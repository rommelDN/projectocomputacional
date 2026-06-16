// ─── RSA Core Math ────────────────────────────────────────

/**
 * EXPONENCIACIÓN MODULAR — calcula (base^exp) % mod
 *
 * Es una función GENÉRICA de matemáticas, no exclusiva de RSA.
 * Por eso recibe 'mod' como parámetro en vez de usar 'n' directamente,
 * lo que permite reutilizarla en distintos contextos:
 *
 *   Cifrar:          modpow(codigo,  e,   n)    → mod = n
 *   Descifrar:       modpow(cipher,  d,   n)    → mod = n
 *   Otros usos:      modpow(base,   exp, phi)   → mod = phi u otro
 *
 * ¿Por qué no hacemos base^exp directamente?
 * → Los números crecen astronómicamente. Este algoritmo
 *   ("square and multiply") los mantiene siempre pequeños
 *   reduciendo módulo en cada paso.
 *
 * Usamos BigInt porque JS pierde precisión con enteros > 2^53.
 */
export function modpow(base, exp, mod) {
  let result = 1n;
  base = BigInt(base) % BigInt(mod);
  exp  = BigInt(exp);
  mod  = BigInt(mod);
  while (exp > 0n) {
    if (exp % 2n === 1n) result = result * base % mod;  // bit activo → acumular
    exp  = exp / 2n;        // desplazar al siguiente bit
    base = base * base % mod; // elevar base al cuadrado
  }
  return Number(result);
}


/**
 * MÁXIMO COMÚN DIVISOR (gcd)
 * Algoritmo de Euclides: gcd(a, b) = gcd(b, a % b)
 *
 * Se usa para verificar que 'e' y φ(n) son coprimos,
 * es decir, que gcd(e, φ) === 1.
 * Eso garantiza que 'd' (la clave privada) existe.
 */
export function gcd(a, b) {
  // Convertir a BigInt para soportar números grandes de RSA
  a = BigInt(a); b = BigInt(b);

  // Repetir mientras b no sea 0
  // En cada vuelta: a toma el valor de b, b toma el resto de a/b
  // El problema se reduce hasta que b llega a 0
  while (b) { [a, b] = [b, a % b]; }

  // Cuando b es 0, a contiene el MCD → convertir de vuelta a Number
  return Number(a);
}

/**
 * INVERSO MODULAR (modInverse)
 * Encuentra 'd' tal que (e * d) ≡ 1 (mod φ)
 *
 * Usa el Algoritmo Extendido de Euclides.
 * Piénsalo como: ¿qué número multiplicado por e
 * da resto 1 al dividir entre φ?
 *
 * Ese 'd' es la clave privada — el "deshacer" del cifrado.
 */
export function modInverse(e, phi) {
  // Iniciar residuos con los valores de entrada convertidos a BigInt
  let [old_r, r] = [BigInt(e), BigInt(phi)];

  // Coeficientes que rastrean cómo se construye el MCD
  // old_s arranca en 1 (coeficiente de e), s en 0 (coeficiente de phi)
  let [old_s, s] = [1n, 0n];

  // Repetir mientras el residuo no llegue a 0
  while (r !== 0n) {
    // Cociente entero de la división
    const q = old_r / r;

    // Actualizar residuos (igual que Euclides normal)
    [old_r, r] = [r, old_r - q * r];

    // Actualizar coeficientes siguiendo el mismo patrón
    [old_s, s] = [s, old_s - q * s];
  }

  // old_s puede ser negativo → sumar phi para dejarlo en rango [0, phi)
  return Number(((old_s % BigInt(phi)) + BigInt(phi)) % BigInt(phi));
}

/**
 * TEST DE PRIMALIDAD (isPrime)
 * Comprueba si n es primo por fuerza bruta (trial division).
 *
 * Optimizaciones básicas:
 *  - Descartar pares excepto el 2
 *  - Solo iterar hasta √n (si tiene un divisor > √n,
 *    su par complementario sería < √n y ya lo habríamos visto)
 *
 * Suficiente para primos pequeños de demostración.
 * En RSA real se usa Miller-Rabin para primos de 1024+ bits.
 */
export function isPrime(n) {
  n = Number(n);

  // Caso 1: menores que 2 nunca son primos (0, 1, negativos)
  if (n < 2) return false;

  // Caso 2: el 2 es el único primo par — caso especial
  if (n === 2) return true;

  // Caso 3: cualquier otro par no puede ser primo (divisible entre 2)
  if (n % 2 === 0) return false;

  // Caso 4: probar divisores impares desde 3 hasta √n
  // Solo impares (i += 2) porque los pares ya fueron descartados arriba
  // Solo hasta √n porque si hay un divisor mayor, su par ya fue revisado
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false; // encontró un divisor → no es primo
  }

  // Pasó todos los filtros → es primo
  return true;
}

/**
 * PRIMO ALEATORIO EN RANGO (getRandomPrime)
 * Recoge todos los primos entre min y max
 * y devuelve uno al azar.
 *
 * Se usa para generar candidatos a 'e'.
 * El filtro de coprimalidad con φ se aplica después en generateKeys.
 */
function getRandomPrime(min, max) {
  // Lista donde se guardarán todos los primos encontrados en el rango
  let candidates = [];

  // Recorrer todos los números entre min y max
  for (let i = min; i <= max; i++) {

    // Si el número es primo, agregarlo a la lista de candidatos
    if (isPrime(i)) candidates.push(i);
  }

  // Elegir un índice al azar entre 0 y la cantidad de candidatos
  // Math.random()          → número entre 0 y 1
  // × candidates.length    → escala al tamaño de la lista
  // Math.floor(...)        → redondea hacia abajo para obtener índice entero
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * GENERACIÓN DE CLAVES RSA (generateKeys)
 * A partir de dos primos p y q produce el par de claves.
 *
 * Paso a paso:
 *  1. n   = p × q          → módulo público
 *  2. φ   = (p-1)(q-1)     → función de Euler (cantidad de coprimos con n)
 *  3. e   → exponente público: primo aleatorio coprimo con φ
 *  4. d   → exponente privado: inverso modular de e respecto a φ
 *
 * Claves resultantes:
 *  Pública:  (e, n)   — para cifrar
 *  Privada:  (d, n)   — para descifrar
 */
export function generateKeys(p, q) {
  // Asegurar que p y q son números normales (no BigInt)
  p = Number(p);
  q = Number(q);

  // Paso 1: calcular el módulo público
  const n = p * q;

  // Paso 2: calcular el totiente de Euler
  // φ = cantidad de números entre 1 y n que son coprimos con n
  const phi = (p - 1) * (q - 1);

  // Paso 3: buscar e primo y coprimo con phi
  // Se repite hasta encontrar un e válido (gcd = 1 garantiza que d existe)
  let e;
  do {
    // Buscar primo aleatorio en rango [2, phi-1]
    e = getRandomPrime(2, phi - 1);
  } while (gcd(e, phi) !== 1);

  // Paso 4: calcular d — el inverso modular de e respecto a phi
  const d = modInverse(e, phi); // clave privada

  // Devolver todas las piezas del sistema RSA
  return { p, q, n, phi, e, d };
}

/**
 * CIFRADO RSA carácter a carácter (rsaEncrypt)
 * Para cada carácter del texto:
 *  1. Obtiene su código ASCII (charCodeAt)
 *  2. Aplica: cifrado = código^e % n
 *
 * Devuelve un array de objetos con el proceso completo
 * (útil para visualizar en la UI paso a paso).
 */
export function rsaEncrypt(text, e, n) {
  // Separar el texto en array de caracteres y procesar cada uno
  return text.split('').map(ch => ({

    char:   ch,                              // carácter original  ej: 'H'
    code:   ch.charCodeAt(0),               // código ASCII        ej: 72
    cipher: modpow(ch.charCodeAt(0), e, n)  // cifrado: 72^e % n  ej: 3521
  }));
}

/**
 * DESCIFRADO RSA (rsaDecrypt)
 * Invierte el cifrado con la clave privada d:
 *  descifrado = cifrado^d % n
 *
 * Por la propiedad RSA: (m^e)^d ≡ m (mod n)
 * → recuperamos exactamente el código ASCII original.
 */
export function rsaDecrypt(cipherArr, d, n) {
  // Procesar cada objeto del array cifrado
  return cipherArr.map(item => ({

    ...item,  // conservar los datos originales (char, code, cipher)

    decoded: modpow(item.cipher, d, n), // descifrar: cipher^d % n → código ASCII

    // Convertir el código ASCII recuperado de vuelta a carácter
    char: String.fromCharCode(modpow(item.cipher, d, n))
  }));
}
/**
 * CIFRADO SIMPLIFICADO (encryptText)
 * Versión compacta: devuelve solo el array de valores cifrados,
 * sin el detalle intermedio de rsaEncrypt.
 */
export function encryptText(text, e, n) {
  return rsaEncrypt(text, e, n).map(x => x.cipher);
}

/**
 * DESCIFRADO SIMPLIFICADO (decryptCiphers)
 * Recibe array de números cifrados y reconstruye el texto original
 * convirtiendo cada valor descifrado de vuelta a carácter.
 */
export function decryptCiphers(ciphers, d, n) {
  return ciphers.map(c => String.fromCharCode(modpow(c, d, n))).join('');
}

/**
 * VISTA PREVIA DEL CIFRADO (formatCipherPreview)
 * Muestra los primeros `max` valores cifrados en formato legible.
 * Si hay más elementos, añade "…" para indicarlo.
 * Ej: [142, 87, 203, 56, …]
 */
export function formatCipherPreview(arr, max = 4) {
  const slice = arr.slice(0, max);
  return '[' + slice.join(', ') + (arr.length > max ? ', …]' : ']');
}