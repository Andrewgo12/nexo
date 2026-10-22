import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Bus, 
  Moon, 
  ShieldCheck, 
  CloudRain, 
  MapPin, 
  Plus, 
  CheckCircle2 
} from 'lucide-react';
import { UNIVERSITIES, NEIGHBORHOODS } from '../data/mockData';

export default function IncidentReportModal({ 
  isOpen, 
  onClose, 
  onAddIncident, 
  activeUniversity, 
  studentUser 
}) {
  const [type, setType] = useState('mio_delay');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [locationName, setLocationName] = useState(activeUniversity.shortName);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Determine coords based on location choice
    const foundUni = UNIVERSITIES.find(u => u.shortName === locationName);
    const foundNeigh = NEIGHBORHOODS.find(n => n.name === locationName);
    const coords = foundUni ? foundUni.coords : foundNeigh ? foundNeigh.coords : activeUniversity.coords;

    const newIncident = {
      id: `inc-${Date.now()}`,
      type,
      title,
      description,
      coords,
      severity,
      time: 'Justo ahora',
      reportedBy: `Estudiante ${studentUser.name.split(' ')[0]}`,
      icon: type === 'mio_delay' ? 'bus' : 
            type === 'dark_spot' ? 'moon' : 
            type === 'police_patrol' ? 'shield-check' : 'cloud-rain'
    };

    setSubmitted(true);
    setTimeout(() => {
      onAddIncident(newIncident);
      setSubmitted(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--amber-primary)', color: 'white', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="modal-title">Reportar Alerta Comunitaria en Ruta</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Ayuda a la red universitaria de Cali a evitar zonas oscuras o trancones
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Incident Type Grid */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Tipo de Incidencia:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'mio_delay', label: 'Retraso de Ruta MIO', icon: <Bus size={15} /> },
                { id: 'dark_spot', label: 'Vía Oscura / Falla Luz', icon: <Moon size={15} /> },
                { id: 'police_patrol', label: 'Patrulla / Cuadrante', icon: <ShieldCheck size={15} /> },
                { id: 'traffic_rain', label: 'Trancón / Lluvia Fuerte', icon: <CloudRain size={15} /> }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setType(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: type === opt.id ? '2px solid var(--emerald-primary)' : '1px solid var(--border-color)',
                    background: type === opt.id ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-tertiary)',
                    color: type === opt.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Título breve de la alerta:
            </label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej: Falla de luminaria en sendero Cañasgordas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Ubicación aproximada en Cali:
            </label>
            <select 
              className="form-select" 
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            >
              <optgroup label="Campus Universitarios">
                {UNIVERSITIES.map(u => (
                  <option key={u.id} value={u.shortName}>{u.shortName}</option>
                ))}
              </optgroup>
              <optgroup label="Barrios y Sectores Residenciales">
                {NEIGHBORHOODS.slice(0, 10).map(n => (
                  <option key={n.id} value={n.name}>{n.name} ({n.zone.split(' ')[1] || ''})</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Nivel de Severidad:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'low', label: 'Informativa (Baja)', color: '#3b82f6' },
                { id: 'medium', label: 'Precaución (Media)', color: '#f59e0b' },
                { id: 'high', label: 'Urgente / Peligro (Alta)', color: '#ef4444' }
              ].map(s => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSeverity(s.id)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: severity === s.id ? `2px solid ${s.color}` : '1px solid var(--border-color)',
                    background: severity === s.id ? 'rgba(255,255,255,0.08)' : 'var(--bg-secondary)',
                    color: severity === s.id ? s.color : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Detalles o recomendación para compañeros:
            </label>
            <textarea 
              className="form-textarea" 
              rows={3}
              placeholder="Indica si es mejor tomar otra vía, si hay presencia de guardias o si es recomendable caminar en grupo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitted}
              style={{ minWidth: '140px', justifyContent: 'center' }}
            >
              {submitted ? (
                <>
                  <CheckCircle2 size={16} /> ¡Publicado!
                </>
              ) : (
                <>
                  <Plus size={16} /> Publicar Alerta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
