import { readAppData, writeAppData, resetAppData } from '../src/services/appDatabase.js';
import {
  UNIVERSITY_DOMAINS,
  validateInstitutionalEmail,
  createStudentProfile,
  calculateDistanceBetweenPoints,
  buildRouteSummary,
  calculateCompatibilityScore,
  filterTravelMatches,
  createTravelOffer,
  requestTripSeat,
  calculateTripCost,
  createEmergencyAlert,
  updateTravelStatus,
  createChatMessage,
  buildTravelSearchCandidates,
  buildSafetyOverview,
  buildDashboardSnapshot,
  buildMatchRecommendations,
  computeReputationScore,
  rateUser,
  reportUser,
  generateNotification,
  createTripGroup,
  getUserSummary,
  challengeRequiredActions,
  getRouteModeKey,
  calculateTravelReadiness,
  buildDashboardMetrics,
  createTrustLedger,
  buildSafetyMatrix,
  getCurrentStudentLocation,
  searchZoneByText,
  suggestMeetingPoint,
  evaluateTripRisk,
  createModerationCase,
  buildTrustSummary,
  buildSafetyAlert
} from '../src/services/viajauCore.js';
import { calculateMultimodalDetails } from '../src/services/routingApi.js';

const makeLocalStorageMock = () => {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); }
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = makeLocalStorageMock();
}

if (typeof globalThis.window === 'undefined') {
  globalThis.window = { localStorage: globalThis.localStorage };
}

const testCases = [
  {
    name: 'UNIVERSITY_DOMAINS',
    fn: () => UNIVERSITY_DOMAINS
  },
  {
    name: 'validateInstitutionalEmail',
    fn: () => validateInstitutionalEmail('kevin.gonzalez@uniajc.edu.co', '@uniajc.edu.co')
  },
  {
    name: 'createStudentProfile',
    fn: () => createStudentProfile({
      name: 'Ana Vélez',
      email: 'ana@uniajc.edu.co',
      university: 'UNIAJC',
      career: 'Ingeniería de Sistemas',
      semester: '7',
      shift: 'Nocturna',
      neighborhood: 'El Caney',
      transport: 'MIO + caminata',
      emergency: 'María Vélez',
      privacy: 'Zona aproximada'
    })
  },
  {
    name: 'calculateDistanceBetweenPoints',
    fn: () => calculateDistanceBetweenPoints({ lat: 3.4577, lng: -76.5394 }, { lat: 3.47, lng: -76.52 })
  },
  {
    name: 'buildRouteSummary',
    fn: () => buildRouteSummary({
      origin: 'UNIAJC Sede Sur',
      destination: 'El Caney',
      mode: 'MIO + caminata',
      routeResult: { distanceKm: 7.9, durationMin: 24 }
    })
  },
  {
    name: 'calculateCompatibilityScore',
    fn: () => calculateCompatibilityScore({ neighborhood: 'El Caney', shift: 'Nocturna', transport: 'MIO + caminata', trustScore: 4.8 }, { zone: 'El Caney', time: '19:45', transport: 'MIO + caminata' })
  },
  {
    name: 'filterTravelMatches',
    fn: () => filterTravelMatches({ zone: 'El Caney', time: '19:45', faculty: 'Ingeniería', transport: 'MIO', confidence: '4.8+', gender: 'Cualquiera', sort: 'Compatibilidad' }, [
      { name: 'Ana Vélez', zone: 'El Caney', time: '19:45', faculty: 'Ingeniería', transport: 'MIO + caminata', score: 96, safety: 'Alta', gender: 'Mujer' },
      { name: 'Daniela Carmona', zone: 'El Caney', time: '19:50', faculty: 'Ingeniería', transport: 'MIO', score: 92, safety: 'Alta', gender: 'Mujer' },
      { name: 'Santiago Rojas', zone: 'Pance', time: '20:10', faculty: 'Diseño', transport: 'Carro', score: 86, safety: 'Media', gender: 'Hombre' }
    ])
  },
  {
    name: 'createTravelOffer',
    fn: () => createTravelOffer({ name: 'Kevin González' }, { origin: 'UNIAJC Sede Sur', destination: 'El Caney' })
  },
  {
    name: 'requestTripSeat',
    fn: () => requestTripSeat([{ driver: 'Claudia', route: 'UNIAJC -> Pance', seats: 2, cost: '3500 COP', status: 'Oferta nueva' }], 0)
  },
  {
    name: 'calculateTripCost',
    fn: () => calculateTripCost(8.4)
  },
  {
    name: 'createEmergencyAlert',
    fn: () => createEmergencyAlert('Botón de pánico', 'Kevin González')
  },
  {
    name: 'updateTravelStatus',
    fn: () => updateTravelStatus([{ driver: 'Claudia', status: 'Verificado' }], 0, 'Viaje en curso')
  },
  {
    name: 'createChatMessage',
    fn: () => createChatMessage('Kevin', 'Voy saliendo de la universidad.')
  },
  {
    name: 'buildTravelSearchCandidates',
    fn: () => buildTravelSearchCandidates()
  },
  {
    name: 'buildSafetyOverview',
    fn: () => buildSafetyOverview({ emergencyContact: 'María González', privacy: 'Zona aproximada' })
  },
  {
    name: 'buildDashboardSnapshot',
    fn: () => buildDashboardSnapshot([{ driver: 'Ana' }], [{ type: 'Check-in' }])
  },
  {
    name: 'buildMatchRecommendations',
    fn: () => buildMatchRecommendations({ neighborhood: 'El Caney', trustScore: 4.8 }, [{ name: 'Ana Vélez', zone: 'El Caney', time: '19:45', transport: 'MIO + caminata' }])
  },
  {
    name: 'computeReputationScore',
    fn: () => computeReputationScore([{ score: 4.9 }, { score: 4.8 }, { score: 4.7 }])
  },
  {
    name: 'rateUser',
    fn: () => rateUser({ name: 'Ana', rating: 4.7 }, 4.9)
  },
  {
    name: 'reportUser',
    fn: () => reportUser({ name: 'Santiago' }, 'Viaje inseguro')
  },
  {
    name: 'generateNotification',
    fn: () => generateNotification('match', 'Hubo un nuevo match seguro', 'Push')
  },
  {
    name: 'createTripGroup',
    fn: () => createTripGroup({ name: 'Kevin González', trustScore: 4.9 }, { origin: 'UNIAJC Sede Sur', destination: 'El Caney' })
  },
  {
    name: 'getUserSummary',
    fn: () => getUserSummary({ name: 'Kevin', university: 'UNIAJC', career: 'Ingeniería de Sistemas', semester: '8vo', verified: true, trustScore: 4.9 })
  },
  {
    name: 'challengeRequiredActions',
    fn: () => challengeRequiredActions()
  },
  {
    name: 'getRouteModeKey',
    fn: () => getRouteModeKey('MIO + caminata')
  },
  {
    name: 'calculateTravelReadiness',
    fn: () => calculateTravelReadiness({ trustScore: 4.9 }, { origin: 'UNIAJC', destination: 'El Caney' })
  },
  {
    name: 'buildDashboardMetrics',
    fn: () => buildDashboardMetrics({ trustScore: 4.8 }, { time: '19:45' }, [{ driver: 'Ana' }], [{ type: 'Check-in' }])
  },
  {
    name: 'createTrustLedger',
    fn: () => createTrustLedger({ name: 'Ana', trustScore: 4.8 }, 'checkin', 0.1)
  },
  {
    name: 'buildSafetyMatrix',
    fn: () => buildSafetyMatrix({ trustScore: 4.8, emergency: 'María' })
  },
  {
    name: 'getCurrentStudentLocation',
    fn: () => getCurrentStudentLocation({ neighborhood: 'El Caney', privacy: 'Zona aproximada' })
  },
  {
    name: 'searchZoneByText',
    fn: () => searchZoneByText('El', ['El Caney', 'Pance', 'Valle del Lili'])
  },
  {
    name: 'suggestMeetingPoint',
    fn: () => suggestMeetingPoint('UNIAJC Sede Sur', 'El Caney', ['El Caney'])
  },
  {
    name: 'evaluateTripRisk',
    fn: () => evaluateTripRisk({ route: 'UNIAJC -> El Caney' }, { trustScore: 4.9 })
  },
  {
    name: 'createModerationCase',
    fn: () => createModerationCase({ name: 'Santiago' }, 'Reporte de conducta insegura')
  },
  {
    name: 'buildTrustSummary',
    fn: () => buildTrustSummary([{ rating: 4.8 }, { rating: 4.9 }, { rating: 4.7 }])
  },
  {
    name: 'buildSafetyAlert',
    fn: () => buildSafetyAlert('Check-in', 'Llegada segura confirmada a la universidad', 'low')
  },
  {
    name: 'calculateMultimodalDetails',
    fn: () => calculateMultimodalDetails(8.4)
  },
  {
    name: 'readAppData/writeAppData',
    fn: () => {
      const payload = {
        student: { name: 'Test Student', neighborhood: 'El Caney' },
        university: { id: 'uniajc', name: 'UNIAJC', domain: '@uniajc.edu.co' },
        activeTab: 'auth'
      };
      writeAppData(payload);
      return readAppData();
    }
  },
  {
    name: 'resetAppData',
    fn: () => resetAppData()
  }
];

const runTests = async () => {
  console.log('===== VIAJAU PROJECT FUNCTION TEST SUITE =====');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const results = [];

  for (const test of testCases) {
    try {
      const value = await test.fn();
      const result = {
        name: test.name,
        status: 'OK',
        value
      };
      console.log(`✔ ${test.name}: ${JSON.stringify(value, null, 2)}`);
      results.push(result);
    } catch (error) {
      const result = {
        name: test.name,
        status: 'ERROR',
        value: error?.message || String(error)
      };
      console.log(`✖ ${test.name}: ${result.value}`);
      results.push(result);
    }
    console.log('');
  }

  console.log('===== SUMMARY =====');
  console.log(`Tests run: ${results.length}`);
  console.log(`Passed: ${results.filter((item) => item.status === 'OK').length}`);
  console.log(`Failed: ${results.filter((item) => item.status === 'ERROR').length}`);
};

runTests();
