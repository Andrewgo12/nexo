<?php

return [
    'stateful' => array_filter(array_map(
        'trim',
        explode(',', env(
            'SANCTUM_STATEFUL_DOMAINS',
            'localhost,localhost:5173,127.0.0.1,127.0.0.1:5173,127.0.0.1:8000,::1',
        )),
    )),
    'guard' => ['web'],
    'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 10080),
];
