// ──────────────────────────────────────────────────────────────────────────────
// Implementación básica del algoritmo RSA en JavaScript
// Este código permite:
// 1. Generar claves RSA
// 2. Encriptar texto
// 3. Desencriptar texto
// 4. Realizar operaciones matemáticas necesarias para RSA
// ──────────────────────────────────────────────────────────────────────────────


// ─── Funciones matemáticas principales de RSA ────────────────────────────────

/*
  Calcula:
      (base ^ exp) mod mod

  usando exponenciación modular rápida.
  
  RSA utiliza esta operación tanto para cifrar
  como para descifrar mensajes.

  Se usa BigInt porque los números en RSA pueden
  ser extremadamente grandes.
*/
function modpow(base, exp, mod) {

  // Resultado acumulado
  let result = 1n;

  // Conversión a BigInt y reducción inicial módulo mod
  base = BigInt(base) % BigInt(mod);
  exp  = BigInt(exp);
  mod  = BigInt(mod);

  // Mientras el exponente sea mayor a 0
  while (exp > 0n) {

    // Si el exponente es impar
    if (exp % 2n === 1n)
      result = result * base % mod;

    // Dividir el exponente entre 2
    exp = exp / 2n;

    // Elevar la base al cuadrado módulo mod
    base = base * base % mod;
  }

  return Number(result);
}


/*
  Calcula el Máximo Común Divisor (MCD)
  usando el algoritmo de Euclides.

  En RSA se usa para verificar que:
      gcd(e, phi) = 1

  es decir, que e y phi sean coprimos.
*/
function gcd(a, b) {

  a = BigInt(a);
  b = BigInt(b);

  // Algoritmo de Euclides
  while (b) {
    [a, b] = [b, a % b];
  }

  return Number(a);
}


/*
  Calcula el inverso modular de e módulo phi.

  Busca un número d tal que:
      (d * e) mod phi = 1

  Este valor d es la clave privada RSA.

  Se usa el algoritmo extendido de Euclides.
*/
function modInverse(e, phi) {

  let [old_r, r] = [BigInt(e), BigInt(phi)];
  let [old_s, s] = [1n, 0n];

  while (r !== 0n) {

    // Cociente
    const q = old_r / r;

    // Actualización de residuos
    [old_r, r] = [r, old_r - q * r];

    // Actualización de coeficientes
    [old_s, s] = [s, old_s - q * s];
  }

  // Ajuste para evitar negativos
  return Number(
    ((old_s % BigInt(phi)) + BigInt(phi)) % BigInt(phi)
  );
}


/*
  Verifica si un número es primo.

  RSA necesita dos números primos:
      p y q

  para generar las claves.
*/
function isPrime(n) {

  n = Number(n);

  // Casos base
  if (n < 2) return false;
  if (n === 2) return true;

  // Los pares mayores que 2 no son primos
  if (n % 2 === 0) return false;

  // Verificar divisibilidad hasta sqrt(n)
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0)
      return false;
  }

  return true;
}


// ─── Generación de claves RSA ────────────────────────────────────────────────

/*
  Genera el par de claves RSA usando
  dos números primos p y q.

  PASOS:

  1. n = p * q
  2. phi = (p - 1)(q - 1)
  3. Buscar e coprimo con phi
  4. Calcular d = inverso modular de e

  Clave pública:
      (e, n)

  Clave privada:
      (d, n)
*/
// Generar primos pequeños candidatos para e
function getRandomPrime(min, max) {
  let candidates = [];
  
  for (let i = min; i <= max; i++) {
    if (isPrime(i)) candidates.push(i);
  }

  // Mezclar y buscar uno coprimo con phi
  // (se filtra después al generar claves)
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function generateKeys(p, q) {
  p = Number(p);
  q = Number(q);

  const n = p * q;
  const phi = (p - 1) * (q - 1);

  // e primo aleatorio y coprimo con phi
  let e;
  do {
    e = getRandomPrime(2, phi - 1);
  } while (gcd(e, phi) !== 1);

  const d = modInverse(e, phi);

  return { p, q, n, phi, e, d };
}


// ─── Cifrado RSA ─────────────────────────────────────────────────────────────

/*
  Encripta un texto usando la clave pública:
      (e, n)

  Fórmula RSA:
      C = M^e mod n

  donde:
      M = mensaje
      C = cifrado
*/
function encrypt(text, e, n) {

  // Procesar cada carácter del texto
  const steps = text.split('').map(ch => {

    // Convertir carácter a código ASCII
    const code = ch.charCodeAt(0);

    // Aplicar fórmula RSA
    const cipher = modpow(code, e, n);

    return {
      char: ch,
      code,
      cipher
    };
  });

  return {

    // Texto original
    original: text,

    // Lista de valores cifrados
    ciphers: steps.map(s => s.cipher),

    // Mostrar solo primeros 5 pasos
    steps: steps.slice(0, 5),

    // Fórmula utilizada
    formula: `C = M^${e} mod ${n}`,
  };
}


// ─── Descifrado RSA ──────────────────────────────────────────────────────────

/*
  Descifra un mensaje usando la clave privada:
      (d, n)

  Fórmula RSA:
      M = C^d mod n

  donde:
      C = texto cifrado
      M = mensaje original
*/
function decrypt(ciphers, d, n) {

  // Procesar cada número cifrado
  const steps = ciphers.map(c => {

    // Recuperar código ASCII original
    const decoded = modpow(c, d, n);

    return {

      // Valor cifrado
      cipher: c,

      // Código ASCII recuperado
      decoded,

      // Convertir ASCII a carácter
      char: String.fromCharCode(decoded)
    };
  });

  return {

    // Reconstruir texto original
    text: steps.map(s => s.char).join(''),

    // Mostrar primeros 5 pasos
    steps: steps.slice(0, 5),

    // Fórmula utilizada
    formula: `M = C^${d} mod ${n}`,
  };
}


// ─── Exportar funciones ──────────────────────────────────────────────────────

// Permite usar estas funciones desde otros archivos
module.exports = {
  generateKeys,
  encrypt,
  decrypt,
  isPrime,
  modpow
};