/**
 * Production-Grade Encryption Utility
 * Uses Web Crypto API with AES-256-GCM for secure client-side encryption
 */

// Generate a random encryption key (store securely - DO NOT hardcode in production)
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

// Export key to be stored (e.g., in secure backend)
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(exported);
}

// Import key from storage
export async function importKey(keyData: string): Promise<CryptoKey> {
  const jwk = JSON.parse(keyData);
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Derive key from password (for password-based encryption)
export async function deriveKeyFromPassword(
  password: string,
  salt: BufferSource
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt text using AES-256-GCM
 * @param plaintext - The text to encrypt
 * @param key - The encryption key
 * @returns Base64 encoded encrypted data with IV prepended
 */
export async function encryptText(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random IV (Initialization Vector)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt data
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt text using AES-256-GCM
 * @param encryptedData - Base64 encoded encrypted data with IV
 * @param key - The decryption key
 * @returns Decrypted plaintext
 */
export async function decryptText(
  encryptedData: string,
  key: CryptoKey
): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0)
    );

    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data. Invalid key or corrupted data.");
  }
}

/**
 * Encrypt a file using AES-256-GCM
 * @param file - The file to encrypt
 * @param key - The encryption key
 * @returns Base64 encoded encrypted file with IV and original filename
 */
export async function encryptFile(
  file: File,
  key: CryptoKey
): Promise<{
  encrypted: string;
  metadata: { name: string; type: string; size: number };
}> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt file data
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  const encryptedBase64 = btoa(String.fromCharCode(...combined));

  return {
    encrypted: encryptedBase64,
    metadata: {
      name: file.name,
      type: file.type,
      size: file.size,
    },
  };
}

/**
 * Decrypt a file using AES-256-GCM
 * @param encryptedData - Base64 encoded encrypted file with IV
 * @param key - The decryption key
 * @param metadata - Original file metadata
 * @returns Decrypted File object
 */
export async function decryptFile(
  encryptedData: string,
  key: CryptoKey,
  metadata: { name: string; type: string }
): Promise<File> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), (c) =>
      c.charCodeAt(0)
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );

    // Create File object
    return new File([decrypted], metadata.name, { type: metadata.type });
  } catch (error) {
    console.error("File decryption failed:", error);
    throw new Error("Failed to decrypt file. Invalid key or corrupted data.");
  }
}

/**
 * Generate a secure random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Convert salt to base64 for storage
 */
export function saltToBase64(salt: Uint8Array): string {
  return btoa(String.fromCharCode(...salt));
}

/**
 * Convert base64 salt back to Uint8Array
 */
export function base64ToSalt(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

// Key management helper (use secure backend storage in production)
class EncryptionKeyManager {
  private static KEY_STORAGE_KEY = "clinic_encryption_key";
  private static SALT_STORAGE_KEY = "clinic_encryption_salt";

  /**
   * Initialize encryption key from password
   * In production, store the derived key securely on the backend
   */
  static async initializeFromPassword(password: string): Promise<CryptoKey> {
    // Check if salt exists, if not create one
    let salt: Uint8Array;
    const storedSalt = sessionStorage.getItem(this.SALT_STORAGE_KEY);

    if (storedSalt) {
      salt = base64ToSalt(storedSalt);
    } else {
      salt = generateSalt();
      sessionStorage.setItem(this.SALT_STORAGE_KEY, saltToBase64(salt));
    }

    const key = await deriveKeyFromPassword(password, salt as BufferSource);

    // Store key in session (in production, use secure backend)
    const exportedKey = await exportKey(key);
    sessionStorage.setItem(this.KEY_STORAGE_KEY, exportedKey);

    return key;
  }

  /**
   * Get the current encryption key from session storage
   * In production, retrieve from secure backend with proper authentication
   */
  static async getKey(): Promise<CryptoKey | null> {
    const storedKey = sessionStorage.getItem(this.KEY_STORAGE_KEY);
    if (!storedKey) return null;

    try {
      return await importKey(storedKey);
    } catch (error) {
      console.error("Failed to import encryption key:", error);
      return null;
    }
  }

  /**
   * Clear encryption key from storage (logout)
   */
  static clearKey(): void {
    sessionStorage.removeItem(this.KEY_STORAGE_KEY);
    sessionStorage.removeItem(this.SALT_STORAGE_KEY);
  }
}

export default EncryptionKeyManager;
