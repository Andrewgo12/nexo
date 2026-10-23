export function buildDashboardOverview({
  emailVerified,
  validEmail,
  emailDomain,
  routeMode,
  routeResult,
  routeSummary,
}) {
  return [
    {
      key: 'email',
      title: 'Correo institucional',
      value: emailVerified ? (validEmail ? 'Verificado' : 'Revisar dominio') : 'Pendiente',
      detail: validEmail
        ? `Dominio ${emailDomain} reconocido`
        : `Dominio esperado: ${emailDomain}`,
      tone: '#34d399',
    },
    {
      key: 'route',
      title: 'Ruta calculada',
      value: routeResult ? routeSummary.distance : 'Sin calcular',
      detail: routeResult
        ? `${routeSummary.duration} · ${routeResult.source || 'Proveedor externo'}`
        : 'La seguridad y disponibilidad de la ruta no se evalúan.',
      tone: '#60a5fa',
    },
    {
      key: 'transport',
      title: 'Modo seleccionado',
      value: routeMode || 'Sin seleccionar',
      detail: 'El perfil describe el modo solicitado; no confirma disponibilidad.',
      tone: '#a7f3d0',
    },
    {
      key: 'emergency',
      title: 'Alertas SOS',
      value: 'Registro en la app',
      detail: 'No se contacta automáticamente a autoridades ni servicios de emergencia.',
      tone: '#fca5a5',
    },
  ];
}
