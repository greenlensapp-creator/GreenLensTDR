/**
 * Cliente HTTP unificado para GreenLens
 * Maneja llamadas a la API backend tanto en entorno AI Studio/Express como en Netlify Serverless Functions
 * y conexiones cross-origin desde GitHub Pages.
 */

import { getBackendBaseUrls } from '../config/apiConfig';

export interface ApiClientOptions {
  timeoutMs?: number;
}

/**
 * Sanitiza mensajes de error para evitar exponer cualquier clave, token o Bearer
 */
function sanitizeClientErrorMessage(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/Bearer\s+[A-Za-z0-9_\-\.]{6,}/gi, 'Bearer [REDACTED]')
    .replace(/gsk_[A-Za-z0-9_\-\.]{6,}/gi, '[REDACTED_GROQ_KEY]')
    .replace(/sk-[A-Za-z0-9_\-\.]{6,}/gi, '[REDACTED_KEY]')
    .replace(/(?:api_key|apikey|key)=['"]?[A-Za-z0-9_\-\.]{6,}['"]?/gi, 'key=[REDACTED]');
}

export class ApiError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, code?: string, statusCode?: number, details?: any) {
    super(sanitizeClientErrorMessage(message));
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = typeof details === 'string' ? sanitizeClientErrorMessage(details) : details;
  }
}

// Memorizar en la sesión la URL base del backend que respondió exitosamente
let cachedWorkingBaseUrl: string | null = null;

/**
 * Genera la lista ordenada de endpoints candidatos a probar
 */
function buildCandidateUrls(cleanPath: string): string[] {
  const baseUrls = getBackendBaseUrls();
  const urls: string[] = [];

  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const isLocalOrPreview = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('run.app') || !hostname.includes('netlify.app');

  // Si ya descubrimos qué base URL funciona en esta sesión, priorizarla
  if (cachedWorkingBaseUrl !== null && baseUrls.includes(cachedWorkingBaseUrl)) {
    const prefix = cachedWorkingBaseUrl;
    urls.push(`${prefix}/api/${cleanPath}`);
    if (!isLocalOrPreview) {
      urls.push(`${prefix}/.netlify/functions/api?route=${encodeURIComponent(cleanPath)}`);
      urls.push(`${prefix}/.netlify/functions/api/${cleanPath}`);
    }
  }

  for (const base of baseUrls) {
    if (base === cachedWorkingBaseUrl) continue;
    const prefix = base;
    urls.push(`${prefix}/api/${cleanPath}`);
    if (!isLocalOrPreview) {
      urls.push(`${prefix}/.netlify/functions/api?route=${encodeURIComponent(cleanPath)}`);
      urls.push(`${prefix}/.netlify/functions/api/${cleanPath}`);
    }
  }

  // Eliminar duplicados manteniendo orden
  return Array.from(new Set(urls));
}

/**
 * Realiza una petición POST segura a un endpoint del backend botánico.
 * Prueba de manera ordenada los endpoints y URLs candidatas (AI Studio, Netlify, o conexión GitHub -> Netlify).
 */
export async function postToApi<T>(
  endpointPath: string,
  payload: any,
  options: ApiClientOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs || 35000;
  const cleanPath = endpointPath.startsWith('/') ? endpointPath.slice(1) : endpointPath;
  const urlsToTry = buildCandidateUrls(cleanPath);

  // Enriquecer el payload con la ruta destino para que el backend la identifique siempre
  const enrichedPayload = {
    ...(payload && typeof payload === 'object' ? payload : {}),
    _route: cleanPath
  };

  let lastError: any = null;

  for (const url of urlsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log(`[LOCAL_API_REQUEST] Enviando petición a ${url}`, {
      endpoint: cleanPath
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-GreenLens-Route': cleanPath,
          'X-Target-Route': cleanPath
        },
        body: JSON.stringify(enrichedPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      // Si no es JSON (ej. Vite devolvió index.html o un 404 HTML), pasamos al siguiente candidato
      if (!isJson) {
        lastError = new ApiError(
          `El backend en ${url} no devolvió formato JSON.`,
          'INVALID_CONTENT_TYPE',
          response?.status || 0
        );
        continue;
      }

      // El endpoint devolvió JSON válido
      try {
        const parsed = new URL(url, window.location.href);
        cachedWorkingBaseUrl = parsed.origin === window.location.origin ? '' : parsed.origin;
      } catch {}

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Fallback a texto si fallase el parseo
        }

        const rawMessage = errorData?.error || `Error ${response?.status || 500}: ${response?.statusText || 'Internal Error'}`;
        const sanitizedMsg = sanitizeClientErrorMessage(rawMessage);
        const errorCode = errorData?.code || `HTTP_${response?.status || 500}`;

        console.warn(`[GreenLens Backend ${response?.status || 500}]`, errorCode, sanitizedMsg);
        // Al ser una respuesta directa del backend en JSON, lanzamos el error directamente sin cascadas
        throw new ApiError(sanitizedMsg, errorCode, response?.status || 500, errorData?.details);
      }

      const data = await response.json();
      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new ApiError(
          'Tiempo de espera agotado al conectar con el servidor.',
          'TIMEOUT',
          408
        );
      }

      if (err instanceof ApiError) {
        // Solo continuamos buscando si fue un error de Content-Type no JSON
        if (err.code === 'INVALID_CONTENT_TYPE') {
          lastError = err;
          continue;
        }
        // Si el backend devolvió un error JSON legítimo (ej. 401, 500, 502), propagarlo
        throw err;
      }

      lastError = err;
    }
  }

  // Si todas las opciones fallaron
  if (lastError instanceof ApiError) {
    throw lastError;
  }

  throw new ApiError(
    'No se pudo establecer conexión con el servidor botánico.',
    'NETWORK_ERROR',
    0
  );
}

/**
 * Consulta de estado / salud del servicio backend con diagnóstico seguro
 */
export async function checkBackendHealth(): Promise<{
  status: string;
  isAiConfigured: boolean;
  environment?: string;
  backendUrl?: string;
}> {
  const baseUrls = getBackendBaseUrls();
  const urls: string[] = [];

  for (const base of baseUrls) {
    const prefix = base;
    urls.push(`${prefix}/api/health`);
    urls.push(`${prefix}/.netlify/functions/api?route=health`);
    urls.push(`${prefix}/.netlify/functions/api/health`);
  }

  for (const u of urls) {
    try {
      const response = await fetch(u);
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        const aiPresent = Boolean(data?.isAiConfigured ?? data?.isLlmApiConfigured);
        try {
          const parsed = new URL(u, window.location.href);
          cachedWorkingBaseUrl = parsed.origin === window.location.origin ? '' : parsed.origin;
        } catch {}

        return {
          status: data?.status || 'ok',
          isAiConfigured: aiPresent,
          environment: data?.environment,
          backendUrl: u
        };
      }
    } catch {
      // Intentar siguiente URL
    }
  }

  return { status: 'offline', isAiConfigured: false };
}
