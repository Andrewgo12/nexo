import React, { useState } from 'react';
import { 
  Calculator, 
  MapPin, 
  Navigation, 
  Car, 
  Bike, 
  Bus, 
  Footprints, 
  Users, 
  Clock, 
  Leaf, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  Search
} from 'lucide-react';
import { UNIVERSITIES, NEIGHBORHOODS } from '../data/mockData';
import { calculateMultimodalDetails, searchAddressNominatim } from '../services/routingApi';

export default function RouteCalculator({ activeUniversity, onSelectCalculatedTrip }) {
  const [originId, setOriginId] = useState(activeUniversity.id);
  const [destId, setDestId] = useState('el-caney');
  const [interUniversityEnabled, setInterUniversityEnabled] = useState(true);
  const [departureTime, setDepartureTime] = useState('9:45 PM');

  // Nominatim Address search state
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState('');
  const [customDestination, setCustomDestination] = useState(null);

  const originUni = UNIVERSITIES.find(u => u.id === originId) || activeUniversity;
  const destNeighborhood = customDestination || NEIGHBORHOODS.find(n => n.id === destId) || NEIGHBORHOODS[0];

  // Approximate distance calculation using Haversine formula
  const getDistanceKm = (c1, c2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (c2[0] - c1[0]) * Math.PI / 180;
    const dLon = (c2[1] - c1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(c1[0] * Math.PI / 180) * Math.cos(c2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.max(1.2, +(R * c).toFixed(1));
  };

  const distanceKm = getDistanceKm(originUni.coords, destNeighborhood.coords || [3.3780, -76.5240]);

  // Multimodal modes calculation
  const multimodalModes = calculateMultimodalDetails(distanceKm);

  const handleSearchNominatim = async (e) => {
    e.preventDefault();
    if (addressSearchQuery.trim().length < 3) {
      setAddressSearchError('Escribe al menos 3 caracteres para buscar.');
      setAddressSearchResults([]);
      return;
    }
    setIsSearchingAddress(true);
    setAddressSearchError('');
    try {
      const results = await searchAddressNominatim(addressSearchQuery);
      setAddressSearchResults(results);
      if (results.length === 0) setAddressSearchError('No se encontraron lugares para esa búsqueda.');
    } catch (error) {
      setAddressSearchResults([]);
      setAddressSearchError(error.message || 'No fue posible buscar esa dirección.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectSearchResult = (res) => {
    setCustomDestination({
      id: `custom-${res.id}`,
      name: res.name,
      zone: 'Sector Identificado por OSM',
      coords: [res.lat, res.lng],
      riskScore: 'Medio',
      commonMio: 'Conexión MIO cercana'
    });
    setAddressSearchResults([]);
    setAddressSearchQuery('');
  };

  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="panel-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="panel-title">
            <Calculator size={20} style={{ color: 'var(--emerald-primary)' }} />
            <span>Calculador Interuniversitario Multimodal de Rutas & Aportes</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Compara tiempos, tarifas de aporte, ahorro de CO2 y seguridad en 7 modos de transporte en Cali
          </p>
        </div>

        {addressSearchError && (
          <div role="alert" style={{ color: '#b91c1c', fontSize: '0.82rem' }}>
            {addressSearchError}
          </div>
        )}

        <div className="badge badge-emerald">
          <Sparkles size={12} /> OSRM & OpenStreetMap Cali
        </div>
      </div>

      {/* Selectors Card */}
      <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="form-group">
          <label className="form-label">
            <MapPin size={14} style={{ color: 'var(--sapphire-primary)' }} />
            <span>Campus Universitario de Origen</span>
          </label>
          <select value={originId} onChange={(e) => setOriginId(e.target.value)}>
            {UNIVERSITIES.map(u => (
              <option key={u.id} value={u.id}>{u.shortName}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <Navigation size={14} style={{ color: 'var(--emerald-primary)' }} />
            <span>Barrio o Sector de Destino</span>
          </label>
          <select value={destId} onChange={(e) => { setDestId(e.target.value); setCustomDestination(null); }}>
            {NEIGHBORHOODS.map(nh => (
              <option key={nh.id} value={nh.id}>{nh.name} ({nh.zone.split(' ')[1] || 'Cali'})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            <Clock size={14} style={{ color: 'var(--amber-primary)' }} />
            <span>Franja / Hora de Salida</span>
          </label>
          <input
            type="text"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            placeholder="Ej: 9:45 PM (Jornada Nocturna)"
          />
        </div>
      </div>

      {/* Optional Free Geocoding Search using Nominatim OpenStreetMap */}
      <div style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <form onSubmit={handleSearchNominatim} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="¿O buscas una dirección o parada específica en Cali? (ej: Estación Capri, Chipichape, Menga, Sameco...)" 
            value={addressSearchQuery}
            onChange={(e) => setAddressSearchQuery(e.target.value)}
            style={{ fontSize: '0.82rem', height: '36px' }}
          />
          <button type="submit" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            {isSearchingAddress ? 'Buscando OSM...' : 'Buscar en OSM'}
          </button>
        </form>

        {addressSearchResults.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Coincidencias en Cali:</span>
            {addressSearchResults.map(res => (
              <div 
                key={res.id} 
                onClick={() => handleSelectSearchResult(res)}
                style={{ fontSize: '0.8rem', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-tertiary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{res.fullName}</span>
                <span className="badge badge-emerald">Seleccionar</span>
              </div>
            ))}
          </div>
        )}

        {customDestination && (
          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--emerald-primary)', fontWeight: 600 }}>
            ✓ Destino personalizado seleccionado: {customDestination.name}
          </div>
        )}
      </div>

      {/* Corridor Summary Banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%)', border: '1px solid var(--border-highlight)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--emerald-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Corredor {originUni.badge} ➔ {destNeighborhood.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Distancia aproximada: <strong>{distanceKm} km</strong> | Nivel de riesgo nocturno: <span style={{ color: destNeighborhood.riskScore?.includes('Alto') ? '#f87171' : '#34d399', fontWeight: 700 }}>{destNeighborhood.riskScore || 'Bajo'}</span>
            </div>
          </div>
        </div>

        {/* Inter-university toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
          <input
            type="checkbox"
            checked={interUniversityEnabled}
            onChange={(e) => setInterUniversityEnabled(e.target.checked)}
          />
          <span style={{ fontWeight: 600 }}>Red Multicampus Cali (UNIAJC, USC, Univalle, Javeriana, Icesi)</span>
        </label>
      </div>

      {/* Multimodal Cards Comparison (7 Modes) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Estimaciones orientativas ({multimodalModes.length} modos; sin rutas verificadas)</span>
        </h3>

        {multimodalModes.map(mode => (
          <div 
            key={mode.id} 
            className={`calc-mode-card ${mode.id === 'car' ? 'recommended' : ''}`}
            onClick={() => onSelectCalculatedTrip && onSelectCalculatedTrip(mode)}
            style={{ cursor: 'pointer' }}
            title="Haz clic para explorar viajes de esta modalidad en el mapa"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: 'var(--radius-md)', 
                background: mode.mode === 'car' ? '#3b82f6' :
                            mode.mode === 'moto' ? '#f59e0b' :
                            mode.mode === 'mio' ? '#10b981' :
                            mode.mode === 'bike' ? '#059669' :
                            mode.mode === 'walk' ? '#8b5cf6' :
                            mode.mode === 'taxi' ? '#ea580c' : '#475569', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0 
              }}>
                {mode.mode === 'car' ? <Car size={20} /> :
                 mode.mode === 'moto' ? <Bike size={20} /> :
                 mode.mode === 'mio' ? <Bus size={20} /> :
                 mode.mode === 'bike' ? <Bike size={20} /> :
                 mode.mode === 'walk' ? <Footprints size={20} /> :
                 mode.mode === 'taxi' ? <Users size={20} /> : <Bus size={20} />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{mode.name}</span>
                  <span className={`badge ${mode.badgeClass}`} style={{ fontSize: '0.7rem' }}>
                    {mode.safetyScore}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {mode.recommendation}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Leaf size={12} /> {mode.co2SavedKg} kg CO₂ ahorrados
                  </span>
                  <span>Estimación no vinculante</span>
                </div>
              </div>
            </div>

            {/* Price & Time Block */}
            <div style={{ textAlign: 'right', minWidth: '130px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: mode.costCop === 0 ? '#34d399' : 'var(--text-primary)' }}>
                {mode.costCop === 0 ? 'Gratis' : `$${mode.costCop.toLocaleString('es-CO')}`}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--emerald-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                <Clock size={13} /> {mode.timeMin} minutos
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--sapphire-primary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', marginTop: '2px' }}>
                Ver viajes <ArrowRight size={10} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
