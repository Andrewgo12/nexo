export default function Panel({ title, value, color }) {
  return (
    <div style={{ background: 'rgba(15,23,42,.8)', border: '1px solid rgba(148,163,184,.2)', borderRadius: 14, padding: 16 }}>
      <div style={{ color, fontWeight: 800, marginBottom: 4 }}>{title}</div>
      <div style={{ color: '#dbeafe' }}>{value}</div>
    </div>
  );
}
