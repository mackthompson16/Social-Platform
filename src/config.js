// Centralized configuration for API and WebSocket endpoints.
// Defaults point at the local backend (API and WS share the same port).
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
