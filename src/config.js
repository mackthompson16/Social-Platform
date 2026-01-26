// Centralized configuration for API and WebSocket endpoints.
// Values are pulled from runtime or build-time env, but we avoid forcing localhost
// when the app is accessed from a remote host.
// src/config.js

const runtimeConfig = window.__ENV || window.__CONFIG__ || {};

const apiBaseFromEnv =
  runtimeConfig.REACT_APP_API_URL ||
  runtimeConfig.API_BASE_URL ||
  process.env.REACT_APP_API_URL;

const wsBaseFromEnv =
  runtimeConfig.REACT_APP_WS_URL ||
  runtimeConfig.WS_BASE_URL ||
  process.env.REACT_APP_WS_URL;

const { protocol: locProtocol = 'http:', hostname: locHost = 'localhost' } = window.location || {};
const protocol = locProtocol === 'https:' ? 'https' : 'http';
const wsProtocol = protocol === 'https' ? 'wss' : 'ws';

const isLocalHost = (hostname) =>
  !hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

// Prefer env values unless they point to localhost while the page is served from a non-local host.
const preferEnvOr = (envValue, fallback) => {
  if (!envValue) return fallback;
  try {
    const { hostname } = new URL(envValue);
    if (!isLocalHost(hostname)) return envValue;
    if (isLocalHost(locHost)) return envValue;
    return fallback;
  } catch {
    return envValue;
  }
};

// Default to same host on port 5000 if nothing is configured.
const isProdHost = !isLocalHost(locHost);
const apiDefault = isProdHost ? `${protocol}://api.${locHost}` : `${protocol}://${locHost}:5000`;
const wsDefault  = isProdHost ? `${wsProtocol}://api.${locHost}` : `${wsProtocol}://${locHost}:5001`;

export const API_BASE_URL = preferEnvOr(apiBaseFromEnv, apiDefault);
export const WS_BASE_URL  = preferEnvOr(wsBaseFromEnv,  wsDefault);

