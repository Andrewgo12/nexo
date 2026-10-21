<?php

return [
    'free_trial_months' => 6,
    'monthly_price_cop' => 9000,
    'payments_enabled' => false,
    'wompi' => [
        'enabled' => (bool) env('WOMPI_SANDBOX_ENABLED', false),
        'public_key' => env('WOMPI_SANDBOX_PUBLIC_KEY'),
        'integrity_secret' => env('WOMPI_SANDBOX_INTEGRITY_SECRET'),
        'events_secret' => env('WOMPI_SANDBOX_EVENTS_SECRET'),
    ],
];
