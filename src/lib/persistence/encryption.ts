const SESSION_STORAGE_KEY = 'secureship:intake:session-encryption-key';
const AES_KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Validates that the current runtime provides the browser APIs required for
 * session-scoped encryption.
 */
function assertBrowserEnvironment(): void {
  if (typeof window === 'undefined') {
    throw new Error('SecureShip encryption is only available in the browser.');
  }

  if (typeof window.sessionStorage === 'undefined') {
    throw new Error('Session storage is unavailable for SecureShip encryption.');
  }

  if (typeof window.crypto === 'undefined' || typeof window.crypto.subtle === 'undefined') {
    throw new Error('Web Crypto API is unavailable for SecureShip encryption.');
  }
}

/**
 * Narrows unknown JSON values to plain records for safer structural checks.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates the minimal JWK shape needed to restore an AES session key.
 */
function isAesJwk(value: unknown): value is JsonWebKey {
  if (!isRecord(value)) {
    return false;
  }

  return value.kty === 'oct' && typeof value.k === 'string';
}

/**
 * Converts a UTF-8 string into a byte array for crypto operations.
 */
function stringToUint8Array(value: string): Uint8Array {
  return textEncoder.encode(value);
}

/**
 * Converts decrypted bytes back into a UTF-8 string.
 */
function uint8ArrayToString(value: Uint8Array): string {
  return textDecoder.decode(value);
}

/**
 * Normalizes an ArrayBuffer-like crypto result into a Uint8Array view.
 */
function toUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

/**
 * Copies a byte view into a standalone ArrayBuffer accepted by Web Crypto.
 */
function uint8ArrayToArrayBuffer(value: Uint8Array): ArrayBuffer {
  return new Uint8Array(value).buffer;
}

/**
 * Concatenates IV and ciphertext into a single payload before base64 encoding.
 */
function concatUint8Arrays(left: Uint8Array, right: Uint8Array): Uint8Array {
  const combined = new Uint8Array(left.byteLength + right.byteLength);
  combined.set(left, 0);
  combined.set(right, left.byteLength);
  return combined;
}

/**
 * Encodes bytes as base64 using chunking to avoid stack limits on larger inputs.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

/**
 * Decodes a base64 payload into raw bytes and rejects malformed input safely.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  } catch {
    throw new Error('Encrypted payload is invalid or corrupted.');
  }
}

/**
 * Restores the current session key from storage or generates a fresh one for
 * the active browser session.
 */
async function getSessionKey(): Promise<CryptoKey> {
  assertBrowserEnvironment();

  const storedKey = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (storedKey) {
    try {
      const parsedKey: unknown = JSON.parse(storedKey);

      if (isAesJwk(parsedKey)) {
        return await window.crypto.subtle.importKey(
          'jwk',
          parsedKey,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      }
    } catch {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  const generatedKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await window.crypto.subtle.exportKey('jwk', generatedKey);
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(exportedKey));

  return generatedKey;
}

/**
 * Encrypts plaintext with a session-scoped AES-GCM key and returns a base64
 * payload containing both IV and ciphertext.
 */
export async function encryptData(plainText: string): Promise<string> {
  assertBrowserEnvironment();

  const key = await getSessionKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encodedPlainText = stringToUint8Array(plainText);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: uint8ArrayToArrayBuffer(iv) },
    key,
    uint8ArrayToArrayBuffer(encodedPlainText)
  );

  return uint8ArrayToBase64(concatUint8Arrays(iv, toUint8Array(cipherBuffer)));
}

/**
 * Decrypts a base64 payload produced by `encryptData`. Corrupted or mismatched
 * payloads are rejected with a safe, generic error.
 */
export async function decryptData(cipherText: string): Promise<string> {
  assertBrowserEnvironment();

  const payload = base64ToUint8Array(cipherText);

  if (payload.byteLength <= IV_LENGTH_BYTES) {
    throw new Error('Encrypted payload is invalid or corrupted.');
  }

  const iv = payload.slice(0, IV_LENGTH_BYTES);
  const cipherBytes = payload.slice(IV_LENGTH_BYTES);
  const key = await getSessionKey();

  try {
    const plainBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: uint8ArrayToArrayBuffer(iv) },
      key,
      uint8ArrayToArrayBuffer(cipherBytes)
    );

    return uint8ArrayToString(toUint8Array(plainBuffer));
  } catch {
    throw new Error('Encrypted payload could not be decrypted.');
  }
}
