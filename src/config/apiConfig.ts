/**
 * =========================================================================
 * 🌿 CONFIGURACIÓN DE CONEXIÓN Y BACKEND DE GREENLENS
 * =========================================================================
 * 
 * Gestiona de forma unificada la URL del backend seguro (Express en local/AI Studio
 * o Netlify Functions en producción).
 * 
 * Permite que:
 * 1. AI Studio funcione directamente en localhost / Cloud Run.
 * 2. Netlify funcione directamente en su mismo dominio.
 * 3. GitHub Pages (frontend estático) se comunique de forma segura con la
 *    Netlify Function desplegada sin exponer ninguna clave en el frontend.
 */

export function getBackendBaseUrls(): string[] {
  const urls: string[] = [];

  // 1. Variable de entorno configurada (Vite / Netlify / GitHub Actions)
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NETLIFY_URL) ||
    ''
  ).trim().replace(/\/+$/, '');

  if (envUrl) {
    urls.push(envUrl);
  }

  // 2. Variable guardada en localStorage (si el usuario la guardó en Ajustes o consola)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = (localStorage.getItem('greenlens_backend_url') || '').trim().replace(/\/+$/, '');
      if (stored && !urls.includes(stored)) {
        urls.push(stored);
      }
    } catch {
      // Ignorar restricciones de cookies/storage en entornos restringidos
    }
  }

  // 3. Detección inteligente según el host actual del navegador
  const isBrowser = typeof window !== 'undefined' && Boolean(window.location);
  const hostname = isBrowser ? window.location.hostname : '';
  const isGitHubPages = hostname.endsWith('github.io');

  if (!isGitHubPages) {
    // En AI Studio, Netlify o localhost, la URL relativa (mismo origen) es la prioridad número 1
    if (!urls.includes('')) {
      urls.unshift('');
    }
  } else {
    // En GitHub Pages (ej. greenlensapp-creator.github.io):
    // GitHub Pages NO tiene backend propio. Intentamos conectar con el despliegue de Netlify:
    const knownNetlifyUrls = [
      'https://proyecto-greenlens-tdr.netlify.app',
      'https://greenlens-tdr.netlify.app'
    ];

    for (const candidate of knownNetlifyUrls) {
      if (!urls.includes(candidate)) {
        urls.push(candidate);
      }
    }

    // Dejar la ruta relativa como último recurso de fallback
    if (!urls.includes('')) {
      urls.push('');
    }
  }

  return urls;
}

/**
 * Guarda o actualiza la URL del backend en localStorage para ejecuciones fuera de Netlify
 */
export function setCustomBackendUrl(url: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const clean = (url || '').trim().replace(/\/+$/, '');
      if (clean) {
        localStorage.setItem('greenlens_backend_url', clean);
      } else {
        localStorage.removeItem('greenlens_backend_url');
      }
    } catch {
      // Ignorar
    }
  }
}
