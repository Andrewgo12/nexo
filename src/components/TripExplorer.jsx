import React, { useState } from 'react';
import { 
  Search, 
  Car, 
  Bike, 
  Bus, 
  Footprints, 
  Users, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Plus,
  Heart,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function TripExplorer({
  trips,
  selectedTrip,
  onSelectTrip,
  onOpenCreateTrip,
  activeUniversity,
  onRequestSeat,
  studentUser,
  onOpenJoinModal,
  onOpenAdvancedFilters
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState('all'); // all, car, moto, mio, walk, taxi, bike, intermunicipal
  const [selectedShift, setSelectedShift] = useState('all'); // all, Jornada Nocturna, Jornada Tarde, Jornada Mañana
  const [sameUniversityOnly, setSameUniversityOnly] = useState(false);
  const [onlyGirls, setOnlyGirls] = useState(false);
  const [joinedTrips, setJoinedTrips] = useState([]);

  // Filtering Logic
  const filteredTrips = trips.filter(trip => {
    // Mode
    if (selectedMode !== 'all' && trip.transportMode !== selectedMode) return false;

    // Shift
    if (selectedShift !== 'all' && !trip.shift.toLowerCase().includes(selectedShift.toLowerCase())) return false;

    // University
    if (sameUniversityOnly && !trip.driver.university.toLowerCase().includes(activeUniversity.badge.toLowerCase())) {
      return false;
    }

    // Only girls safety filter
    if (onlyGirls && !trip.onlyGirls) return false;

    // Search query (destination, neighborhood, driver name, campus)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDest = trip.destination.name.toLowerCase().includes(q);
      const matchOrigin = trip.origin.name.toLowerCase().includes(q);
      const matchDriver = trip.driver.name.toLowerCase().includes(q);
      const matchUni = trip.driver.university.toLowerCase().includes(q);
      if (!matchDest && !matchOrigin && !matchDriver && !matchUni) return false;
    }

    return true;
  });

  const handleJoin = (e, trip) => {
    e.stopPropagation();
    if (onOpenJoinModal) {
      onOpenJoinModal(trip);
    } else {
      if (joinedTrips.includes(trip.id)) return;
      setJoinedTrips(prev => [...prev, trip.id]);
      onRequestSeat(trip);
    }
  };

  const getModeBadgeClass = (mode) => {
    switch (mode) {
      case 'car': return 'mode-car';
      case 'moto': return 'mode-moto';
      case 'mio': return 'mode-mio';
      case 'bike': return 'mode-bike';
      case 'walk': return 'mode-walk';
      case 'taxi': return 'mode-taxi';
      case 'intermunicipal': return 'mode-intermunicipal';
      default: return 'mode-car';
    }
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'car': return <Car size={14} />;
      case 'moto': return <Bike size={14} />;
      case 'mio': return <Bus size={14} />;
      case 'bike': return <Bike size={14} />;
      case 'walk': return <Footprints size={14} />;
      case 'taxi': return <Users size={14} />;
      case 'intermunicipal': return <Bus size={14} />;
      default: return <Car size={14} />;
    }
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'car': return 'Carro Compartido';
      case 'moto': return 'Moto-Cupo';
      case 'mio': return 'Parche MIO';
      case 'bike': return 'Bici-Ruta';
      case 'walk': return 'Caminata Segura';
      case 'taxi': return 'Taxi Grupal';
      case 'intermunicipal': return 'Foráneo Terminal';
      default: return mode;
    }
  };

  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Explorer Header */}
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            <Users size={20} style={{ color: 'var(--emerald-primary)' }} />
            <span>Viajes y Parches Universitarios</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Emparejamiento seguro por barrio, horario y ruta en Cali
          </p>
        </div>

        <button className="btn-primary" onClick={onOpenCreateTrip} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          <Plus size={16} /> Publicar Cupo
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-container">
        {/* Search Input */}
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-field"
            placeholder="Buscar por barrio (ej: El Caney, Ciudad 2000, Morichal, Menga)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Transport Mode Pills */}
        <div className="mode-filters-row">
          <button 
            className={`mode-filter-pill ${selectedMode === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedMode('all')}
          >
            Todos ({trips.length})
          </button>
          <button 
            className={`mode-filter-pill ${selectedMode === 'car' ? 'active' : ''}`}
            onClick={() => setSelectedMode('car')}
          >
            <Car size={14} /> Carro
          </button>
          <button 
            className={`mode-filter-pill ${selectedMode === 'mio' ? 'active' : ''}`}
            onClick={() => setSelectedMode('mio')}
          >
            <Bus size={14} /> MIO
          </button>
          <button 
            className={`mode-filter-pill ${selectedMode === 'moto' ? 'active' : ''}`}
            onClick={() => setSelectedMode('moto')}
          >
            <Bike size={14} /> Moto
          </button>
          <button 
            className={`mode-filter-pill ${selectedMode === 'bike' ? 'active' : ''}`}
            onClick={() => setSelectedMode('bike')}
          >
            <Bike size={14} /> Bici
          </button>
          <button 
            className={`mode-filter-pill ${selectedMode === 'walk' ? 'active' : ''}`}
            onClick={() => setSelectedMode('walk')}
          >
            <Footprints size={14} /> A pie
          </button>
          <button 
            className={`mode-filter-pill ${selectedMode === 'taxi' ? 'active' : ''}`}
            onClick={() => setSelectedMode('taxi')}
          >
            <Users size={14} /> Taxi
          </button>
          <button 
            className={`mode-filter-pill ${selectedMode === 'intermunicipal' ? 'active' : ''}`}
            onClick={() => setSelectedMode('intermunicipal')}
          >
            <Bus size={14} /> Terminal
          </button>
        </div>

        {/* Secondary Filter Row: Shift, Same Uni, Only Girls */}
        <div className="secondary-filters-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select 
              value={selectedShift} 
              onChange={(e) => setSelectedShift(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
            >
              <option value="all">Todas las Jornadas</option>
              <option value="Nocturna">🌙 Jornada Nocturna (Prioritaria)</option>
              <option value="Tarde">☀️ Jornada Tarde</option>
              <option value="Mañana">🌅 Jornada Mañana</option>
            </select>

            <button 
              className={`mode-filter-pill ${sameUniversityOnly ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => setSameUniversityOnly(!sameUniversityOnly)}
            >
              🎓 Solo {activeUniversity.badge}
            </button>
          </div>

          <button 
            className={`girls-only-toggle ${onlyGirls ? 'active' : ''}`}
            onClick={() => setOnlyGirls(!onlyGirls)}
            title="Mostrar viajes exclusivos entre estudiantes mujeres"
          >
            <Heart size={13} />
            <span>Espacio Seguro Mujeres</span>
          </button>
        </div>
      </div>

      {/* Trips List */}
      <div className="trips-list">
        {filteredTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No hay viajes con estos filtros</h4>
            <p style={{ fontSize: '0.85rem' }}>Prueba buscando otro barrio o publica tú el primer cupo de tu jornada.</p>
            <button className="btn-primary" style={{ marginTop: '16px', fontSize: '0.85rem' }} onClick={onOpenCreateTrip}>
              <Plus size={14} /> Ofrecer Cupo Ahora
            </button>
          </div>
        ) : (
          filteredTrips.map(trip => {
            const isSelected = selectedTrip?.id === trip.id;
            const isJoined = joinedTrips.includes(trip.id);

            return (
              <div 
                key={trip.id} 
                className={`trip-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectTrip(trip)}
              >
                {/* Card Header */}
                <div className="trip-card-header">
                  <div className="driver-info">
                    <img src={trip.driver.avatar} alt={trip.driver.name} className="driver-avatar" />
                    <div className="driver-details">
                      <div className="driver-name-row">
                        <span>{trip.driver.name}</span>
                        {trip.driver.verifiedCarnet && (
                          <span title="Carnet institucional verificado">
                            <ShieldCheck size={15} className="verified-icon" />
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700, marginLeft: '2px' }}>
                          ★ {trip.driver.rating}
                        </span>
                      </div>
                      <div className="driver-subtext">
                        {trip.driver.university} • {trip.driver.career} ({trip.driver.semester})
                      </div>
                    </div>
                  </div>

                  <div className={`trip-mode-badge ${getModeBadgeClass(trip.transportMode)}`}>
                    {getModeIcon(trip.transportMode)}
                    <span>{getModeLabel(trip.transportMode)}</span>
                  </div>
                </div>

                {/* Route Section */}
                <div className="trip-route-section">
                  <div className="route-dots-col">
                    <div className="dot-origin" />
                    <div className="dot-line" />
                    <div className="dot-dest" />
                  </div>

                  <div className="route-text-col">
                    <div className="route-origin-title">
                      <span>{trip.origin.name}</span>
                      <span className="route-time">⏰ {trip.departureTime}</span>
                    </div>

                    <div className="route-dest-title">
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {trip.destination.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {trip.shift}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meeting Point Box */}
                <div style={{ fontSize: '0.8rem', background: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <MapPin size={13} style={{ color: 'var(--emerald-primary)', flexShrink: 0 }} />
                  <span><strong>Punto de encuentro:</strong> {trip.meetingPoint}</span>
                </div>

                {/* Vehicle specifics if applicable */}
                {trip.vehicleInfo && trip.vehicleInfo.model && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>🚗 {trip.vehicleInfo.model} {trip.vehicleInfo.plate ? `(${trip.vehicleInfo.plate})` : ''}</span>
                    {trip.vehicleInfo.extraHelmet && <span style={{ color: '#fbbf24' }}>🪖 Incluye casco extra</span>}
                  </div>
                )}

                {/* Footer with Seats, Insurance, Price and Join Button */}
                <div className="trip-card-footer">
                  <div className="trip-meta-group">
                    <div className="meta-item">
                      <div className="seat-pills" title={`${trip.availableSeats} cupos libres de ${trip.totalSeats}`}>
                        {Array.from({ length: trip.totalSeats }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`seat-pip ${i < (trip.totalSeats - trip.availableSeats) ? 'taken' : ''}`} 
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.78rem' }}>
                        {trip.availableSeats} {trip.availableSeats === 1 ? 'cupo' : 'cupos'}
                      </span>
                    </div>

                    {trip.insuranceActive && (
                      <span className="insurance-badge" title="Micro-seguro de asistencia AXA por trayecto incluido">
                        🛡️ Seguro AXA
                      </span>
                    )}

                    {trip.onlyGirls && (
                      <span className="badge" style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.3)', textTransform: 'none', padding: '2px 6px' }}>
                        💜 Solo Chicas
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: trip.priceContribution === 0 ? '#34d399' : 'var(--text-primary)' }}>
                        {trip.priceContribution === 0 ? 'Gratis' : `$${trip.priceContribution.toLocaleString('es-CO')}`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {trip.priceContribution === 0 ? 'Acompañamiento' : 'Aporte gasolina'}
                      </div>
                    </div>

                    <button 
                      className={isJoined ? "btn-secondary" : "btn-primary"}
                      style={{ padding: '7px 14px', fontSize: '0.8rem', minWidth: '105px' }}
                      onClick={(e) => handleJoin(e, trip)}
                    >
                      {isJoined ? (
                        <>
                          <Check size={14} style={{ color: 'var(--emerald-primary)' }} /> Unido
                        </>
                      ) : (
                        'Unirme'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
