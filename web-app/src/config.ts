export const API_BASE = (() => {
  // Normalize env base URL if provided; strip trailing slashes
  const raw = process.env.REACT_APP_BACKEND_URL;
  const env = raw && raw.trim() ? raw.trim().replace(/\/+$/, '') : '';

  if (env) return env;

  const { protocol, hostname } = window.location;

  // GitHub Codespaces mapping: frontend runs on -3000/-3001, backend on -8001
  if (hostname.endsWith('.app.github.dev')) {
    // Replace "-<port>.app.github.dev" with "-8001.app.github.dev"
    const mappedHost = hostname.replace(/-\d+\.app\.github\.dev$/, '-8001.app.github.dev');
    return `${protocol}//${mappedHost}`;
  }

  // Local dev fallback: same host, FastAPI default port
  return `${protocol}//${hostname}:8001`;
})();

export const api = (path: string) => {
  // In CRA dev server, use relative paths so the proxy in package.json can forward to the backend
  if (process.env.NODE_ENV === 'development') {
    return path;
  }
  // In production, hit the absolute backend URL
  return `${API_BASE}${path}`;
};