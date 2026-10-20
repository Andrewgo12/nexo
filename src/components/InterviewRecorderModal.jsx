import React, { useState } from 'react';
import { 
  X, 
  Mic, 
  Video, 
  HelpCircle, 
  CheckCircle2, 
  Download, 
  Copy, 
  Sparkles, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { INTERVIEW_QUESTIONS } from '../data/mockData';

export default function InterviewRecorderModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [studentName, setStudentName] = useState('');
  const [university, setUniversity] = useState('UNIAJC');
  const [transportMode, setTransportMode] = useState('Transporte Público MIO');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [copied, setCopied] = useState(false);

  // Five Whys state for Question #8
  const [whys, setWhys] = useState({
    w1: '',
    w2: '',
    w3: '',
    w4: '',
    rootCause: ''
  });

  const handleAnswerChange = (text) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: text
    }));
  };

  const handleExportJSON = () => {
    const interviewData = {
      project: 'ViajaU - Validación de Idea de Negocio',
      course: 'Saber 1 Innovación y Emprendimiento Grupo 841A',
      studentInterviewed: studentName || 'Estudiante Anónimo',
      university,
      transportMode,
      date: new Date().toLocaleDateString('es-CO'),
      answers,
      fiveWhysRootCauseAnalysis: whys
    };

    const blob = new Blob([JSON.stringify(interviewData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Entrevista_ViajaU_${(studentName || 'Estudiante').replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const handleCopySummary = () => {
    const summaryText = `
ENTREVISTA DE CAMPO VIAJAU - ANEXO A
Estudiante: ${studentName || 'Anónimo'} (${university})
Modo de transporte habitual: ${transportMode}
Fecha: ${new Date().toLocaleDateString('es-CO')}

RESPUESTAS DESTACADAS:
Q1 Permiso grabación: ${answers[0] || 'Sí'}
Q4 Última mala experiencia: ${answers[3] || 'Sin respuesta'}
Q5 Nivel de seguridad (1-5): ${answers[4] || '2/5'}
Q6 Uso de cupos/WhatsApp: ${answers[5] || 'Sin respuesta'}
Q10 Usaría la app ViajaU: ${answers[9] || 'Sí'}
Q12 Pagaría micro-seguro AXA ($2.000-$5.000): ${answers[11] || 'Sí'}

ANÁLISIS DE LOS 5 PORQUÉS (CAUSA RAÍZ):
1. ${whys.w1 || 'N/A'}
2. ${whys.w2 || 'N/A'}
3. ${whys.w3 || 'N/A'}
4. ${whys.w4 || 'N/A'}
Causa Raíz: ${whys.rootCause || 'N/A'}
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const q = INTERVIEW_QUESTIONS[currentQuestionIndex];

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--purple-primary)', color: 'white', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
              <Video size={18} />
            </div>
            <div>
              <h3 className="modal-title">Guion de Entrevista en Video (Anexo A)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Instrumento cualitativo para validar H3 (Cupos WhatsApp) y H4 (Micro-seguro AXA)
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Respondent Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nombre del Entrevistado:</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej: Laura Martínez"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                style={{ fontSize: '0.8rem', height: '34px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Universidad:</label>
              <select 
                className="form-select" 
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                style={{ fontSize: '0.8rem', height: '34px' }}
              >
                <option value="UNIAJC">UNIAJC</option>
                <option value="Univalle">Universidad del Valle</option>
                <option value="USC">Univ. Santiago de Cali</option>
                <option value="Javeriana">Javeriana Cali</option>
                <option value="Icesi">Universidad Icesi</option>
                <option value="San Buenaventura">USB Cali</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Modo habitual:</label>
              <select 
                className="form-select" 
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                style={{ fontSize: '0.8rem', height: '34px' }}
              >
                <option value="MIO">Transporte MIO</option>
                <option value="Carro">Carro propio</option>
                <option value="Moto">Moto</option>
                <option value="Caminata">A pie / Parche</option>
                <option value="Bici">Bicicleta</option>
                <option value="Intermunicipal">Intermunicipal Terminal</option>
              </select>
            </div>
          </div>

          {/* Stepper Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span>Pregunta <strong>{currentQuestionIndex + 1}</strong> de <strong>{INTERVIEW_QUESTIONS.length}</strong></span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {INTERVIEW_QUESTIONS.map((_, i) => (
                <div 
                  key={i} 
                  onClick={() => setCurrentQuestionIndex(i)}
                  style={{
                    width: '16px',
                    height: '6px',
                    borderRadius: '2px',
                    background: i === currentQuestionIndex ? 'var(--emerald-primary)' : answers[i] ? 'var(--sapphire-primary)' : 'var(--bg-tertiary)',
                    cursor: 'pointer'
                  }}
                  title={`Pregunta ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Question Box */}
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--emerald-primary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Pregunta #{q.id}
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {q.text}
            </h4>

            {/* Special 5 Whys interactive sub-tool for Question #8 */}
            {q.id === 8 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--amber-primary)' }}>
                  Herramienta de Causa Raíz (Sakichi Toyoda / Taiichi Ohno):
                </span>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Por qué 1: ¿Por qué debe regresar solo(a) a esa hora?"
                  value={whys.w1}
                  onChange={(e) => setWhys({ ...whys, w1: e.target.value })}
                  style={{ fontSize: '0.8rem' }}
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Por qué 2: ¿Por qué ocurre la razón anterior?"
                  value={whys.w2}
                  onChange={(e) => setWhys({ ...whys, w2: e.target.value })}
                  style={{ fontSize: '0.8rem' }}
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Por qué 3: ¿Por qué no se ha resuelto hasta ahora?"
                  value={whys.w3}
                  onChange={(e) => setWhys({ ...whys, w3: e.target.value })}
                  style={{ fontSize: '0.8rem' }}
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Por qué 4: ¿Por qué no usa cupos informales o WhatsApp?"
                  value={whys.w4}
                  onChange={(e) => setWhys({ ...whys, w4: e.target.value })}
                  style={{ fontSize: '0.8rem' }}
                />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Por qué 5 (CAUSA RAÍZ): ¿Cuál es la razón de fondo?"
                  value={whys.rootCause}
                  onChange={(e) => setWhys({ ...whys, rootCause: e.target.value })}
                  style={{ fontSize: '0.8rem', border: '1px solid var(--emerald-primary)', fontWeight: 700 }}
                />
              </div>
            ) : (
              <textarea 
                className="form-textarea" 
                rows={3}
                placeholder="Anota aquí la respuesta y comentarios del estudiante durante la entrevista..."
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            )}
          </div>

          {/* Navigation & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button 
              className="btn-secondary" 
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              style={{ fontSize: '0.82rem' }}
            >
              Anterior
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-secondary" 
                onClick={handleCopySummary}
                style={{ fontSize: '0.82rem' }}
                title="Copiar resumen al portapapeles"
              >
                {copied ? <CheckCircle2 size={15} style={{ color: 'var(--emerald-primary)' }} /> : <Copy size={15} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>

              <button 
                className="btn-secondary" 
                onClick={handleExportJSON}
                style={{ fontSize: '0.82rem' }}
                title="Exportar archivo JSON"
              >
                <Download size={15} />
                <span>Exportar JSON</span>
              </button>

              <button 
                className="btn-primary" 
                disabled={currentQuestionIndex === INTERVIEW_QUESTIONS.length - 1}
                onClick={() => setCurrentQuestionIndex(prev => Math.min(INTERVIEW_QUESTIONS.length - 1, prev + 1))}
                style={{ fontSize: '0.82rem' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
