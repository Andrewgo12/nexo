import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Map,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { BUSINESS_MODULES } from '../data/businessModules';

const MODULE_ICONS = [GraduationCap, Map, Users, ShieldCheck, CreditCard, BarChart3];

export default function BusinessModulesDashboard() {
  return (
    <div style={{ display: 'grid', gap: '22px', padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#86efac', fontWeight: 800 }}>
            Arquitectura del negocio
          </div>
          <h2 style={{ margin: '8px 0 0', color: 'white', fontSize: '2rem' }}>Cobertura completa de ViajaU</h2>
        </div>
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: '999px', padding: '8px 12px', color: '#a7f3d0', fontWeight: 700 }}>
          {BUSINESS_MODULES.reduce((sum, module) => sum + module.functions.length, 0)} funciones cubiertas
        </div>
      </div>

      {BUSINESS_MODULES.map((module, index) => {
        const Icon = MODULE_ICONS[index] ?? CheckCircle2;

        return (
          <div
            key={module.id}
            style={{
              background: 'rgba(15, 23, 42, 0.82)',
              border: '1px solid rgba(148,163,184,0.18)',
              borderRadius: '22px',
              padding: '24px',
              boxShadow: '0 18px 45px rgba(15, 23, 42, 0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a7f3d0' }}>
                  Módulo {index + 1}
                </div>
                <h3 style={{ margin: '6px 0 0', color: '#f8fafc', fontSize: '1.28rem' }}>{module.title}</h3>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(59,130,246,0.18))', display: 'grid', placeItems: 'center', color: '#86efac' }}>
                <Icon size={23} />
              </div>
            </div>

            <p style={{ margin: '0 0 16px', color: '#cbd5e1', lineHeight: 1.6 }}>{module.summary}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {module.functions.map((func) => (
                <span
                  key={`${module.id}-${func}`}
                  style={{
                    background: 'rgba(15,118,110,0.14)',
                    border: '1px solid rgba(52,211,153,0.25)',
                    color: '#dcfce7',
                    borderRadius: '999px',
                    padding: '7px 11px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  {func}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
