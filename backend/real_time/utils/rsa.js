// ─── RSA Core Math ────────────────────────────────────────────────────────────

function modpow(base, exp, mod) {
  let result = 1n;
  base = BigInt(base) % BigInt(mod);
  exp  = BigInt(exp);
  mod  = BigInt(mod);
  while (exp > 0n) {
    if (exp % 2n === 1n) result = result * base % mod;
    exp  = exp / 2n;
    base = base * base % mod;
  }
  return Number(result);
}

function gcd(a, b) {
  a = BigInt(a); b = BigInt(b);
  while (b) { [a, b] = [b, a % b]; }
  return Number(a);
}

function modInverse(e, phi) {
  let [old_r, r] = [BigInt(e), BigInt(phi)];
  let [old_s, s] = [1n, 0n];
  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  return Number(((old_s % BigInt(phi)) + BigInt(phi)) % BigInt(phi));
}

function isPrime(n) {
  n = Number(n);
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// ─── Generate RSA key pair ────────────────────────────────────────────────────
function generateKeys(p, q) {
  p = Number(p); q = Number(q);
  const n   = p * q;
  const phi = (p - 1) * (q - 1);

  let e = 2;
  while (e < phi) {
    if (gcd(e, phi) === 1) break;
    e++;
  }

  const d = modInverse(e, phi);
  return { p, q, n, phi, e, d };
}

// ─── Encrypt text ─────────────────────────────────────────────────────────────
function encrypt(text, e, n) {
  const steps = text.split('').map(ch => {
    const code   = ch.charCodeAt(0);
    const cipher = modpow(code, e, n);
    return { char: ch, code, cipher };
  });

  return {
    original:  text,
    ciphers:   steps.map(s => s.cipher),
    steps:     steps.slice(0, 5), // first 5 chars for display
    formula:   `C = M^${e} mod ${n}`,
  };
}

// ─── Decrypt ciphers ──────────────────────────────────────────────────────────
function decrypt(ciphers, d, n) {
  const steps = ciphers.map(c => {
    const decoded = modpow(c, d, n);
    return { cipher: c, decoded, char: String.fromCharCode(decoded) };
  });

  return {
    text:    steps.map(s => s.char).join(''),
    steps:   steps.slice(0, 5),
    formula: `M = C^${d} mod ${n}`,
  };
}

module.exports = { generateKeys, encrypt, decrypt, isPrime, modpow };