import React, { useState } from 'react';
import { 
  X, 
  Leaf, 
  DollarSign, 
  Award
} from 'lucide-react';

export default function EcoSavingsModal({ isOpen, onClose }) {
  const [tripsPerWeek, setTripsPerWeek] = useState(8);
  const [currentCostPerTrip, setCurrentCostPerTrip] = useState(14000); // e.g. Taxi / Uber solo
  const avgDistanceKm = 14;

  if (!isOpen) return null;

  // Calculated metrics
  const sharedCostPerTrip = 3500; // Carpooling or MIO average
  const tripsPerMonth = tripsPerWeek * 4;
  const currentMonthlyExpense = tripsPerMonth * currentCostPerTrip;
  const viajaUMonthlyExpense = tripsPerMonth * sharedCostPerTrip;
  const moneySavedMonthly = currentMonthlyExpense - viajaUMonthlyExpense;

  // CO2 calculation (approx. 0.16 kg CO2 per km solo car vs shared)
  const co2KgSavedMonthly = +(tripsPerMonth * avgDistanceKm * 0.14).toFixed(1);
  const treesEquivalent = +(co2KgSavedMonthly / 1.8).toFixed(1);

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--emerald-primary)', color: 'white', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <Leaf size={18} />
            </div>
            <div>
              <h3 className="modal-title">Calculadora de Ahorro & Huella de Carbono</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Impacto financiero en tu presupuesto universitario y reducción de emisiones en Cali
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sliders Box */}
          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Viajes universitarios por semana:</span>
                <strong style={{ color: 'var(--emerald-primary)' }}>{tripsPerWeek} trayectos/sem</strong>
              </div>
              <input 
                type="range" 
                min={2} 
                max={14} 
                value={tripsPerWeek}
                onChange={(e) => setTripsPerWeek(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--emerald-primary)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Costo habitual en transporte individual:</span>
                <strong style={{ color: '#38bdf8' }}>${currentCostPerTrip.toLocaleString('es-CO')} COP/viaje</strong>
              </div>
              <input 
                type="range" 
                min={3000} 
                max={25000} 
                step={1000}
                value={currentCostPerTrip}
                onChange={(e) => setCurrentCostPerTrip(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
          </div>

          {/* Results Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Money Saved */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)', border: '1px solid var(--emerald-primary)', padding: '18px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--emerald-primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                <DollarSign size={16} /> Ahorro Mensual
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--emerald-primary)' }}>
                ${moneySavedMonthly.toLocaleString('es-CO')} COP
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Equivalente al 65% de ahorro frente a desplazarte solo en taxi o app individual.
              </span>
            </div>

            {/* CO2 Saved */}
            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(29,78,216,0.05) 100%)', border: '1px solid var(--sapphire-primary)', padding: '18px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 700 }}>
                <Leaf size={16} /> CO2 No Emitido
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#60a5fa' }}>
                {co2KgSavedMonthly} kg CO2
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Equivalente al oxígeno producido por {treesEquivalent} árboles nativos en los Farallones de Cali.
              </span>
            </div>
          </div>

          {/* Academic Insight Pill */}
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award size={24} style={{ color: 'var(--amber-primary)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <strong>Hallazgo del informe UNIAJC:</strong> El costo del transporte obliga a estudiantes a elegir entre pagar pasaje o alimentación; coordinar rutas reduce la deserción universitaria en Cali.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={onClose} style={{ minWidth: '120px', justifyContent: 'center' }}>
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
