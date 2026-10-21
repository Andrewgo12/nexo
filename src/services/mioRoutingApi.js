import { getOsrmRoute } from './routingApi.js';

const MIO_FEATURE_SERVICE = 'https://services9.arcgis.com/8rJ42n9yWry0I4K4/arcgis/rest/services/GTFS/FeatureServer';
const REQUEST_TIMEOUT_MS = 10000;
const MAX_STOPS_PER_SIDE = 3;
const MAX_SHAPES_PER_SIDE = 40;
const MAX_QUERY_IDS = 500;
const MAX_QUERY_PAGES = 20;

function distanceMeters(a, b) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(b[0] - a[0]);
  const longitudeDelta = toRadians(b[1] - a[1]);
  const value = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(a[0])) * Math.cos(toRadians(b[0])) *
    Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function validateCoordinates(coords, label) {
  if (
    !Array.isArray(coords) ||
    coords.length !== 2 ||
    !Number.isFinite(coords[0]) ||
    !Number.isFinite(coords[1]) ||
    coords[0] < -90 ||
    coords[0] > 90 ||
    coords[1] < -180 ||
    coords[1] > 180
  ) {
    throw new Error(`${label} debe tener latitud y longitud válidas.`);
  }
}

async function queryLayer(layerId, parameters) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const pageSize = Number(parameters.resultRecordCount || 1000);
  const features = [];

  try {
    for (let page = 0; page < MAX_QUERY_PAGES; page += 1) {
      const body = new URLSearchParams({
        ...parameters,
        f: 'json',
        resultOffset: String(Number(parameters.resultOffset || 0) + page * pageSize),
      });
      const response = await fetch(`${MIO_FEATURE_SERVICE}/${layerId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Metro Cali respondió con el estado ${response.status}.`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || 'Metro Cali devolvió un error al consultar el GTFS.');
      }
      if (!Array.isArray(data.features)) {
        throw new Error('Metro Cali devolvió una respuesta GTFS inválida.');
      }
      features.push(...data.features);
      if (!data.exceededTransferLimit) return features;
      if (!data.features.length) break;
    }

    throw new Error('La respuesta de rutas MIO excede el límite consultable del proveedor.');
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La consulta de rutas MIO tardó demasiado. Intenta de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function findNearbyStops(coords) {
  const [lat, lng] = coords;
  const delta = 0.015;
  const features = await queryLayer(0, {
    where: '1=1',
    geometry: `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outFields: 'ID,GStopID',
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '500',
  });

  const stops = features
    .map(({ attributes, geometry }) => ({
      id: Number(attributes.ID),
      code: String(attributes.GStopID || attributes.ID),
      coords: [Number(geometry?.y), Number(geometry?.x)],
    }))
    .filter((stop) => Number.isInteger(stop.id) && stop.coords.every(Number.isFinite))
    .map((stop) => ({ ...stop, distance: distanceMeters(coords, stop.coords) }))
    .filter((stop) => stop.distance <= 1500)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_STOPS_PER_SIDE);

  if (!stops.length) {
    throw new Error('No se encontraron paradas MIO a una distancia caminable de ese punto.');
  }
  return stops;
}

async function findLineVariantIds(stop) {
  const where = `FromStopID=${stop.id} OR ToStopID=${stop.id}`;
  const features = await queryLayer(1, {
    where,
    outFields: 'LineVarID',
    returnGeometry: 'false',
    returnDistinctValues: 'true',
    resultRecordCount: '2000',
  });
  return features
    .map(({ attributes }) => Number(attributes.LineVarID))
    .filter(Number.isInteger);
}

async function getLineVariants(ids) {
  const uniqueIds = [...new Set(ids)];
  const batches = [];
  for (let index = 0; index < uniqueIds.length; index += MAX_QUERY_IDS) {
    batches.push(uniqueIds.slice(index, index + MAX_QUERY_IDS));
  }

  const features = await Promise.all(batches.map((batch) => queryLayer(5, {
    where: `ID IN (${batch.join(',')})`,
    outFields: 'ID,LineID,GDirectionID,GShapeID',
    returnGeometry: 'false',
    resultRecordCount: String(MAX_QUERY_IDS),
  })));

  return features.flat().map(({ attributes }) => ({
    id: Number(attributes.ID),
    lineId: Number(attributes.LineID),
    direction: Number(attributes.GDirectionID),
    shapeId: String(attributes.GShapeID || ''),
  })).filter((variant) => (
    Number.isInteger(variant.id) &&
    Number.isInteger(variant.lineId) &&
    variant.shapeId.length > 0
  ));
}

function shapeGroupKey(variant) {
  const [routeId, shapeId] = variant.shapeId.split('-');
  if (!routeId || !shapeId) return '';
  return `${routeId}-${shapeId}-${variant.direction}`;
}

function selectShapeRepresentatives(variants, relevantIds) {
  const relevant = new Set(relevantIds);
  const selected = new Map();
  for (const variant of variants) {
    if (!relevant.has(variant.id)) continue;
    const key = shapeGroupKey(variant);
    const current = selected.get(key);
    if (key && (!current || variant.id < current.id)) selected.set(key, variant);
  }
  return [...selected.values()]
    .sort((a, b) => a.id - b.id)
    .slice(0, MAX_SHAPES_PER_SIDE);
}

async function getShapeSegments(variants) {
  const ids = [...new Set(variants.map(({ id }) => id))];
  const features = [];
  for (let index = 0; index < ids.length; index += MAX_QUERY_IDS) {
    const batch = ids.slice(index, index + MAX_QUERY_IDS);
    const records = await queryLayer(1, {
      where: `LineVarID IN (${batch.join(',')})`,
      outFields: 'LineVarID,SqIdx,FromStopID,ToStopID,Shape__Length',
      returnGeometry: 'true',
      outSR: '4326',
      orderByFields: 'LineVarID,SqIdx',
      resultRecordCount: '2000',
    });
    features.push(...records);
  }

  const grouped = new Map();
  for (const feature of features) {
    const { attributes, geometry } = feature;
    const lineVariantId = Number(attributes.LineVarID);
    const path = geometry?.paths?.[0];
    if (
      !Number.isInteger(lineVariantId) ||
      !Array.isArray(path) ||
      path.length < 2 ||
      !Number.isFinite(Number(attributes.Shape__Length))
    ) continue;

    if (!grouped.has(lineVariantId)) grouped.set(lineVariantId, []);
    grouped.get(lineVariantId).push({
      sequence: Number(attributes.SqIdx),
      fromStopId: Number(attributes.FromStopID),
      toStopId: Number(attributes.ToStopID),
      distanceMeters: Number(attributes.Shape__Length),
      geometry: path.map(([lng, lat]) => [Number(lat), Number(lng)]),
    });
  }
  return grouped;
}

function findForwardSegments(segments, fromStopId, toStopId) {
  const ordered = [...segments].sort((a, b) => a.sequence - b.sequence);
  for (let start = 0; start < ordered.length; start += 1) {
    if (ordered[start].fromStopId !== fromStopId) continue;
    for (let end = start; end < ordered.length; end += 1) {
      if (end > start && ordered[end - 1].toStopId !== ordered[end].fromStopId) break;
      if (ordered[end].toStopId === toStopId) return ordered.slice(start, end + 1);
    }
  }
  return null;
}

function buildPath(segments) {
  const polyline = [];
  for (const segment of segments) {
    for (const coordinate of segment.geometry) {
      const previous = polyline.at(-1);
      if (!previous || previous[0] !== coordinate[0] || previous[1] !== coordinate[1]) {
        polyline.push(coordinate);
      }
    }
  }
  return {
    polyline,
    distanceMeters: segments.reduce((sum, segment) => sum + segment.distanceMeters, 0),
  };
}

function evaluateRoute(variants, shapes, startStops, endStops) {
  const groups = variants.map((variant) => ({
    ...variant,
    segments: shapes.get(variant.id) || [],
  })).filter((variant) => variant.segments.length > 0);
  const candidates = [];

  for (const startStop of startStops) {
    for (const endStop of endStops) {
      for (const variant of groups) {
        const direct = findForwardSegments(variant.segments, startStop.id, endStop.id);
        if (!direct) continue;
        const path = buildPath(direct);
        candidates.push({
          startStop,
          endStop,
          segments: [path],
          routes: [variant.shapeId.split('-')[0]],
          score: path.distanceMeters + startStop.distance + endStop.distance,
        });
      }
    }
  }

  if (!candidates.length) {
    for (const startStop of startStops) {
      for (const firstVariant of groups) {
        const firstSegments = [...firstVariant.segments].sort((a, b) => a.sequence - b.sequence);
        const firstStartIndex = firstSegments.findIndex((segment) => segment.fromStopId === startStop.id);
        if (firstStartIndex < 0) continue;
        for (const endStop of endStops) {
          for (const secondVariant of groups) {
            if (firstVariant.id === secondVariant.id) continue;
            const secondSegments = [...secondVariant.segments].sort((a, b) => a.sequence - b.sequence);
            const secondEndIndex = secondSegments.findIndex((segment) => segment.toStopId === endStop.id);
            if (secondEndIndex < 0) continue;

            for (let firstEndIndex = firstStartIndex; firstEndIndex < firstSegments.length; firstEndIndex += 1) {
              const transferStopId = firstSegments[firstEndIndex].toStopId;
              const transferIndex = secondSegments.findIndex((segment, index) => (
                index <= secondEndIndex && segment.fromStopId === transferStopId
              ));
              if (transferIndex < 0 || transferIndex > secondEndIndex) continue;

              const firstPath = buildPath(firstSegments.slice(firstStartIndex, firstEndIndex + 1));
              const secondPath = buildPath(secondSegments.slice(transferIndex, secondEndIndex + 1));
              candidates.push({
                startStop,
                endStop,
                segments: [firstPath, secondPath],
                routes: [
                  firstVariant.shapeId.split('-')[0],
                  secondVariant.shapeId.split('-')[0],
                ],
                score: firstPath.distanceMeters + secondPath.distanceMeters + startStop.distance + endStop.distance,
              });
            }
          }
        }
      }
    }
  }

  return candidates.sort((a, b) => a.score - b.score)[0] || null;
}

export async function getMioRoute(origin, destination) {
  validateCoordinates(origin, 'El origen');
  validateCoordinates(destination, 'El destino');

  const [startStops, endStops] = await Promise.all([
    findNearbyStops(origin),
    findNearbyStops(destination),
  ]);
  const [startVariantsByStop, endVariantsByStop] = await Promise.all([
    Promise.all(startStops.map(findLineVariantIds)),
    Promise.all(endStops.map(findLineVariantIds)),
  ]);
  const startIds = startVariantsByStop.flat();
  const endIds = endVariantsByStop.flat();
  const variants = await getLineVariants([...startIds, ...endIds]);
  const startShapes = selectShapeRepresentatives(variants, startIds);
  const endShapes = selectShapeRepresentatives(variants, endIds);
  const relevantShapes = new Map();
  [...startShapes, ...endShapes].forEach((variant) => {
    relevantShapes.set(variant.id, variant);
  });

  if (!relevantShapes.size) {
    throw new Error('No se encontraron rutas MIO que conecten las paradas cercanas.');
  }
  const shapes = await getShapeSegments([...relevantShapes.values()]);
  const itinerary = evaluateRoute(
    [...startShapes, ...endShapes].filter((variant, index, list) => (
      list.findIndex((candidate) => candidate.id === variant.id) === index
    )),
    shapes,
    startStops,
    endStops,
  );

  if (!itinerary) {
    throw new Error('No se encontró un recorrido MIO directo o con un transbordo entre las paradas cercanas.');
  }

  const [accessRoute, egressRoute] = await Promise.all([
    getOsrmRoute(origin, itinerary.startStop.coords, 'walk'),
    getOsrmRoute(itinerary.endStop.coords, destination, 'walk'),
  ]);
  const transitPolyline = itinerary.segments.flatMap(({ polyline }) => polyline);
  const polyline = [
    ...accessRoute.polyline,
    ...transitPolyline.slice(1),
    ...egressRoute.polyline.slice(1),
  ];

  return {
    polyline,
    distanceKm: +(
      accessRoute.distanceKm +
      itinerary.segments.reduce((sum, segment) => sum + segment.distanceMeters / 1000, 0) +
      egressRoute.distanceKm
    ).toFixed(2),
    source: 'Metro Cali GTFS / ArcGIS',
    mode: 'mio',
    routes: [...new Set(itinerary.routes)],
    stops: [itinerary.startStop.code, itinerary.endStop.code],
    stopDetails: [
      { code: itinerary.startStop.code, coords: itinerary.startStop.coords, role: 'Abordaje' },
      { code: itinerary.endStop.code, coords: itinerary.endStop.coords, role: 'Descenso' },
    ],
    scheduleAvailable: false,
  };
}
