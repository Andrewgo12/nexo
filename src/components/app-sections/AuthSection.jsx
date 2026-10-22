import Panel from '../Panel';
import { authFunctions } from '../../data/appSectionData';

export default function AuthSection({
  uni,
  universities,
  email,
  validEmail,
  student,
  privacy,
  authUser,
  field,
  passwordForm,
  onStudentChange,
  onTrustedContactConsentChange,
  onPrivacyChange,
  onSaveProfile,
  onProfilePhotoSelect,
  onProfilePhotoUpload,
  onPasswordChange,
  onChangePassword,
}) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: '#86efac', fontWeight: 800 }}>MÓDULO 1</div>
        <h2 style={{ margin: '10px 0 20px', fontSize: 34 }}>Autenticación y registro universitario</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}><span>Universidad</span><select value={uni.id} disabled style={field}>{universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}</select></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Correo institucional</span><input value={email} readOnly style={{ ...field, borderColor: validEmail ? 'rgba(52,211,153,.5)' : 'rgba(239,68,68,.55)' }} /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}><span>Nombre</span><input value={student.name} onChange={(event) => onStudentChange('name', event.target.value)} style={field} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Programa / facultad</span><input value={student.career} onChange={(event) => onStudentChange('career', event.target.value)} style={field} /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}><span>Semestre</span><input value={student.semester} onChange={(event) => onStudentChange('semester', event.target.value)} style={field} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Jornada</span><select value={student.shift} onChange={(event) => onStudentChange('shift', event.target.value)} style={field}><option>Mañana</option><option>Nocturna</option><option>Tarde</option></select></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Barrio</span><input value={student.neighborhood} onChange={(event) => onStudentChange('neighborhood', event.target.value)} style={field} /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}><span>Transporte habitual</span><input value={student.transport} onChange={(event) => onStudentChange('transport', event.target.value)} style={field} /></label>
          <label style={{ display: 'grid', gap: 8 }}><span>Contacto de confianza</span><input value={student.emergency} onChange={(event) => onStudentChange('emergency', event.target.value)} style={field} /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>Correo del contacto de confianza</span>
            <input type="email" autoComplete="email" value={student.trusted_contact_email || ''} onChange={(event) => onStudentChange('trusted_contact_email', event.target.value)} disabled={!student.trusted_contact_consent} style={field} placeholder="contacto@ejemplo.com" />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>Teléfono del contacto (formato internacional)</span>
            <input type="tel" autoComplete="tel" value={student.trusted_contact_phone || ''} onChange={(event) => onStudentChange('trusted_contact_phone', event.target.value)} disabled={!student.trusted_contact_consent} style={field} placeholder="+573001234567" />
          </label>
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
          <input type="checkbox" checked={Boolean(student.trusted_contact_consent)} onChange={(event) => onTrustedContactConsentChange(event.target.checked)} style={{ marginTop: 4 }} />
          Autorizo alertas SOS y de seguridad por correo, SMS y WhatsApp a este contacto. Puedo retirar el consentimiento en cualquier momento; no se enviarán mis coordenadas exactas por esos canales.
        </label>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: validEmail ? '#86efac' : '#fca5a5', fontWeight: 800 }}>Dominio requerido: {uni.domain}</div>
          <button type="button" onClick={onSaveProfile} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', borderRadius: 12, padding: '12px 18px', fontWeight: 800 }}>Guardar perfil</button>
        </div>
        <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 24, paddingTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Foto de perfil</h3>
          {authUser?.photo_url && <img src={authUser.photo_url} alt="Foto de perfil" width="80" height="80" style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input aria-label="Foto de perfil" type="file" accept="image/jpeg,image/png,image/webp" onChange={onProfilePhotoSelect} />
            <button type="button" onClick={onProfilePhotoUpload} style={{ ...field, cursor: 'pointer' }}>Subir foto</button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(148,163,184,.2)', marginTop: 24, paddingTop: 20 }}>
          <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <input aria-label="Contraseña actual" type="password" value={passwordForm.current_password} onChange={(event) => onPasswordChange('current_password', event.target.value)} style={field} placeholder="Contraseña actual" />
            <input aria-label="Nueva contraseña" type="password" value={passwordForm.password} onChange={(event) => onPasswordChange('password', event.target.value)} style={field} placeholder="Nueva contraseña (12+)" />
            <input aria-label="Confirmar nueva contraseña" type="password" value={passwordForm.password_confirmation} onChange={(event) => onPasswordChange('password_confirmation', event.target.value)} style={field} placeholder="Confirmar nueva contraseña" />
            <button type="button" onClick={onChangePassword} style={{ ...field, cursor: 'pointer' }}>Actualizar contraseña</button>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,.82)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#94a3b8', fontWeight: 800 }}>SEGURIDAD</div>
        <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          <Panel title="Validación institucional" value={validEmail ? 'Correo validado' : 'Pendiente'} color="#86efac" />
          <label style={{ display: 'grid', gap: 8 }}><span>Privacidad</span><select value={privacy} onChange={(event) => onPrivacyChange(event.target.value)} style={field}><option>Zona aproximada</option><option>Ubicación compartida</option><option>Privacidad máxima</option></select></label>
          <Panel title="Contacto de emergencia" value={student.emergency} color="#fbbf24" />
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>{authFunctions.map((item) => <span key={item} style={{ fontSize: 10, padding: '6px 8px', borderRadius: 999, background: 'rgba(148,163,184,.12)', color: '#dbeafe' }}>{item}</span>)}</div>
      </div>
    </section>
  );
}
