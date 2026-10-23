export const modules = [
  { key: 'auth', title: '1. Usuarios y validación institucional', color: '#34d399' },
  { key: 'routes', title: '2. Mapa, rutas y geolocalización', color: '#60a5fa' },
  { key: 'search', title: '3. Búsqueda, filtros y ordenamiento', color: '#7dd3fc' },
  { key: 'match', title: '4. Match por zona y horario', color: '#a7f3d0' },
  { key: 'trips', title: '5. Gestión de viajes', color: '#fbbf24' },
  { key: 'safety', title: '6. Seguridad y ubicación', color: '#fca5a5' },
  { key: 'admin', title: '7. Administración y analytics', color: '#c4b5fd' },
  { key: 'trust', title: '8. Confiabilidad y reputación', color: '#a78bfa' },
  { key: 'payments', title: '9. Pago y seguro por trayecto', color: '#2dd4bf' },
  { key: 'dashboard', title: '10. Dashboard y comunicación', color: '#f472b6' },
  { key: 'privacy', title: '11. Privacidad y seguridad backend', color: '#38bdf8' },
  { key: 'alerts', title: '12. Notificaciones y recordatorios', color: '#f59e0b' },
  { key: 'advanced', title: '13. Funcionalidades avanzadas', color: '#a3e635' },
  { key: 'backend', title: '14. Infraestructura y backend', color: '#fb7185' },
  { key: 'checklist', title: '15. Checklist de cumplimiento', color: '#f9a8d4' },
  { key: 'roadmap', title: '16. Roadmap de implementación', color: '#67e8f9' },
];

export const tripStatusLabels = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  'oferta-activa': 'Activa',
  'en-curso': 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

export const universities = [
  { id: 'uniajc', name: 'UNIAJC', domain: '@uniajc.edu.co' },
  { id: 'univalle', name: 'Univalle', domain: '@correounivalle.edu.co' },
  { id: 'javeriana', name: 'Javeriana Cali', domain: '@javerianacali.edu.co' },
  { id: 'icesi', name: 'Icesi', domain: '@icesi.edu.co' }
];

export const adminUniversities = ['UNIAJC', 'Univalle', 'Javeriana Cali', 'Icesi'];

export const catalogTypes = [
  { value: 'campus', label: 'Sede' },
  { value: 'faculty', label: 'Facultad' },
  { value: 'program', label: 'Programa' },
  { value: 'period', label: 'Periodo académico' },
];

export const initialStudent = { name: '', email: '', career: '', semester: '', shift: '', neighborhood: '', transport: '', emergency: '', privacy: 'Zona aproximada' };

export const field = { padding: '12px 14px', borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', color: '#fff' };

export const insuranceStatusLabel = (status) => ({
  quote_requested: 'Cotización solicitada · pendiente de respuesta',
  quoted: 'Cotización recibida · pendiente de compra externa',
  pending_review: 'Póliza recibida · pendiente de validación',
  active: 'Activa · póliza verificada por administración',
  rejected: 'Rechazada · revisa la nota administrativa',
}[status] || status);

export const membershipPaymentStatusLabel = (status) => ({
  pending: 'pendiente de confirmación',
  approved: 'aprobada por sandbox',
  declined: 'rechazada por sandbox',
  voided: 'anulada por sandbox',
  error: 'error de sandbox',
}[status] || status);

export const formatInsurancePremium = (amount) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(amount);
