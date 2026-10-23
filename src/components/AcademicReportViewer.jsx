import React, { useState } from 'react';
import { 
  FileText, 
  BarChart3, 
  GitFork, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  GraduationCap, 
  Sparkles,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { 
  REPORT_SURVEY_DATA, 
  ISHIKAWA_DATA, 
  PROBLEM_TREE_DATA, 
  JOBS_TO_BE_DONE_DATA, 
  HYPOTHESES_DATA 
} from '../data/mockData';

export default function AcademicReportViewer({ onOpenInterviewRecorder }) {
  const [activeReportTab, setActiveReportTab] = useState('charts'); // 'charts', 'ishikawa', 'tree', 'jobs', 'hypotheses', 'full-text'
  const [selectedFigureIndex, setSelectedFigureIndex] = useState(0);
  const [selectedIshikawaCategory, setSelectedIshikawaCategory] = useState(null);

  const figures = REPORT_SURVEY_DATA.figures;
  const currentFig = figures[selectedFigureIndex];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Document Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(59,130,246,0.12) 100%)', 
        border: '1px solid var(--border-highlight)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-md)', background: 'var(--emerald-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}>
            <GraduationCap size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-emerald">UNIAJC • Grupo 841A</span>
              <span className="badge badge-sapphire">Saber 1 — Innovación y Emprendimiento</span>
              <span className="badge badge-amber">Cali, 2026</span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
              ViajaU: Modelo de Movilidad Segura por Zonas y Jornadas Universitarias en Cali
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Autores: <strong>Kevin Andrés González Dinas</strong> • <strong>Claudia Vanessa Aranda Arad</strong> • <strong>Ana María Vélez Córdoba</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={onOpenInterviewRecorder}
            style={{ fontSize: '0.82rem' }}
          >
            <BookOpen size={15} />
            <span>Guion de Campo (Anexo A)</span>
          </button>

          <button 
            className="btn-primary" 
            onClick={handlePrint}
            style={{ fontSize: '0.82rem' }}
          >
            <Printer size={15} />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', overflowX: 'auto' }}>
        {[
          { id: 'charts', label: '1. Gráficos de Encuesta (Fig 1-6)', icon: <BarChart3 size={15} /> },
          { id: 'hypotheses', label: '2. Validación de Hipótesis (H1-H4)', icon: <CheckCircle2 size={15} /> },
          { id: 'ishikawa', label: '3. Diagrama de Ishikawa', icon: <GitFork size={15} /> },
          { id: 'tree', label: '4. Árbol de Problemas', icon: <Target size={15} /> },
          { id: 'jobs', label: '5. Jobs To Be Done', icon: <Sparkles size={15} /> },
          { id: 'full-text', label: '6. Documento Académico Completo', icon: <FileText size={15} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              background: activeReportTab === tab.id ? 'var(--emerald-primary)' : 'var(--bg-tertiary)',
              color: activeReportTab === tab.id ? 'white' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              border: activeReportTab === tab.id ? '1px solid var(--emerald-primary)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition)'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: SURVEY CHARTS (FIGURES 1 TO 6) */}
      {activeReportTab === 'charts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Selector pills for Fig 1 to 6 */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {figures.map((fig, idx) => (
              <button
                key={fig.id}
                onClick={() => setSelectedFigureIndex(idx)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedFigureIndex === idx ? 'var(--bg-card-hover)' : 'var(--bg-secondary)',
                  border: selectedFigureIndex === idx ? '2px solid var(--emerald-primary)' : '1px solid var(--border-color)',
                  color: selectedFigureIndex === idx ? 'var(--emerald-primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Figura {idx + 1}
              </button>
            ))}
          </div>

          {/* Active Figure Card */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentFig.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {currentFig.description}
                </p>
              </div>
              <span className="badge badge-emerald">Muestra: 33 Estudiantes Universitarios en Cali</span>
            </div>

            {/* Insight Callout */}
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--emerald-primary)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} style={{ color: 'var(--emerald-primary)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <strong>Hallazgo Clave:</strong> {currentFig.keyInsight}
              </div>
            </div>

            {/* Interactive Data Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              {currentFig.data.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.count} respuestas)</span>
                      <strong style={{ color: item.color, fontSize: '0.95rem' }}>{item.value.toFixed(1)}%</strong>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div style={{ width: '100%', height: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${item.value}%`, 
                        height: '100%', 
                        background: item.color, 
                        borderRadius: 'var(--radius-full)', 
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Figure Footnote */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Fuente: Formulario estructurado aplicado en campo por Kevin González, Ana Vélez y Claudia Aranda (UNIAJC, 2026).</span>
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSdd47m39LAp3JKl-KlQHszNMfKOZ6YnyXh8-z8qw2NiISx5ZQ/viewform" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'var(--sapphire-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Ver Formulario Original</span> <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HYPOTHESES VALIDATION (H1 TO H4) */}
      {activeReportTab === 'hypotheses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Conclusión General del Equipo UNIAJC: Hipótesis Parcialmente Validada</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              El problema se confirma con fuerza contundente (H1 y H2 validadas con 87.9% de afectación y 81.8% de intención de uso). La disposición a pagar por el seguro formal de trayecto (H4) y las limitaciones de los cupos informales (H3) se profundizan mediante el instrumento de entrevista semiestructurada del Anexo A.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {HYPOTHESES_DATA.map(h => (
              <div 
                key={h.id} 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '18px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{h.title}</h4>
                  <span className={`badge ${h.statusBadge}`}>{h.status}</span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontStyle: 'italic', background: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  "{h.statement}"
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Evidencia Recogida:</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {h.evidence}
                  </p>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Nivel de Confianza:</span>
                  <strong style={{ color: h.validationScore > 80 ? 'var(--emerald-primary)' : 'var(--amber-primary)' }}>
                    {h.validationScore}%
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ISHIKAWA FISHBONE DIAGRAM */}
      {activeReportTab === 'ishikawa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--amber-primary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Herramienta de Calidad • Kaoru Ishikawa (1960)
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              Diagrama de Espina de Pescado: Diagnóstico de Causas de Raíz
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <strong>Problema Central Analizado:</strong> {ISHIKAWA_DATA.problem}
            </p>
          </div>

          {/* Interactive Fishbone Categories */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {ISHIKAWA_DATA.categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => setSelectedIshikawaCategory(selectedIshikawaCategory === cat.id ? null : cat.id)}
                style={{ 
                  background: selectedIshikawaCategory === cat.id ? 'var(--bg-card-hover)' : 'var(--bg-tertiary)', 
                  border: selectedIshikawaCategory === cat.id ? '2px solid var(--emerald-primary)' : '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '16px', 
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--emerald-primary)' }}>
                    {cat.name}
                  </h4>
                  <span className="badge badge-sapphire">{cat.causes.length} Causas</span>
                </div>

                <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cat.causes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROBLEM TREE */}
      {activeReportTab === 'tree' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Effects (Branches) */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--rose-primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} /> Consecuencias y Efectos Observables
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {PROBLEM_TREE_DATA.effects.map(eff => (
                <div key={eff.id} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--rose-primary)', fontWeight: 800 }}>{eff.tag}</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{eff.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Central Trunk */}
          <div style={{ background: 'var(--bg-secondary)', border: '2px solid var(--emerald-primary)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', boxShadow: '0 4px 20px rgba(16,185,129,0.2)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--emerald-primary)', fontWeight: 800, textTransform: 'uppercase' }}>Tronco Principal • Problema Central</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {PROBLEM_TREE_DATA.centralProblem}
            </h3>
          </div>

          {/* Causes (Roots) */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={15} /> Causas Raíz Donde Interviene ViajaU
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {PROBLEM_TREE_DATA.causes.map(cause => (
                <div key={cause.id} style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800 }}>{cause.tag}</span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{cause.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: JOBS TO BE DONE */}
      {activeReportTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--emerald-primary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Marco de Clayton Christensen (Harvard Business School)
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>Declaración Central del Job-To-Be-Done</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{JOBS_TO_BE_DONE_DATA.coreJob}"
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {JOBS_TO_BE_DONE_DATA.dimensions.map((dim, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: 'var(--bg-tertiary)', 
                  border: `1px solid ${dim.color}40`, 
                  borderRadius: 'var(--radius-md)', 
                  padding: '18px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${dim.color}20`, color: dim.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: dim.color }}>{dim.dimension}</h4>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {dim.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: FULL TEXT DOCUMENT READER */}
      {activeReportTab === 'full-text' && (
        <div style={{ background: 'var(--bg-secondary)', padding: '28px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '600px', overflowY: 'auto' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--emerald-primary)', fontWeight: 800 }}>INFORME COMPLETO DE INVESTIGACIÓN</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '4px' }}>ViajaU: Modelo de Movilidad Segura por Zonas y Jornadas para Estudiantes Universitarios en Cali</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Kevin Andrés González Dinas, Claudia Vanessa Aranda Arad, Ana María Vélez Córdoba — UNIAJC 2026
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>1. Resumen</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
              ViajaU es una aplicación de car-pooling y coordinación de viajes en grupo pensada para estudiantes universitarios de Cali. La idea agrupa a los estudiantes por zona de residencia, ruta de transporte público y jornada académica, con un objetivo puntual: que nadie tenga que volver solo a su casa después de clase, especialmente en la jornada nocturna. El registro se valida con el correo institucional; a partir del barrio que el estudiante declara, el sistema cruza esa ubicación con las rutas del Sistema Integrado de Transporte Masivo (MIO) y agrupa por franja horaria, generando puntos de encuentro y una función de ubicación compartida durante el trayecto.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>2. Evidencia de Mercado en Cali</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
              El sistema MIO de Cali viene perdiendo pasajeros de forma sostenida: pasó de un promedio de 450,000 pasajeros por día hábil en noviembre de 2019 a 289,000 en noviembre de 2023, una caída del 36%. En la Universidad Santiago de Cali, los estudiantes ya resuelven este problema por su cuenta mediante los llamados "cupos" por WhatsApp. Además, existe un flujo importante de estudiantes que conectan con la Terminal de Transportes de Cali para tomar buses intermunicipales hacia Palmira, Buga, Yumbo y Jamundí.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>3. Infraestructura de Datos Abiertos</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
              El módulo combina la red vial de OpenStreetMap y rutas OSRM configurables con la capa pública de Metro Cali para consultar paradas y trazados del MIO. La capa revisada no confirma calendarios activos; por eso la app no presenta horarios ni frecuencias como vigentes. OSRM puede autoalojarse con un extracto OSM, sujeto a recursos locales y a la atribución de OpenStreetMap (ODbL).
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>4. Referencias Seleccionadas (APA 7)</h3>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '16px' }}>
              <li>BlaBlaCar and AXA. (s.f.). BlaBlaCar and AXA launch first-of-its-kind ridesharing insurance product.</li>
              <li>Blank, S. (s.f.). Customer development. steveblank.com.</li>
              <li>Christensen, C. M., Hall, T., Dillon, K., & Duncan, D. S. (2016). Know your customers' "jobs to be done." Harvard Business Review.</li>
              <li>Centro de Investigación en Sostenibilidad Urbana (SUR), Universidad de los Andes. (2024). Decision-making in open carpooling programs. Travel Behaviour and Society.</li>
              <li>Metro Cali. (2025). GTFS oficial del Sistema Masivo Integrado de Occidente (MIO).</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
