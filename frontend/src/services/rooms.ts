// frontend/src/services/rooms.ts
// API client for E2E encrypted chat room key exchange.
// #region Imports
import { API_BASE_URL } from "../config/env";

// #endregion Imports
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("travelBuddyToken");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
};

/** Upload our ECDH public key to the server so others can wrap keys for us. */
export async function uploadPublicKey(publicKeyJwk: JsonWebKey): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/users/public-key`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ publicKeyJwk }),
  });

  // Handle 401 Unauthorized
  if (res.status === 401) {
    localStorage.removeItem("travelBuddyToken");
    localStorage.removeItem("travelBuddyUser");
    window.location.href = "/login";
    throw new Error("Session expired - please log in again");
  }

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Upload public key failed: ${res.status} - ${error}`);
  }
}

/** Fetch our wrapped room key from the server, if it exists. */
export async function fetchMyRoomKey(hikeId: string): Promise<{
  wrappedKey: string;
  iv: string;
  senderPublicKeyJwk: JsonWebKey;
} | null> {
  const res = await fetch(`${API_BASE_URL}/api/rooms/${hikeId}/my-key`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
}

/** Store wrapped room-key entries for a list of participants. */
export async function distributeRoomKeys(
  hikeId: string,
  keys: Array<{
    userId: string;
    wrappedKey: string;
    iv: string;
    senderPublicKeyJwk: JsonWebKey;
  }>
): Promise<void> {
  await fetch(`${API_BASE_URL}/api/rooms/${hikeId}/keys`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ keys }),
  });
}

/** Fetch the public keys of all hike participants. */
export async function fetchParticipantPublicKeys(
  hikeId: string
): Promise<Array<{ userId: string; name: string; publicKeyJwk: JsonWebKey | null }>> {
  const res = await fetch(
    `${API_BASE_URL}/api/rooms/${hikeId}/participants-public-keys`,
    { headers: authHeaders() }
  );
  if (!res.ok) return [];
  return res.json();
}
