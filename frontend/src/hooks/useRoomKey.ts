/**
 * useRoomKey — resolves the AES-256-GCM room key for a hike chat.
 *
 * Resolution order:
 *  1. In-memory cache (fastest, no async needed)
 *  2. Server-stored wrapped key  → unwrap locally
 *  3. Generate a new key         → distribute to all participants via server
 *  4. Socket peer request        → ask an online room member for the key
 *
 * Returns { roomKey, isReady, error }.
 * roomKey is null while loading or on unrecoverable error.
 */
import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";
import {
  getCachedRoomKey,
  cacheRoomKey,
  getMyPrivateKey,
  generateRoomKey,
  wrapRoomKey,
  unwrapRoomKey,
} from "../utils/e2e";
import {
  fetchMyRoomKey,
  distributeRoomKeys,
  fetchParticipantPublicKeys,
} from "../services/rooms";

export interface UseRoomKeyResult {
  roomKey: CryptoKey | null;
  isReady: boolean;
  error: string | null;
}

export function useRoomKey(hikeId: string | undefined): UseRoomKeyResult {
  const { user } = useAuth();
  const [roomKey, setRoomKey] = useState<CryptoKey | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Prevent double-initialisation in React Strict Mode / re-renders
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!hikeId || !user?.id) {
      setRoomKey(null);
      setIsReady(false);
      return;
    }

    // ── 1. In-memory cache hit ─────────────────────────────────────────────
    const cached = getCachedRoomKey(hikeId);
    if (cached) {
      setRoomKey(cached);
      setIsReady(true);
      return;
    }

    if (loadingRef.current) return;
    loadingRef.current = true;

    let cancelled = false;

    const resolve = async () => {
      try {
        const privateKey = await getMyPrivateKey();
        if (!privateKey) throw new Error("E2E private key not found in localStorage.");

        // ── 2. Try server-stored wrapped key ────────────────────────────────
        const stored = await fetchMyRoomKey(hikeId);
        if (stored && !cancelled) {
          const key = await unwrapRoomKey(
            stored.wrappedKey,
            stored.iv,
            privateKey,
            stored.senderPublicKeyJwk
          );
          cacheRoomKey(hikeId, key);
          setRoomKey(key);
          setIsReady(true);
          return;
        }

        // ── 3. Generate new room key + distribute to all participants ────────
        const participants = await fetchParticipantPublicKeys(hikeId);
        const newKey = await generateRoomKey();

        const myPubJwkStr = localStorage.getItem("tb_e2e_pub");
        const myPubJwk: JsonWebKey = myPubJwkStr ? JSON.parse(myPubJwkStr) : null;

        if (!myPubJwk) throw new Error("Own public key not found.");

        // Wrap for every participant that has uploaded their public key
        const wrappedEntries = await Promise.all(
          participants
            .filter((p) => p.publicKeyJwk !== null)
            .map(async (p) => {
              const { wrappedKey, iv, senderPublicKeyJwk } = await wrapRoomKey(
                newKey,
                privateKey,
                p.publicKeyJwk!
              );
              return { userId: p.userId, wrappedKey, iv, senderPublicKeyJwk };
            })
        );

        // Also wrap for ourselves if we weren't included
        const selfIncluded = participants.some((p) => p.userId === user.id);
        if (!selfIncluded) {
          const { wrappedKey, iv, senderPublicKeyJwk } = await wrapRoomKey(
            newKey,
            privateKey,
            myPubJwk
          );
          wrappedEntries.push({ userId: user.id!, wrappedKey, iv, senderPublicKeyJwk });
        }

        if (wrappedEntries.length > 0) {
          await distributeRoomKeys(hikeId, wrappedEntries);
        }

        if (!cancelled) {
          cacheRoomKey(hikeId, newKey);
          setRoomKey(newKey);
          setIsReady(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("useRoomKey error:", err);
          // ── 4. Fallback: request key from online peers via socket ──────────
          requestFromPeer(hikeId);
        }
      } finally {
        loadingRef.current = false;
      }
    };

    resolve();

    return () => {
      cancelled = true;
    };
  }, [hikeId, user?.id]);

  // ── Peer socket fallback ────────────────────────────────────────────────────
  // When we can't get the key from the server, ask another online room member.
  const requestFromPeer = (rid: string) => {
    const myPubJwkStr = localStorage.getItem("tb_e2e_pub");
    socket.emit("request_room_key", {
      roomId: rid,
      requesterId: user?.id,
      requesterPublicKeyJwk: myPubJwkStr ? JSON.parse(myPubJwkStr) : null,
    });
    setError("Waiting for a room member to share the encryption key…");
  };

  // Listen for a peer responding to our key request
  useEffect(() => {
    const userId = user?.id;
    if (!hikeId || !userId) return;

    const handleKeyProvided = async (data: {
      recipientId: string;
      wrappedKey: string;
      iv: string;
      senderPublicKeyJwk: JsonWebKey;
    }) => {
      if (data.recipientId !== userId) return; // not for us
      try {
        const privateKey = await getMyPrivateKey();
        if (!privateKey) return;
        const key = await unwrapRoomKey(
          data.wrappedKey,
          data.iv,
          privateKey,
          data.senderPublicKeyJwk
        );
        cacheRoomKey(hikeId, key);
        setRoomKey(key);
        setIsReady(true);
        setError(null);
      } catch (e) {
        console.error("Failed to unwrap peer-provided room key:", e);
        setError("Could not decrypt room key from peer.");
      }
    };

    // Listen for requests from OTHER users so we can help them
    const handleKeyRequested = async (data: {
      roomId: string;
      requesterId: string;
      requesterPublicKeyJwk: JsonWebKey | null;
    }) => {
      if (data.roomId !== hikeId) return;
      if (!data.requesterPublicKeyJwk) return;

      const myKey = getCachedRoomKey(hikeId);
      if (!myKey) return; // we don't have it either

      try {
        const privateKey = await getMyPrivateKey();
        if (!privateKey) return;
        const { wrappedKey, iv, senderPublicKeyJwk } = await wrapRoomKey(
          myKey,
          privateKey,
          data.requesterPublicKeyJwk
        );
        socket.emit("provide_room_key", {
          roomId: hikeId,
          recipientId: data.requesterId,
          wrappedKey,
          iv,
          senderPublicKeyJwk,
        });
      } catch (e) {
        console.error("Failed to provide room key to peer:", e);
      }
    };

    socket.on("room_key_provided", handleKeyProvided);
    socket.on("room_key_requested", handleKeyRequested);

    return () => {
      socket.off("room_key_provided", handleKeyProvided);
      socket.off("room_key_requested", handleKeyRequested);
    };
  }, [hikeId, user?.id]);

  return { roomKey, isReady, error };
}
