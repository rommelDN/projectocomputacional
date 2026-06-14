import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import RoomJoin from '../RoomJoin/RoomJoin';
import './Chat.scss';

function formatTime(iso) {
  const d = new Date(iso);
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

function CipherBadge({ ciphers }) {
  const preview = ciphers.slice(0,4).join(', ') + (ciphers.length > 4 ? ', …' : '');
  return <div className="chat-page__cipher">C = [{preview}]</div>;
}

function StepCard({ step, index }) {
  const [open, setOpen] = useState(false);
  const typeClass = { encrypt: 'enc', decrypt: 'dec' }[step.type] || 'enc';
  const typeBadge = { encrypt: 'ENCRYPT', decrypt: 'DECRYPT' }[step.type] || step.type.toUpperCase();

  return (
    <div className={`chat-page__step chat-page__step--${typeClass} ${open ? 'chat-page__step--open' : ''}`}>
      <div className="chat-page__step-header" onClick={() => setOpen(o => !o)}>
        <span className="chat-page__step-num">#{index}</span>
        <span className="chat-page__step-title">{step.title}</span>
        <span className={`chat-page__step-badge chat-page__step-badge--${typeClass}`}>{typeBadge}</span>
        <span className="chat-page__step-chevron">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="chat-page__step-body">
          {step.rows.map((row, i) => (
            <div key={i} className="chat-page__step-row">
              <span className="chat-page__step-key">{row.key}</span>
              <span className={`chat-page__step-val ${row.cls ? `chat-page__step-val--${row.cls}` : ''}`}>
                {row.val}
              </span>
            </div>
          ))}
          <div className="chat-page__step-formula">{step.formula}</div>
        </div>
      )}
    </div>
  );
}

function buildSteps(msg, stepOffset) {
  const cipherPreview = '[' + msg.ciphers.slice(0,4).join(', ') + (msg.ciphers.length > 4 ? ', …]' : ']');
  const encRows = [
    { key: 'Mensaje (M)',  val: `"${msg.text}"`,        cls: ''       },
    { key: 'Fórmula',      val: msg.encFormula,          cls: 'cyan'   },
    ...msg.encSteps.map(s => ({
      key: `'${s.char}' → ${s.code}`,
      val: `${s.code}^e mod n = ${s.cipher}`,
      cls: 'violet',
    })),
    { key: 'Cifrado',      val: cipherPreview,           cls: 'cyan'   },
  ];
  const decRows = [
    { key: 'Cifrado (C)',  val: cipherPreview,           cls: 'cyan'   },
    { key: 'Fórmula',      val: msg.decFormula,          cls: 'green'  },
    ...msg.decSteps.map(s => ({
      key: `${s.cipher} → ${s.char}`,
      val: `${s.cipher}^d mod n = ${s.decoded}`,
      cls: 'green',
    })),
    { key: 'Resultado',    val: `"${msg.decrypted}"`,    cls: 'green'  },
  ];
  return [
    { type: 'encrypt', title: `Encriptando "${msg.text.slice(0,20)}${msg.text.length>20?'…':''}"`, rows: encRows, formula: msg.encFormula },
    { type: 'decrypt', title: 'Desencriptando mensaje', rows: decRows, formula: msg.decFormula },
  ];
}

export default function Chat({ keys }) {
  const [session,  setSession]  = useState(null); // { roomId, userName }
  const [input,    setInput]    = useState('');
  const msgEndRef  = useRef(null);
  const stepEndRef = useRef(null);
  const inputRef   = useRef(null);

  const { connected, connecting, messages, roomInfo, error, sendMessage } = useSocket({
    roomId:   session?.roomId,
    userName: session?.userName,
    keys,
  });

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { stepEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    if (!keys) { alert('Primero genera las claves RSA en el Generador de claves'); return; }
    sendMessage(input.trim());
    setInput('');
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ── Not joined yet → show join screen ──────────────────────────────────────
  if (!session) {
    return <RoomJoin onJoin={setSession} />;
  }
  
  const myId = session?.userName;

  // Build all steps from messages
const allSteps = messages.flatMap((msg) => {
  const isMe = msg.sender === myId;

  if (isMe) {
    // Yo envié este mensaje → solo muestro mi encriptación
    return [buildSteps(msg, 0)[0]]; // índice 0 = paso ENCRYPT
  } else {
    // Otro lo envió → solo muestro mi desencriptación
    return [buildSteps(msg, 0)[1]]; // índice 1 = paso DECRYPT
  }
});

  return (
    <div className="chat-page">

      {/* ── LEFT: Chat ── */}
      <div className="chat-page__chat">
        <div className="chat-page__panel-header">
          <div className="chat-page__panel-title-row">
            <div className="chat-page__panel-title">Canal seguro</div>
            <div className={`chat-page__conn-badge ${connected ? 'chat-page__conn-badge--on' : connecting ? 'chat-page__conn-badge--connecting' : 'chat-page__conn-badge--off'}`}>
              <span className="chat-page__conn-dot" />
              {connected ? 'Conectado' : connecting ? 'Conectando…' : 'Desconectado'}
            </div>
          </div>

          <div className="chat-page__personas">
            <div className="chat-page__persona">
              <span className="chat-page__avatar chat-page__avatar--a">
                {session.userName.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="chat-page__persona-name">{session.userName}</div>
                <div className="chat-page__persona-key">Sala: {session.roomId}</div>
              </div>
            </div>

            <div className="chat-page__room-users">
              {roomInfo?.users?.filter(u => u.name !== session.userName).map(u => (
                <div key={u.id} className="chat-page__persona chat-page__persona--right">
                  <div style={{ textAlign: 'right' }}>
                    <div className="chat-page__persona-name">{u.name}</div>
                    <div className="chat-page__persona-key">en línea</div>
                  </div>
                  <span className="chat-page__avatar chat-page__avatar--b">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {(!roomInfo?.users || roomInfo.users.length < 2) && (
                <div className="chat-page__waiting">
                  <span className="chat-page__waiting-dot" />
                  Esperando otra persona…
                </div>
              )}
            </div>
          </div>

          {!keys && (
            <div className="chat-page__keys-warning">
              ⚠ Sin claves RSA — ve al Generador de claves primero
            </div>
          )}
        </div>

        {error && (
          <div className="chat-page__error-bar">{error}</div>
        )}

        <div className="chat-page__messages">
          {messages.length === 0 && (
            <div className="chat-page__empty-msgs">
              <span>🔐</span>
              <p>Aún no hay mensajes</p>
              <p className="chat-page__empty-hint">Los mensajes se encriptarán con RSA en tiempo real</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.sender === myId;
            return (
              <div key={msg.id} className={`chat-page__msg-row ${isMe ? 'chat-page__msg-row--right' : ''}`}>
                <span className={`chat-page__avatar ${isMe ? 'chat-page__avatar--a' : 'chat-page__avatar--b'}`}>
                  {msg.sender.charAt(0).toUpperCase()}
                </span>
                <div className="chat-page__msg-content">
                  <div className="chat-page__msg-label">{msg.sender} · {formatTime(msg.timestamp)}</div>
                  <div className={`chat-page__bubble ${isMe ? 'chat-page__bubble--right' : 'chat-page__bubble--left'}`}>
                    {msg.text}
                  </div>
                  <CipherBadge ciphers={msg.ciphers} />
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>

        <div className="chat-page__input-area">
          <span className="chat-page__avatar chat-page__avatar--a">
            {session.userName.charAt(0).toUpperCase()}
          </span>
          <textarea
            ref={inputRef}
            className="chat-page__input"
            rows={1}
            placeholder={connected ? 'Escribe un mensaje para encriptar…' : 'Sin conexión al servidor…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={!connected}
          />
          <button
            className="chat-page__send-btn"
            onClick={handleSend}
            disabled={!connected || !input.trim()}
          >➤</button>
        </div>
      </div>

      <div className="chat-page__divider" />

      {/* ── RIGHT: RSA History ── */}
      <div className="chat-page__history">
        <div className="chat-page__panel-header">
          <div className="chat-page__panel-title">Historial RSA</div>
          <div className="chat-page__history-count">{allSteps.length} operaciones</div>
        </div>

        <div className="chat-page__steps">
          {allSteps.length === 0 && (
            <div className="chat-page__empty-steps">
              <span>⬡</span>
              <p>Envía un mensaje para ver el proceso RSA</p>
            </div>
          )}
          {allSteps.map((step, i) => (
            <StepCard key={i} step={step} index={i + 1} />
          ))}
          <div ref={stepEndRef} />
        </div>
      </div>
    </div>
  );
}