// Mock data & configuration for ViajaU (Santiago de Cali, Colombia)

export const UNIVERSITIES = [
  {
    id: 'uniajc-sur',
    name: 'Institución Universitaria Antonio José Camacho',
    shortName: 'UNIAJC Sede Sur',
    campus: 'Sede Principal Sur (Km 1 Vía Pance)',
    coords: [3.3518, -76.5338],
    domain: '@uniajc.edu.co',
    color: '#059669',
    badge: 'UNIAJC',
    address: 'Calle 25 con Carrera 122, Cali'
  },
  {
    id: 'uniajc-norte',
    name: 'Institución Universitaria Antonio José Camacho',
    shortName: 'UNIAJC Sede Norte',
    campus: 'Sede Norte (Av. 6N)',
    coords: [3.4735, -76.5265],
    domain: '@uniajc.edu.co',
    color: '#059669',
    badge: 'UNIAJC Norte',
    address: 'Av. 6N # 28N-102, Cali'
  },
  {
    id: 'univalle',
    name: 'Universidad del Valle',
    shortName: 'Univalle Meléndez',
    campus: 'Ciudad Universitaria Meléndez',
    coords: [3.3725, -76.5333],
    domain: '@correounivalle.edu.co',
    color: '#dc2626',
    badge: 'Univalle',
    address: 'Calle 13 # 100-00, Cali'
  },
  {
    id: 'javeriana',
    name: 'Pontificia Universidad Javeriana Cali',
    shortName: 'Javeriana Cali',
    campus: 'Campus Pance',
    coords: [3.3486, -76.5305],
    domain: '@javerianacali.edu.co',
    color: '#2563eb',
    badge: 'Javeriana',
    address: 'Calle 18 # 118-250, Cali'
  },
  {
    id: 'icesi',
    name: 'Universidad Icesi',
    shortName: 'Icesi',
    campus: 'Campus Pance',
    coords: [3.3423, -76.5312],
    domain: '@icesi.edu.co',
    color: '#0284c7',
    badge: 'Icesi',
    address: 'Calle 18 # 122-135, Cali'
  },
  {
    id: 'usc',
    name: 'Universidad Santiago de Cali',
    shortName: 'USC Pampalinda',
    campus: 'Sede Pampalinda',
    coords: [3.4026, -76.5478],
    domain: '@usc.edu.co',
    color: '#7c3aed',
    badge: 'USC',
    address: 'Calle 5 # 62-00, Cali'
  },
  {
    id: 'uao',
    name: 'Universidad Autónoma de Occidente',
    shortName: 'UAO',
    campus: 'Campus Valle del Lili',
    coords: [3.3537, -76.5230],
    domain: '@uao.edu.co',
    color: '#ea580c',
    badge: 'UAO',
    address: 'Calle 25 # 115-85, Cali'
  },
  {
    id: 'usb',
    name: 'Universidad de San Buenaventura',
    shortName: 'USB Cali',
    campus: 'Campus Pance',
    coords: [3.3428, -76.5411],
    domain: '@usbcali.edu.co',
    color: '#d97706',
    badge: 'San Buenaventura',
    address: 'Carrera 122 # 6-65, Cali'
  },
  {
    id: 'terminal',
    name: 'Terminal de Transportes de Cali',
    shortName: 'Terminal Cali (Estudiantes Foráneos)',
    campus: 'Conexión Intermunicipal (Buga, Palmira, Tuluá, Yumbo)',
    coords: [3.4651, -76.5233],
    domain: '@terminal.co',
    color: '#475569',
    badge: 'Terminal Cali',
    address: 'Calle 30N # 2AN-29, Cali'
  }
];

export const NEIGHBORHOODS = [
  // Zona Sur
  { id: 'el-caney', name: 'El Caney', zone: 'Zona Sur (Comuna 17)', coords: [3.3780, -76.5240], riskScore: 'Bajo', commonMio: 'P21B, A13A' },
  { id: 'valle-del-lili', name: 'Valle del Lili', zone: 'Zona Sur (Comuna 17)', coords: [3.3650, -76.5220], riskScore: 'Bajo', commonMio: 'A13C, P21B' },
  { id: 'ciudad-2000', name: 'Ciudad 2000', zone: 'Zona Sur (Comuna 16)', coords: [3.3920, -76.5180], riskScore: 'Medio', commonMio: 'P21B, P47A' },
  { id: 'el-ingenio', name: 'El Ingenio', zone: 'Zona Sur (Comuna 17)', coords: [3.3850, -76.5360], riskScore: 'Bajo', commonMio: 'T31, P27D' },
  { id: 'capri', name: 'Capri / Pasoancho', zone: 'Zona Sur (Comuna 17)', coords: [3.3950, -76.5410], riskScore: 'Bajo', commonMio: 'T31, P27D' },
  { id: 'limonar', name: 'El Limonar', zone: 'Zona Sur (Comuna 17)', coords: [3.4050, -76.5380], riskScore: 'Bajo', commonMio: 'T31, P27D' },
  { id: 'melendez', name: 'Meléndez / Polvorines', zone: 'Zona Sur (Comuna 18)', coords: [3.3750, -76.5480], riskScore: 'Medio-Alto', commonMio: 'A12A, T31' },
  { id: 'bochalema', name: 'Bochalema', zone: 'Zona Sur (Expansión)', coords: [3.3390, -76.5210], riskScore: 'Bajo', commonMio: 'A17B, A17D' },
  { id: 'jamundi', name: 'Jamundí (Área Metropolitana)', zone: 'Conurbación Sur', coords: [3.2610, -76.5410], riskScore: 'Medio', commonMio: 'Intermunicipal / MIO A17A' },

  // Zona Oriente
  { id: 'morichal', name: 'Morichal de Comfandi', zone: 'Zona Oriente (Comuna 15)', coords: [3.3980, -76.5020], riskScore: 'Medio', commonMio: 'P47A, P21B' },
  { id: 'los-sauces', name: 'Los Sauces', zone: 'Zona Oriente (Comuna 11)', coords: [3.4210, -76.5120], riskScore: 'Medio', commonMio: 'P21B, T50' },
  { id: 'el-guabal', name: 'El Guabal', zone: 'Zona Oriente (Comuna 10)', coords: [3.4180, -76.5260], riskScore: 'Medio', commonMio: 'P27D, P47A' },
  { id: 'mariano-ramos', name: 'Mariano Ramos', zone: 'Zona Oriente (Comuna 16)', coords: [3.4070, -76.5080], riskScore: 'Alto nocturno', commonMio: 'P21B, T50' },
  { id: 'calipso', name: 'Calipso / Terminal Calipso', zone: 'Zona Oriente (Comuna 13)', coords: [3.4140, -76.5058], riskScore: 'Medio-Alto', commonMio: 'T50, P21B' },
  { id: 'alfonso-lopez', name: 'Alfonso López', zone: 'Zona Oriente (Comuna 7)', coords: [3.4560, -76.4950], riskScore: 'Medio-Alto', commonMio: 'T40, T47B' },

  // Zona Centro y Tradicional
  { id: 'san-fernando', name: 'San Fernando / Imbanaco', zone: 'Zona Tradicional (Comuna 19)', coords: [3.4270, -76.5410], riskScore: 'Bajo', commonMio: 'T31, E21' },
  { id: 'miraflores', name: 'Miraflores / Alameda', zone: 'Zona Tradicional (Comuna 19)', coords: [3.4350, -76.5380], riskScore: 'Medio', commonMio: 'T31, P27D' },
  { id: 'san-antonio', name: 'San Antonio / El Peñón', zone: 'Zona Oeste / Tradicional (Comuna 3)', coords: [3.4480, -76.5420], riskScore: 'Bajo', commonMio: 'A02, A06' },
  { id: 'san-bosco', name: 'San Bosco / Centro', zone: 'Zona Centro (Comuna 3)', coords: [3.4418, -76.5332], riskScore: 'Medio-Alto nocturno', commonMio: 'T31, E21' },

  // Zona Norte
  { id: 'granada', name: 'Granada / Centenario', zone: 'Zona Norte (Comuna 2)', coords: [3.4580, -76.5340], riskScore: 'Bajo', commonMio: 'A05, P27D' },
  { id: 'versalles', name: 'Versalles / Estación Torre de Cali', zone: 'Zona Norte (Comuna 2)', coords: [3.4568, -76.5298], riskScore: 'Bajo-Medio', commonMio: 'T31, E21' },
  { id: 'chipichape', name: 'Chipichape / Santa Mónica', zone: 'Zona Norte (Comuna 2)', coords: [3.4750, -76.5270], riskScore: 'Bajo', commonMio: 'P27D, P24B' },
  { id: 'la-flora', name: 'La Flora / Menga', zone: 'Zona Norte (Comuna 2)', coords: [3.4880, -76.5220], riskScore: 'Bajo', commonMio: 'E21, P27D' },
  { id: 'chiminangos', name: 'Chiminangos / Los Andes', zone: 'Zona Norte (Comuna 5)', coords: [3.4790, -76.5050], riskScore: 'Medio', commonMio: 'T31, P42' },
  { id: 'floralia', name: 'Floralia / Paso del Comercio', zone: 'Zona Norte (Comuna 6)', coords: [3.4870, -76.4920], riskScore: 'Medio-Alto nocturno', commonMio: 'T31, P30A' },
  { id: 'yumbo', name: 'Yumbo (Industrial / Residencial)', zone: 'Conurbación Norte', coords: [3.5820, -76.4950], riskScore: 'Medio', commonMio: 'Intermunicipal Sameco' },

  // Zona Oeste
  { id: 'terron-colorado', name: 'Terrón Colorado (Vía al Mar)', zone: 'Zona Oeste (Comuna 1)', coords: [3.4550, -76.5580], riskScore: 'Medio-Alto', commonMio: 'A05, A02' }
];

export const MIO_STATIONS = [
  { id: 's-uni', name: 'Estación Universidades (Sur)', coords: [3.3644, -76.5316], lines: ['T31', 'E21', 'A11', 'A19A', 'A17B', 'P21B'] },
  { id: 's-capri', name: 'Estación Capri', coords: [3.3905, -76.5422], lines: ['T31', 'E21', 'P27D', 'P47A'] },
  { id: 's-pampalinda', name: 'Estación Pampalinda (USC)', coords: [3.4026, -76.5460], lines: ['T31', 'E21', 'P27D'] },
  { id: 's-tequendama', name: 'Estación Tequendama', coords: [3.4195, -76.5442], lines: ['T31', 'E21', 'T47B'] },
  { id: 's-sanbosco', name: 'Estación San Bosco', coords: [3.4418, -76.5332], lines: ['T31', 'E21', 'T47B', 'T50'] },
  { id: 's-torrecali', name: 'Estación Torre de Cali / Versalles', coords: [3.4568, -76.5298], lines: ['T31', 'E21', 'P27D'] },
  { id: 's-chiminangos', name: 'Estación Chiminangos', coords: [3.4795, -76.5055], lines: ['T31'] },
  { id: 's-pasocomercio', name: 'Terminal Paso del Comercio', coords: [3.4862, -76.4886], lines: ['T31', 'P30A'] },
  { id: 's-calipso', name: 'Terminal Calipso (Oriente)', coords: [3.4140, -76.5058], lines: ['T50', 'P21B', 'T47B'] },
  { id: 's-menga', name: 'Terminal Menga (Norte)', coords: [3.4921, -76.5178], lines: ['E21', 'P21B', 'P27D'] }
];

export const MIO_LINES = [
  {
    id: 'T31',
    name: 'Troncal T31 (Universidades <-> Paso del Comercio)',
    color: '#0284c7',
    description: 'Columna vertebral de Cali por Calle 5 y Carrera 1. Pasa por Univalle, USC y Hospital Universitario.',
    coords: [
      [3.3644, -76.5316],
      [3.3905, -76.5422],
      [3.4026, -76.5460],
      [3.4195, -76.5442],
      [3.4418, -76.5332],
      [3.4568, -76.5298],
      [3.4795, -76.5055],
      [3.4862, -76.4886]
    ]
  },
  {
    id: 'E21',
    name: 'Expreso E21 (Universidades <-> Terminal Menga)',
    color: '#2563eb',
    description: 'Ruta rápida expresa universitaria norte-sur por carril exclusivo.',
    coords: [
      [3.3644, -76.5316],
      [3.3905, -76.5422],
      [3.4195, -76.5442],
      [3.4418, -76.5332],
      [3.4568, -76.5298],
      [3.4780, -76.5250],
      [3.4921, -76.5178]
    ]
  },
  {
    id: 'T50',
    name: 'Troncal T50 (Universidades <-> Nuevo Latir)',
    color: '#ea580c',
    description: 'Conexión directa entre el corredor universitario del Sur y el Distrito de Aguablanca.',
    coords: [
      [3.3644, -76.5316],
      [3.3905, -76.5422],
      [3.4140, -76.5058],
      [3.4168, -76.4950]
    ]
  },
  {
    id: 'P21B',
    name: 'Pretroncal P21B (Universidades <-> Terminal Menga por Autopista)',
    color: '#10b981',
    description: 'Cruza por Valle del Lili, El Caney, Ciudad 2000 y Autopista Oriental.',
    coords: [
      [3.3644, -76.5316],
      [3.3780, -76.5240],
      [3.3920, -76.5180],
      [3.4140, -76.5058],
      [3.4500, -76.5020],
      [3.4921, -76.5178]
    ]
  }
];

export const INITIAL_TRIPS = [
  {
    id: 'trip-1',
    driver: {
      name: 'Kevin González',
      role: 'Conductor Carro',
      university: 'UNIAJC Sede Sur',
      career: 'Ingeniería de Sistemas',
      semester: '8vo Semestre',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 4.95,
      completedTrips: 42,
      verifiedEmail: true,
      verifiedCarnet: true,
      gender: 'M'
    },
    transportMode: 'car',
    vehicleInfo: {
      model: 'Chevrolet Spark GT (Gris)',
      plate: '***-412',
      trunkAvailable: true
    },
    origin: {
      name: 'UNIAJC Sede Sur (Portería Pance)',
      coords: [3.3518, -76.5338]
    },
    destination: {
      name: 'El Caney / Valle del Lili',
      neighborhoodId: 'el-caney',
      coords: [3.3780, -76.5240]
    },
    shift: 'Jornada Nocturna',
    departureTime: '9:45 PM',
    status: 'scheduled',
    totalSeats: 3,
    availableSeats: 2,
    passengers: [
      { name: 'Ana V.', university: 'UNIAJC', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' }
    ],
    priceContribution: 3500,
    insuranceActive: true,
    insuranceProvider: 'AXA / ViajaU Protege',
    meetingPoint: 'Bahía vehicular frente a portería UNIAJC',
    onlyGirls: false,
    routePolyline: [
      [3.3518, -76.5338],
      [3.3600, -76.5320],
      [3.3644, -76.5316],
      [3.3720, -76.5280],
      [3.3780, -76.5240]
    ]
  },
  {
    id: 'trip-2',
    driver: {
      name: 'Claudia Vanessa Aranda',
      role: 'Líder Parche MIO',
      university: 'UNIAJC Sede Sur',
      career: 'Ingeniería de Sistemas',
      semester: '8vo Semestre',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      rating: 4.98,
      completedTrips: 68,
      verifiedEmail: true,
      verifiedCarnet: true,
      gender: 'F'
    },
    transportMode: 'mio',
    vehicleInfo: {
      model: 'MIO Troncal T31 / T47B en Grupo',
      line: 'T31',
      station: 'Estación Universidades'
    },
    origin: {
      name: 'UNIAJC Sede Sur (Plaza Central)',
      coords: [3.3518, -76.5338]
    },
    destination: {
      name: 'Chiminangos / Floralia (Zona Norte)',
      neighborhoodId: 'chiminangos',
      coords: [3.4795, -76.5055]
    },
    shift: 'Jornada Nocturna',
    departureTime: '9:50 PM',
    status: 'scheduled',
    totalSeats: 6,
    availableSeats: 3,
    passengers: [
      { name: 'Diana R.', university: 'UNIAJC', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { name: 'Paola M.', university: 'Univalle', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' }
    ],
    priceContribution: 0,
    insuranceActive: true,
    insuranceProvider: 'ViajaU Acompañado',
    meetingPoint: 'Torniquetes Estación Universidades (Alimentador A19A)',
    onlyGirls: true,
    routePolyline: [
      [3.3518, -76.5338],
      [3.3644, -76.5316],
      [3.3905, -76.5422],
      [3.4195, -76.5442],
      [3.4418, -76.5332],
      [3.4568, -76.5298],
      [3.4795, -76.5055]
    ]
  },
  {
    id: 'trip-3',
    driver: {
      name: 'David Restrepo',
      role: 'Conductor Moto',
      university: 'Univalle Meléndez',
      career: 'Ingeniería Mecánica',
      semester: '6to Semestre',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 4.88,
      completedTrips: 31,
      verifiedEmail: true,
      verifiedCarnet: true,
      gender: 'M'
    },
    transportMode: 'moto',
    vehicleInfo: {
      model: 'Yamaha FZ 2.0 (Negra)',
      plate: '***-89D',
      extraHelmet: true
    },
    origin: {
      name: 'Univalle Meléndez (Portería Peatonal Cll 13)',
      coords: [3.3725, -76.5333]
    },
    destination: {
      name: 'Morichal / Ciudad 2000 (Oriente)',
      neighborhoodId: 'morichal',
      coords: [3.3980, -76.5020]
    },
    shift: 'Jornada Nocturna',
    departureTime: '9:30 PM',
    status: 'scheduled',
    totalSeats: 1,
    availableSeats: 1,
    passengers: [],
    priceContribution: 3000,
    insuranceActive: true,
    insuranceProvider: 'AXA / ViajaU Protege',
    meetingPoint: 'Portería Calle 13 con 100 frente a la estación MIO Buitrera',
    onlyGirls: false,
    routePolyline: [
      [3.3725, -76.5333],
      [3.3850, -76.5200],
      [3.3920, -76.5100],
      [3.3980, -76.5020]
    ]
  },
  {
    id: 'trip-4',
    driver: {
      name: 'Ana María Vélez',
      role: 'Líder Caminata',
      university: 'UNIAJC Sede Sur',
      career: 'Ingeniería de Sistemas',
      semester: '4to Semestre',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      rating: 4.92,
      completedTrips: 22,
      verifiedEmail: true,
      verifiedCarnet: true,
      gender: 'F'
    },
    transportMode: 'walk',
    vehicleInfo: {
      model: 'Caminata Segura en Parche Iluminado',
      speed: 'Paso firme y seguro en grupo'
    },
    origin: {
      name: 'UNIAJC Sede Sur',
      coords: [3.3518, -76.5338]
    },
    destination: {
      name: 'Estación MIO Universidades',
      neighborhoodId: 'valle-del-lili',
      coords: [3.3644, -76.5316]
    },
    shift: 'Jornada Nocturna',
    departureTime: '9:35 PM',
    status: 'scheduled',
    totalSeats: 8,
    availableSeats: 4,
    passengers: [
      { name: 'Camilo S.', university: 'UNIAJC', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { name: 'Laura B.', university: 'Javeriana', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { name: 'Mateo P.', university: 'UNIAJC', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
      { name: 'Sofia T.', university: 'Icesi', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' }
    ],
    priceContribution: 0,
    insuranceActive: true,
    insuranceProvider: 'Alerta SOS Satelital ViajaU',
    meetingPoint: 'Portería vehicular UNIAJC con linternas / paraguas',
    onlyGirls: false,
    routePolyline: [
      [3.3518, -76.5338],
      [3.3560, -76.5330],
      [3.3600, -76.5322],
      [3.3644, -76.5316]
    ]
  },
  {
    id: 'trip-5',
    driver: {
      name: 'Valentina Ospina',
      role: 'Coordinadora Taxi Grupal',
      university: 'Javeriana Cali',
      career: 'Administración de Empresas',
      semester: '7mo Semestre',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      rating: 4.97,
      completedTrips: 19,
      verifiedEmail: true,
      verifiedCarnet: true,
      gender: 'F'
    },
    transportMode: 'taxi',
    vehicleInfo: {
      model: 'Taxi Seguro / Didi Compartido (4 cupos)',
      plate: 'Verificación en app'
    },
    origin: {
      name: 'Javeriana Cali (Bahía Entrada Pance)',
      coords: [3.3486, -76.5305]
    },
    destination: {
      name: 'Terminal de Transportes de Cali (Norte)',
      neighborhoodId: 'versalles',
      coords: [3.4651, -76.5233]
    },
    shift: 'Jornada Nocturna',
    departureTime: '9:15 PM',
    status: 'scheduled',
    totalSeats: 4,
    availableSeats: 1,
    passengers: [
      { name: 'Esteban C.', university: 'Icesi', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
      { name: 'Valeria G.', university: 'UNIAJC', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
      { name: 'Daniel R.', university: 'Javeriana', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80' }
    ],
    priceContribution: 6500,
    insuranceActive: true,
    insuranceProvider: 'AXA / ViajaU Protege',
    meetingPoint: 'Bahía de taxis de la Javeriana, parando por UNIAJC y Univalle si coincide',
    onlyGirls: false,
    routePolyline: [
      [3.3486, -76.5305],
      [3.3644, -76.5316],
      [3.4026, -76.5460],
      [3.4418, -76.5332],
      [3.4651, -76.5233]
    ]
  },
  {
    id: 'trip-6',
    driver: {
      name: 'Mateo Cárdenas',
      role: 'Conductor Carro',
      university: 'Universidad Icesi',
      career: 'Economía y Negocios',
      semester: '5to Semestre',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      rating: 4.89,
      completedTrips: 15,
      verifiedEmail: true,
      verifiedCarnet: true,
      gender: 'M'
    },
    transportMode: 'car',
    vehicleInfo: {
      model: 'Mazda 2 SkyActiv (Blanco)',
      plate: '***-982',
      trunkAvailable: true
    },
    origin: {
      name: 'Universidad Icesi (Parqueadero 2)',
      coords: [3.3423, -76.5312]
    },
    destination: {
      name: 'San Fernando / Miraflores',
      neighborhoodId: 'san-fernando',
      coords: [3.4270, -76.5410]
    },
    shift: 'Jornada Nocturna',
    departureTime: '10:00 PM',
    status: 'scheduled',
    totalSeats: 3,
    availableSeats: 2,
    passengers: [
      { name: 'Santiago B.', university: 'UAO', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
    ],
    priceContribution: 4000,
    insuranceActive: true,
    insuranceProvider: 'AXA / ViajaU Protege',
    meetingPoint: 'Portería Icesi sobre Cañasgordas frente a Carulla Pance',
    onlyGirls: false,
    routePolyline: [
      [3.3423, -76.5312],
      [3.3644, -76.5316],
    ]
  },
  {
    id: 'trip-7',
    driver: {
      name: 'Santiago Morales',
      role: 'Líder Ciclo-Parche',
      university: 'UNIAJC Sede Sur',
      career: 'Ingeniería de Sistemas',
      semester: '6to Semestre',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      rating: 4.96,
      completedTrips: 38,
      verifiedEmail: true,
      verifiedCarnet: true,
      gender: 'M'
    },
    transportMode: 'bike',
    vehicleInfo: {
      model: 'Bicicleta MTB / Caravana Ciclorruta Cañasgordas',
      equipment: 'Luces LED delanteras/traseras y chalecos reflectivos'
    },
    origin: {
      name: 'UNIAJC Sede Sur (Bicicletero Principal)',
      coords: [3.3518, -76.5338]
    },
    destination: {
      name: 'El Ingenio / Capri (Ciclorruta Pasoancho)',
      neighborhoodId: 'el-ingenio',
      coords: [3.3850, -76.5360]
    },
    shift: 'Jornada Nocturna',
    departureTime: '9:40 PM',
    status: 'scheduled',
    totalSeats: 6,
    availableSeats: 3,
    passengers: [
      { name: 'Daniela K.', university: 'UNIAJC', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { name: 'Felipe M.', university: 'Javeriana', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { name: 'Carolina O.', university: 'Icesi', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
    ],
    priceContribution: 0,
    insuranceActive: true,
    insuranceProvider: 'ViajaU Ciclo-Protege',
    meetingPoint: 'Bicicletero bajo techo frente a cafetería central',
    onlyGirls: false,
    routePolyline: [
      [3.3518, -76.5338],
      [3.3600, -76.5350],
      [3.3720, -76.5370],
      [3.3850, -76.5360]
    ]
  },
  {
    id: 'trip-8',
    driver: {
      name: 'Carlos Hernán Caicedo',
      role: 'Coordinador Ruta Foránea Terminal',
      university: 'UNIAJC Sede Sur',
      career: 'Ingeniería de Sistemas',
      semester: '8vo Semestre',
      avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
      rating: 4.93,
      completedTrips: 27,
      verifiedEmail: true,
      verifiedCarnet: true,
      gender: 'M'
    },
    transportMode: 'intermunicipal',
    vehicleInfo: {
      model: 'Van / Expreso MIO Conexión Terminal de Cali',
      details: 'Conexión directa para estudiantes que van a Palmira, Buga, Yumbo y Tuluá'
    },
    origin: {
      name: 'UNIAJC Sede Sur (Portería Vía Pance)',
      coords: [3.3518, -76.5338]
    },
    destination: {
      name: 'Terminal de Transportes de Cali (Norte)',
      neighborhoodId: 'versalles',
      coords: [3.4651, -76.5233]
    },
    shift: 'Jornada Nocturna (Urgente para no perder bus)',
    departureTime: '9:25 PM',
    status: 'scheduled',
    totalSeats: 5,
    availableSeats: 2,
    passengers: [
      { name: 'Julian B. (Palmira)', university: 'UNIAJC', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
      { name: 'Marcela T. (Yumbo)', university: 'Univalle', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
      { name: 'Camilo R. (Buga)', university: 'Javeriana', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' }
    ],
    priceContribution: 4500,
    insuranceActive: true,
    insuranceProvider: 'AXA / ViajaU Protege',
    meetingPoint: 'Bahía principal de buses con equipaje listo',
    onlyGirls: false,
    routePolyline: [
      [3.3518, -76.5338],
      [3.3644, -76.5316],
      [3.4026, -76.5460],
      [3.4418, -76.5332],
      [3.4651, -76.5233]
    ]
  }
];

export const CURRENT_STUDENT_USER = {
  id: 'student-kevin',
  name: 'Kevin Andrés González Dinas',
  email: 'kgonzalez@uniajc.edu.co',
  universityId: 'uniajc-sur',
  universityName: 'Institución Universitaria Antonio José Camacho',
  career: 'Ingeniería de Sistemas',
  semester: '8vo Semestre (Grupo 841A)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  role: 'both', // passenger, car_driver, moto_driver, walk_leader
  activeRole: 'passenger',
  neighborhoodId: 'el-caney',
  neighborhoodName: 'El Caney',
  zone: 'Zona Sur (Comuna 17)',
  shiftPreference: 'Jornada Nocturna (Salida 9:45 PM)',
  preferredModes: ['car', 'mio', 'walk', 'bike'],
  trustLevel: 2, // 1: Correo validado, 2: Carnet validado, 3: Viajero Top
  carnetCode: 'AJC-84102928',
  rating: 4.95,
  totalTrips: 42,
  emergencyContact: {
    name: 'Martha Dinas (Mamá)',
    phone: '+57 315 882 1920',
    relationship: 'Madre',
    notifyOnStart: true,
    notifyOnArrival: true
  },
  insuranceOptIn: true
};

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: '¡Cupo Confirmado!',
    message: 'Kevin González aceptó tu solicitud de viaje hacia El Caney para las 9:45 PM.',
    time: 'Hace 5 min',
    read: false,
    type: 'success',
    icon: 'check-circle'
  },
  {
    id: 'notif-2',
    title: 'Parche MIO por salir',
    message: 'El grupo de Claudia Aranda para la Troncal T31 se reúne en 15 min en los torniquetes de Universidades.',
    time: 'Hace 12 min',
    read: false,
    type: 'info',
    icon: 'bus'
  },
  {
    id: 'notif-3',
    title: 'Micro-seguro AXA Activo',
    message: 'Tu seguro de trayecto nocturno #AXA-88392 está activo con monitoreo satelital hasta llegar a casa.',
    time: 'Hace 25 min',
    read: true,
    type: 'shield',
    icon: 'shield-check'
  },
  {
    id: 'notif-4',
    title: 'Alerta de Bienestar UNIAJC',
    message: 'Monitoreo de seguridad especial habilitado hoy en corredor Pance / Cañasgordas hasta las 10:30 PM.',
    time: 'Hace 1 hora',
    read: true,
    type: 'warning',
    icon: 'alert-triangle'
  }
];

export const INITIAL_CHAT_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'Kevin González',
    senderRole: 'Conductor',
    isMe: false,
    text: '¡Hola muchachos! Salgo puntual a las 9:45 PM de la plazoleta central de la UNIAJC.',
    time: '9:20 PM'
  },
  {
    id: 'msg-2',
    sender: 'Ana V.',
    senderRole: 'Pasajera',
    isMe: false,
    text: 'Súper Kevin, ya salí de clase de Inteligencia de Negocios, te espero en la bahía.',
    time: '9:25 PM'
  },
  {
    id: 'msg-3',
    sender: 'Tú',
    senderRole: 'Pasajero',
    isMe: true,
    text: 'Voy bajando del laboratorio 4, llego en 5 minutos.',
    time: '9:28 PM'
  },
  {
    id: 'msg-4',
    sender: 'Sistema ViajaU',
    senderRole: 'Seguridad',
    isSystem: true,
    text: '🛡️ Seguro AXA activado. Cobertura médica y rastreo satelital vigentes durante este desplazamiento.',
    time: '9:30 PM'
  }
];

// Incidentes comunitarios reportados en tiempo real sobre el mapa de Cali
export const COMMUNITY_INCIDENTS = [
  {
    id: 'inc-1',
    type: 'mio_delay',
    title: 'Retraso Frecuencia MIO T31',
    description: 'Buses demorados más de 20 min en Estación Universidades con dirección Norte.',
    coords: [3.3644, -76.5316],
    severity: 'medium',
    time: 'Hace 15 min',
    reportedBy: 'Estudiante UNIAJC',
    icon: 'bus'
  },
  {
    id: 'inc-2',
    type: 'dark_spot',
    title: 'Luminaria Apagada en Cruce Peatonal',
    description: 'Falta de alumbrado público en el sendero entre UNIAJC y la estación Universidades.',
    coords: [3.3560, -76.5330],
    severity: 'high',
    time: 'Hace 30 min',
    reportedBy: 'Parche Caminata Nocturna',
    icon: 'moon'
  },
  {
    id: 'inc-3',
    type: 'police_patrol',
    title: 'Patrulla de Policía y Cuadrante Seguro',
    description: 'Puesto de control y acompañamiento preventivo de la Policía en la glorieta de Cañasgordas.',
    coords: [3.3580, -76.5310],
    severity: 'low',
    time: 'Hace 8 min',
    reportedBy: 'Seguridad Universitaria',
    icon: 'shield-check'
  },
  {
    id: 'inc-4',
    type: 'traffic_rain',
    title: 'Paso Lento por Pavimento Mojado',
    description: 'Llovizna intermitente sobre la Avenida Pasoancho con Carrera 100.',
    coords: [3.3780, -76.5360],
    severity: 'medium',
    time: 'Hace 22 min',
    reportedBy: 'Conductor Carro ViajaU',
    icon: 'cloud-rain'
  }
];

// Datos estadísticos y empíricos del Informe de Validación de Idea de Negocio (33 estudiantes)
export const REPORT_SURVEY_DATA = {
  sampleSize: 33,
  location: 'Santiago de Cali, Colombia',
  course: 'Saber 1 — Innovación y Emprendimiento (Grupo 841A)',
  institution: 'Institución Universitaria Antonio José Camacho (UNIAJC)',
  figures: [
    {
      id: 'fig-1',
      title: 'Figura 1. Universidad en la que estudian los encuestados (n = 32)',
      description: 'El 50% de la muestra pertenece a la UNIAJC, seguido por la Universidad Santiago de Cali (15.6%) y Univalle (12.5%).',
      keyInsight: '50% UNIAJC y 50% otras 7 universidades de Cali, demostrando interés interuniversitario.',
      data: [
        { label: 'UNIAJC', value: 50.0, count: 16, color: '#10b981' },
        { label: 'Univ. Santiago de Cali (USC)', value: 15.6, count: 5, color: '#8b5cf6' },
        { label: 'Universidad del Valle', value: 12.5, count: 4, color: '#ef4444' },
        { label: 'Javeriana Cali', value: 9.4, count: 3, color: '#3b82f6' },
        { label: 'Otras (Icesi, San Buenaventura, UAO)', value: 12.5, count: 4, color: '#f59e0b' }
      ]
    },
    {
      id: 'fig-2',
      title: 'Figura 2. Principal dificultad al regresar de estudiar en la noche (n = 33)',
      description: 'La seguridad es, de lejos, la preocupación más crítica para el estudiante al terminar clases.',
      keyInsight: 'Casi la mitad (48.5%) señala el miedo a la inseguridad y atracos como su mayor problema.',
      data: [
        { label: 'Inseguridad y Peligro', value: 48.5, count: 16, color: '#ef4444' },
        { label: 'Transporte Escaso / Lento', value: 18.2, count: 6, color: '#f59e0b' },
        { label: 'Falta de Compañía / Soledad', value: 18.2, count: 6, color: '#8b5cf6' },
        { label: 'Costo Elevado del Desplazamiento', value: 15.1, count: 5, color: '#06b6d4' }
      ]
    },
    {
      id: 'fig-3',
      title: 'Figura 3. Estudiantes que han evitado estudiar de noche por motivos de seguridad (n = 33)',
      description: 'El dato más contundente del trabajo de campo: la inseguridad altera directamente la vida académica.',
      keyInsight: 'El 87.9% ha dejado de matricular materias nocturnas por miedo al regreso a casa.',
      data: [
        { label: 'Sí ha evitado estudiar de noche', value: 87.9, count: 29, color: '#dc2626' },
        { label: 'No ha evitado estudiar de noche', value: 12.1, count: 4, color: '#10b981' }
      ]
    },
    {
      id: 'fig-4',
      title: 'Figura 4. Medida que más aumentaría la sensación de seguridad (n = 33)',
      description: 'La solución operativa de desplazarse en grupo y transporte nocturno supera al resto.',
      keyInsight: 'El 36.4% prioriza transporte nocturno acompañado y 21.2% mayor vigilancia en paraderos.',
      data: [
        { label: 'Transporte Nocturno Acompañado', value: 36.4, count: 12, color: '#10b981' },
        { label: 'Mayor Vigilancia y Cuadrante', value: 21.2, count: 7, color: '#3b82f6' },
        { label: 'Rutas Directas Punto a Punto', value: 18.2, count: 6, color: '#8b5cf6' },
        { label: 'Iluminación y Puntos de Encuentro', value: 24.2, count: 8, color: '#f59e0b' }
      ]
    },
    {
      id: 'fig-5',
      title: 'Figura 5. Interés en que la aplicación conecte con estudiantes de ruta similar (n = 33)',
      description: 'Aceptación rotunda de la propuesta de valor de ViajaU.',
      keyInsight: 'Más del 80% adoptaría de inmediato una herramienta para coincidir en ruta con compañeros.',
      data: [
        { label: 'Sí le gustaría usar la app', value: 81.8, count: 27, color: '#10b981' },
        { label: 'Tal vez / Depende de seguridad', value: 15.2, count: 5, color: '#f59e0b' },
        { label: 'No le interesa', value: 3.0, count: 1, color: '#ef4444' }
      ]
    },
    {
      id: 'fig-6',
      title: 'Figura 6. Información necesaria antes de aceptar acompañar a alguien (n = 33)',
      description: 'Parámetros obligatorios requeridos para la confianza mutua entre universitarios.',
      keyInsight: 'Nombre/foto y ruta aproximada concentran el 60.6% de los requerimientos de confianza.',
      data: [
        { label: 'Nombre y Foto de Carnet', value: 30.3, count: 10, color: '#3b82f6' },
        { label: 'Ruta Aproximada / Barrio', value: 30.3, count: 10, color: '#10b981' },
        { label: 'Carrera y Semestre', value: 21.2, count: 7, color: '#8b5cf6' },
        { label: 'Hora Exacta de Salida', value: 18.2, count: 6, color: '#f59e0b' }
      ]
    }
  ]
};

// Diagrama de Ishikawa (Espina de Pescado) del Informe
export const ISHIKAWA_DATA = {
  problem: 'El transporte diario de los estudiantes universitarios en Cali es costoso, lento e inseguro, en particular durante la jornada nocturna.',
  categories: [
    {
      id: 'personas',
      name: 'Personas',
      icon: 'users',
      causes: [
        'Falta de confianza para compartir vehículo o trayecto con desconocidos de otras carreras.',
        'Escasa costumbre de coordinar viajes grupales formales más allá de amigos cercanos.',
        'Temor y vulnerabilidad acentuada en mujeres jóvenes en horarios nocturnos (después de 9:00 PM).'
      ]
    },
    {
      id: 'procesos',
      name: 'Procesos',
      icon: 'refresh-cw',
      causes: [
        'Ausencia de un método organizado y seguro para encontrar compañeros con rutas y horarios similares.',
        'Dependencia exclusiva de grupos informales de WhatsApp con poca verificación de identidad.',
        'Falta de protocolos de confirmación de llegada segura a casa.'
      ]
    },
    {
      id: 'tecnologia',
      name: 'Tecnología',
      icon: 'cpu',
      causes: [
        'Ausencia de una aplicación que cruce barrio de residencia, rutas del MIO y jornada académica.',
        'Falta de integración con micro-seguros embebidos por trayecto de bajo costo.',
        'Subutilización de la infraestructura de datos abiertos existente (GTFS Metrocali y OpenStreetMap).'
      ]
    },
    {
      id: 'entorno',
      name: 'Entorno',
      icon: 'map-pin',
      causes: [
        'Congestión vehicular severa en horas pico en corredores de Calle 5, Pasoancho y Cañasgordas.',
        'Caída sostenida en el uso del MIO (36% menos pasajeros) que reduce la frecuencia nocturna.',
        'Calles y paraderos con iluminación deficiente alrededor de los campus universitarios.'
      ]
    },
    {
      id: 'economia',
      name: 'Economía',
      icon: 'dollar-sign',
      causes: [
        'Presupuesto estudiantil severamente limitado frente al costo de taxi o vehículo particular.',
        'Tarifas de transporte en aumento sin tarifa diferencial consolidada para todos los universitarios.',
        'Alto costo de combustible y parqueadero que ahoga a estudiantes que llevan carro o moto propia.'
      ]
    }
  ]
};

// Árbol de Problemas del Informe
export const PROBLEM_TREE_DATA = {
  centralProblem: 'Los estudiantes universitarios de Cali que viven lejos del campus enfrentan un transporte diario costoso, lento e inseguro, con mayor riesgo en la jornada nocturna.',
  causes: [
    { id: 'c1', text: 'Las rutas de transporte público no cubren con frecuencia todas las zonas residenciales.', tag: 'Cobertura MIO' },
    { id: 'c2', text: 'No existe un mecanismo organizado para agrupar a estudiantes por zona y horario.', tag: 'Coordinación' },
    { id: 'c3', text: 'El costo de un vehículo particular o app de transporte individual es inaccesible.', tag: 'Económica' },
    { id: 'c4', text: 'No existe acompañamiento ni verificación satelital de llegada para el regreso nocturno.', tag: 'Seguridad' }
  ],
  effects: [
    { id: 'e1', text: 'Aumento del gasto mensual en transporte, reduciendo el presupuesto de alimentación o copias.', tag: 'Impacto Presupuestal' },
    { id: 'e2', text: 'Llegadas tarde, inasistencias a clase y deserción universitaria forzada por inseguridad.', tag: 'Deserción Académica' },
    { id: 'e3', text: 'Mayor exposición a atracos y acoso durante trayectos nocturnos en solitario.', tag: 'Riesgo Físico' },
    { id: 'e4', text: 'Congestión vehicular y alta huella de carbono por desplazamientos individuales ineficientes.', tag: 'Impacto Ambiental' }
  ]
};

// Matriz Jobs to Be Done (Clayton Christensen)
export const JOBS_TO_BE_DONE_DATA = {
  coreJob: 'Cuando el estudiante sale de clase en la noche y debe regresar a una zona alejada del campus, busca desplazarse acompañado de otros estudiantes de su misma zona y horario, y contar con la verificación de que llegó bien, para llegar a casa sin riesgo y sin comprometer una parte relevante de su presupuesto mensual.',
  dimensions: [
    {
      dimension: 'Trabajo Funcional',
      detail: 'Llegar a tiempo y de forma segura a la universidad o a la residencia, mediante la coordinación de ruta y horario con otros estudiantes.',
      icon: 'navigation',
      color: '#10b981'
    },
    {
      dimension: 'Trabajo Emocional',
      detail: 'Obtener tranquilidad mental, reducción de la ansiedad y control sobre el trayecto diario, en particular el regreso nocturno.',
      icon: 'heart',
      color: '#ef4444'
    },
    {
      dimension: 'Trabajo Social',
      detail: 'Ser percibido como un miembro solidario, confiable y responsable de la comunidad universitaria que cuida de sus compañeros.',
      icon: 'users',
      color: '#3b82f6'
    }
  ]
};

// Matriz de Validación de Hipótesis de Steve Blank
export const HYPOTHESES_DATA = [
  {
    id: 'H1',
    title: 'H1 — Problema Real',
    statement: 'El transporte diario representa una carga significativa de tiempo, dinero y seguridad para los estudiantes en jornada nocturna.',
    status: 'Validada',
    statusBadge: 'badge-emerald',
    evidence: '48.5% señaló la seguridad como principal dificultad y 87.9% ha evitado estudiar de noche por motivos de seguridad.',
    validationScore: 95
  },
  {
    id: 'H2',
    title: 'H2 — Deseabilidad del Emparejamiento',
    statement: 'Los estudiantes coordinarán trayectos con compañeros verificados que no conocen previamente.',
    status: 'Validada',
    statusBadge: 'badge-emerald',
    evidence: '81.8% afirmó que usaría la aplicación. 60.6% exige únicamente nombre/carnet y ruta aproximada para viajar juntos.',
    validationScore: 90
  },
  {
    id: 'H3',
    title: 'H3 — Comportamiento Informal Actual',
    statement: 'Los estudiantes ya resuelven el problema con "cupos" informales por WhatsApp y acuerdos verbales.',
    status: 'Validación en Campo',
    statusBadge: 'badge-amber',
    evidence: 'Observado en la USC y Univalle. Pendiente registrar con el guion de videoentrevistas del Anexo A.',
    validationScore: 70
  },
  {
    id: 'H4',
    title: 'H4 — Disposición a Pagar Micro-Seguro',
    statement: 'Los estudiantes pagarán un valor fijo ($1.500 a $3.500 COP) por un seguro embebido de asistencia por trayecto.',
    status: 'Pendiente Ronda Cualitativa',
    statusBadge: 'badge-amber',
    evidence: 'Respaldado por el modelo comercial de BlaBlaCar y AXA en Europa. Se valida con el Anexo A del informe.',
    validationScore: 65
  }
];

// Preguntas del Guion de Entrevista en Video (Anexo A del informe)
export const INTERVIEW_QUESTIONS = [
  { id: 1, text: '¿Autorizas que grabemos esta entrevista para un trabajo académico de validación de idea de negocio?' },
  { id: 2, text: '¿En qué universidad y jornada estudias, y te mueves en carro propio, moto, transporte público o a pie?' },
  { id: 3, text: 'Cuéntame cómo es un día típico tuyo, desde que sales de clase en la noche hasta que llegas a tu casa.' },
  { id: 4, text: 'Describe la última vez que tuviste una mala experiencia o un momento de inseguridad en ese trayecto nocturno.' },
  { id: 5, text: 'En una escala de uno a cinco, ¿qué tan seguro te sientes en tu trayecto nocturno, y por qué esa calificación?' },
  { id: 6, text: '¿Alguna vez has compartido transporte con compañeros para volver de la universidad (cupo pagado o WhatsApp)?' },
  { id: 7, text: '¿Quién armaba el grupo, cómo decidían en quién confiar y qué fallaba de esa forma informal?' },
  { id: 8, text: 'Técnica de los 5 Porqués sobre la causa raíz del miedo o la dificultad de viaje.' },
  { id: 9, text: '¿Cuánto gastas al mes en transporte hacia la universidad, y cómo afecta el resto de tu presupuesto?' },
  { id: 10, text: 'Si existiera una app que te agrupe con estudiantes de tu zona y horario para no regresar solo, ¿la usarías?' },
  { id: 11, text: '¿Qué te generaría desconfianza sobre compartir tu ubicación en tiempo real con compañeros de viaje?' },
  { id: 12, text: 'Si existiera un seguro de viaje que por $2.000 a $5.000 dé asistencia y avise si no confirmas llegada, ¿lo pagarías?' },
  { id: 13, text: '¿Cuánto te parecería razonable pagar por ese seguro y por qué ese monto?' },
  { id: 14, text: '¿Confiarías más en eso que en avisar por WhatsApp a un amigo cuando llegas? ¿Por qué?' },
  { id: 15, text: 'Si pudieras cambiar una sola cosa de tu transporte diario, ¿qué cambiarías?' },
  { id: 16, text: 'Imagina una solución perfecta para este problema: ¿cómo se vería y qué tendría que hacer por ti?' },
  { id: 17, text: '¿Hay algo de tu experiencia con el transporte que no te hayamos preguntado y creas que debamos saber?' }
];

