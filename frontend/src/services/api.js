const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const api = {
  keygen:  (p, q)            => post('/api/rsa/keygen',  { p, q }),
  encrypt: (text, e, n)      => post('/api/rsa/encrypt', { text, e, n }),
  decrypt: (ciphers, d, n)   => post('/api/rsa/decrypt', { ciphers, d, n }),
  health:  ()                => fetch(`${BASE}/api/health`).then(r => r.json()),
};