import React, { useEffect, useRef, useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  GraduationCap, 
  Check, 
  Edit3, 
  Star, 
  Lock, 
  QrCode,
} from 'lucide-react';
import { NEIGHBORHOODS } from '../data/mockData';

export default function StudentProfile({ 
  studentUser, 
  onUpdateProfile, 
  activeUniversity, 
  onOpenVerification 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const savedSuccessTimeout = useRef(null);

  useEffect(() => () => {
    if (savedSuccessTimeout.current !== null) {
      window.clearTimeout(savedSuccessTimeout.current);
    }
  }, []);

  // Form states
  const [name, setName] = useState(studentUser.name);
  const [career, setCareer] = useState(studentUser.career);
  const [semester, setSemester] = useState(studentUser.semester);
  const [neighborhoodId, setNeighborhoodId] = useState(studentUser.neighborhoodId);
  const [shiftPreference, setShiftPreference] = useState(studentUser.shiftPreference);
  const [activeRole, setActiveRole] = useState(studentUser.activeRole);
  const [emergencyName, setEmergencyName] = useState(studentUser.emergencyContact.name);
  const [emergencyPhone, setEmergencyPhone] = useState(studentUser.emergencyContact.phone);
  const [emergencyRelationship, setEmergencyRelationship] = useState(studentUser.emergencyContact.relationship);

  const selectedNeighborhood = NEIGHBORHOODS.find(n => n.id === neighborhoodId) || NEIGHBORHOODS[0];

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      ...studentUser,
      name,
      career,
      semester,
      neighborhoodId,
      neighborhoodName: selectedNeighborhood.name,
      zone: selectedNeighborhood.zone,
      shiftPreference,
      activeRole,
      emergencyContact: {
        ...studentUser.emergencyContact,
        name: emergencyName,
        phone: emergencyPhone,
        relationship: emergencyRelationship
      }
    };
    onUpdateProfile(updated);
    setIsEditing(false);
    setSavedSuccess(true);
    if (savedSuccessTimeout.current !== null) window.clearTimeout(savedSuccessTimeout.current);
    savedSuccessTimeout.current = window.setTimeout(() => {
      savedSuccessTimeout.current = null;
      setSavedSuccess(false);
    }, 3500);
  };

  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="panel-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="panel-title">
            <User size={20} style={{ color: 'var(--emerald-primary)' }} />
            <span>Perfil Estudiantil & Configuración de Privacidad</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Validación institucional universitaria y zona residencial aproximada
          </p>
        </div>

        {!isEditing ? (
          <button className="btn-secondary" onClick={() => setIsEditing(true)}>
            <Edit3 size={15} /> Editar Perfil
          </button>
        ) : (
          <button className="btn-secondary" onClick={() => setIsEditing(false)}>
            Cancelar
          </button>
        )}
      </div>

      {savedSuccess && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--emerald-primary)', padding: '10px 16px', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> Perfil y zona de residencia actualizados correctamente.
        </div>
      )}

      {/* Virtual Student Carnet Card */}
      <div className="virtual-carnet">
        <div className="carnet-watermark">UNIAJC</div>
        <div className="carnet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={20} />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.04em' }}>
              {activeUniversity.shortName.toUpperCase()}
            </span>
          </div>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}>
            ✓ ESTUDIANTE ACTIVO 2026
          </span>
        </div>

        <div className="carnet-body">
          <img src={studentUser.avatar} alt={studentUser.name} className="carnet-photo" />

          <div className="carnet-info">
            <div className="carnet-name">{studentUser.name}</div>
            <div className="carnet-career">{studentUser.career}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{studentUser.semester}</div>
            <div className="carnet-code">ID: {studentUser.carnetCode} • {studentUser.email}</div>
          </div>

          <div className="carnet-qr-badge">
            <QrCode size={36} />
            <span>VALIDADO</span>
          </div>
        </div>
      </div>

      {/* Trust & Verification Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-full)', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correo Institucional</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#34d399' }}>✓ Verificado (@uniajc.edu.co)</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-full)', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nivel de Confianza</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#60a5fa' }}>
                {studentUser.trustLevel === 3 ? 'Nivel 3: 100% Verificado' : 'Nivel 2: Carnet Validado'}
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onOpenVerification}
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            Validar
          </button>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-full)', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reputación de la Comunidad</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fbbf24' }}>{studentUser.rating} ★ ({studentUser.totalTrips} viajes seguros)</div>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Privacy Note Banner */}
        <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Lock size={20} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#38bdf8' }}>Privacidad por Diseño (Requisito Central ViajaU):</strong><br />
            Tu dirección exacta de vivienda jamás se publica ni se comparte con otros estudiantes. Solo declaras tu <strong>barrio o sector aproximado</strong> para calcular la compatibilidad de ruta y puntos de encuentro seguros.
          </div>
        </div>

        <div className="form-grid">
          {/* Student Name */}
          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <input
              type="text"
              value={name}
              disabled={!isEditing}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Academic Career */}
          <div className="form-group">
            <label className="form-label">Programa Académico</label>
            <input
              type="text"
              value={career}
              disabled={!isEditing}
              onChange={(e) => setCareer(e.target.value)}
              required
            />
          </div>

          {/* Semester */}
          <div className="form-group">
            <label className="form-label">Semestre / Grupo</label>
            <input
              type="text"
              value={semester}
              disabled={!isEditing}
              onChange={(e) => setSemester(e.target.value)}
              required
            />
          </div>

          {/* Approximate Neighborhood Selector */}
          <div className="form-group">
            <label className="form-label">
              <MapPin size={14} style={{ color: 'var(--emerald-primary)' }} />
              <span>Barrio Residencial Aproximado</span>
            </label>
            <select
              value={neighborhoodId}
              disabled={!isEditing}
              onChange={(e) => setNeighborhoodId(e.target.value)}
            >
              {NEIGHBORHOODS.map(nh => (
                <option key={nh.id} value={nh.id}>
                  {nh.name} — {nh.zone}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Shift */}
          <div className="form-group">
            <label className="form-label">Jornada y Horario Habitual de Salida</label>
            <input
              type="text"
              value={shiftPreference}
              disabled={!isEditing}
              onChange={(e) => setShiftPreference(e.target.value)}
              placeholder="Ej: Jornada Nocturna (Salida 9:45 PM)"
              required
            />
          </div>

          {/* Active Role */}
          <div className="form-group">
            <label className="form-label">Rol Activo en la Plataforma</label>
            <select
              value={activeRole}
              disabled={!isEditing}
              onChange={(e) => setActiveRole(e.target.value)}
            >
              <option value="passenger">Pasajero / Acompañante de Grupo</option>
              <option value="car_driver">Conductor Carro (Ofrecer Cupos)</option>
              <option value="moto_driver">Conductor Moto (Moto-Cupo)</option>
              <option value="walk_leader">Líder de Parche MIO / Caminata</option>
            </select>
          </div>
        </div>

        {/* Emergency Contact Card */}
        <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} style={{ color: 'var(--rose-primary)' }} />
              <span>Contacto de Confianza (Alerta SOS y Verificación de Llegada)</span>
            </h4>
            <span className="badge badge-rose">Prioridad de Seguridad</span>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nombre del Contacto</label>
              <input
                type="text"
                value={emergencyName}
                disabled={!isEditing}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Ej: Martha Dinas (Mamá)"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parentesco</label>
              <input
                type="text"
                value={emergencyRelationship}
                disabled={!isEditing}
                onChange={(e) => setEmergencyRelationship(e.target.value)}
                placeholder="Ej: Madre / Padre / Hermano"
                required
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Teléfono Móvil (WhatsApp / SMS automático)</label>
              <input
                type="tel"
                value={emergencyPhone}
                disabled={!isEditing}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+57 315 882 1920"
                required
              />
            </div>
          </div>
        </div>

        {/* Save button when editing */}
        {isEditing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>
              Guardar Cambios
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
