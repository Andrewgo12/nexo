<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InstitutionalCatalogEntry;
use App\Models\SafetyAlert;
use App\Models\TransitFeedImport;
use App\Models\User;
use App\Services\TransitFeedImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminManagementController extends Controller
{
    public function users(Request $request)
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::in([User::STATUS_ACTIVE, User::STATUS_PENDING, User::STATUS_BLOCKED])],
            'verification' => ['sometimes', Rule::in(['verified', 'pending'])],
            'search' => ['sometimes', 'string', 'max:120'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
        $query = User::query()
            ->where('role', User::ROLE_STUDENT)
            ->with('studentProfile:id,user_id,name,university,career,verified,status');

        $this->scopeUsersToInstitution($request, $query);
        $query->when($filters['status'] ?? null, fn ($builder, string $status) => $builder->where('status', $status));
        $query->when($filters['verification'] ?? null, function ($builder, string $verification): void {
            $verified = $verification === 'verified';
            $builder->whereHas('studentProfile', fn ($profiles) => $profiles->where('verified', $verified));
        });
        $query->when($filters['search'] ?? null, function ($builder, string $search): void {
            $builder->where(fn ($users) => $users->where('name', 'like', '%'.$search.'%')
                ->orWhere('email', 'like', '%'.$search.'%'));
        });

        $users = $query->orderByDesc('created_at')
            ->paginate(25)
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'university' => $user->studentProfile?->university ?? $user->university,
                'career' => $user->studentProfile?->career ?? $user->career,
                'status' => $user->status,
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'profile_verified' => (bool) $user->studentProfile?->verified,
                'created_at' => $user->created_at?->toISOString(),
            ]);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function updateUser(Request $request, User $managedUser)
    {
        abort_unless($managedUser->role === User::ROLE_STUDENT, 404);
        abort_if($request->user()->is($managedUser), 409, 'No puedes cambiar tu propio estado desde este panel.');
        $this->assertInstitutionOwnsUser($request, $managedUser);

        $data = $request->validate([
            'status' => ['sometimes', Rule::in([User::STATUS_ACTIVE, User::STATUS_PENDING, User::STATUS_BLOCKED])],
            'profile_verified' => ['sometimes', 'boolean'],
        ]);
        abort_if($data === [], 422, 'Indica el estado o la verificación que quieres actualizar.');

        DB::transaction(function () use ($managedUser, $data): void {
            if (array_key_exists('status', $data)) {
                $statusChanged = $managedUser->status !== $data['status'];
                if ($statusChanged) {
                    $managedUser->forceFill([
                        'status' => $data['status'],
                        'auth_version' => $managedUser->auth_version + 1,
                    ])->save();
                }
                if ($statusChanged || $data['status'] === User::STATUS_BLOCKED) {
                    $managedUser->tokens()->delete();
                }
            }
            if (array_key_exists('profile_verified', $data)) {
                $profile = $managedUser->studentProfile;
                abort_unless($profile, 409, 'La cuenta no tiene un perfil estudiantil para verificar.');
                $profile->update([
                    'verified' => $data['profile_verified'],
                    'status' => $data['profile_verified'] ? 'activo' : 'pendiente',
                ]);
            }
        });

        return response()->json([
            'message' => 'Cuenta actualizada.',
            'data' => [
                'id' => $managedUser->id,
                'status' => $managedUser->fresh()->status,
                'profile_verified' => (bool) $managedUser->studentProfile()->value('verified'),
            ],
        ]);
    }

    public function incidents(Request $request)
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::in(['active', 'resolved', 'all'])],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
        $query = SafetyAlert::query()
            ->with('studentProfile:id,name,university')
            ->when(($filters['status'] ?? 'active') !== 'all', function ($builder) use ($filters): void {
                $builder->where('active', ($filters['status'] ?? 'active') === 'active');
            });
        if ($request->user()->role === User::ROLE_UNIVERSITY) {
            $university = $this->requireAssignedUniversity($request);
            $query->whereHas('studentProfile', fn ($profiles) => $profiles->where(
                'university',
                $university,
            ));
        }

        $incidents = $query->latest()
            ->paginate(25)
            ->through(fn (SafetyAlert $alert): array => [
                'id' => $alert->id,
                'type' => $alert->type,
                'severity' => $alert->severity,
                'active' => $alert->active,
                'student' => $alert->studentProfile?->name,
                'university' => $alert->studentProfile?->university,
                'created_at' => $alert->created_at?->toISOString(),
                'resolved_at' => $alert->resolved_at?->toISOString(),
            ]);

        return response()->json([
            'data' => $incidents->items(),
            'meta' => [
                'current_page' => $incidents->currentPage(),
                'last_page' => $incidents->lastPage(),
                'total' => $incidents->total(),
            ],
        ]);
    }

    public function catalog(Request $request)
    {
        $university = $this->catalogUniversity($request);
        $entries = InstitutionalCatalogEntry::query()
            ->where('university', $university)
            ->when($request->boolean('include_inactive'), fn ($query) => $query, fn ($query) => $query->where('active', true))
            ->orderBy('type')
            ->orderBy('name')
            ->get(['id', 'university', 'type', 'name', 'active']);

        return response()->json(['data' => $entries]);
    }

    public function createCatalogEntry(Request $request)
    {
        $data = $request->validate([
            'university' => [
                Rule::requiredIf($request->user()->role === User::ROLE_ADMIN),
                'nullable',
                'string',
                Rule::in(array_column(config('viajau.universities'), 'name')),
            ],
            'type' => ['required', Rule::in(['campus', 'program', 'faculty', 'period'])],
            'name' => ['required', 'string', 'max:120'],
        ]);
        $university = $request->user()->role === User::ROLE_UNIVERSITY
            ? $this->requireAssignedUniversity($request)
            : $data['university'];

        $entry = InstitutionalCatalogEntry::query()->firstOrCreate(
            ['university' => $university, 'type' => $data['type'], 'name' => trim($data['name'])],
            ['active' => true],
        );
        abort_if($entry->active && ! $entry->wasRecentlyCreated, 409, 'El elemento ya está registrado.');
        if (! $entry->active) {
            $entry->update(['active' => true]);
        }

        return response()->json(['data' => $entry], $entry->wasRecentlyCreated ? 201 : 200);
    }

    public function updateCatalogEntry(Request $request, InstitutionalCatalogEntry $entry)
    {
        $this->assertInstitutionOwnsCatalogEntry($request, $entry);
        $data = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:120',
                Rule::unique('institutional_catalog_entries', 'name')
                    ->where('university', $entry->university)
                    ->where('type', $entry->type)
                    ->ignore($entry->id),
            ],
            'active' => ['sometimes', 'boolean'],
        ]);
        abort_if($data === [], 422, 'Indica el nombre o estado que quieres actualizar.');
        $entry->update($data);

        return response()->json(['data' => $entry->fresh()]);
    }

    public function deactivateCatalogEntry(Request $request, InstitutionalCatalogEntry $entry)
    {
        $this->assertInstitutionOwnsCatalogEntry($request, $entry);
        $entry->update(['active' => false]);

        return response()->json(['message' => 'Elemento desactivado.', 'data' => $entry->fresh()]);
    }

    public function importTransitFeed(Request $request, TransitFeedImportService $importer)
    {
        $data = $request->validate([
            'feed_version' => ['required', 'string', 'max:120', 'regex:/\S/'],
            'stops' => ['required', 'file', 'mimes:txt,csv', 'max:20480'],
            'routes' => ['required', 'file', 'mimes:txt,csv', 'max:20480'],
        ]);
        $import = $importer->import(
            trim($data['feed_version']),
            $data['stops'],
            $data['routes'],
            $request->user()->id,
        );

        return response()->json([
            'message' => 'Feed GTFS validado e guardado. No se importaron horarios.',
            'data' => $import,
        ], 201);
    }

    public function latestTransitFeed()
    {
        return response()->json([
            'data' => TransitFeedImport::query()
                ->where('status', 'completed')
                ->latest()
                ->first(['id', 'feed_version', 'status', 'stops_count', 'routes_count', 'created_at']),
        ]);
    }

    private function catalogUniversity(Request $request): string
    {
        if ($request->user()->role === User::ROLE_UNIVERSITY) {
            return $this->requireAssignedUniversity($request);
        }

        $data = $request->validate([
            'university' => ['required', 'string', Rule::in(array_column(config('viajau.universities'), 'name'))],
        ]);

        return $data['university'];
    }

    private function scopeUsersToInstitution(Request $request, $query): void
    {
        if ($request->user()->role === User::ROLE_UNIVERSITY) {
            $university = $this->requireAssignedUniversity($request);
            $query->whereHas('studentProfile', fn ($profiles) => $profiles->where('university', $university));
        }
    }

    private function assertInstitutionOwnsUser(Request $request, User $user): void
    {
        if ($request->user()->role !== User::ROLE_UNIVERSITY) {
            return;
        }

        $university = $this->requireAssignedUniversity($request);
        abort_unless($user->studentProfile?->university === $university, 404);
    }

    private function assertInstitutionOwnsCatalogEntry(Request $request, InstitutionalCatalogEntry $entry): void
    {
        if ($request->user()->role !== User::ROLE_UNIVERSITY) {
            return;
        }

        abort_unless($entry->university === $this->requireAssignedUniversity($request), 404);
    }

    private function requireAssignedUniversity(Request $request): string
    {
        $university = $request->user()->university;
        abort_unless(is_string($university) && trim($university) !== '', 403, 'La cuenta institucional no tiene una universidad asignada.');

        return $university;
    }
}
