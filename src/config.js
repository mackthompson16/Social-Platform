// Centralized configuration for API and WebSocket endpoints.
// Defaults point at the local backend (API and WS share the same port).
// src/config.js

// This will be "localhost" in dev, "44.213.76.187" on EC2
const host = window.location.hostname;

// Always talk to backend on port 5000 on the same host
export const API_BASE_URL = `http://${host}:5000`;
export const WS_BASE_URL = `ws://${host}:5000`;