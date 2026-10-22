import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Share2, 
  MessageCircle,
  Home,
  RotateCcw
} from 'lucide-react';

export default function ArrivalCheckinModal({ 
  isOpen, 
  onClose, 
  trip, 
  studentUser, 
  onConfirmArrival,
  onTriggerSOS 
}) {
  // Initial countdown 35 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen || !isRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          // Dead-man's switch triggers alert
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isRunning, timeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleArrivalSuccess = () => {
    setIsRunning(false);
    setArrivalConfirmed(true);
    onConfirmArrival && onConfirmArrival();
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const emergencyContact = studentUser.emergencyContact || {
    name: 'Contacto de Emergencia',
    phone: '+57 315 882 1920',
    relationship: 'Familiar'
  };

  // WhatsApp prefilled message
  const whatsappMsg = encodeURIComponent(
    `Hola ${emergencyContact.name}, te confirmo que he llegado bien y seguro(a) a casa desde la universidad con ViajaU Cali. 🛡️🏠`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${emergencyContact.phone.replace(/[^0-9]/g, '')}&text=${whatsappMsg}`;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--emerald-primary)', color: 'white', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <Home size={18} />
            </div>
            <div>
              <h3 className="modal-title">Check-in de Llegada Segura</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Monitoreo satelital y confirmación para tu contacto de confianza
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
          {arrivalConfirmed ? (
            <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: 'var(--emerald-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={40} />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>¡Llegada Confirmada!</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Se ha notificado a {emergencyContact.name} que te encuentras a salvo en tu hogar.
              </p>
            </div>
          ) : (
            <>
              {/* Timer Box */}
              <div style={{ 
                background: timeLeft < 300 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)', 
                border: timeLeft < 300 ? '1px solid var(--rose-primary)' : '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-lg)', 
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  Tiempo Estimado Restante
                </span>
                <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'monospace', color: timeLeft < 300 ? 'var(--rose-primary)' : 'var(--emerald-primary)' }}>
                  {timeFormatted}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
                  Si el temporizador llega a 00:00 sin confirmación, ViajaU enviará un aviso de emergencia automático a tu contacto.
                </p>
              </div>

              {/* Destination & Contact info */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Destino seguro:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{trip?.destination?.name || studentUser.neighborhoodName}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contacto notificado:</span>
                  <span style={{ color: 'var(--emerald-primary)', fontWeight: 600 }}>
                    {emergencyContact.name} ({emergencyContact.phone})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '1rem', fontWeight: 700 }}
                  onClick={handleArrivalSuccess}
                >
                  <CheckCircle2 size={20} />
                  <span>¡Ya Llegué Seguro(a) a Casa!</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <a 
                    href={whatsappUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary" 
                    style={{ justifyContent: 'center', textDecoration: 'none', background: '#25D366', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.82rem' }}
                  >
                    <MessageCircle size={16} /> Avisar por WhatsApp
                  </a>

                  <button 
                    className="btn-secondary" 
                    style={{ justifyContent: 'center', borderColor: 'var(--rose-primary)', color: 'var(--rose-primary)', fontSize: '0.82rem' }}
                    onClick={() => {
                      onClose();
                      onTriggerSOS && onTriggerSOS({
                        timestamp: new Date().toLocaleTimeString(),
                        user: studentUser.name,
                        campus: 'Regreso nocturno en curso',
                        coords: trip?.destination?.coords || [3.3768, -76.5332]
                      });
                    }}
                  >
                    <AlertTriangle size={15} /> Botón SOS
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
