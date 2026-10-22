import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2,
  AlertTriangle,
  Home,
} from 'lucide-react';
import { UNIVERSITIES, MIO_STATIONS, MIO_LINES, NEIGHBORHOODS } from '../data/mockData';
import { getOsrmRoute } from '../services/routingApi';

// Custom icons using Leaflet DivIcon
const createCustomIcon = (bgColor, iconHtml, size = 32) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        background: ${bgColor}; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        border: 2px solid white;
        font-size: 14px;
      ">
        ${iconHtml}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

export default function InteractiveMap({ 
  selectedTrip, 
  activeTrips, 
  onSelectTrip,
  activeUniversity,
  incidents = [],
  onOpenReportIncident,
  onOpenArrivalCheckin,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const onSelectTripRef = useRef(onSelectTrip);
  const routePolylineRef = useRef(null);
  const simulationMarkerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Layer toggles
  const [showUnis, setShowUnis] = useState(true);
  const [showMio, setShowMio] = useState(true);
  const [showTrips, setShowTrips] = useState(true);
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);
  const [showIncidents, setShowIncidents] = useState(true);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0); // 0 to 100%
  const [simulationFinished, setSimulationFinished] = useState(false);

  // Dynamic OSRM route polyline state
  const [activePolylineCoords, setActivePolylineCoords] = useState(null);
  const [routingSource, setRoutingSource] = useState('');

  useEffect(() => {
    onSelectTripRef.current = onSelectTrip;
  }, [onSelectTrip]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on southern university corridor in Cali
    const map = L.map(mapContainerRef.current, {
      center: [3.3768, -76.5332],
      zoom: 13,
      zoomControl: false
    });

    // Dark styled OpenStreetMap tiles for night safety aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Layer group containers
    const markersLayer = L.layerGroup().addTo(map);

    // 1. Draw Universities
    if (showUnis) {
      UNIVERSITIES.forEach(uni => {
        const isCurrent = activeUniversity?.id === uni.id;
        const icon = createCustomIcon(
          uni.color,
          `<span style="font-size: 11px; font-weight: 800;">U</span>`,
          isCurrent ? 36 : 28
        );

        const marker = L.marker(uni.coords, { icon });
        marker.bindPopup(`
          <div style="font-family: var(--font-body); padding: 4px;">
            <div style="font-size: 0.75rem; color: #10b981; font-weight: 800; text-transform: uppercase;">Campus Universitario</div>
            <h4 style="margin: 2px 0 6px 0; font-size: 1rem; color: #f8fafc;">${uni.shortName}</h4>
            <p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">${uni.campus}</p>
            <div style="margin-top: 8px; font-size: 0.75rem; background: #0f172a; padding: 4px 8px; border-radius: 4px; color: #38bdf8;">
              ${uni.domain}
            </div>
          </div>
        `);
        markersLayer.addLayer(marker);
      });
    }

    // 2. Draw MIO Stations and Lines
    if (showMio) {
      // Lines
      MIO_LINES.forEach(line => {
        const polyline = L.polyline(line.coords, {
          color: line.color,
          weight: 4,
          opacity: 0.75,
          dashArray: line.id.startsWith('P') ? '6, 6' : undefined
        });
        polyline.bindPopup(`
          <div style="font-family: var(--font-body); padding: 4px;">
            <span style="font-size: 0.75rem; background: ${line.color}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${line.id}</span>
            <h4 style="margin: 6px 0 4px 0; font-size: 0.9rem; color: #f8fafc;">${line.name}</h4>
            <p style="margin: 0; font-size: 0.75rem; color: #94a3b8;">${line.description}</p>
          </div>
        `);
        markersLayer.addLayer(polyline);
      });

      // Stations
      MIO_STATIONS.forEach(st => {
        const icon = createCustomIcon(
          '#0284c7',
          `<span style="font-size: 10px; font-weight: 800;">M</span>`,
          24
        );
        const marker = L.marker(st.coords, { icon });
        marker.bindPopup(`
          <div style="font-family: var(--font-body); padding: 4px;">
            <div style="font-size: 0.7rem; color: #38bdf8; font-weight: 800;">ESTACIÓN MIO METROCALI</div>
            <h4 style="margin: 2px 0; font-size: 0.9rem; color: #f8fafc;">${st.name}</h4>
            <p style="margin: 4px 0 0 0; font-size: 0.75rem; color: #cbd5e1;">Rutas: ${st.lines.join(', ')}</p>
          </div>
        `);
        markersLayer.addLayer(marker);
      });
    }

    // 3. Draw Active Student Trips across all 7 modes
    if (showTrips) {
      activeTrips.forEach(trip => {
        const isSelected = selectedTrip?.id === trip.id;
        const color = trip.transportMode === 'car' ? '#3b82f6' :
                      trip.transportMode === 'moto' ? '#f59e0b' :
                      trip.transportMode === 'mio' ? '#10b981' :
                      trip.transportMode === 'bike' ? '#10b981' :
                      trip.transportMode === 'walk' ? '#8b5cf6' :
                      trip.transportMode === 'taxi' ? '#ea580c' : '#475569';

        const modeSymbol = trip.transportMode === 'car' ? '🚗' :
                           trip.transportMode === 'moto' ? '🏍️' :
                           trip.transportMode === 'mio' ? '🚌' :
                           trip.transportMode === 'bike' ? '🚲' :
                           trip.transportMode === 'walk' ? '🚶' :
                           trip.transportMode === 'taxi' ? '🚕' : '🚐';

        const icon = createCustomIcon(color, modeSymbol, isSelected ? 36 : 28);
        const marker = L.marker(trip.origin.coords, { icon });

        marker.on('click', () => {
          onSelectTripRef.current?.(trip);
        });

        marker.bindPopup(`
          <div style="font-family: var(--font-body); padding: 6px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-size: 0.7rem; font-weight: 800; color: ${color}; text-transform: uppercase;">
                ${trip.driver.role}
              </span>
              <span style="font-size: 0.75rem; color: #34d399; font-weight: 700;">★ ${trip.driver.rating}</span>
            </div>
            <h4 style="margin: 4px 0 2px 0; font-size: 0.95rem; color: #f8fafc;">${trip.driver.name}</h4>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 6px;">${trip.driver.university}</div>
            <div style="background: #0f172a; padding: 6px 8px; border-radius: 6px; font-size: 0.75rem;">
              <div>📍 <strong>Hacia:</strong> ${trip.destination.name}</div>
              <div>⏰ <strong>Salida:</strong> ${trip.departureTime} (${trip.shift})</div>
              <div>🛡️ <strong>Seguro:</strong> ${trip.insuranceActive ? 'AXA Embebido' : 'No'}</div>
              <div>👥 <strong>Cupos disponibles:</strong> ${trip.availableSeats} de ${trip.totalSeats}</div>
            </div>
          </div>
        `);

        markersLayer.addLayer(marker);
      });
    }

    // 4. Neighborhoods
    if (showNeighborhoods) {
      NEIGHBORHOODS.forEach(nh => {
        const marker = L.circle(nh.coords, {
          radius: 550,
          color: nh.riskScore.includes('Alto') ? '#ef4444' : '#10b981',
          fillColor: nh.riskScore.includes('Alto') ? '#ef4444' : '#10b981',
          fillOpacity: 0.15,
          weight: 1
        });
        marker.bindPopup(`
          <div style="font-family: var(--font-body); padding: 4px;">
            <div style="font-size: 0.75rem; color: #10b981; font-weight: 700;">BARRIO / SECTOR</div>
            <h4 style="margin: 2px 0; font-size: 0.9rem; color: #f8fafc;">${nh.name}</h4>
            <div style="font-size: 0.75rem; color: #94a3b8;">${nh.zone}</div>
            <div style="font-size: 0.75rem; margin-top: 4px;">Rutas MIO: <strong>${nh.commonMio}</strong></div>
          </div>
        `);
        markersLayer.addLayer(marker);
      });
    }

    // 5. Community Incidents
    if (showIncidents && incidents.length > 0) {
      incidents.forEach(inc => {
        const incColor = inc.severity === 'high' ? '#ef4444' : inc.severity === 'medium' ? '#f59e0b' : '#3b82f6';
        const incEmoji = inc.type === 'mio_delay' ? '🚌' :
                         inc.type === 'dark_spot' ? '🌑' :
                         inc.type === 'police_patrol' ? '👮' : '🌧️';

        const icon = createCustomIcon(incColor, incEmoji, 28);
        const marker = L.marker(inc.coords, { icon });
        marker.bindPopup(`
          <div style="font-family: var(--font-body); padding: 6px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.7rem; font-weight: 800; color: ${incColor}; text-transform: uppercase;">
                ALERTA COMUNITARIA
              </span>
              <span style="font-size: 0.7rem; color: #94a3b8;">${inc.time}</span>
            </div>
            <h4 style="margin: 4px 0 2px 0; font-size: 0.9rem; color: #f8fafc;">${inc.title}</h4>
            <p style="margin: 0; font-size: 0.78rem; color: #cbd5e1;">${inc.description}</p>
            <div style="margin-top: 6px; font-size: 0.72rem; color: #94a3b8;">
              Reportado por: <strong>${inc.reportedBy}</strong>
            </div>
          </div>
        `);
        markersLayer.addLayer(marker);
      });
    }

    return () => {
      map.removeLayer(markersLayer);
    };
  }, [showUnis, showMio, showTrips, showNeighborhoods, showIncidents, activeTrips, selectedTrip, activeUniversity, incidents]);

  // Dynamic OSRM Route Calculation and Polyline Handling
  useEffect(() => {
    let isMounted = true;
    const map = mapInstanceRef.current;
    if (!map) return;

    // Reset simulator
    setIsSimulating(false);
    setSimulationProgress(0);
    setSimulationFinished(false);

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (simulationMarkerRef.current) {
      map.removeLayer(simulationMarkerRef.current);
      simulationMarkerRef.current = null;
    }

    setActivePolylineCoords(null);
    setRoutingSource('');

    if (selectedTrip && selectedTrip.origin && selectedTrip.destination) {
      // Query real OSRM routing engine
      getOsrmRoute(selectedTrip.origin.coords, selectedTrip.destination.coords, selectedTrip.transportMode)
        .then(result => {
          if (!isMounted || !mapInstanceRef.current || !result) return;
          const coords = result.polyline;
          setActivePolylineCoords(coords);
          setRoutingSource(result.source || 'OSRM');

          const polyline = L.polyline(coords, {
            color: '#10b981',
            weight: 6,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          routePolylineRef.current = polyline;
          map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

          // Start simulation marker
          const vehicleEmoji = selectedTrip.transportMode === 'car' ? '🚗' :
                               selectedTrip.transportMode === 'moto' ? '🏍️' :
                               selectedTrip.transportMode === 'mio' ? '🚌' :
                               selectedTrip.transportMode === 'bike' ? '🚲' :
                               selectedTrip.transportMode === 'walk' ? '🚶' :
                               selectedTrip.transportMode === 'taxi' ? '🚕' : '🚐';

          const simIcon = createCustomIcon('#059669', vehicleEmoji, 38);
          const simMarker = L.marker(coords[0], { icon: simIcon, zIndexOffset: 1000 }).addTo(map);
          simulationMarkerRef.current = simMarker;
        })
        .catch(error => {
          if (!isMounted) return;
          setActivePolylineCoords(null);
          setRoutingSource(error.message || 'No se pudo calcular una ruta vial real.');
        });
    }

    return () => {
      isMounted = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [selectedTrip]);

  // Real-Time GPS Tracking Simulation Engine
  const startSimulation = () => {
    const coords = activePolylineCoords;
    if (!coords || coords.length < 2) return;
    setIsSimulating(true);
    setSimulationFinished(false);

    let step = 0;
    const totalSteps = 140; // smooth interpolation

    const animate = () => {
      if (!mapInstanceRef.current || !simulationMarkerRef.current) return;
      step++;
      const progressRatio = step / totalSteps;
      setSimulationProgress(Math.round(progressRatio * 100));

      const totalSegments = coords.length - 1;
      const segmentProgress = progressRatio * totalSegments;
      const segmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
      const segmentFraction = segmentProgress - segmentIndex;

      const p1 = coords[segmentIndex];
      const p2 = coords[segmentIndex + 1];

      const currentLat = p1[0] + (p2[0] - p1[0]) * segmentFraction;
      const currentLng = p1[1] + (p2[1] - p1[1]) * segmentFraction;

      if (simulationMarkerRef.current) {
        simulationMarkerRef.current.setLatLng([currentLat, currentLng]);
      }

      if (step < totalSteps) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSimulating(false);
        setSimulationFinished(true);
        if (mapInstanceRef.current && simulationMarkerRef.current) {
          simulationMarkerRef.current.bindPopup(`
            <div style="font-family: var(--font-body); text-align: center; padding: 6px;">
              <div style="color: #10b981; font-weight: 800; font-size: 0.85rem;">Simulación de recorrido completada</div>
              <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">
                Esta simulación no verifica una llegada real ni notifica a contactos.
              </div>
            </div>
          `).openPopup();
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const resetSimulation = () => {
    pauseSimulation();
    setSimulationProgress(0);
    setSimulationFinished(false);
    const coords = activePolylineCoords || selectedTrip?.routePolyline;
    if (coords && simulationMarkerRef.current) {
      simulationMarkerRef.current.setLatLng(coords[0]);
    }
  };

  return (
    <div className="panel-card map-wrapper" style={{ padding: 0 }}>
      {/* Floating Map Layer Toggles */}
      <div className="map-controls-floating">
        <div className="map-layer-pill-group">
          <button 
            className={`map-layer-btn ${showUnis ? 'active' : ''}`}
            onClick={() => setShowUnis(!showUnis)}
            title="Campus Universitarios"
          >
            🎓 Universidades
          </button>
          <button 
            className={`map-layer-btn ${showMio ? 'active' : ''}`}
            onClick={() => setShowMio(!showMio)}
            title="Rutas y Estaciones MIO"
          >
            🚌 MIO Metrocali
          </button>
          <button 
            className={`map-layer-btn ${showTrips ? 'active' : ''}`}
            onClick={() => setShowTrips(!showTrips)}
            title="Viajes de Estudiantes"
          >
            👥 Viajes Activos
          </button>
          <button 
            className={`map-layer-btn ${showIncidents ? 'active' : ''}`}
            onClick={() => setShowIncidents(!showIncidents)}
            title="Incidencias Comunitarias en Ruta"
          >
            ⚠️ Alertas en Ruta ({incidents.length})
          </button>
          <button 
            className={`map-layer-btn ${showNeighborhoods ? 'active' : ''}`}
            onClick={() => setShowNeighborhoods(!showNeighborhoods)}
            title="Barrios y Zonas de Cali"
          >
            🏘️ Barrios
          </button>
        </div>

        {/* Quick Toolbar Action Buttons */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'auto' }}>
          <button 
            className="map-layer-btn active"
            style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid var(--amber-primary)', color: 'var(--amber-primary)' }}
            onClick={onOpenReportIncident}
            title="Reportar Alerta en Ruta"
          >
            <AlertTriangle size={13} />
            <span>Reportar Alerta</span>
          </button>

          <button 
            className="map-layer-btn active"
            style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--emerald-primary)', color: 'var(--emerald-primary)' }}
            onClick={onOpenArrivalCheckin}
            title="Check-in de Llegada a Casa"
          >
            <Home size={13} />
            <span>Check-in</span>
          </button>

          <button 
            className="map-layer-btn active"
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
            onClick={() => {
              if (mapInstanceRef.current && activeUniversity) {
                mapInstanceRef.current.flyTo(activeUniversity.coords, 14, { duration: 1.2 });
              }
            }}
            title="Centrar en mi Campus"
          >
            <Navigation size={13} style={{ color: 'var(--emerald-primary)' }} />
            <span>Mi Campus</span>
          </button>
        </div>
      </div>

      {/* Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '520px' }} />

      {/* Live GPS Route Tracking Simulator Bar */}
      {selectedTrip && (
        <div className="tracking-simulator-bar">
          <div className="tracking-status-info">
            <div className="tracking-pulse-dot" style={{ background: simulationFinished ? '#10b981' : isSimulating ? '#38bdf8' : '#f59e0b' }} />
            <div>
              <div className="tracking-text-title">
                <span>{simulationFinished ? 'Simulación completada' : isSimulating ? 'Simulación de trayecto...' : 'Simular desplazamiento'}</span>
                {routingSource && (
                  <span style={{ fontSize: '0.68rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                    {routingSource}
                  </span>
                )}
              </div>
              <div className="tracking-sub">
                {selectedTrip.origin.name} ➔ {selectedTrip.destination.name} | {simulationProgress}% recorrido
              </div>
            </div>
          </div>

          <div className="tracking-actions">
            {!isSimulating && !simulationFinished && (
              <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={startSimulation}>
                <Play size={14} /> Iniciar Rastreo
              </button>
            )}
            {isSimulating && (
              <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={pauseSimulation}>
                <Pause size={14} /> Pausar
              </button>
            )}
            {simulationFinished && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={16} /> Llegaste a salvo
                </span>
                <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={resetSimulation}>
                  <RotateCcw size={12} />
                </button>
              </div>
            )}
            {!simulationFinished && (
              <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={resetSimulation} title="Reiniciar">
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
