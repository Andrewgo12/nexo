<?php

return [
    'monthly_budget_cop' => (int) env('INSURANCE_MONTHLY_BUDGET_COP', 30000),
    'products' => [
        'mapfre-accidentes-escolares' => [
            'provider' => 'MAPFRE',
            'name' => 'Accidentes Escolares',
            'coverage_summary' => 'Póliza colectiva para institución educativa. MAPFRE informa accidentes 24/7 y gastos médicos; algunas garantías de vida son opcionales. Disponibilidad, condiciones y prima requieren cotización institucional.',
            'source_url' => 'https://www.mapfre.com.co/empresas/seguros-vida-colectivos/accidentes-escolares/',
        ],
        'mundial-accidentes-personales' => [
            'provider' => 'Seguros Mundial',
            'name' => 'Accidentes Personales Protegidos',
            'coverage_summary' => 'Producto candidato de accidentes personales. Amparos, exclusiones, elegibilidad estudiantil y prima deben confirmarse en una cotización y condiciones vigentes.',
            'source_url' => 'https://www.segurosmundial.com.co/personas/',
        ],
        'mundial-salud-esencial' => [
            'provider' => 'Seguros Mundial',
            'name' => 'Salud Mundial Esencial',
            'coverage_summary' => 'Producto de salud separado; no se asume que cubra accidentes, vida o pertenencias. Confirmar condiciones, red, exclusiones y prima.',
            'source_url' => 'https://www.segurosmundial.com.co/personas/seguros-personales/ramo-de-salud/seguro-de-salud-mundial-esencial/',
        ],
        'mundial-celulares-usados' => [
            'provider' => 'Seguros Mundial',
            'name' => 'Seguro de Celulares Usados',
            'coverage_summary' => 'Producto separado para celulares; confirmar si hurto, daño, deducibles y requisitos aplican al equipo del estudiante.',
            'source_url' => 'https://www.segurosmundial.com.co/personas/seguros-personales/lineas-personales/seguro_de_celulares_usados/',
        ],
    ],
];
