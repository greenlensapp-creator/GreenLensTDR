// netlify/functions/api.ts: Router Serverless para Netlify Functions con Groq
import 'dotenv/config';

export interface NetlifyEvent {
  httpMethod: string;
  headers: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
  body?: string | null;
  isBase64Encoded?: boolean;
  path?: string;
}

export interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

import {
  BotanyAiError,
  getSanitizedGroqApiKey,
  getGroqEndpoint,
  getGroqModel,
  sanitizeErrorMessage,
  handleIdentifyPlant,
  handleIdentifyInfo,
  handleCareGuide,
  handleWateringCalc,
  handleConditions,
  handlePlantHealth,
  handleLightMeter
} from '../../server/botanyAiEngine';

export const handler = async (event: NetlifyEvent, context?: any): Promise<NetlifyResponse> => {
  const origin = event.headers.origin || '*';

  const responseHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, X-GreenLens-Route, X-Target-Route',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: responseHeaders,
      body: ''
    };
  }

  let body: any = {};
  let rawBody = event.body || '';

  if (rawBody && event.isBase64Encoded) {
    try {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
    } catch (e) {
      console.warn('[Netlify Function] Error decodificando body base64:', e);
    }
  }

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }
  }

  const getHeader = (name: string): string | undefined => {
    return event.headers[name.toLowerCase()] || event.headers[name];
  };

  let route = '';
  const queryRoute = event.queryStringParameters?.route;
  const headerRoute = getHeader('x-target-route') || getHeader('x-greenlens-route');
  const bodyRoute = body?._route;

  if (queryRoute) {
    route = '/' + queryRoute.replace(/^\/+/, '');
  } else if (headerRoute) {
    route = '/' + String(headerRoute).replace(/^\/+/, '');
  } else if (bodyRoute) {
    route = '/' + String(bodyRoute).replace(/^\/+/, '');
  } else if (event.path) {
    const cleanPath = event.path
      .replace(/^\/\.netlify\/functions\/api\/?/, '')
      .replace(/^\/api\/?/, '')
      .replace(/^\/+/, '');
    route = cleanPath ? `/${cleanPath}` : '/health';
  } else {
    route = '/health';
  }

  const apiKey = getSanitizedGroqApiKey();
  const isConfigured = Boolean(apiKey);

  try {
    // 1. Endpoint de Salud
    if (route === '/health' || route === '/api/health') {
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({
          status: 'ok',
          environment: 'netlify-functions',
          isAiConfigured: isConfigured,
          gateway: 'Groq',
          model: getGroqModel(),
          endpoint: getGroqEndpoint().replace(/:\/\/[^@]+@/, '://'),
          timestamp: new Date().toISOString()
        })
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: responseHeaders,
        body: JSON.stringify({
          error: `Método ${event.httpMethod} no permitido.`,
          code: 'METHOD_NOT_ALLOWED',
          isAiConfigured: isConfigured
        })
      };
    }

    // 2. Comprobación de configuración
    if (!isConfigured) {
      return {
        statusCode: 503,
        headers: responseHeaders,
        body: JSON.stringify({
          error: 'El servicio de IA requiere la variable de entorno GROQ_API_KEY configurada en Netlify.',
          code: 'GROQ_NOT_CONFIGURED',
          isAiConfigured: false
        })
      };
    }

    // 3. Despacho de endpoints botánicos
    let result: any;
    const reqLanguage = body.language || 'es';

    switch (route) {
      case '/identify-plant':
        result = await handleIdentifyPlant(body.imageBase64, undefined, reqLanguage);
        break;

      case '/identify-info':
        result = await handleIdentifyInfo(body.className, undefined, reqLanguage);
        break;

      case '/care-tools/guide':
        result = await handleCareGuide(body.imageBase64, body.plantName, undefined, reqLanguage);
        break;

      case '/care-tools/watering':
        result = await handleWateringCalc(body, undefined, reqLanguage);
        break;

      case '/care-tools/conditions':
        result = await handleConditions(body, undefined, reqLanguage);
        break;

      case '/care-tools/health':
        result = await handlePlantHealth(body, undefined, reqLanguage);
        break;

      case '/care-tools/light':
        result = await handleLightMeter(body, undefined, reqLanguage);
        break;

      default:
        return {
          statusCode: 404,
          headers: responseHeaders,
          body: JSON.stringify({
            error: `Endpoint no encontrado: ${route}`,
            code: 'ENDPOINT_NOT_FOUND',
            isAiConfigured: isConfigured
          })
        };
    }

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(result)
    };
  } catch (err: any) {
    if (err instanceof BotanyAiError) {
      if (err.code === 'GROQ_VISION_RATE_LIMITED') {
        return {
          statusCode: err.statusCode || 429,
          headers: responseHeaders,
          body: JSON.stringify({
            error: true,
            code: 'GROQ_VISION_RATE_LIMITED',
            message: sanitizeErrorMessage(err.message),
            retryAfterMs: err.details?.retryAfterMs || 30000,
            availableVisionModels: err.details?.availableVisionModels || [],
            isAiConfigured: isConfigured
          })
        };
      }

      return {
        statusCode: err.statusCode || 500,
        headers: responseHeaders,
        body: JSON.stringify({
          error: sanitizeErrorMessage(err.message),
          code: err.code,
          details: typeof err.details === 'string' ? sanitizeErrorMessage(err.details) : undefined,
          isAiConfigured: isConfigured
        })
      };
    }

    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify({
        error: sanitizeErrorMessage(err?.message || 'Error interno en el servidor.'),
        code: 'INTERNAL_SERVER_ERROR',
        isAiConfigured: isConfigured
      })
    };
  }
};
