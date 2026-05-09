import React, { useState } from 'react';
import { generateKeys, isPrime, gcd } from '../../utils/rsa';
import './KeyGenerator.scss';
 
const PRESETS = [
  { label: 'Ejemplo clásico', p: 61,  q: 53  },
  { label: 'Pequeño',         p: 17,  q: 19  },
  { label: 'Mediano',         p: 101, q: 103 },
];
 
export default function KeyGenerator({ onKeysGenerated, currentKeys }) {
  const [p, setP]         = useState('');
  const [q, setQ]         = useState('');
  const [result, setResult] = useState(currentKeys || null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(!!currentKeys);
 
  function validate() {
    const pn = Number(p), qn = Number(q);
    if (!p || !q) return 'Ingresa valores para p y q';
    if (!Number.isInteger(pn) || !Number.isInteger(qn)) return 'p y q deben ser enteros';
    if (pn < 2 || qn < 2) return 'p y q deben ser mayores a 1';
    if (!isPrime(pn)) return `p = ${pn} no es primo`;
    if (!isPrime(qn)) return `q = ${qn} no es primo`;
    if (pn === qn) return 'p y q deben ser distintos';
    return null;
  }
 
  function handleGenerate() {
    const err = validate();
    if (err) { setError(err); setResult(null); return; }
    setError('');
    setLoading(true);
    setTimeout(() => {
      const keys = generateKeys(Number(p), Number(q));
      setResult(keys);
      setGenerated(true);
      setLoading(false);
      onKeysGenerated(keys);
    }, 600);
  }
 
  function applyPreset(preset) {
    setP(String(preset.p));
    setQ(String(preset.q));
    setError('');
    setResult(null);
    setGenerated(false);
  }
 
  const pValid = p && isPrime(Number(p));
  const qValid = q && isPrime(Number(q));
 
  return (
    <div className="keygen">
      {/* Header */}
      <div className="keygen__header">
        <div className="keygen__header-left">
          <h1 className="keygen__title">Generador de claves</h1>
          <p className="keygen__subtitle">
            Ingresa dos números primos para generar tu par de claves RSA
          </p>
        </div>
        <div className="keygen__header-badge">
          <span className="keygen__badge-dot" />
          RSA-{result ? result.n.toString(2).length : '?'} bits aprox.
        </div>
      </div>
 
      <div className="keygen__body">
        {/* Left: inputs */}
        <div className="keygen__inputs-col">
 
          {/* Presets */}
          <div className="keygen__section">
            <p className="keygen__section-label">Presets</p>
            <div className="keygen__presets">
              {PRESETS.map((pr) => (
                <button
                  key={pr.label}
                  className="keygen__preset-btn"
                  onClick={() => applyPreset(pr)}
                >
                  <span className="keygen__preset-name">{pr.label}</span>
                  <span className="keygen__preset-vals">p={pr.p}, q={pr.q}</span>
                </button>
              ))}
            </div>
          </div>
 
          {/* p & q inputs */}
          <div className="keygen__section">
            <p className="keygen__section-label">Parámetros</p>
            <div className="keygen__fields">
              <div className={`keygen__field ${p ? (pValid ? 'keygen__field--ok' : 'keygen__field--err') : ''}`}>
                <label className="keygen__field-label">
                  <span className="keygen__field-var">p</span>
                  <span>Primer número primo</span>
                </label>
                <input
                  className="keygen__input"
                  type="number"
                  min="2"
                  placeholder="ej. 61"
                  value={p}
                  onChange={e => { setP(e.target.value); setError(''); setGenerated(false); }}
                />
                {p && (
                  <span className={`keygen__field-status ${pValid ? 'ok' : 'err'}`}>
                    {pValid ? '✓ primo' : '✗ no primo'}
                  </span>
                )}
              </div>
 
              <div className="keygen__field-sep">×</div>
 
              <div className={`keygen__field ${q ? (qValid ? 'keygen__field--ok' : 'keygen__field--err') : ''}`}>
                <label className="keygen__field-label">
                  <span className="keygen__field-var">q</span>
                  <span>Segundo número primo</span>
                </label>
                <input
                  className="keygen__input"
                  type="number"
                  min="2"
                  placeholder="ej. 53"
                  value={q}
                  onChange={e => { setQ(e.target.value); setError(''); setGenerated(false); }}
                />
                {q && (
                  <span className={`keygen__field-status ${qValid ? 'ok' : 'err'}`}>
                    {qValid ? '✓ primo' : '✗ no primo'}
                  </span>
                )}
              </div>
            </div>
 
            {error && <p className="keygen__error">{error}</p>}
          </div>
 
          {/* Generate button */}
          <button
            className={`keygen__btn ${loading ? 'keygen__btn--loading' : ''} ${generated ? 'keygen__btn--done' : ''}`}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <><span className="keygen__spinner" /> Calculando…</>
            ) : generated ? (
              <><span>✓</span> Claves generadas</>
            ) : (
              <><span>⚙</span> Generar par de claves</>
            )}
          </button>
 
          {/* Formula reminder */}
          <div className="keygen__formula-box">
            <p className="keygen__formula-title">Proceso RSA</p>
            <div className="keygen__formula-steps">
              {[
                { step: '1', expr: 'n = p × q',           desc: 'módulo público' },
                { step: '2', expr: 'φ(n) = (p−1)(q−1)',   desc: 'totient de Euler' },
                { step: '3', expr: 'gcd(e, φ(n)) = 1',    desc: 'e coprimo con φ(n)' },
                { step: '4', expr: 'd ≡ e⁻¹ mod φ(n)',    desc: 'clave privada' },
              ].map(({ step, expr, desc }) => (
                <div className="keygen__formula-step" key={step}>
                  <span className="keygen__formula-num">{step}</span>
                  <span className="keygen__formula-expr">{expr}</span>
                  <span className="keygen__formula-desc">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        {/* Right: result */}
        <div className="keygen__result-col">
          {result ? (
            <div className="keygen__result">
              <div className="keygen__result-header">
                <span className="keygen__result-title">Par de claves generado</span>
                <span className="keygen__result-ok">✓ Listo</span>
              </div>
 
              {/* Computation steps */}
              <div className="keygen__steps">
                <div className="keygen__step">
                  <span className="keygen__step-label">Primos elegidos</span>
                  <span className="keygen__step-val keygen__step-val--cyan">
                    p = {result.p} &nbsp;&nbsp; q = {result.q}
                  </span>
                </div>
                <div className="keygen__step">
                  <span className="keygen__step-label">n = p × q</span>
                  <span className="keygen__step-val keygen__step-val--white">
                    {result.p} × {result.q} = <strong>{result.n}</strong>
                  </span>
                </div>
                <div className="keygen__step">
                  <span className="keygen__step-label">φ(n) = (p−1)(q−1)</span>
                  <span className="keygen__step-val keygen__step-val--white">
                    ({result.p}−1)({result.q}−1) = <strong>{result.phi}</strong>
                  </span>
                </div>
                <div className="keygen__step">
                  <span className="keygen__step-label">e (clave pública)</span>
                  <span className="keygen__step-val keygen__step-val--violet">
                    e = <strong>{result.e}</strong>
                    <span className="keygen__step-note"> gcd({result.e}, {result.phi}) = 1 ✓</span>
                  </span>
                </div>
                <div className="keygen__step">
                  <span className="keygen__step-label">d (clave privada)</span>
                  <span className="keygen__step-val keygen__step-val--red">
                    d = <strong>{result.d}</strong>
                    <span className="keygen__step-note"> ({result.e} × {result.d}) mod {result.phi} = 1 ✓</span>
                  </span>
                </div>
              </div>
 
              {/* Key cards */}
              <div className="keygen__key-cards">
                <div className="keygen__key-card keygen__key-card--pub">
                  <div className="keygen__key-card-header">
                    <span className="keygen__key-card-icon">🔑</span>
                    <span className="keygen__key-card-title">Clave pública</span>
                    <span className="keygen__key-card-badge">PUBLIC</span>
                  </div>
                  <div className="keygen__key-card-body">
                    <div className="keygen__key-pair">
                      <span className="keygen__key-var">e</span>
                      <span className="keygen__key-num">{result.e}</span>
                    </div>
                    <div className="keygen__key-pair">
                      <span className="keygen__key-var">n</span>
                      <span className="keygen__key-num">{result.n}</span>
                    </div>
                  </div>
                  <p className="keygen__key-card-note">
                    Compartir con todos · Usada para <strong>encriptar</strong>
                  </p>
                </div>
 
                <div className="keygen__key-card keygen__key-card--priv">
                  <div className="keygen__key-card-header">
                    <span className="keygen__key-card-icon">🔒</span>
                    <span className="keygen__key-card-title">Clave privada</span>
                    <span className="keygen__key-card-badge">PRIVATE</span>
                  </div>
                  <div className="keygen__key-card-body">
                    <div className="keygen__key-pair">
                      <span className="keygen__key-var">d</span>
                      <span className="keygen__key-num">{result.d}</span>
                    </div>
                    <div className="keygen__key-pair">
                      <span className="keygen__key-var">n</span>
                      <span className="keygen__key-num">{result.n}</span>
                    </div>
                  </div>
                  <p className="keygen__key-card-note">
                    Mantener en secreto · Usada para <strong>desencriptar</strong>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="keygen__empty">
              <div className="keygen__empty-icon">⬡</div>
              <p className="keygen__empty-text">Ingresa p y q para generar las claves</p>
              <p className="keygen__empty-hint">Las claves se usarán en el chat encriptado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}