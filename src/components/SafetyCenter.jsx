import React, { useEffect, useRef, useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  PhoneCall, 
  MapPin, 
  Lock, 
  FileText, 
  ShieldAlert
} from 'lucide-react';

export default function SafetyCenter({ 
  studentUser, 
  onTriggerSOS, 
  activeUniversity,
  onOpenVerification,
  onOpenArrivalCheckin,
  onOpenReportIncident,
  onOpenEcoSavings
}) {
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosActive, setSosActive] = useState(false);
  const countdownInterval = useRef(null);

  useEffect(() => () => {
    if (countdownInterval.current !== null) {
      window.clearInterval(countdownInterval.current);
    }
  }, []);

  const clearCountdown = () => {
    if (countdownInterval.current !== null) {
      window.clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
  };

  const startSOS = () => {
    clearCountdown();
    setShowSOSModal(true);
    setSosCountdown(5);
    setSosActive(false);

    let count = 5;
    countdownInterval.current = window.setInterval(() => {
      count--;
      setSosCountdown(count);
      if (count <= 0) {
        clearCountdown();
        setSosActive(true);
        onTriggerSOS({
          timestamp: new Date().toLocaleTimeString(),
          user: studentUser.name,
          campus: activeUniversity.shortName,
          coords: activeUniversity.coords,
          contact: studentUser.emergencyContact
        });
      }
    }, 1000);
  };

  const cancelSOS = () => {
    clearCountdown();
    setShowSOSModal(false);
    setSosActive(false);
  };

  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="panel-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="panel-title">
            <ShieldCheck size={22} style={{ color: 'var(--emerald-primary)' }} />
            <span>Centro de Seguridad & Micro-Seguro Embebido (AXA / ViajaU)</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Modelo de protección por trayecto para estudiantes universitarios basado en el precedente BlaBlaCar + AXA
          </p>
        </div>

        <button className="sos-header-btn" onClick={startSOS}>
          <AlertTriangle size={16} /> BOTÓN SOS DE PÁNICO
        </button>
      </div>

      {/* Embedded Insurance Showcase Card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(2,132,199,0.12) 0%, rgba(16,185,129,0.12) 100%)', border: '1px solid var(--border-highlight)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Póliza de Micro-Seguro de Trayecto Universitario</h3>
                <span className="badge badge-sapphire">Alianza Modelo AXA Colpatria</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Monetización transparente por uso: $1.500 COP por viaje asegurado, sin suscripciones mensuales fijas
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Costo por Trayecto</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>$1.500 COP</div>
          </div>
        </div>

        {/* Coverage Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '6px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>
              ✓ Asistencia Médica en Ruta
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Cobertura de gastos médicos de urgencia por accidente en trayecto hasta <strong>$15.000.000 COP</strong>.
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>
              ✓ Protección de Equipos de Estudio
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Reposición garantizada de portátil y celular por hurto calificado en viaje acompañado hasta <strong>$3.500.000 COP</strong>.
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>
              ✓ Asistencia Jurídica & Tránsito
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Asesoría legal inmediata y mediación en accidentes viales dentro del perímetro urbano de Cali y Jamundí.
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ color: '#c084fc', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>
              ✓ Verificación Satelital de Llegada
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Rastreo encriptado de viaje que notifica a tu acudiente vía WhatsApp cuando entras al radio seguro de tu casa.
            </div>
          </div>
        </div>

        {/* Quick Safety Tools Action Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '10px' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onOpenArrivalCheckin}
            style={{ padding: '10px', justifyContent: 'center', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--emerald-primary)', color: 'var(--emerald-primary)', fontWeight: 700 }}
          >
            <ShieldCheck size={16} /> Check-in de Llegada
          </button>

          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onOpenReportIncident}
            style={{ padding: '10px', justifyContent: 'center', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--amber-primary)', color: 'var(--amber-primary)', fontWeight: 700 }}
          >
            <AlertTriangle size={16} /> Reportar Alerta en Ruta
          </button>

          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onOpenVerification}
            style={{ padding: '10px', justifyContent: 'center', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--sapphire-primary)', color: '#60a5fa', fontWeight: 700 }}
          >
            <Lock size={16} /> Validar Carnet Digital
          </button>

          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onOpenEcoSavings}
            style={{ padding: '10px', justifyContent: 'center', fontSize: '0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontWeight: 700 }}
          >
            <FileText size={16} /> Ahorro & Huella CO2
          </button>
        </div>
      </div>

      {/* Emergency Call Numbers & Safe Corridors */}
      <div className="dashboard-grid" style={{ minHeight: 'auto', gap: '20px' }}>
        {/* Left: Direct Helpline Numbers */}
        <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={18} style={{ color: 'var(--rose-primary)' }} />
            <span>Líneas Directas de Emergencia en Cali</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Policía Metropolitana de Cali</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atención cuadrantes y emergencias</div>
              </div>
              <span className="badge badge-rose" style={{ fontSize: '0.85rem' }}>123</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Patrulla Púrpura (Seguridad de Género)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Orientación inmediata mujeres víctimas de acoso</div>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.85rem' }}>155</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Vigilancia y Seguridad Campus UNIAJC</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Puesto de control Portería Pance</div>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.8rem' }}>318 402 1199</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Centro de Control Metrocali MIO</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monitoreo de cámaras en estaciones</div>
              </div>
              <span className="badge badge-sapphire" style={{ fontSize: '0.8rem' }}>620 4040</span>
            </div>
          </div>
        </div>

        {/* Right: Safe Meeting Corridors */}
        <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: 'var(--emerald-primary)' }} />
            <span>Puntos de Encuentro Seguros Monitoreados</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📍 Portería Principal UNIAJC Sur</div>
              <div style={{ color: 'var(--text-secondary)' }}>Bahía iluminada con cámara domo institucional y presencia de vigilancia hasta las 10:30 PM.</div>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📍 Estación Universidades MIO (Sur)</div>
              <div style={{ color: 'var(--text-secondary)' }}>Zona de torniquetes y parada alimentadores A19A y A11. Punto de convergencia de Univalle, Javeriana e Icesi.</div>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📍 Bahía Peatonal Universidad del Valle</div>
              <div style={{ color: 'var(--text-secondary)' }}>Calle 13 con Carrera 100 frente a Estación Buitrera. Corredor seguro con alumbrado LED.</div>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📍 Terminal de Transportes de Cali</div>
              <div style={{ color: 'var(--text-secondary)' }}>Bahía central de abordaje de buses intermunicipales con acompañamiento policial constante.</div>
            </div>
          </div>
        </div>
      </div>

      {/* SOS Panic Modal with Countdown */}
      {showSOSModal && (
        <div className="modal-overlay">
          <div className="modal-card sos-modal-content">
            {!sosActive ? (
              <>
                <div className="sos-countdown-circle">{sosCountdown}</div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--rose-primary)', fontWeight: 800 }}>
                  EMITIENDO ALERTA DE PÁNICO SOS
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                  En {sosCountdown} segundos se enviará tu ubicación en tiempo real al <strong>Centro de Seguridad UNIAJC</strong>, cuadrante de policía más cercano y a tu contacto de confianza (<strong>{studentUser.emergencyContact.name}</strong>).
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button className="btn-secondary" onClick={cancelSOS} style={{ padding: '10px 24px', fontWeight: 700 }}>
                    Cancelar Alerta Falsa
                  </button>
                  <button className="btn-danger" onClick={() => { clearCountdown(); setSosActive(true); onTriggerSOS({ timestamp: new Date().toLocaleTimeString(), user: studentUser.name, campus: activeUniversity.shortName, coords: activeUniversity.coords, contact: studentUser.emergencyContact }); }}>
                    Enviar Ya
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '3px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <ShieldAlert size={36} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#ef4444', fontWeight: 800 }}>
                  ¡ALERTA SOS ENVIADA CON ÉXITO!
                </h3>
                <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', width: '100%', textAlign: 'left', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>📍 <strong>Ubicación transmitida:</strong> {activeUniversity.shortName} ({activeUniversity.coords.join(', ')})</div>
                  <div>📱 <strong>SMS de emergencia despachado a:</strong> {studentUser.emergencyContact.name} ({studentUser.emergencyContact.phone})</div>
                  <div>🚨 <strong>Policía y Seguridad Universitaria:</strong> Enlace satelital abierto</div>
                </div>
                <button className="btn-secondary" style={{ marginTop: '12px' }} onClick={cancelSOS}>
                  Cerrar Ventana de Alerta
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
