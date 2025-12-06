// Centralized configuration for API and WebSocket endpoints.
// Values are pulled from runtime or build-time env, falling back to local dev defaults.
// src/config.js

const runtimeConfig = window.__ENV || window.__CONFIG__;

const apiBaseFromEnv =
  runtimeConfig?.REACT_APP_API_URL ||
  runtimeConfig?.API_BASE_URL ||
  process.env.REACT_APP_API_URL;

const wsBaseFromEnv =
  runtimeConfig?.REACT_APP_WS_URL ||
  runtimeConfig?.WS_BASE_URL ||
  process.env.REACT_APP_WS_URL;

const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
const host = window.location.hostname || 'localhost';

// Default to localhost backend on port 5000 if nothing is configured.
export const API_BASE_URL = apiBaseFromEnv || `${protocol}://${host}:5000`;
export const WS_BASE_URL = wsBaseFromEnv || `${wsProtocol}://${host}:5000`;
