export default function ConfirmationModal({
  modal,
  onClose,
  includeSafetyLocation,
  onToggleSafetyLocation,
  safetyLocationError,
  safetyActionLoading,
  onConfirmWithoutLocation,
  field,
}) {
  if (!modal) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div
        className="modal-card modal-card-enhanced"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: 560, animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Confirmación</div>
            <h3 id="confirmation-modal-title" style={{ marginTop: 6, fontSize: 28, fontWeight: 800 }}>{modal.title}</h3>
          </div>
          <button type="button" className="btn-secondary" style={{ padding: '8px 10px' }} onClick={onClose}>✕</button>
        </div>

        <div style={{ background: 'rgba(15,23,42,.8)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', display: 'inline-block', background: modal.accent || '#10b981', boxShadow: `0 0 0 6px ${modal.accent || '#10b981'}22` }} />
            <span style={{ fontWeight: 800, color: '#dbeafe' }}>Acción segura y validada</span>
          </div>
          <p style={{ color: '#dbeafe', lineHeight: 1.6, margin: 0 }}>{modal.message}</p>
        </div>

        {modal.type === 'panic' && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#dbeafe' }}>
              <input type="checkbox" checked={includeSafetyLocation} onChange={(event) => onToggleSafetyLocation(event.target.checked)} />
              Incluir mi ubicación GPS actual en esta alerta (el navegador solicitará permiso y las coordenadas se enviarán al servidor).
            </label>
            {safetyLocationError && (
              <div role="alert" style={{ color: '#fecaca', marginTop: 10 }}>
                {safetyLocationError}
                <button
                  type="button"
                  disabled={safetyActionLoading === 'panic'}
                  onClick={() => void onConfirmWithoutLocation(true)}
                  style={{ ...field, display: 'block', marginTop: 8, padding: '7px 10px', cursor: 'pointer' }}
                >
                  Enviar SOS sin ubicación GPS
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" disabled={safetyActionLoading === 'panic'} onClick={modal.onConfirm}>
            {safetyActionLoading === 'panic' ? 'Registrando SOS…' : modal.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
