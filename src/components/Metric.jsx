export default function Metric({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(15,23,42,.7)', border: '1px solid rgba(148,163,184,.15)', borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ marginTop: 8, color, fontWeight: 800, fontSize: 24 }}>{value}</div>
    </div>
  );
}
