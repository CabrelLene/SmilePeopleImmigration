// client/src/lib/socket.ts
import { io, Socket } from "socket.io-client";

const URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/api")
  .replace(/\/api\/?$/,""); // -> origin du serveur
let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(URL, { transports: ["websocket"], withCredentials: true });
  }
  return socket;
}
