/**
 * End-to-End Encryption utilities using the Web Crypto API.
 *
 * Key exchange:  ECDH P-256
 * Room key:      AES-256-GCM (random per hike room)
 * Message enc:   AES-256-GCM with the room key
 *
 * Per-user key pair is generated once and stored in localStorage.
 * The public key is uploaded to the server so other users can wrap
 * the room key for us.  The private key never leaves the device.
 *
 * Room keys live in an in-memory cache (roomKeyCache).  They are
 * recovered on next login by requesting the wrapped copy from the
 * server and unwrapping it locally.
 */

// ── Storage keys ─────────────────────────────────────────────────────────────
const PRIV_KEY_LS = "tb_e2e_priv";
const PUB_KEY_LS  = "tb_e2e_pub";

// ── In-memory room-key cache (survives re-renders, cleared on page refresh) ──
const roomKeyCache = new Map<string, CryptoKey>();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str);
}

export function base64ToBuf(b64: string): Uint8Array<ArrayBuffer> {
  const decoded = atob(b64);
  const buf = new ArrayBuffer(decoded.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < decoded.length; i++) {
    view[i] = decoded.charCodeAt(i);
  }
  return view;
}

// ─────────────────────────────────────────────────────────────────────────────
// User key-pair management
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a new ECDH P-256 key pair and persist it to localStorage. */
export async function generateAndStoreKeyPair(): Promise<JsonWebKey> {
  const kp = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
  const pubJwk  = await crypto.subtle.exportKey("jwk", kp.publicKey);
  const privJwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  localStorage.setItem(PUB_KEY_LS,  JSON.stringify(pubJwk));
  localStorage.setItem(PRIV_KEY_LS, JSON.stringify(privJwk));
  return pubJwk;
}

/**
 * Return the stored public key JWK, or generate a new pair if none exists.
 * This is safe to call every time the app initialises.
 */
export async function getOrCreateKeyPair(): Promise<JsonWebKey> {
  const stored = localStorage.getItem(PUB_KEY_LS);
  if (stored) return JSON.parse(stored) as JsonWebKey;
  return generateAndStoreKeyPair();
}

/** Load the user's own private key from localStorage. */
export async function getMyPrivateKey(): Promise<CryptoKey | null> {
  const stored = localStorage.getItem(PRIV_KEY_LS);
  if (!stored) return null;
  try {
    return await crypto.subtle.importKey(
      "jwk",
      JSON.parse(stored) as JsonWebKey,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveKey", "deriveBits"]
    );
  } catch {
    return null;
  }
}

/** Import a foreign public key from its JWK representation. */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ECDH-derived wrapping key (for room-key distribution)
// ─────────────────────────────────────────────────────────────────────────────

async function deriveWrappingKey(
  myPrivate: CryptoKey,
  theirPublic: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublic },
    myPrivate,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Room-key lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a fresh AES-256-GCM room key. */
export async function generateRoomKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/** Export a room key to raw bytes. */
export async function exportRoomKeyRaw(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("raw", key);
}

/** Import raw bytes as a room key. */
export async function importRoomKeyRaw(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Wrap (encrypt) a room key for a specific recipient.
 * Uses ECDH between my private key and their public key as the wrapping key.
 */
export async function wrapRoomKey(
  roomKey: CryptoKey,
  myPrivateKey: CryptoKey,
  recipientPublicKeyJwk: JsonWebKey
): Promise<{ wrappedKey: string; iv: string; senderPublicKeyJwk: JsonWebKey }> {
  const recipientPublicKey = await importPublicKey(recipientPublicKeyJwk);
  const wrappingKey = await deriveWrappingKey(myPrivateKey, recipientPublicKey);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const raw = await exportRoomKeyRaw(roomKey);
  const wrapped = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, wrappingKey, raw);

  const myPubJwk = JSON.parse(localStorage.getItem(PUB_KEY_LS) || "null") as JsonWebKey;

  return {
    wrappedKey: bufToBase64(wrapped),
    iv: bufToBase64(iv),
    senderPublicKeyJwk: myPubJwk,
  };
}

/**
 * Unwrap (decrypt) a room key that was wrapped for us.
 * Uses ECDH between my private key and the sender's public key.
 */
export async function unwrapRoomKey(
  wrappedKey: string,
  iv: string,
  myPrivateKey: CryptoKey,
  senderPublicKeyJwk: JsonWebKey
): Promise<CryptoKey> {
  const senderPublicKey = await importPublicKey(senderPublicKeyJwk);
  const wrappingKey = await deriveWrappingKey(myPrivateKey, senderPublicKey);

  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuf(iv) },
    wrappingKey,
    base64ToBuf(wrappedKey)
  );
  return importRoomKeyRaw(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// Room-key cache helpers
// ─────────────────────────────────────────────────────────────────────────────

export function cacheRoomKey(hikeId: string, key: CryptoKey): void {
  roomKeyCache.set(hikeId, key);
}

export function getCachedRoomKey(hikeId: string): CryptoKey | undefined {
  return roomKeyCache.get(hikeId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Message encryption / decryption
// ─────────────────────────────────────────────────────────────────────────────

/** Encrypt plaintext with the room's AES-GCM key. Returns "base64(iv):base64(cipher)". */
export async function encryptMessage(plaintext: string, roomKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    roomKey,
    new TextEncoder().encode(plaintext)
  );
  return `${bufToBase64(iv)}:${bufToBase64(cipher)}`;
}

/**
 * Decrypt a message produced by encryptMessage.
 * Returns "[encrypted]" if decryption fails (e.g. wrong key or corrupted data).
 * Returns the input as-is if it does not look like an E2E ciphertext.
 */
export async function decryptMessage(ciphertext: string, roomKey: CryptoKey): Promise<string> {
  const parts = ciphertext.split(":");
  if (parts.length !== 2) return ciphertext; // not E2E-encrypted, show raw
  const [ivB64, dataB64] = parts;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBuf(ivB64) },
      roomKey,
      base64ToBuf(dataB64)
    );
    return new TextDecoder().decode(plain);
  } catch {
    return "[encrypted message — key unavailable]";
  }
}

/** Quick check: does a string look like an E2E ciphertext? */
export function isEncrypted(text: string): boolean {
  return /^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/.test(text);
}
