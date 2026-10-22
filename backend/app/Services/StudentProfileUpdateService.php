<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class StudentProfileUpdateService
{
    private const USER_FIELDS = [
        'name',
        'career',
        'semester',
        'shift',
        'neighborhood',
        'emergency_contact',
    ];

    private const PROFILE_FIELDS = [
        'name',
        'career',
        'semester',
        'shift',
        'neighborhood',
        'transport',
        'emergency_contact',
        'privacy',
    ];

    public function __construct(
        private readonly TrustedContactProfileService $trustedContactProfile,
    ) {}

    public function validationRules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'career' => ['sometimes', 'nullable', 'string', 'max:120'],
            'semester' => ['sometimes', 'nullable', 'string', 'max:40'],
            'shift' => ['sometimes', 'nullable', 'string', 'max:40'],
            'neighborhood' => ['sometimes', 'nullable', 'string', 'max:120'],
            'transport' => ['sometimes', 'nullable', 'string', 'max:120'],
            'emergency_contact' => ['sometimes', 'nullable', 'string', 'max:160'],
            'trusted_contact_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'trusted_contact_phone' => ['sometimes', 'nullable', 'regex:/^\+[1-9]\d{7,14}$/'],
            'trusted_contact_consent' => ['sometimes', 'boolean'],
            'privacy' => ['sometimes', 'nullable', 'string', 'max:120'],
        ];
    }

    public function update(
        User $user,
        array $data,
        ?StudentProfile $profile = null,
    ): ?StudentProfile {
        return DB::transaction(function () use ($user, $data, $profile): ?StudentProfile {
            $this->trustedContactProfile->update($user, $data);
            $user->fill(Arr::only($data, self::USER_FIELDS))->save();

            $profile ??= $user->studentProfile;
            if ($profile !== null) {
                $profile->fill(Arr::only($data, self::PROFILE_FIELDS))->save();
            }

            return $profile;
        });
    }
}
