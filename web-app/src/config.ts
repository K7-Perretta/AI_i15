export const API_BASE = (() => {
  const env = process.env.REACT_APP_BACKEND_URL;
  if (env && env.trim()) return env.trim();

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