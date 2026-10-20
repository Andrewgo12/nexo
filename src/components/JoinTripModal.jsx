import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Car, 
  Bike, 
  Bus, 
  Footprints, 
  Users, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Phone
} from 'lucide-react';

export default function JoinTripModal({ 
  isOpen, 
  onClose, 
  trip, 
  onConfirmJoin, 
  studentUser 
}) {
  if (!isOpen || !trip) return null;

  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [pickupNote, setPickupNote] = useState('');
  const [securityPin] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [confirmed, setConfirmed] = useState(false);

  const insuranceFee = includeInsurance ? 1500 : 0;
  const baseCost = trip.priceContribution || 0;
  const totalToPay = baseCost + insuranceFee;

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirmJoin({
        tripId: trip.id,
        trip,
        includeInsurance,
        securityPin,
        pickupNote,
        totalToPay
      });
      setConfirmed(false);
      onClose();
    }, 1200);
  };

  const getModeIcon = () => {
    switch (trip.transportMode) {
      case 'car': return <Car size={18} />;
      case 'moto': return <Bike size={18} />;
      case 'mio': return <Bus size={18} />;
      case 'bike': return <Bike size={18} />;
      case 'walk': return <Footprints size={18} />;
      case 'taxi': return <Users size={18} />;
      case 'intermunicipal': return <Bus size={18} />;
      default: return <Car size={18} />;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--emerald-primary)', color: 'white', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              {getModeIcon()}
            </div>
            <div>
              <h3 className="modal-title">Reservar Cupo en Desplazamiento</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Validación de seguridad y seguro embebido AXA por trayecto
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Driver & Trip Overview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-tertiary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <img 
              src={trip.driver.avatar} 
              alt={trip.driver.name} 
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--emerald-primary)' }} 
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{trip.driver.name}</h4>
                <span className="badge badge-emerald">★ {trip.driver.rating}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {trip.driver.role} • {trip.driver.university}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {trip.driver.career} ({trip.driver.semester})
              </div>
            </div>
          </div>

          {/* Route Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Origen & Salida</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} style={{ color: 'var(--amber-primary)' }} /> {trip.departureTime}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {trip.origin.name}
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destino / Sector</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} style={{ color: 'var(--emerald-primary)' }} /> {trip.destination.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {trip.shift}
              </div>
            </div>
          </div>

          {/* Meeting Point */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.82rem' }}>
            <strong style={{ color: '#60a5fa' }}>Punto de Encuentro:</strong> {trip.meetingPoint}
          </div>

          {/* Embedded Insurance Option */}
          <div style={{ 
            background: includeInsurance ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)', 
            border: includeInsurance ? '1px solid var(--emerald-primary)' : '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)', 
            padding: '14px', 
            transition: 'var(--transition)',
            cursor: 'pointer' 
          }}
          onClick={() => setIncludeInsurance(!includeInsurance)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={includeInsurance} 
                  onChange={(e) => setIncludeInsurance(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--emerald-primary)', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--emerald-primary)' }} />
                    Activar Micro-Seguro de Trayecto AXA
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Asistencia médica de emergencia, SOS universitario y aviso a tu acudiente si no confirmas llegada.
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--emerald-primary)' }}>+$1.500 COP</span>
            </div>
          </div>

          {/* Security PIN Generator Preview */}
          <div style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={17} style={{ color: 'var(--amber-primary)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>PIN de Abordaje Seguro:</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Díselo a {trip.driver.name.split(' ')[0]} al subir para validar el viaje</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--amber-primary)', color: 'var(--amber-primary)', fontWeight: 800, letterSpacing: '2px', fontSize: '1rem' }}>
              {securityPin}
            </div>
          </div>

          {/* Pickup note */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Mensaje o detalle para el conductor (opcional):
            </label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej: Llevo maletín mediano / te espero con saco rojo"
              value={pickupNote}
              onChange={(e) => setPickupNote(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          {/* Total Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aporte Total del Trayecto</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${totalToPay.toLocaleString('es-CO')} COP
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={handleConfirm}
                disabled={confirmed}
                style={{ minWidth: '150px', justifyContent: 'center' }}
              >
                {confirmed ? (
                  <>
                    <CheckCircle2 size={16} /> ¡Confirmado!
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Confirmar Cupo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
