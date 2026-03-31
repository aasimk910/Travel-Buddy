// frontend/src/utils/socket.ts
// Socket.IO client instance configured with JWT auth from localStorage.
// #region Imports
import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/env";
import { getToken } from "../services/auth";

// #endregion Imports
export const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ['websocket'],
  autoConnect: false,
  auth: (cb) => {
    cb({ token: getToken() || "" });
  },
});

