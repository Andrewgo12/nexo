import React, { useState } from 'react';
import { MessageSquare, X, Send, ShieldCheck, CheckCheck } from 'lucide-react';

export default function ActiveTripChat({ isOpen, onClose, trip, messages, onSendMessage, studentUser }) {
  const [inputVal, setInputVal] = useState('');

  if (!isOpen || !trip) return null;

  const quickReplies = [
    'Voy bajando del salón',
    'Llegué al punto de encuentro',
    '¿Traes casco adicional?',
    'Llegué bien a casa, ¡gracias!'
  ];

  const handleSend = (textToSend) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    onSendMessage({
      id: `msg-${Date.now()}`,
      sender: studentUser.name.split(' ')[0],
      senderRole: 'Pasajero',
      isMe: true,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    if (!textToSend) setInputVal('');
  };

  return (
    <div className="chat-drawer">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} style={{ color: 'var(--emerald-primary)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Chat de Trayecto Acompañado</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {trip.origin.name.split('(')[0]} ➔ {trip.destination.name}
            </div>
          </div>
        </div>

        <button className="btn-secondary" style={{ padding: '4px' }} onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`chat-bubble ${msg.isSystem ? 'system' : msg.isMe ? 'me' : 'other'}`}
          >
            {!msg.isSystem && (
              <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, marginBottom: '2px' }}>
                {msg.sender} ({msg.senderRole})
              </div>
            )}
            <div>{msg.text}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, textAlign: 'right', marginTop: '2px' }}>
              {msg.time}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Replies */}
      <div style={{ padding: '6px 12px', background: 'var(--bg-secondary)', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid var(--border-color)' }}>
        {quickReplies.map((qr, i) => (
          <button 
            key={i} 
            onClick={() => handleSend(qr)}
            style={{ padding: '4px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Input Row */}
      <div className="chat-input-row">
        <input
          type="text"
          placeholder="Escribe un mensaje al grupo..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
        />
        <button className="btn-primary" style={{ padding: '8px 12px' }} onClick={() => handleSend()}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
