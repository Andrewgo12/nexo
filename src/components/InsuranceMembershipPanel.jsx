import { memo } from 'react';

function InsuranceMembershipPanel({
  authUser,
  adminInsuranceEnrollments,
  downloadInsurancePolicy,
  field,
  formatInsurancePremium,
  insuranceAction,
  insuranceError,
  insuranceLoading,
  insuranceMonthlyBudget,
  insuranceProducts,
  insuranceStatusLabel,
  membershipInfo,
  membershipPaymentStatusLabel,
  moderateInsuranceEnrollment,
  myInsuranceEnrollments,
  openWompiMembershipCheckout,
  submitAdminInsuranceQuote,
  submitInsurancePolicyForm,
  submitInsuranceQuoteRequest,
}) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#5eead4', fontWeight: 800 }}>MÓDULO 9</div>
        <h2 style={{ margin: '10px 0 12px', fontSize: 34 }}>Cotización y registro manual de seguros</h2>
        <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.6 }}>
          No se confirmó una póliza integral ni un precio público que reúna salud, vida y hurto. Los productos son candidatos para cotizar; la prima debe ser de máximo {formatInsurancePremium(insuranceMonthlyBudget)} al mes. ViajaU no activa cobertura por solicitar una cotización ni por subir un documento: administración debe verificar la póliza.
        </p>
        {authUser?.role === 'student' && membershipInfo?.data && (
          <div style={{ marginBottom: 20, background: 'rgba(45,212,191,.06)', border: '1px solid rgba(45,212,191,.2)', borderRadius: 14, padding: 16 }}>
            <strong>Membresía de ViajaU</strong>
            <p style={{ color: '#cbd5e1', margin: '8px 0' }}>{membershipInfo.message}</p>
            <p style={{ color: '#cbd5e1', margin: 0 }}>
              {membershipInfo.data.status === 'free_trial'
                ? `Periodo gratuito: ${membershipInfo.data.trial_starts_at} a ${membershipInfo.data.trial_ends_at} (${membershipInfo.data.days_remaining} días restantes).`
                : `Periodo gratuito finalizado el ${membershipInfo.data.trial_ends_at}. Precio previsto: ${formatInsurancePremium(membershipInfo.data.monthly_price_cop)} / mes.`}
            </p>
            {membershipInfo.data.latest_sandbox_payment && (
              <p role="status" style={{ color: '#fbbf24', marginBottom: 0 }}>
                Última prueba sandbox: {membershipPaymentStatusLabel(membershipInfo.data.latest_sandbox_payment.status)}. No activa la membresía.
              </p>
            )}
            {membershipInfo.data.status === 'awaiting_payment_provider' && membershipInfo.data.wompi_sandbox_enabled && (
              <button
                type="button"
                disabled={insuranceAction === 'membership-checkout'}
                onClick={openWompiMembershipCheckout}
                style={{ ...field, marginTop: 12 }}
              >
                {insuranceAction === 'membership-checkout' ? 'Abriendo sandbox…' : 'Probar pago sandbox con Wompi · COP $9.000'}
              </button>
            )}
            {membershipInfo.data.status === 'awaiting_payment_provider' && !membershipInfo.data.wompi_sandbox_enabled && (
              <p style={{ color: '#94a3b8', marginBottom: 0 }}>Las pruebas de pago sandbox aún no tienen llaves configuradas. No se realizará ningún cobro.</p>
            )}
          </div>
        )}
        {insuranceError && <p role="alert" style={{ color: '#fca5a5' }}>{insuranceError}</p>}
        {insuranceLoading && <p role="status" style={{ color: '#cbd5e1' }}>Cargando información de seguros…</p>}

        {authUser?.role === 'student' && (
          <>
            <h3 style={{ margin: '24px 0 12px' }}>Productos candidatos · todos requieren cotización</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {insuranceProducts.map((product) => {
                const hasOpenRequest = myInsuranceEnrollments.some((item) => (
                  item.product_key === product.key
                  && ['quote_requested', 'quoted', 'pending_review', 'active'].includes(item.status)
                ));
                return (
                  <article key={product.key} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 16 }}>
                    <strong>{product.provider} · {product.name}</strong>
                    <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>{product.coverage_summary}</p>
                    <a href={product.source_url} target="_blank" rel="noreferrer" style={{ color: '#5eead4', fontSize: 13 }}>Ver información del proveedor</a>
                    <p style={{ color: '#fbbf24', fontSize: 13 }}>Precio: por cotizar · presupuesto máximo {formatInsurancePremium(product.monthly_budget_cop)} / mes · sin cobertura confirmada</p>
                    <button
                      type="button"
                      disabled={hasOpenRequest || insuranceAction === `quote-${product.key}`}
                      onClick={() => submitInsuranceQuoteRequest(product.key)}
                      style={field}
                    >
                      {hasOpenRequest ? 'Solicitud en curso' : insuranceAction === `quote-${product.key}` ? 'Enviando…' : 'Solicitar cotización'}
                    </button>
                  </article>
                );
              })}
            </div>

            <h3 style={{ margin: '28px 0 12px' }}>Mis solicitudes y pólizas</h3>
            {!myInsuranceEnrollments.length && !insuranceLoading && <p style={{ color: '#94a3b8' }}>Aún no tienes solicitudes de seguro.</p>}
            <div style={{ display: 'grid', gap: 12 }}>
              {myInsuranceEnrollments.map((enrollment) => (
                <article key={enrollment.id} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 16 }}>
                  <strong>{enrollment.provider} · {enrollment.product_name}</strong>
                  <p style={{ color: '#5eead4', margin: '8px 0' }}>Estado: {insuranceStatusLabel(enrollment.status)}</p>
                  {enrollment.monthly_premium_cop != null && (
                    <p>Prima cotizada: {formatInsurancePremium(enrollment.monthly_premium_cop)} / mes</p>
                  )}
                  {enrollment.coverage_summary && <p style={{ color: '#cbd5e1' }}>{enrollment.coverage_summary}</p>}
                  {enrollment.review_note && <p role="note" style={{ color: '#fbbf24' }}>Nota administrativa: {enrollment.review_note}</p>}
                  {enrollment.status === 'quoted' && enrollment.monthly_premium_cop <= insuranceMonthlyBudget && (
                    <form onSubmit={(event) => submitInsurancePolicyForm(event, enrollment.id)} style={{ display: 'grid', gap: 10, maxWidth: 560, marginTop: 14 }}>
                      <label style={{ display: 'grid', gap: 6 }}>Número de póliza
                        <input name="policy_number" required maxLength={120} style={field} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>Inicio de cobertura
                        <input name="coverage_starts_at" type="date" required style={field} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>Fin de cobertura
                        <input name="coverage_ends_at" type="date" required style={field} />
                      </label>
                      <label style={{ display: 'grid', gap: 6 }}>Documento PDF de la póliza (máx. 5 MB)
                        <input name="policy_document" type="file" accept="application/pdf,.pdf" required style={field} />
                      </label>
                      <button type="submit" disabled={insuranceAction === `policy-${enrollment.id}`} style={field}>
                        {insuranceAction === `policy-${enrollment.id}` ? 'Enviando…' : 'Enviar póliza para verificación'}
                      </button>
                    </form>
                  )}
                  {enrollment.status === 'quoted' && enrollment.monthly_premium_cop > insuranceMonthlyBudget && (
                    <p role="alert" style={{ color: '#fca5a5' }}>Esta cotización excede el presupuesto de {formatInsurancePremium(insuranceMonthlyBudget)}/mes y no puede registrarse como cobertura.</p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}

        {authUser?.role === 'admin' && (
          <>
            <h3 style={{ margin: '24px 0 12px' }}>Revisión administrativa</h3>
            {!adminInsuranceEnrollments.length && !insuranceLoading && <p style={{ color: '#94a3b8' }}>No hay solicitudes de seguro para revisar.</p>}
            <div style={{ display: 'grid', gap: 12 }}>
              {adminInsuranceEnrollments.map((enrollment) => (
                <article key={enrollment.id} style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, padding: 16 }}>
                  <strong>{enrollment.provider} · {enrollment.product_name}</strong>
                  <p style={{ color: '#cbd5e1' }}>Estudiante: {enrollment.user} · {enrollment.email}</p>
                  <p style={{ color: '#5eead4' }}>Estado: {insuranceStatusLabel(enrollment.status)}</p>
                  {enrollment.monthly_premium_cop != null && <p>Prima: {formatInsurancePremium(enrollment.monthly_premium_cop)} / mes</p>}
                  {enrollment.coverage_summary && <p>{enrollment.coverage_summary}</p>}
                  {enrollment.policy_number && <p>Póliza: {enrollment.policy_number} · Vigencia: {enrollment.coverage_starts_at} a {enrollment.coverage_ends_at}</p>}
                  {enrollment.review_note && <p role="note">Nota: {enrollment.review_note}</p>}
                  {enrollment.status === 'quote_requested' && (
                    <>
                      <form onSubmit={(event) => submitAdminInsuranceQuote(event, enrollment.id)} style={{ display: 'grid', gap: 10, maxWidth: 600 }}>
                        <label style={{ display: 'grid', gap: 6 }}>Prima mensual cotizada (COP)
                          <input name="monthly_premium_cop" type="number" min="1" max="1000000" required style={field} />
                        </label>
                        <label style={{ display: 'grid', gap: 6 }}>Coberturas y condiciones confirmadas por el proveedor
                          <textarea name="coverage_summary" minLength={10} maxLength={2000} required style={{ ...field, minHeight: 90 }} />
                        </label>
                        <button type="submit" disabled={insuranceAction === `admin-${enrollment.id}`} style={field}>Registrar cotización verificada</button>
                      </form>
                      <button type="button" disabled={insuranceAction === `admin-${enrollment.id}`} onClick={() => moderateInsuranceEnrollment(enrollment.id, 'rejected')} style={{ ...field, marginTop: 8 }}>Rechazar solicitud con motivo</button>
                    </>
                  )}
                  {enrollment.status === 'quoted' && (
                    <button type="button" disabled={insuranceAction === `admin-${enrollment.id}`} onClick={() => moderateInsuranceEnrollment(enrollment.id, 'rejected')} style={{ ...field, marginTop: 8 }}>Rechazar cotización con motivo</button>
                  )}
                  {enrollment.status === 'pending_review' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {enrollment.has_policy_document && <button type="button" disabled={insuranceAction === `download-${enrollment.id}`} onClick={() => downloadInsurancePolicy(enrollment.id)} style={field}>Descargar póliza</button>}
                      <button type="button" disabled={insuranceAction === `admin-${enrollment.id}`} onClick={() => moderateInsuranceEnrollment(enrollment.id, 'active')} style={field}>Validar y activar póliza</button>
                      <button type="button" disabled={insuranceAction === `admin-${enrollment.id}`} onClick={() => moderateInsuranceEnrollment(enrollment.id, 'rejected')} style={field}>Rechazar con motivo</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
        {!['student', 'admin'].includes(authUser?.role) && (
          <p role="status" style={{ color: '#fbbf24' }}>Inicia sesión como estudiante verificado o administrador para usar este flujo.</p>
        )}
      </div>
    </section>
  );
}

export default memo(InsuranceMembershipPanel);
