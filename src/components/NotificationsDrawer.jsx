import React from 'react';
import { Bell, X, CheckCheck, CheckCircle, Bus, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function NotificationsDrawer({ isOpen, onClose, notifications, onMarkAllRead }) {
  if (!isOpen) return null;

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'check-circle': return <CheckCircle size={18} style={{ color: '#34d399' }} />;
      case 'bus': return <Bus size={18} style={{ color: '#38bdf8' }} />;
      case 'shield-check': return <ShieldCheck size={18} style={{ color: '#818cf8' }} />;
      case 'alert-triangle': return <AlertTriangle size={18} style={{ color: '#fbbf24' }} />;
      default: return <Bell size={18} style={{ color: '#10b981' }} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '20px' }}
      >
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} style={{ color: 'var(--emerald-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Notificaciones de Viaje</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              onClick={onMarkAllRead}
            >
              <CheckCheck size={14} /> Marcar Leídas
            </button>
            <button className="btn-secondary" style={{ padding: '4px' }} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
          {notifications.map(n => (
            <div 
              key={n.id} 
              style={{
                background: n.read ? 'var(--bg-secondary)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${n.read ? 'var(--border-color)' : 'var(--border-highlight)'}`,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {getIcon(n.icon)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {n.title}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.time}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {n.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
