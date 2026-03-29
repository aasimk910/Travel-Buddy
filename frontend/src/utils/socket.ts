import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/env";

export const socket = io(API_BASE_URL, {
  withCredentials: true,
  transports: ['websocket'],
  autoConnect: false,
  auth: (cb) => {
    cb({ token: localStorage.getItem("travelBuddyToken") || "" });
  },
});

