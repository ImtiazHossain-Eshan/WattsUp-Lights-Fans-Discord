/**
 * Socket.IO client — single shared instance. App.jsx connects it on mount and
 * cleans up on unmount; socket.io handles reconnection automatically.
 */

import { io } from "socket.io-client";
import { BACKEND_URL } from "./api";

export const socket = io(BACKEND_URL, {
  autoConnect: false,
});
