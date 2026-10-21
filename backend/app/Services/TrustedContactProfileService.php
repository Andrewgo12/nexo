<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class TrustedContactProfileService
{
    public function update(User $user, array $data): void
    {
        $contactFields = array_intersect_key($data, array_flip([
            'trusted_contact_email',
            'trusted_contact_phone',
            'trusted_contact_consent',
        ]));
        if (! $contactFields) {
            return;
        }

        $consented = array_key_exists('trusted_contact_consent', $data)
            ? (bool) $data['trusted_contact_consent']
            : (bool) $user->trusted_contact_consent;

        if (! $consented) {
            if (
                ! empty($data['trusted_contact_email'])
                || ! empty($data['trusted_contact_phone'])
            ) {
                throw ValidationException::withMessages([
                    'trusted_contact_consent' => ['Debes aceptar el contacto externo antes de guardar sus datos.'],
                ]);
            }

            $user->forceFill([
                'trusted_contact_email' => null,
                'trusted_contact_phone' => null,
                'trusted_contact_consent' => false,
                'trusted_contact_consent_at' => null,
            ])->save();

            return;
        }

        $email = $data['trusted_contact_email'] ?? $user->trusted_contact_email;
        $phone = $data['trusted_contact_phone'] ?? $user->trusted_contact_phone;
        Validator::make([
            'trusted_contact_email' => $email,
            'trusted_contact_phone' => $phone,
        ], [
            'trusted_contact_email' => ['required', 'email', 'max:255'],
            'trusted_contact_phone' => ['required', 'regex:/^\+[1-9]\d{7,14}$/'],
        ])->validate();

        $destinationChanged = $email !== $user->trusted_contact_email
            || $phone !== $user->trusted_contact_phone;
        $user->forceFill([
            'trusted_contact_email' => $email,
            'trusted_contact_phone' => $phone,
            'trusted_contact_consent' => true,
            'trusted_contact_consent_at' => ! $user->trusted_contact_consent || $destinationChanged
                ? now()
                : $user->trusted_contact_consent_at,
        ])->save();
    }
}
