import React, { useState } from 'react';
import { 
  X, 
  Car, 
  Bike, 
  Bus, 
  Footprints, 
  Users, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { UNIVERSITIES, NEIGHBORHOODS } from '../data/mockData';

export default function CreateTripModal({ 
  isOpen, 
  onClose, 
  onCreateTrip, 
  activeUniversity,
  studentUser 
}) {
  const [transportMode, setTransportMode] = useState('car'); // car, moto, mio, walk, taxi
  const [originCampus, setOriginCampus] = useState(activeUniversity.shortName);
  const [destinationNeighborhoodId, setDestinationNeighborhoodId] = useState('el-caney');
  const [departureTime, setDepartureTime] = useState('9:45 PM');
  const [shift, setShift] = useState('Jornada Nocturna');
  const [meetingPoint, setMeetingPoint] = useState('Portería Principal frente a la plazoleta');
  const [totalSeats, setTotalSeats] = useState(3);
  const [vehicleModel, setVehicleModel] = useState('Chevrolet Spark GT (Gris)');
  const [vehiclePlate, setVehiclePlate] = useState('***-412');
  const [priceContribution, setPriceContribution] = useState(3500);
  const [insuranceActive, setInsuranceActive] = useState(true);
  const [onlyGirls, setOnlyGirls] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedNeighborhood = NEIGHBORHOODS.find(n => n.id === destinationNeighborhoodId) || NEIGHBORHOODS[0];
    const originUni = UNIVERSITIES.find(u => u.shortName === originCampus) || activeUniversity;

    // Generate simulated route points between origin and neighborhood
    const originCoords = originUni.coords;
    const destCoords = selectedNeighborhood.coords;
    const midLat = (originCoords[0] + destCoords[0]) / 2 + 0.005;
    const midLng = (originCoords[1] + destCoords[1]) / 2 - 0.002;

    const newTrip = {
      id: `trip-${Date.now()}`,
      driver: {
        name: studentUser.name,
        role: transportMode === 'car' ? 'Conductor Carro' :
              transportMode === 'moto' ? 'Conductor Moto' :
              transportMode === 'mio' ? 'Líder Parche MIO' :
              transportMode === 'bike' ? 'Líder Ciclo-Parche' :
              transportMode === 'walk' ? 'Líder Caminata' :
              transportMode === 'intermunicipal' ? 'Coordinador Ruta Foránea' : 'Coordinador Taxi',
        university: activeUniversity.shortName,
        career: studentUser.career,
        semester: studentUser.semester,
        avatar: studentUser.avatar,
        rating: studentUser.rating,
        completedTrips: studentUser.totalTrips,
        verifiedEmail: true,
        verifiedCarnet: true,
        gender: 'M'
      },
      transportMode,
      vehicleInfo: {
        model: transportMode === 'car' || transportMode === 'moto' ? vehicleModel : 
               transportMode === 'mio' ? 'MIO Metrocali Troncal' :
               transportMode === 'bike' ? 'Caravana Ciclorruta' :
               transportMode === 'walk' ? 'Caminata Iluminada' :
               transportMode === 'intermunicipal' ? 'Van / Expreso a Terminal' : 'Taxi Seguro Compartido',
        plate: transportMode === 'car' || transportMode === 'moto' ? vehiclePlate : undefined,
        trunkAvailable: transportMode === 'car'
      },
      origin: {
        name: `${originUni.shortName} (${meetingPoint.split(' ')[0]})`,
        coords: originCoords
      },
      destination: {
        name: `${selectedNeighborhood.name} (${selectedNeighborhood.zone.split(' ')[1] || ''})`,
        neighborhoodId: selectedNeighborhood.id,
        coords: destCoords
      },
      shift,
      departureTime,
      status: 'scheduled',
      totalSeats: Number(totalSeats),
      availableSeats: Number(totalSeats),
      passengers: [],
      priceContribution: transportMode === 'mio' || transportMode === 'walk' || transportMode === 'bike' ? 0 : Number(priceContribution),
      insuranceActive,
      insuranceProvider: 'AXA / ViajaU Protege',
      meetingPoint,
      onlyGirls,
      routePolyline: [
        originCoords,
        [midLat, midLng],
        destCoords
      ]
    };

    onCreateTrip(newTrip);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="panel-title">
              <span>Publicar Viaje / Ofrecer Cupo</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Conecta con compañeros de tu misma zona y regresa acompañado
            </p>
          </div>
          <button className="btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Mode Selection */}
          <div className="form-group">
            <label className="form-label">¿Cómo te vas a desplazar?</label>
            <div className="mode-filters-row" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`mode-filter-pill ${transportMode === 'car' ? 'active' : ''}`}
                onClick={() => { setTransportMode('car'); setTotalSeats(3); setPriceContribution(3500); }}
              >
                <Car size={16} /> Carro (Carpooling)
              </button>
              <button
                type="button"
                className={`mode-filter-pill ${transportMode === 'moto' ? 'active' : ''}`}
                onClick={() => { setTransportMode('moto'); setTotalSeats(1); setPriceContribution(3000); }}
              >
                <Bike size={16} /> Moto (1 Cupo)
              </button>
              <button
                type="button"
                className={`mode-filter-pill ${transportMode === 'mio' ? 'active' : ''}`}
                onClick={() => { setTransportMode('mio'); setTotalSeats(6); setPriceContribution(0); }}
              >
                <Bus size={16} /> MIO en Parche
              </button>
              <button
                type="button"
                className={`mode-filter-pill ${transportMode === 'bike' ? 'active' : ''}`}
                onClick={() => { setTransportMode('bike'); setTotalSeats(5); setPriceContribution(0); }}
              >
                <Bike size={16} /> Bici-Ruta
              </button>
              <button
                type="button"
                className={`mode-filter-pill ${transportMode === 'walk' ? 'active' : ''}`}
                onClick={() => { setTransportMode('walk'); setTotalSeats(8); setPriceContribution(0); }}
              >
                <Footprints size={16} /> Caminata Segura
              </button>
              <button
                type="button"
                className={`mode-filter-pill ${transportMode === 'taxi' ? 'active' : ''}`}
                onClick={() => { setTransportMode('taxi'); setTotalSeats(4); setPriceContribution(6000); }}
              >
                <Users size={16} /> Taxi Grupal
              </button>
              <button
                type="button"
                className={`mode-filter-pill ${transportMode === 'intermunicipal' ? 'active' : ''}`}
                onClick={() => { setTransportMode('intermunicipal'); setTotalSeats(5); setPriceContribution(4500); }}
              >
                <Bus size={16} /> Foráneo Terminal
              </button>
            </div>
          </div>

          <div className="form-grid">
            {/* Campus Origin */}
            <div className="form-group">
              <label className="form-label">Campus de Origen</label>
              <select value={originCampus} onChange={(e) => setOriginCampus(e.target.value)}>
                {UNIVERSITIES.map(u => (
                  <option key={u.id} value={u.shortName}>{u.shortName}</option>
                ))}
              </select>
            </div>

            {/* Destination Neighborhood */}
            <div className="form-group">
              <label className="form-label">Barrio o Sector de Destino</label>
              <select value={destinationNeighborhoodId} onChange={(e) => setDestinationNeighborhoodId(e.target.value)}>
                {NEIGHBORHOODS.map(nh => (
                  <option key={nh.id} value={nh.id}>{nh.name} ({nh.zone.split(' ')[1] || 'Cali'})</option>
                ))}
              </select>
            </div>

            {/* Meeting Point */}
            <div className="form-group full-width">
              <label className="form-label">Punto de Encuentro en el Campus</label>
              <input
                type="text"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                placeholder="Ej: Portería Pance frente a plazoleta de comidas"
                required
              />
            </div>

            {/* Departure Time */}
            <div className="form-group">
              <label className="form-label">Hora Estimada de Salida</label>
              <input
                type="text"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="Ej: 9:45 PM"
                required
              />
            </div>

            {/* Shift */}
            <div className="form-group">
              <label className="form-label">Jornada Académica</label>
              <select value={shift} onChange={(e) => setShift(e.target.value)}>
                <option value="Jornada Nocturna">🌙 Jornada Nocturna (Noche)</option>
                <option value="Jornada Tarde">☀️ Jornada Tarde</option>
                <option value="Jornada Mañana">🌅 Jornada Mañana</option>
              </select>
            </div>

            {/* Seats */}
            <div className="form-group">
              <label className="form-label">Cupos / Acompañantes Disponibles</label>
              <input
                type="number"
                min="1"
                max="10"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                required
              />
            </div>

            {/* Contribution */}
            <div className="form-group">
              <label className="form-label">Aporte sugerido por persona (COP)</label>
              <input
                type="number"
                min="0"
                step="500"
                disabled={transportMode === 'mio' || transportMode === 'walk'}
                value={priceContribution}
                onChange={(e) => setPriceContribution(e.target.value)}
              />
            </div>

            {/* Vehicle Model & Plate if car/moto */}
            {(transportMode === 'car' || transportMode === 'moto') && (
              <>
                <div className="form-group">
                  <label className="form-label">Vehículo (Modelo y Color)</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Ej: Chevrolet Spark GT Gris"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Placa (Últimos 3 dígitos)</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="Ej: ***-412"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Embedded Insurance Section */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={insuranceActive}
                onChange={(e) => setInsuranceActive(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} /> Activar Micro-seguro de Trayecto AXA / ViajaU
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Siguiendo el modelo BlaBlaCar + AXA: Asistencia médica de emergencia por trayecto, respaldo jurídico y verificación satelital de llegada sin comisión excesiva.
                </p>
              </div>
            </label>
          </div>

          {/* Only Girls Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={onlyGirls}
                onChange={(e) => setOnlyGirls(e.target.checked)}
              />
              <span style={{ color: '#f472b6', fontWeight: 600 }}>Solo Chicas (Espacio exclusivo para mujeres)</span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>
              Publicar Trayecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
