import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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
  handleLightMeter,
  getAllDiscoveredModels,
  discoverGroqVisionModels,
  getHealthDiagnostic
} from './server/botanyAiEngine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // CORS middleware para permitir llamadas locales y desde preview
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, X-GreenLens-Route, X-Target-Route'
    );
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Endpoint de salud con diagnóstico seguro de la capa Groq (Requirement 20)
  const sendHealth = async (req: express.Request, res: express.Response) => {
    res.type('application/json');
    const apiKey = getSanitizedGroqApiKey();

    if (apiKey && getAllDiscoveredModels().length === 0) {
      try {
        await discoverGroqVisionModels(apiKey);
      } catch (err) {
        console.warn('[Groq] Initial health diagnostics discovery failed:', err);
      }
    }

    const diagnostic = getHealthDiagnostic();

    res.json({
      status: 'ok',
      environment: 'express-server',
      isAiConfigured: Boolean(apiKey),
      timestamp: new Date().toISOString(),
      ...diagnostic
    });
  };

  // Rutas de salud
  app.get('/api/health', sendHealth);
  app.post('/api/health', sendHealth);
  app.get('/health', sendHealth);
  app.post('/health', sendHealth);

  // Helper para procesar operaciones botánicas
  const processOperation = async (route: string, req: express.Request, res: express.Response) => {
    res.type('application/json');
    try {
      const language = req.body?.language || 'es';
      let result: any;

      switch (route) {
        case '/identify-plant':
          result = await handleIdentifyPlant(req.body?.imageBase64, undefined, language);
          break;

        case '/identify-info':
          result = await handleIdentifyInfo(req.body?.className, undefined, language);
          break;

        case '/care-tools/guide':
          result = await handleCareGuide(req.body?.imageBase64, req.body?.plantName, undefined, language);
          break;

        case '/care-tools/watering':
          result = await handleWateringCalc(req.body, undefined, language);
          break;

        case '/care-tools/conditions':
          result = await handleConditions(req.body, undefined, language);
          break;

        case '/care-tools/health':
          result = await handlePlantHealth(req.body, undefined, language);
          break;

        case '/care-tools/light':
          result = await handleLightMeter(req.body, undefined, language);
          break;

        default:
          return res.status(404).json({
            error: `Endpoint no encontrado: ${route}`,
            code: 'ENDPOINT_NOT_FOUND'
          });
      }

      return res.json(result);
    } catch (err: any) {
      if (err instanceof BotanyAiError) {
        if (err.code === 'GROQ_VISION_RATE_LIMITED') {
          return res.status(err.statusCode || 429).json({
            error: true,
            code: 'GROQ_VISION_RATE_LIMITED',
            message: err.message,
            retryAfterMs: err.details?.retryAfterMs || 30000,
            availableVisionModels: err.details?.availableVisionModels || []
          });
        }
        return res.status(err.statusCode || 500).json({
          error: sanitizeErrorMessage(err.message),
          code: err.code,
          details: typeof err.details === 'string' ? sanitizeErrorMessage(err.details) : undefined
        });
      }

      return res.status(500).json({
        error: sanitizeErrorMessage(err?.message || 'Error al procesar la petición botánica'),
        code: 'SERVER_ERROR'
      });
    }
  };

  // Rutas directas específicas
  app.post('/api/identify-plant', (req, res) => processOperation('/identify-plant', req, res));
  app.post('/api/identify-info', (req, res) => processOperation('/identify-info', req, res));
  app.post('/api/care-tools/guide', (req, res) => processOperation('/care-tools/guide', req, res));
  app.post('/api/care-tools/watering', (req, res) => processOperation('/care-tools/watering', req, res));
  app.post('/api/care-tools/conditions', (req, res) => processOperation('/care-tools/conditions', req, res));
  app.post('/api/care-tools/health', (req, res) => processOperation('/care-tools/health', req, res));
  app.post('/api/care-tools/light', (req, res) => processOperation('/care-tools/light', req, res));

  // Router general para compatibilidad con Netlify functions y rutas parametrizadas
  const handleGeneralApi = (req: express.Request, res: express.Response) => {
    let route = req.path;
    if (req.query?.route) {
      route = '/' + String(req.query.route).replace(/^\/+/, '');
    } else if (req.body?._route) {
      route = '/' + String(req.body._route).replace(/^\/+/, '');
    } else {
      route = route
        .replace(/^\/\.netlify\/functions\/api/, '')
        .replace(/^\/api/, '');
      if (!route || route === '/') {
        route = '/health';
      }
    }

    if (!route.startsWith('/')) {
      route = '/' + route;
    }

    if (route === '/health') {
      return sendHealth(req, res);
    }

    if (req.method !== 'POST') {
      res.type('application/json');
      return res.status(405).json({
        error: `Método ${req.method} no permitido.`,
        code: 'METHOD_NOT_ALLOWED'
      });
    }

    return processOperation(route, req, res);
  };

  app.all('/api/*', handleGeneralApi);
  app.all('/.netlify/functions/api', handleGeneralApi);
  app.all('/.netlify/functions/api/*', handleGeneralApi);

  // Integración de Vite Middleware para Desarrollo o Archivos Estáticos en Producción
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[GREENLENS_SERVER] Servidor corriendo en http://localhost:${PORT}`);
    console.log(`[GREENLENS_SERVER] AI Gateway: Groq (${getGroqEndpoint()})`);
    console.log(`[GREENLENS_SERVER] AI Model: ${getGroqModel()}`);
  });
}

startServer().catch((err) => {
  console.error('[GREENLENS_SERVER_FATAL] Error arrancando el servidor:', err);
});
