const enc = new TextEncoder();
const dec = new TextDecoder();

// Helper: base64 encode/decode
const toBase64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromBase64 = (str: string) =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

async function deriveKey(password: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Hardcoded salt & iterations just to satisfy API
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(1), // single zero byte
      iterations: 1,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(text: string, password: string): Promise<string> {
  const key = await deriveKey(password);
  const iv = new Uint8Array(12); // All-zero IV (bad for real security, but meets your request)
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(text)
  );
  return toBase64(ciphertext);
}

export async function decrypt(
  base64: string,
  password: string
): Promise<string> {
  const key = await deriveKey(password);
  const iv = new Uint8Array(12); // Must match encryption
  const ciphertext = fromBase64(base64);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return dec.decode(plaintext);
}
