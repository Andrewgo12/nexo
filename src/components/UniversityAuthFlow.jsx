import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

const defaultForm = {
  name: 'Kevin González',
  email: 'kevin.gonzalez@uniajc.edu.co',
  password: 'Segura2026!',
  career: 'Ingeniería de Sistemas',
  semester: '8vo Semestre',
  neighborhood: 'el-caney',
  shift: 'Nocturna',
  emergencyName: 'María González',
  emergencyPhone: '+57 300 123 4567',
};

export default function UniversityAuthFlow({ universities, currentUser, activeUniversity, onComplete }) {
  const [mode, setMode] = useState('register');
  const [selectedUniversityId, setSelectedUniversityId] = useState(activeUniversity?.id ?? universities[0].id);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedUniversity = useMemo(
    () => universities.find((u) => u.id === selectedUniversityId) ?? universities[0],
    [selectedUniversityId, universities],
  );

  const isInstitutionalEmailValid = (emailValue) => {
    const trimmed = emailValue.trim().toLowerCase();
    const domain = selectedUniversity?.domain?.toLowerCase();
    return Boolean(trimmed && domain && trimmed.endsWith(domain));
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Completa nombre, correo institucional y contraseña para continuar.');
      return;
    }

    if (!isInstitutionalEmailValid(form.email)) {
      setError(`El correo debe pertenecer a ${selectedUniversity.domain}.`);
      return;
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    const profile = {
      ...currentUser,
      name: form.name,
      email: form.email,
      universityName: selectedUniversity.shortName,
      universityDomain: selectedUniversity.domain,
      career: form.career || currentUser.career,
      semester: form.semester || currentUser.semester,
      neighborhoodId: form.neighborhood || currentUser.neighborhoodId,
      shiftPreference: form.shift || currentUser.shiftPreference,
      emergencyContact: {
        ...currentUser.emergencyContact,
        name: form.emergencyName || currentUser.emergencyContact.name,
        phone: form.emergencyPhone || currentUser.emergencyContact.phone,
      },
      trustLevel: 3,
      verifiedEmail: true,
      verifiedInstitutional: true,
      privacyMode: 'zona-aproximada',
      notificationsEnabled: true,
      activeRole: 'Pasajero / Conductor',
    };

    setSuccessMessage('Registro validado y perfil universitario creado con éxito.');
    onComplete({ student: profile, university: selectedUniversity });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '36px 18px', background: 'radial-gradient(circle at top, rgba(16,185,129,0.12), transparent 30%), #06141a' }}>
      <div style={{ width: '100%', maxWidth: '1180px', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '24px' }}>
        <div style={{ background: 'rgba(10,15,20,0.9)', border: '1px solid rgba(148,163,184,0.22)', borderRadius: '24px', padding: '28px', boxShadow: '0 25px 55px rgba(15, 118, 110, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'grid', placeItems: 'center', color: 'white' }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: 700 }}>ViajaU</div>
              <h1 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>Acceso universitario</h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', background: 'rgba(15,23,42,0.75)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(148,163,184,0.2)', marginBottom: '22px', width: 'fit-content' }}>
            <button type="button" onClick={() => setMode('login')} style={{ background: mode === 'login' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 16px', fontWeight: 700, cursor: 'pointer' }}>
              Iniciar sesión
            </button>
            <button type="button" onClick={() => setMode('register')} style={{ background: mode === 'register' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 16px', fontWeight: 700, cursor: 'pointer' }}>
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Universidad</label>
                <select
                  value={selectedUniversityId}
                  onChange={(event) => setSelectedUniversityId(event.target.value)}
                  style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px' }}
                >
                  {universities.map((university) => (
                    <option key={university.id} value={university.id}>{university.shortName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Nombre completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  placeholder="Ej: Ana López"
                  style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Correo institucional</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: '#94a3b8' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  placeholder={selectedUniversity.domain.replace('@', '')}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px 12px 42px' }}
                />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} />
                Dominio requerido: {selectedUniversity.domain}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Contraseña</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px' }}
                />
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Programa / Carrera</label>
                <input
                  type="text"
                  value={form.career}
                  onChange={(event) => handleChange('career', event.target.value)}
                  style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Semestre</label>
                <input
                  type="text"
                  value={form.semester}
                  onChange={(event) => handleChange('semester', event.target.value)}
                  style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px' }}
                />
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Jornada académica</label>
                <select
                  value={form.shift}
                  onChange={(event) => handleChange('shift', event.target.value)}
                  style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px' }}
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Nocturna">Nocturna</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Barrio / zona residencial</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={form.neighborhood}
                    onChange={(event) => handleChange('neighborhood', event.target.value)}
                    placeholder="Ej: El Caney"
                    style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px 12px 42px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Contacto de confianza</label>
                <input
                  type="text"
                  value={form.emergencyName}
                  onChange={(event) => handleChange('emergencyName', event.target.value)}
                  style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ color: '#dbeafe', fontSize: '0.82rem', fontWeight: 700 }}>Teléfono de emergencia</label>
              <input
                type="tel"
                value={form.emergencyPhone}
                onChange={(event) => handleChange('emergencyPhone', event.target.value)}
                style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.35)', color: 'white', borderRadius: '12px', padding: '12px 14px' }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', borderRadius: '12px', padding: '10px 12px', fontSize: '0.82rem' }}>
                {error}
              </div>
            )}

            {successMessage && (
              <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#a7f3d0', borderRadius: '12px', padding: '10px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} /> {successMessage}
              </div>
            )}

            <button type="submit" style={{ border: 'none', background: 'linear-gradient(135deg, #10b981, #057a55)', color: 'white', borderRadius: '14px', padding: '14px 18px', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 15px 35px rgba(16,185,129,0.3)' }}>
              {mode === 'login' ? 'Entrar a mi perfil' : 'Crear perfil universitario'}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <div style={{ display: 'grid', gap: '18px' }}>
          <div style={{ background: 'rgba(11,17,22,0.9)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '24px', padding: '26px' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a7f3d0', fontWeight: 800, marginBottom: '12px' }}>Requisitos del módulo 1</div>
            <div style={{ display: 'grid', gap: '14px' }}>
              {[
                'Registro de estudiante con validación de correo institucional',
                'Verificación de universidad, facultad y programa academico',
                'Perfil con barrio, horario, documento y contacto de confianza',
                'Preferencias y seguridad para viajes compartidos',
                'Privacidad por zona y control de ubicación exacta',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dbeafe', fontSize: '0.93rem' }}>
                  <CheckCircle2 size={17} style={{ color: '#34d399' }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, rgba(14,116,144,0.18), rgba(6,78,59,0.22))', border: '1px solid rgba(94,234,212,0.25)', borderRadius: '24px', padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <ShieldCheck size={18} style={{ color: '#67e8f9' }} />
              <strong style={{ color: 'white', fontSize: '1rem' }}>Estado de seguridad</strong>
            </div>
            <div style={{ display: 'grid', gap: '10px', color: '#dbeafe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Validación institucional</span>
                <span style={{ color: '#86efac', fontWeight: 800 }}>Activo</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Privacidad zonal</span>
                <span style={{ color: '#86efac', fontWeight: 800 }}>Protegida</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Contacto de emergencia</span>
                <span style={{ color: '#86efac', fontWeight: 800 }}>Registrado</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(11,17,22,0.9)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '24px', padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <User size={18} style={{ color: '#c4b5fd' }} />
              <strong style={{ color: 'white' }}>Perfil posible del estudiante</strong>
            </div>
            <div style={{ display: 'grid', gap: '10px', color: '#dbeafe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} style={{ color: '#c4b5fd' }} /> {selectedUniversity.shortName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={16} style={{ color: '#c4b5fd' }} /> Privacidad por barrio</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={16} style={{ color: '#c4b5fd' }} /> Registro con confianza</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
