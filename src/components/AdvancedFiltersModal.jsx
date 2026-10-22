import React from 'react';
import { 
  X, 
  Filter, 
  Car, 
  Bike, 
  Bus, 
  Footprints, 
  Users, 
  Heart, 
  Check, 
  RotateCcw 
} from 'lucide-react';

export default function AdvancedFiltersModal({ 
  isOpen, 
  onClose, 
  filters, 
  onUpdateFilters, 
  onResetFilters 
}) {
  if (!isOpen) return null;

  const toggleMode = (mode) => {
    if (filters.modes.includes(mode)) {
      onUpdateFilters({ ...filters, modes: filters.modes.filter(m => m !== mode) });
    } else {
      onUpdateFilters({ ...filters, modes: [...filters.modes, mode] });
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--emerald-primary)', color: 'white', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <Filter size={18} />
            </div>
            <div>
              <h3 className="modal-title">Filtros Avanzados de Coincidencia</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Personaliza los viajes según medio de transporte, jornada y preferencias de seguridad
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Modes Selection */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              Medios de Transporte Permitidos:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
              {[
                { id: 'car', label: 'Carro Compartido', icon: <Car size={15} /> },
                { id: 'moto', label: 'Moto-Cupo', icon: <Bike size={15} /> },
                { id: 'mio', label: 'Parche MIO', icon: <Bus size={15} /> },
                { id: 'bike', label: 'Bici-Ruta', icon: <Bike size={15} /> },
                { id: 'walk', label: 'Caminata Segura', icon: <Footprints size={15} /> },
                { id: 'taxi', label: 'Taxi Grupal', icon: <Users size={15} /> },
                { id: 'intermunicipal', label: 'Foráneo Terminal', icon: <Bus size={15} /> }
              ].map(item => {
                const isSelected = filters.modes.length === 0 || filters.modes.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleMode(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
                      border: isSelected ? '1px solid var(--emerald-primary)' : '1px solid var(--border-color)',
                      color: isSelected ? 'var(--emerald-primary)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academic Shift Selection */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              Jornada Académica:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { id: 'all', label: 'Todas las Horas' },
                { id: 'Nocturna', label: 'Nocturna (9-10 PM)', highlight: true },
                { id: 'Tarde', label: 'Tarde / Mediodía' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdateFilters({ ...filters, shift: s.id })}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: filters.shift === s.id ? 'var(--bg-card-hover)' : 'var(--bg-tertiary)',
                    border: filters.shift === s.id ? '2px solid var(--emerald-primary)' : '1px solid var(--border-color)',
                    color: filters.shift === s.id ? 'var(--emerald-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Safety Filter: Only Girls */}
          <div style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart size={18} style={{ color: '#ec4899' }} />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f472b6' }}>
                  Solo Chicas / Parche de Mujeres
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Mostrar únicamente viajes conformados y liderados por mujeres universitarias
                </div>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={filters.onlyGirls}
              onChange={(e) => onUpdateFilters({ ...filters, onlyGirls: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#ec4899', cursor: 'pointer' }}
            />
          </div>

          {/* Max Price Range */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Aporte Máximo por Trayecto:
              </label>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--emerald-primary)' }}>
                ${filters.maxPrice.toLocaleString('es-CO')} COP
              </span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={8000} 
              step={500}
              value={filters.maxPrice}
              onChange={(e) => onUpdateFilters({ ...filters, maxPrice: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--emerald-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>$0 (Gratis: MIO / Bici / Caminata)</span>
              <span>$4.000</span>
              <span>$8.000</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onResetFilters}
              style={{ fontSize: '0.82rem' }}
            >
              <RotateCcw size={14} /> Restablecer Filtros
            </button>

            <button 
              type="button" 
              className="btn-primary" 
              onClick={onClose}
              style={{ minWidth: '130px', justifyContent: 'center' }}
            >
              <Check size={16} /> Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
