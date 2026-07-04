/**
 * Socket.IO client — single shared instance. App.jsx connects it on mount and
 * cleans up on unmount; socket.io handles reconnection automatically.
 */

import { io } from "socket.io-client";
import { BACKEND_URL } from "./api";

// Empty BACKEND_URL (production same-origin) → connect to the page's own origin.
// The Socket.IO path lives under /api so one host routes it to the backend.
export const socket = io(BACKEND_URL || undefined, {
  path: "/api/socket.io",
  autoConnect: false,
});
