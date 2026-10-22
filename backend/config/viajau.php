<?php

return [
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173/'),
    'universities' => [
        'uniajc' => ['name' => 'UNIAJC', 'domain' => 'uniajc.edu.co'],
        'univalle' => ['name' => 'Univalle', 'domain' => 'correounivalle.edu.co'],
        'javeriana' => ['name' => 'Javeriana Cali', 'domain' => 'javerianacali.edu.co'],
        'icesi' => ['name' => 'Icesi', 'domain' => 'icesi.edu.co'],
    ],
    'safety' => [
        'route_corridor_meters' => (int) env('SAFETY_ROUTE_CORRIDOR_METERS', 500),
        'arrival_radius_meters' => (int) env('SAFETY_ARRIVAL_RADIUS_METERS', 300),
        'checkin_grace_minutes' => (int) env('SAFETY_CHECKIN_GRACE_MINUTES', 15),
        'location_retention_hours' => max(1, (int) env('SAFETY_LOCATION_RETENTION_HOURS', 24)),
    ],
];
