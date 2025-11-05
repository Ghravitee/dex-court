import { io, Socket } from "socket.io-client";

/**
 * Singleton instance of the active socket connection.
 */
let socket: Socket | null = null;

/**
 * Connects to the WebSocket server using JWT authentication.
 *
 * @param jwt - JWT token for authentication
 * @returns {Socket} - The active Socket.IO instance
 */
export function connectSocket(jwt: string): Socket {
  // Reuse existing socket if already connected
  if (socket && socket.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL, {
    path: "/ws",
    auth: { token: jwt },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"], // skip polling fallback (optional)
  });

  // Log connection events
  socket.on("connect", () => {
    console.log(`Socket connected: ${socket?.id}`);
  });

  socket.on("disconnect", (reason) => {
    console.warn(`Socket disconnected: ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
}

/**
 * Returns the existing socket instance.
 * Throws an error if it was never initialized.
 *
 * @throws Error if socket has not been connected
 */
export function getSocket(): Socket {
  if (!socket) {
    throw new Error(
      "Socket not initialized. Call connectSocket(jwt) before using getSocket().",
    );
  }
  return socket;
}
