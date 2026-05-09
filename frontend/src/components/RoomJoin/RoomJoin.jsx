import React, { useState } from 'react';
import './RoomJoin.scss';

export default function RoomJoin({ onJoin }) {
  const [userName, setUserName] = useState('');
  const [roomId,   setRoomId]   = useState('');
  const [error,    setError]    = useState('');

  function handleJoin() {
    if (!userName.trim()) { setError('Ingresa tu nombre'); return; }
    if (!roomId.trim())   { setError('Ingresa el ID de la sala'); return; }
    setError('');
    onJoin({ userName: userName.trim(), roomId: roomId.trim() });
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleJoin();
  }

  const quickRooms = ['sala-rsa-1', 'sala-rsa-2', 'sala-demo'];

  return (
    <div className="room-join">
      <div className="room-join__card">

        <div className="room-join__header">
          <div className="room-join__icon">🔐</div>
          <h2 className="room-join__title">Unirse al canal seguro</h2>
          <p className="room-join__subtitle">
            Dos personas deben unirse a la misma sala para chatear con RSA en tiempo real
          </p>
        </div>

        <div className="room-join__fields">
          <div className="room-join__field">
            <label className="room-join__label">
              <span className="room-join__label-icon">👤</span>
              Tu nombre
            </label>
            <input
              className="room-join__input"
              type="text"
              placeholder="ej. Persona A"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              onKeyDown={handleKey}
              maxLength={20}
            />
          </div>

          <div className="room-join__field">
            <label className="room-join__label">
              <span className="room-join__label-icon">🏠</span>
              ID de sala
            </label>
            <input
              className="room-join__input"
              type="text"
              placeholder="ej. sala-rsa-1"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              onKeyDown={handleKey}
              maxLength={30}
            />
          </div>
        </div>

        <div className="room-join__quick">
          <p className="room-join__quick-label">Salas rápidas</p>
          <div className="room-join__quick-rooms">
            {quickRooms.map(r => (
              <button
                key={r}
                className={`room-join__quick-btn ${roomId === r ? 'room-join__quick-btn--active' : ''}`}
                onClick={() => setRoomId(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="room-join__error">{error}</p>}

        <button className="room-join__btn" onClick={handleJoin}>
          <span>Entrar al canal</span>
          <span>→</span>
        </button>

        <p className="room-join__note">
          💡 Comparte el mismo ID de sala con la otra persona para comunicarse en tiempo real
        </p>
      </div>
    </div>
  );
}