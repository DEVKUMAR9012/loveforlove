export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');

  if (typeof window === 'undefined') return 'http://localhost:4000';

  const { hostname, origin, protocol } = window.location;
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  if (isLoopback) return 'http://localhost:4000';
  if (protocol === 'http:') return `http://${hostname}:4000`;

  // HTTPS mobile/prod builds should set VITE_API_URL. Falling back to origin
  // avoids mixed-content failures and supports same-origin API proxies.
  return origin;
}
