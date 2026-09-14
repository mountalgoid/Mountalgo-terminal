import crypto from 'crypto';

// Master Secret Key for AES-256-GCM encryption in memory
const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || 'mountalgo_hedge_fund_super_secure_key_32bytes!!';
const ALGORITHM = 'aes-256-gcm';

export function encryptSecret(text: string): { encrypted: string; iv: string; tag: string } {
  if (!text) return { encrypted: '', iv: '', tag: '' };
  
  // Ensure 32 byte key length
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag().toString('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

export function decryptSecret(encryptedHex: string, ivHex: string, tagHex: string): string {
  if (!encryptedHex || !ivHex || !tagHex) return encryptedHex; // fallback to plain if not encrypted
  
  try {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[CryptoUtils] Decryption error:', err);
    return encryptedHex;
  }
}

const CLIENT_SECRET_PREFIX = 'enc::v1::';
const CLIENT_SECRET_KEY = 'MountAlgoSecuredKey2026';

/**
 * Clean sanitization helper for API strings: trims whitespace, zero-width unicode artifacts, and wrapping quotes
 */
function sanitizeRawString(val: string): string {
  if (!val) return "";
  return val
    .replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '')
    .trim()
    .replace(/^["'`]|["'`]$/g, '')
    .trim();
}

/**
 * Decrypts client-persisted XOR obfuscated secret if passed with enc::v1:: prefix
 */
export function decryptClientSecret(cipher?: string): string {
  if (!cipher || typeof cipher !== 'string') return '';
  const sanitized = sanitizeRawString(cipher);
  if (!sanitized.startsWith(CLIENT_SECRET_PREFIX)) return sanitized;
  try {
    const raw = Buffer.from(sanitized.slice(CLIENT_SECRET_PREFIX.length), 'base64').toString('binary');
    let plain = '';
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i) ^ CLIENT_SECRET_KEY.charCodeAt(i % CLIENT_SECRET_KEY.length);
      plain += String.fromCharCode(code);
    }
    return sanitizeRawString(plain);
  } catch {
    return sanitized;
  }
}

/**
 * Resolve any secret payload (AES-256-GCM object, enc::v1:: client cipher, or plaintext)
 * Clean whitespaces, zero-width chars, and accidental quotation wrappers
 */
export function resolveSecret(secretPayload: any): string {
  if (!secretPayload) return "";
  if (typeof secretPayload === "object" && secretPayload.encrypted) {
    return sanitizeRawString(decryptSecret(secretPayload.encrypted, secretPayload.iv, secretPayload.tag));
  }
  let str = sanitizeRawString(String(secretPayload));
  if (str.startsWith(CLIENT_SECRET_PREFIX)) {
    str = decryptClientSecret(str);
  }
  return sanitizeRawString(str);
}

/**
 * Clean API Key string by stripping whitespace, zero-width artifacts, and wrapping quotes
 */
export function cleanApiKey(apiKey?: string): string {
  if (!apiKey) return "";
  return sanitizeRawString(String(apiKey));
}

