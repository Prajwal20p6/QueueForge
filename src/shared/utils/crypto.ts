import {
  createHash,
  createHmac,
  randomUUID,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from 'crypto';

/**
 * Encodes a string into a SHA-256 hex digest
 * @param input - The input string to hash
 * @returns Hash hexadecimal representation
 */
export function hashSHA256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generates a standard cryptographically strong UUIDv4
 * @returns UUID string
 */
export function generateUUID(): string {
  return randomUUID();
}

const BASE32_ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Encodes a number into Crockford's Base32 string representation
 */
function encodeBase32(time: number, length: number): string {
  let str = '';
  let temp = time;
  for (let i = length - 1; i >= 0; i--) {
    const mod = temp % 32;
    str = BASE32_ENCODING.charAt(mod) + str;
    temp = Math.floor(temp / 32);
  }
  return str;
}

/**
 * Generates random entropy Crockford's Base32 string
 */
function encodeRandom(length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    const rand = Math.floor(Math.random() * 32);
    str += BASE32_ENCODING.charAt(rand);
  }
  return str;
}

/**
 * Generates a dependency-free, lexicographically sortable Universally Unique Lexicographically Sortable Identifier (ULID)
 * @returns ULID string
 */
export function generateULID(): string {
  // First 10 chars: millisecond timestamp
  // Next 16 chars: random entropy
  return encodeBase32(Date.now(), 10) + encodeRandom(16);
}

/**
 * Encrypts cleartext using AES-256-CBC algorithm
 * @param data - Target payload
 * @param key - Passphrase key
 * @returns Formatted IV:Ciphertext string
 */
export function encryptAES256(data: string, key: string): string {
  const keyHash = createHash('sha256').update(key).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', keyHash, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a ciphertext using AES-256-CBC algorithm
 * @param encrypted - Formatted IV:Ciphertext string
 * @param key - Passphrase key
 * @returns Cleartext string
 */
export function decryptAES256(encrypted: string, key: string): string {
  const keyHash = createHash('sha256').update(key).digest();
  const parts = encrypted.split(':');

  if (parts.length !== 2) {
    throw new Error('Invalid encrypted input format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const ciphertext = parts[1];
  const decipher = createDecipheriv('aes-256-cbc', keyHash, iv);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates an HMAC SHA-256 signature hash
 * @param message - Payload content
 * @param secret - Signing key secret
 * @returns Hex digest signature
 */
export function hmacSHA256(message: string, secret: string): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}
