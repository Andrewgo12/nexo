import { useState } from 'react';
import Metric from '../Metric';
import { privacyFunctions } from '../../data/appSectionData';
import { getAccountDataExport } from '../../services/authApi';

export default function PrivacySection() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    setExportComplete(false);
    try {
      const { data } = await getAccountDataExport();
      if (
        !data
        || typeof data !== 'object'
        || Array.isArray(data)
        || data.format_version !== 1
        || !data.account
        || typeof data.account !== 'object'
        || !('student_profile' in data)
        || !Array.isArray(data.travel_offers)
        || !Array.isArray(data.trip_requests)
        || !Array.isArray(data.received_trip_requests)
        || !Array.isArray(data.reviews_written)
        || !Array.isArray(data.reviews_received)
        || !Array.isArray(data.messages_written)
        || !Array.isArray(data.safety_alerts)
        || !Array.isArray(data.trip_safety_events)
        || !Array.isArray(data.safety_notification_deliveries)
        || !Array.isArray(data.reports_written)
        || !Array.isArray(data.insurance_enrollments)
        || !Array.isArray(data.membership_payments)
        || !Array.isArray(data.trip_check_ins)
        || !Array.isArray(data.trip_locations)
      ) {
        throw new Error('El servidor devolvió un formato de exportación inválido.');
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `viajau-datos-cuenta-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportComplete(true);
    } catch (error) {
      setExportError(error.message || 'No fue posible descargar la exportación de tus datos.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#7dd3fc', fontWeight: 800 }}>MÓDULO 11</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Privacidad y seguridad del backend</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <Metric label="Autenticación" value="Sanctum" color="#38bdf8" />
          <Metric label="Ubicación" value="Consentida" color="#7dd3fc" />
          <Metric label="Retención GPS" value="Temporal" color="#34d399" />
          <Metric label="Derechos de datos" value="Parcial" color="#fca5a5" />
        </div>
        <div style={{ marginTop: 20, background: 'rgba(56,189,248,.08)', border: '1px solid rgba(56,189,248,.24)', borderRadius: 14, padding: 16, color: '#dbeafe' }}>
          La exportación incluye cuenta, actividad propia, categorías/estados de denuncias, solicitudes de seguro, check-ins, historial de entrega de avisos y puntos GPS guardados de tu cuenta. Las alertas SOS propias incluyen sus coordenadas; revisa el archivo antes de compartirlo. Se omiten mensajes ajenos, textos de denuncias, destinatarios, documentos de póliza e identificadores internos de transacción/proveedor. Los montos exportados no confirman cobros; la ubicación disponible depende de la retención y del scheduler.
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          <button type="button" onClick={handleExport} disabled={exporting} style={{ justifySelf: 'start', border: '1px solid rgba(56,189,248,.4)', borderRadius: 10, background: 'rgba(56,189,248,.14)', color: '#e0f2fe', padding: '10px 14px', fontWeight: 700, cursor: exporting ? 'wait' : 'pointer' }}>
            {exporting ? 'Preparando descarga…' : 'Descargar mis datos'}
          </button>
          {exportError && <div role="alert" style={{ color: '#fecaca' }}>{exportError}</div>}
          {exportComplete && <div role="status" style={{ color: '#86efac' }}>Se descargó la exportación. Los montos reflejan los registros guardados; no confirman un cobro.</div>}
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>SEGURIDAD</div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {privacyFunctions.map((item) => <span key={item} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(56,189,248,.12)', color: '#dbeafe' }}>{item}</span>)}
        </div>
      </div>
    </section>
  );
}
