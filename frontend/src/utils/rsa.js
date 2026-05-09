// ─── RSA Core Math ────────────────────────────────────────
 
export function modpow(base, exp, mod) {
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
 
export function gcd(a, b) {
  a = BigInt(a); b = BigInt(b);
  while (b) { [a, b] = [b, a % b]; }
  return Number(a);
}
 
export function modInverse(e, phi) {
  let [old_r, r]   = [BigInt(e), BigInt(phi)];
  let [old_s, s]   = [1n, 0n];
  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  return Number(((old_s % BigInt(phi)) + BigInt(phi)) % BigInt(phi));
}
 
export function isPrime(n) {
  n = Number(n);
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}
 
export function generateKeys(p, q) {
  p = Number(p); q = Number(q);
  const n   = p * q;
  const phi = (p - 1) * (q - 1);
 
  // Find valid e
  let e = 2;
  while (e < phi) {
    if (gcd(e, phi) === 1) break;
    e++;
  }
 
  const d = modInverse(e, phi);
 
  return { p, q, n, phi, e, d };
}
 
export function rsaEncrypt(text, e, n) {
  return text.split('').map(ch => ({
    char:  ch,
    code:  ch.charCodeAt(0),
    cipher: modpow(ch.charCodeAt(0), e, n),
  }));
}
 
export function rsaDecrypt(cipherArr, d, n) {
  return cipherArr.map(item => ({
    ...item,
    decoded: modpow(item.cipher, d, n),
    char:    String.fromCharCode(modpow(item.cipher, d, n)),
  }));
}
 
export function encryptText(text, e, n) {
  return rsaEncrypt(text, e, n).map(x => x.cipher);
}
 
export function decryptCiphers(ciphers, d, n) {
  return ciphers.map(c => String.fromCharCode(modpow(c, d, n))).join('');
}
 
export function formatCipherPreview(arr, max = 4) {
  const slice = arr.slice(0, max);
  return '[' + slice.join(', ') + (arr.length > max ? ', …]' : ']');
}