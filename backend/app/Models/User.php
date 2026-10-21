<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

#[Appends(['photo_url'])]
#[Fillable([
    'name',
    'email',
    'password',
    'university',
    'career',
    'semester',
    'shift',
    'neighborhood',
    'emergency_contact',
    'trusted_contact_email',
    'trusted_contact_phone',
    'trusted_contact_consent',
    'trusted_contact_consent_at',
    'profile_photo_path',
    'role',
    'status',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmailContract
{
    public const ROLE_STUDENT = 'student';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_SECURITY = 'security';

    public const ROLE_UNIVERSITY = 'university';

    public const ROLES = [
        self::ROLE_STUDENT,
        self::ROLE_ADMIN,
        self::ROLE_SECURITY,
        self::ROLE_UNIVERSITY,
    ];

    public const STATUS_ACTIVE = 'active';

    public const STATUS_PENDING = 'pending';

    public const STATUS_BLOCKED = 'blocked';

    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, MustVerifyEmailTrait, Notifiable;

    public function studentProfile()
    {
        return $this->hasOne(StudentProfile::class);
    }

    protected function photoUrl(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->profile_photo_path
                ? Storage::disk('public')->url($this->profile_photo_path)
                : null,
        );
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'trusted_contact_consent' => 'boolean',
            'trusted_contact_consent_at' => 'datetime',
        ];
    }
}
