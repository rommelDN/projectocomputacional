import React from 'react';
import './Sidebar.scss';
 
const NAV = [
  {
    id: 'keygen',
    icon: '⬡',
    label: 'Generador de claves',
    sub: 'Configura p, q, e, d',
  },
  {
    id: 'chat',
    icon: '⬡',
    label: 'Canal seguro',
    sub: 'Chat encriptado RSA',
  },
];
 
export default function Sidebar({ active, onNavigate, keys }) {
  return (
    <aside className="sidebar">
      {/* Logo / brand */}
      <div className="sidebar__brand">
        <div className="sidebar__brand-icon">
          <span className="lock-icon">🔐</span>
        </div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">RSA</span>
          <span className="sidebar__brand-sub">Criptografía</span>
        </div>
      </div>
 
      {/* University badge */}
      <div className="sidebar__university">
        <span className="sidebar__uni-dot" />
        <span>UPC · Mat. Computacional</span>
      </div>
 
      {/* Nav */}
      <nav className="sidebar__nav">
        <p className="sidebar__nav-label">Módulos</p>
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`sidebar__nav-item ${active === item.id ? 'sidebar__nav-item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="sidebar__nav-hex">{item.icon}</span>
            <div className="sidebar__nav-text">
              <span className="sidebar__nav-name">{item.label}</span>
              <span className="sidebar__nav-desc">{item.sub}</span>
            </div>
            {active === item.id && <span className="sidebar__nav-pill" />}
          </button>
        ))}
      </nav>
 
      {/* Keys status */}
      <div className="sidebar__keys">
        <p className="sidebar__keys-label">Estado de claves</p>
        {keys ? (
          <div className="sidebar__keys-grid">
            <div className="sidebar__key-item">
              <span className="sidebar__key-name">n</span>
              <span className="sidebar__key-val">{keys.n}</span>
            </div>
            <div className="sidebar__key-item">
              <span className="sidebar__key-name">e</span>
              <span className="sidebar__key-val sidebar__key-val--pub">{keys.e}</span>
            </div>
            <div className="sidebar__key-item">
              <span className="sidebar__key-name">d</span>
              <span className="sidebar__key-val sidebar__key-val--priv">{keys.d}</span>
            </div>
            <div className="sidebar__key-item">
              <span className="sidebar__key-name">φ(n)</span>
              <span className="sidebar__key-val">{keys.phi}</span>
            </div>
          </div>
        ) : (
          <div className="sidebar__keys-empty">
            <span>Sin claves generadas</span>
            <span className="sidebar__keys-hint">→ Ve al generador</span>
          </div>
        )}
      </div>
 
      {/* Footer */}
      <div className="sidebar__footer">
        <span className="sidebar__footer-dot" />
        <span>Sistema activo</span>
      </div>
    </aside>
  );
}