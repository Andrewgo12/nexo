import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  GraduationCap, 
  CheckCircle2, 
  Upload, 
  Lock, 
  Sparkles,
  QrCode
} from 'lucide-react';
import { UNIVERSITIES } from '../data/mockData';

export default function InstitutionalVerificationModal({ 
  isOpen, 
  onClose, 
  studentUser, 
  onVerificationComplete 
}) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1);
  const [eduEmail, setEduEmail] = useState(studentUser.email || 'kgonzalez@uniajc.edu.co');
  const [carnetFile, setCarnetFile] = useState(null);
  const [carnetPreview, setCarnetPreview] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSimulateSendCode = (e) => {
    e.preventDefault();
    if (!eduEmail.includes('.edu.co')) {
      alert('Por favor ingresa un correo con terminación .edu.co (ej: @uniajc.edu.co o @correounivalle.edu.co)');
      return;
    }
    setStep(2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCarnetFile(file);
      setCarnetPreview(URL.createObjectURL(file));
    }
  };

  const handleCompleteVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setSuccess(true);
      setTimeout(() => {
        onVerificationComplete && onVerificationComplete({
          ...studentUser,
          verifiedEmail: true,
          verifiedCarnet: true,
          trustLevel: 3
        });
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--emerald-primary)', color: 'white', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="modal-title">Verificación Institucional de Confianza</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Exclusivo para la comunidad universitaria de Cali con carnet vigente
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {success ? (
            <div style={{ padding: '30px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: 'var(--emerald-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={40} />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>¡Identidad Verificada con Éxito!</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '360px' }}>
                Tu cuenta cuenta ahora con la insignia de confianza <strong>Nivel 3: Carnet Validado</strong> para viajar en comunidad.
              </p>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleSimulateSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GraduationCap size={28} style={{ color: 'var(--emerald-primary)' }} />
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Paso 1: Validación de Correo Universitario</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Verificamos el dominio oficial de tu institución (.edu.co) para garantizar que solo estudiantes activos compartan viaje.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Correo electrónico institucional:
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="form-input" 
                    style={{ paddingLeft: '38px', fontSize: '0.88rem' }}
                    value={eduEmail}
                    onChange={(e) => setEduEmail(e.target.value)}
                    required
                    placeholder="tucorreo@uniajc.edu.co"
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Formatos válidos: @uniajc.edu.co, @correounivalle.edu.co, @javerianacali.edu.co, @icesi.edu.co, @usc.edu.co
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ minWidth: '150px', justifyContent: 'center' }}>
                  Continuar al Paso 2
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <QrCode size={28} style={{ color: 'var(--sapphire-primary)' }} />
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Paso 2: Validación de Carnet Estudiantil</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Adjunta una fotografía clara de tu carnet físico o captura del carnet digital en la app institucional.
                  </p>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div style={{ 
                border: '2px dashed var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: '24px', 
                textAlign: 'center', 
                background: 'var(--bg-secondary)',
                position: 'relative',
                cursor: 'pointer'
              }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                {carnetPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={carnetPreview} 
                      alt="Carnet preview" 
                      style={{ maxHeight: '140px', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--emerald-primary)', fontWeight: 600 }}>
                      ✓ Carnet cargado con éxito. Haz clic para cambiarlo.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Upload size={32} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Haz clic o arrastra aquí tu Carnet</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PNG, JPG o PDF hasta 5MB</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Código de Verificación enviado a {eduEmail}:
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ingresa código (ej: 841029)"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  style={{ fontSize: '0.88rem', letterSpacing: '2px', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Volver</button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleCompleteVerification}
                  disabled={isVerifying}
                  style={{ minWidth: '160px', justifyContent: 'center' }}
                >
                  {isVerifying ? 'Validando...' : 'Finalizar Verificación'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
