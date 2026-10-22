<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InsuranceEnrollment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class InsuranceController extends Controller
{
    public function products()
    {
        return response()->json([
            'data' => array_map(
                fn (string $key, array $product): array => [
                    'key' => $key,
                    ...$product,
                    'monthly_budget_cop' => config('insurance.monthly_budget_cop'),
                    'price_status' => 'quote_required',
                ],
                array_keys(config('insurance.products')),
                array_values(config('insurance.products')),
            ),
        ]);
    }

    public function mine(Request $request)
    {
        $this->assertActiveStudent($request);

        return response()->json([
            'data' => InsuranceEnrollment::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->limit(50)
                ->get([
                    'id',
                    'product_key',
                    'provider',
                    'product_name',
                    'monthly_premium_cop',
                    'coverage_summary',
                    'policy_number',
                    'coverage_starts_at',
                    'coverage_ends_at',
                    'status',
                    'review_note',
                    'created_at',
                ]),
        ]);
    }

    public function requestQuote(Request $request)
    {
        $this->assertActiveStudent($request);
        $data = $request->validate([
            'product_key' => ['required', Rule::in(array_keys(config('insurance.products')))],
        ]);
        $product = config('insurance.products.'.$data['product_key']);
        $enrollment = DB::transaction(function () use ($request, $data, $product): InsuranceEnrollment {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            abort_unless(
                $user->role === User::ROLE_STUDENT
                && $user->status === User::STATUS_ACTIVE
                && $user->studentProfile?->verified
                && $user->studentProfile?->status === 'activo',
                403,
                'Necesitas una cuenta y perfil estudiantil activos y verificados.',
            );
            $openRequestExists = InsuranceEnrollment::query()
                ->where('user_id', $request->user()->id)
                ->where('product_key', $data['product_key'])
                ->whereIn('status', ['quote_requested', 'quoted', 'pending_review', 'active'])
                ->exists();
            abort_if($openRequestExists, 409, 'Ya tienes una cotización o póliza vigente para este producto.');

            return InsuranceEnrollment::create([
                'user_id' => $request->user()->id,
                'product_key' => $data['product_key'],
                'provider' => $product['provider'],
                'product_name' => $product['name'],
                'status' => 'quote_requested',
            ]);
        });

        return response()->json([
            'message' => 'Solicitud de cotización registrada. Aún no existe cobertura activa ni precio confirmado.',
            'data' => ['id' => $enrollment->id, 'status' => $enrollment->status],
        ], 201);
    }

    public function submitPolicy(Request $request, InsuranceEnrollment $enrollment)
    {
        $this->assertActiveStudent($request);
        abort_unless((int) $enrollment->user_id === (int) $request->user()->id, 404);
        abort_unless($enrollment->status === 'quoted', 409, 'Solo puedes registrar una póliza para una cotización aprobada.');
        abort_if(
            $enrollment->monthly_premium_cop > config('insurance.monthly_budget_cop'),
            422,
            'La prima supera el presupuesto mensual máximo configurado.',
        );
        $data = $request->validate([
            'policy_number' => ['required', 'string', 'max:120'],
            'coverage_starts_at' => ['required', 'date', 'after_or_equal:today'],
            'coverage_ends_at' => ['required', 'date', 'after:coverage_starts_at'],
            'policy_document' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ]);
        $path = $data['policy_document']->store('insurance/policies', 'local');
        abort_unless(is_string($path), 500, 'No se pudo guardar el documento de póliza.');

        try {
            $enrollment = DB::transaction(function () use ($request, $enrollment, $data, $path): InsuranceEnrollment {
                $lockedEnrollment = InsuranceEnrollment::query()->lockForUpdate()->findOrFail($enrollment->id);
                abort_unless((int) $lockedEnrollment->user_id === (int) $request->user()->id, 404);
                abort_unless(
                    $lockedEnrollment->status === 'quoted',
                    409,
                    'Solo puedes registrar una póliza para una cotización aprobada.',
                );
                abort_if(
                    $lockedEnrollment->monthly_premium_cop > config('insurance.monthly_budget_cop'),
                    422,
                    'La prima supera el presupuesto mensual máximo configurado.',
                );
                $lockedEnrollment->update([
                    'policy_number' => trim($data['policy_number']),
                    'coverage_starts_at' => $data['coverage_starts_at'],
                    'coverage_ends_at' => $data['coverage_ends_at'],
                    'policy_document_path' => $path,
                    'status' => 'pending_review',
                    'review_note' => null,
                    'reviewed_by' => null,
                    'reviewed_at' => null,
                ]);

                return $lockedEnrollment;
            });
        } catch (Throwable $exception) {
            if (
                Storage::disk('local')->exists($path)
                && ! Storage::disk('local')->delete($path)
            ) {
                Log::error('Failed to remove an uncommitted insurance policy document.', [
                    'enrollment_id' => $enrollment->id,
                    'path' => $path,
                    'exception' => $exception->getMessage(),
                ]);
            }
            throw $exception;
        }

        return response()->json([
            'message' => 'Póliza recibida y pendiente de validación administrativa; aún no está activa en ViajaU.',
            'data' => ['id' => $enrollment->id, 'status' => $enrollment->status],
        ], 201);
    }

    public function adminIndex(Request $request)
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::in(['quote_requested', 'quoted', 'pending_review', 'active', 'rejected'])],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
        $enrollments = InsuranceEnrollment::query()
            ->with('user:id,name,email')
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->latest()
            ->paginate(25)
            ->through(fn (InsuranceEnrollment $enrollment): array => [
                'id' => $enrollment->id,
                'user' => $enrollment->user?->name,
                'email' => $enrollment->user?->email,
                'provider' => $enrollment->provider,
                'product_name' => $enrollment->product_name,
                'monthly_premium_cop' => $enrollment->monthly_premium_cop,
                'coverage_summary' => $enrollment->coverage_summary,
                'policy_number' => $enrollment->policy_number,
                'coverage_starts_at' => $enrollment->coverage_starts_at?->toDateString(),
                'coverage_ends_at' => $enrollment->coverage_ends_at?->toDateString(),
                'status' => $enrollment->status,
                'review_note' => $enrollment->review_note,
                'has_policy_document' => $enrollment->policy_document_path !== null,
                'created_at' => $enrollment->created_at?->toISOString(),
            ]);

        return response()->json([
            'data' => $enrollments->items(),
            'meta' => [
                'current_page' => $enrollments->currentPage(),
                'last_page' => $enrollments->lastPage(),
                'total' => $enrollments->total(),
            ],
        ]);
    }

    public function updateEnrollment(Request $request, InsuranceEnrollment $enrollment)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['quoted', 'active', 'rejected'])],
            'monthly_premium_cop' => ['required_if:status,quoted', 'nullable', 'integer', 'min:1', 'max:1000000'],
            'coverage_summary' => ['required_if:status,quoted', 'nullable', 'string', 'min:10', 'max:2000'],
            'review_note' => [
                Rule::requiredIf($request->input('status') === 'rejected'),
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $enrollment = DB::transaction(function () use ($request, $enrollment, $data): InsuranceEnrollment {
            $lockedEnrollment = InsuranceEnrollment::query()->lockForUpdate()->findOrFail($enrollment->id);
            if ($data['status'] === 'active') {
                abort_unless(
                    $lockedEnrollment->status === 'pending_review'
                    && $lockedEnrollment->policy_document_path
                    && Storage::disk('local')->exists($lockedEnrollment->policy_document_path)
                    && $lockedEnrollment->policy_number
                    && $lockedEnrollment->coverage_starts_at
                    && $lockedEnrollment->coverage_ends_at
                    && $lockedEnrollment->coverage_starts_at->lte(today())
                    && $lockedEnrollment->coverage_ends_at->gte(today())
                    && $lockedEnrollment->monthly_premium_cop <= config('insurance.monthly_budget_cop'),
                    409,
                    'La cobertura requiere documento, fechas, prima dentro del presupuesto y revisión de una póliza recibida.',
                );
            }
            if ($data['status'] === 'quoted') {
                abort_unless(
                    $lockedEnrollment->status === 'quote_requested',
                    409,
                    'Solo puedes cotizar una solicitud pendiente de cotización.',
                );
                $data['review_note'] = null;
            }
            if ($data['status'] === 'rejected') {
                abort_unless(
                    in_array($lockedEnrollment->status, ['quote_requested', 'quoted', 'pending_review'], true),
                    409,
                    'No puedes rechazar una cotización que ya está activa.',
                );
            }

            $lockedEnrollment->update([
                ...$data,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            return $lockedEnrollment;
        });

        return response()->json([
            'message' => 'Estado de cotización/póliza actualizado.',
            'data' => ['id' => $enrollment->id, 'status' => $enrollment->status],
        ]);
    }

    public function downloadPolicy(InsuranceEnrollment $enrollment): StreamedResponse
    {
        abort_unless($enrollment->policy_document_path
            && Storage::disk('local')->exists($enrollment->policy_document_path), 404);

        return Storage::disk('local')->download(
            $enrollment->policy_document_path,
            'poliza-'.$enrollment->id.'.pdf',
            ['Content-Type' => 'application/pdf', 'X-Content-Type-Options' => 'nosniff'],
        );
    }

    private function assertActiveStudent(Request $request): void
    {
        $user = $request->user();
        abort_unless(
            $user->role === User::ROLE_STUDENT
            && $user->status === User::STATUS_ACTIVE
            && $user->studentProfile?->verified
            && $user->studentProfile?->status === 'activo',
            403,
            'Necesitas una cuenta y perfil estudiantil activos y verificados.',
        );
    }
}
