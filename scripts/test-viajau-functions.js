import { readAppData, writeAppData, resetAppData } from '../src/services/appDatabase.js';
import {
  UNIVERSITY_DOMAINS,
  validateInstitutionalEmail,
  calculateDistanceBetweenPoints,
  buildRouteSummary,
  filterTravelMatches,
  calculateTripCost,
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
    name: 'filterTravelMatches',
    fn: () => filterTravelMatches({ zone: 'El Caney', time: '19:45', faculty: 'Ingeniería', transport: 'MIO', confidence: '4.8+', gender: 'Cualquiera', sort: 'Compatibilidad' }, [
      { name: 'Ana Vélez', zone: 'El Caney', time: '19:45', faculty: 'Ingeniería', transport: 'MIO + caminata', score: 96, safety: 'Alta', gender: 'Mujer' },
      { name: 'Daniela Carmona', zone: 'El Caney', time: '19:50', faculty: 'Ingeniería', transport: 'MIO', score: 92, safety: 'Alta', gender: 'Mujer' },
      { name: 'Santiago Rojas', zone: 'Pance', time: '20:10', faculty: 'Diseño', transport: 'Carro', score: 86, safety: 'Media', gender: 'Hombre' }
    ])
  },
  {
    name: 'calculateTripCost',
    fn: () => calculateTripCost(8.4)
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
