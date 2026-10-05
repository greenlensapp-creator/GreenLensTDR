// server/botanyAiEngine.ts: Capa centralizada de IA botánica con Groq API y selección automática de modelo
// Integración Oficial: GreenLens Frontend -> Backend (/api/identify-plant) -> Groq API (Selección automática y dinámica de modelo de visión) -> JSON Response

export class BotanyAiError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
    super(sanitizeErrorMessage(message));
    this.name = 'BotanyAiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = typeof details === 'string' ? sanitizeErrorMessage(details) : details;
  }
}

export type SupportedLanguage = 'es' | 'ca' | 'en' | 'ar';

export interface GroqApiRequestPayload {
  operation:
    | 'plant_identification'
    | 'plant_info'
    | 'care_guide'
    | 'watering_calculation'
    | 'ideal_conditions'
    | 'plant_health'
    | 'light_evaluation';
  language: SupportedLanguage;
  payload: any;
}

/**
 * Filtro de seguridad estricto para eliminar cualquier secreto, API key o token
 * antes de que pueda ser registrado en logs o devuelto en respuestas.
 */
export function sanitizeErrorMessage(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/Bearer\s+[A-Za-z0-9_\-\.]{6,}/gi, 'Bearer [REDACTED]')
    .replace(/gsk_[A-Za-z0-9_\-\.]{6,}/gi, '[REDACTED_GROQ_KEY]')
    .replace(/sk-[A-Za-z0-9_\-\.]{6,}/gi, '[REDACTED_KEY]')
    .replace(/(?:api_key|apikey|key)=['"]?[A-Za-z0-9_\-\.]{6,}['"]?/gi, 'key=[REDACTED]')
    .replace(/("x-api-key":\s*")[^"]+(")/gi, '$1[REDACTED]$2')
    .replace(/("Authorization":\s*")[^"]+(")/gi, '$1Bearer [REDACTED]$2');
}

/**
 * Obtiene la clave de autenticación para Groq de forma segura desde las variables de entorno o parámetro del cliente.
 */
export function getSanitizedGroqApiKey(overrideKey?: string): string | undefined {
  if (overrideKey && typeof overrideKey === 'string') {
    const cleaned = overrideKey
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .trim();
    if (cleaned.length > 5) return cleaned;
  }

  const env = process.env || {};
  const raw = env.GROQ_API_KEY || env.groq_api_key || env.Groq_Api_Key;

  if (!raw || typeof raw !== 'string') return undefined;

  const cleaned = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();

  return cleaned.length > 5 ? cleaned : undefined;
}

/**
 * Endpoint oficial de Groq Chat Completions.
 */
export function getGroqEndpoint(): string {
  return 'https://api.groq.com/openai/v1/chat/completions';
}

/**
 * Endpoint oficial de Groq Models.
 */
export function getGroqModelsEndpoint(): string {
  return 'https://api.groq.com/openai/v1/models';
}

// Modelos conocidos que han sido desactivados, deprecados o desarticulados por Groq para no intentar utilizarlos
export const DEPRECATED_GROQ_MODELS = new Set<string>([
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'qwen/qwen3.6-27b',
  'llama-3.2-11b-vision-preview',
  'llama-3.2-90b-vision-preview',
  'llava-v1.5-7b-4096-preview',
  'llama-3.2-11b-vision-instruct',
  'llama-3.2-90b-vision-instruct',
  'meta-llama/llama-3.2-11b-vision-instruct',
  'meta-llama/llama-3.2-90b-vision-instruct'
]);

// Lista de modelos de visión de respaldo conocidos en Groq (se consulta /openai/v1/models dinámicamente)
const DEFAULT_GROQ_VISION_FALLBACKS = [
  'qwen/qwen3.8-27b'
];

interface ModelCache {
  models: string[];
  timestamp: number;
}

let cachedVisionModels: ModelCache | null = null;
let lastSelectedModel: string = 'qwen/qwen3.8-27b';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

// Registro en memoria para rastrear cooldowns por rate limit (HTTP 429) por modelo
export interface RateLimitCooldown {
  cooldownUntil: number;
  limitType: 'TPD' | 'TPM' | 'RPD' | 'RPM' | 'ITPM' | 'OTPM' | 'GENERIC_429';
  retryMs: number;
  lastUsed?: number;
  rawError?: string;
}

// Persistencia en disco de los cooldowns de modelos para sobrevivir a reinicios/reloads del servidor
import fs from 'fs';
import path from 'path';

function getCooldownFilePath(): string {
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return path.join('/tmp', '.groq_cooldowns.json');
  }
  return path.join(process.cwd(), '.groq_cooldowns.json');
}

function persistCooldownsToFile(): void {
  try {
    const filePath = getCooldownFilePath();
    const data = Array.from(modelCooldowns.entries());
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // En entornos serverless o de solo lectura, la persistencia en memoria local es suficiente
  }
}

function loadCooldownsFromFile(): Map<string, RateLimitCooldown> {
  const map = new Map<string, RateLimitCooldown>();
  try {
    const filePath = getCooldownFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const entries = JSON.parse(raw);
      const now = Date.now();
      if (Array.isArray(entries)) {
        for (const [k, v] of entries) {
          if (v && typeof v.cooldownUntil === 'number' && v.cooldownUntil > now) {
            map.set(k, v);
          }
        }
      }
    }
  } catch (err) {
    // Ignorar si no existe archivo previo
  }
  return map;
}

const modelCooldowns = loadCooldownsFromFile();

/**
 * Devuelve el tiempo de espera mínimo en milisegundos de los modelos actualmente en cooldown.
 */
export function getShortestCooldownWaitMs(): number {
  const now = Date.now();
  let minWait = 10000;
  for (const [, cd] of modelCooldowns.entries()) {
    if (cd && cd.cooldownUntil > now) {
      const remaining = cd.cooldownUntil - now;
      if (remaining > 0 && (minWait === 10000 || remaining < minWait)) {
        minWait = remaining;
      }
    }
  }
  return minWait;
}

/**
 * Analiza el mensaje de error de Groq HTTP 429 para identificar el tipo de límite (TPD, TPM, ITPM, OTPM, RPD, RPM)
 * y extrae con precisión el tiempo de espera (ej. "9m6.048s", "45s", "1h2m", "500ms").
 */
export function parseGroqRateLimitDetails(errorDetail: string, retryAfterHeader?: string | null) {
  const msg = errorDetail || '';
  const msgLower = msg.toLowerCase();

  let limitType: RateLimitCooldown['limitType'] = 'GENERIC_429';
  if (msgLower.includes('tokens per day') || msgLower.includes('tpd')) limitType = 'TPD';
  else if (msgLower.includes('requests per day') || msgLower.includes('rpd')) limitType = 'RPD';
  else if (msgLower.includes('input tokens per minute') || msgLower.includes('itpm')) limitType = 'ITPM';
  else if (msgLower.includes('output tokens per minute') || msgLower.includes('otpm')) limitType = 'OTPM';
  else if (msgLower.includes('tokens per minute') || msgLower.includes('tpm')) limitType = 'TPM';
  else if (msgLower.includes('requests per minute') || msgLower.includes('rpm')) limitType = 'RPM';

  let retryMs = 0;

  if (retryAfterHeader) {
    const parsedSec = parseFloat(retryAfterHeader);
    if (!isNaN(parsedSec) && parsedSec > 0) {
      retryMs = Math.round(parsedSec * 1000);
    }
  }

  if (retryMs <= 0) {
    const tryAgainMatch = msg.match(/try again in\s+([0-9hms\.]+)/i);
    if (tryAgainMatch && tryAgainMatch[1]) {
      const timeStr = tryAgainMatch[1].trim();
      let calculatedMs = 0;

      const hoursMatch = timeStr.match(/([0-9\.]+)h/i);
      if (hoursMatch) calculatedMs += parseFloat(hoursMatch[1]) * 3600 * 1000;

      const minutesMatch = timeStr.match(/([0-9\.]+)m(?!s)/i);
      if (minutesMatch) calculatedMs += parseFloat(minutesMatch[1]) * 60 * 1000;

      const secondsMatch = timeStr.match(/([0-9\.]+)s/i);
      if (secondsMatch) calculatedMs += parseFloat(secondsMatch[1]) * 1000;

      const msMatch = timeStr.match(/([0-9\.]+)ms/i);
      if (msMatch) calculatedMs += parseFloat(msMatch[1]);

      if (calculatedMs > 0) {
        retryMs = Math.round(calculatedMs);
      }
    }
  }

  if (retryMs <= 0) {
    if (limitType === 'TPD' || limitType === 'RPD') {
      retryMs = 10 * 60 * 1000; // 10 minutos por defecto para límites diarios
    } else {
      retryMs = 30 * 1000; // 30 segundos para límites por minuto
    }
  }

  return { limitType, retryMs, rawMessage: msg };
}

export interface GroqModelMetadata {
  id: string;
  active: boolean;
  contextWindow: number;
  maxCompletionTokens: number;
  capabilities: string[];
  inputModalities: string[];
  outputModalities: string[];
  canProcessText: boolean;
  canProcessImages: boolean;
  canProcessAudio: boolean;
  canReturnJson: boolean;
  canUseTools: boolean;
  isDeprecated: boolean;
  isInCooldown: boolean;
  cooldownReason?: string;
  cooldownUntil?: number;
  cooldownRemainingMs?: number;
}

// Registro global de todos los modelos descubiertos
let discoveredGroqModels: GroqModelMetadata[] = [];

/**
 * Muestra el estado clasificado de todos los modelos en los logs de desarrollo exactamente en el formato solicitado.
 */
export function logModelStatus(): void {
  const now = Date.now();
  
  const totalModelsDiscovered = discoveredGroqModels.length;
  const activeModelsCount = discoveredGroqModels.filter(m => m.active).length;
  
  const visionModels = discoveredGroqModels
    .filter(m => m.canProcessImages)
    .map(m => m.id);
    
  const textModels = discoveredGroqModels
    .filter(m => m.canProcessText)
    .map(m => m.id);

  const cooldownedList = Array.from(modelCooldowns.entries())
    .filter(([_, cd]) => cd.cooldownUntil > now)
    .map(([id, cd]) => `${id} (${cd.limitType}, ${Math.ceil((cd.cooldownUntil - now) / 1000)}s left)`);

  const selectedVisionModel = getGroqModel();

  console.log(`[Groq] Total models discovered: ${totalModelsDiscovered}`);
  console.log(`[Groq] Active models: ${activeModelsCount}`);
  console.log(`[Groq] Vision models: [${visionModels.join(', ')}]`);
  console.log(`[Groq] Text models: [${textModels.join(', ')}]`);
  console.log(`[Groq] Models in cooldown: [${cooldownedList.join(', ')}]`);
  console.log(`[Groq] Selected vision model: ${selectedVisionModel}`);
}

export function getAllDiscoveredModels(): GroqModelMetadata[] {
  const now = Date.now();
  const models = discoveredGroqModels.length > 0 ? discoveredGroqModels : [
    {
      id: 'openai/gpt-oss-20b',
      active: true,
      contextWindow: 8192,
      maxCompletionTokens: 2048,
      capabilities: ['json_mode', 'tools'],
      inputModalities: ['text'],
      outputModalities: ['text'],
      canProcessText: true,
      canProcessImages: false,
      canProcessAudio: false,
      canReturnJson: true,
      canUseTools: true,
      isDeprecated: false,
      isInCooldown: false
    },
    {
      id: 'qwen/qwen3.8-27b',
      active: true,
      contextWindow: 8192,
      maxCompletionTokens: 2048,
      capabilities: ['json_mode', 'tools'],
      inputModalities: ['text', 'image'],
      outputModalities: ['text'],
      canProcessText: true,
      canProcessImages: true,
      canProcessAudio: false,
      canReturnJson: true,
      canUseTools: true,
      isDeprecated: false,
      isInCooldown: false
    }
  ];

  return models.map(m => {
    const cd = modelCooldowns.get(m.id);
    const inCooldown = !!(cd && cd.cooldownUntil > now);
    return {
      ...m,
      isInCooldown: inCooldown,
      cooldownReason: inCooldown ? cd!.limitType : undefined,
      cooldownUntil: inCooldown ? cd!.cooldownUntil : undefined,
      cooldownRemainingMs: inCooldown ? Math.max(0, cd!.cooldownUntil - now) : undefined
    };
  });
}

export function getActiveModels() {
  return getAllDiscoveredModels().filter(m => m.active);
}

export function getTextCompatibleModels() {
  return getAllDiscoveredModels().filter(m => m.canProcessText);
}

export function getVisionCompatibleModels() {
  return getAllDiscoveredModels().filter(m => m.canProcessImages);
}

export function getAvailablePlantScanModels() {
  return getAllDiscoveredModels().filter(m => m.active && m.canProcessImages && !m.isInCooldown);
}

export function getCooldownBlockedModels() {
  return getAllDiscoveredModels().filter(m => m.isInCooldown);
}

/**
 * Consulta la API oficial de Groq (https://api.groq.com/openai/v1/models)
 * para descubrir dinámicamente los modelos activos compatibles con visión / entrada de imágenes.
 */
export async function discoverGroqVisionModels(apiKey: string, forceRefresh: boolean = false): Promise<string[]> {
  const now = Date.now();
  if (!forceRefresh && cachedVisionModels && now - cachedVisionModels.timestamp < CACHE_TTL_MS && cachedVisionModels.models.length > 0) {
    logModelStatus();
    return cachedVisionModels.models;
  }

  try {
    console.log('[Groq] Querying available models from https://api.groq.com/openai/v1/models ...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(getGroqModelsEndpoint(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'GreenLens-App/2.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new BotanyAiError('GROQ_MODELS_UNAVAILABLE', `Error al consultar lista de modelos (HTTP ${response.status})`, response.status);
    }

    const json = await response.json();
    const modelList: any[] = json?.data || [];

    // Limpiar y registrar la lista real de modelos devuelta por la API
    discoveredGroqModels = [];

    for (const m of modelList) {
      const modelId: string = m?.id || '';
      if (!modelId) continue;

      const active = m.active !== false;
      const contextWindow = m.context_window || m.context_length || 0;
      const maxCompletionTokens = m.max_completion_tokens || m.max_output_length || 0;
      
      const capabilities = Array.isArray(m.supported_features) ? [...m.supported_features] : [];
      if (Array.isArray(m.supported_sampling_parameters)) {
        capabilities.push(...m.supported_sampling_parameters);
      }

      const inputModalities: string[] = Array.isArray(m.input_modalities) ? m.input_modalities : [];
      const outputModalities: string[] = Array.isArray(m.output_modalities) ? m.output_modalities : [];
      
      const idLower = modelId.toLowerCase();
      
      // La compatibilidad de visión se determina estrictamente por input_modalities o patrones de la API
      const hasImageModality = inputModalities.includes('image');
      const hasVisionPattern =
        idLower.includes('vision') ||
        idLower.includes('-vl') ||
        idLower.includes('multimodal') ||
        idLower.includes('llava') ||
        idLower.includes('qwen3');
      const canProcessImages = hasImageModality || hasVisionPattern;

      // Audio / Speech
      const canProcessAudio = inputModalities.includes('audio') || 
                              outputModalities.includes('speech') ||
                              idLower.includes('whisper') || 
                              idLower.includes('orpheus');

      // Seguridad / Clasificación (Prompt Guard)
      const isSecurity = idLower.includes('guard') && !idLower.includes('safeguard');

      // Texto / Chat
      const canProcessText = !canProcessAudio && !isSecurity && 
                             (inputModalities.includes('text') || !hasImageModality);

      // JSON / Tools capabilities
      const canReturnJson = capabilities.includes('json_mode') || 
                            capabilities.includes('json') || 
                            idLower.includes('llama') || 
                            idLower.includes('qwen') || 
                            idLower.includes('gpt-oss');
                            
      const canUseTools = capabilities.includes('tools') || capabilities.includes('tool_use');

      const isDeprecated = DEPRECATED_GROQ_MODELS.has(modelId) || 
                           idLower.includes('llama-3.1-8b') || 
                           idLower.includes('llama-3.3-70b') || 
                           idLower.includes('qwen3.6');

      discoveredGroqModels.push({
        id: modelId,
        active,
        contextWindow,
        maxCompletionTokens,
        capabilities,
        inputModalities,
        outputModalities,
        canProcessText,
        canProcessImages,
        canProcessAudio,
        canReturnJson,
        canUseTools,
        isDeprecated,
        isInCooldown: false
      });
    }

    const visionModels = discoveredGroqModels
      .filter(m => m.active && m.canProcessImages && !m.isDeprecated)
      .map(m => m.id);

    // Si el usuario configuró explícitamente GROQ_VISION_MODEL o GROQ_MODEL en .env y es válido, ponerlo primero
    const envCustom = (process.env.GROQ_VISION_MODEL || process.env.GROQ_MODEL || '').trim();
    if (envCustom && !DEPRECATED_GROQ_MODELS.has(envCustom)) {
      if (!visionModels.includes(envCustom)) {
        visionModels.unshift(envCustom);
      } else {
        const idx = visionModels.indexOf(envCustom);
        visionModels.splice(idx, 1);
        visionModels.unshift(envCustom);
      }
    }

    cachedVisionModels = {
      models: visionModels,
      timestamp: now
    };

    if (visionModels.length > 0) {
      lastSelectedModel = visionModels[0];
    }

    logModelStatus();

    return visionModels;
  } catch (err: any) {
    console.warn(`[Groq] Error discovering models: ${sanitizeErrorMessage(err.message || '')}`);
    throw err;
  }
}

/**
 * Filtra Y EXCLUYE de manera estricta cualquier modelo que se encuentre en cooldown por rate limit (HTTP 429).
 * NUNCA devuelve un modelo bloqueado en la lista de candidatos.
 */
export function getOrderedVisionModels(allModels: string[]): string[] {
  const now = Date.now();
  const validCandidates: string[] = [];

  for (const modelId of allModels) {
    if (!modelId) continue;

    if (DEPRECATED_GROQ_MODELS.has(modelId)) {
      console.log(`[Groq] Excluding decommissioned model ${modelId} from candidates.`);
      continue;
    }

    const cd = modelCooldowns.get(modelId);
    if (cd && cd.cooldownUntil > now) {
      const waitSec = Math.ceil((cd.cooldownUntil - now) / 1000);
      console.log(`[Groq] ${modelId} is in cooldown until ${new Date(cd.cooldownUntil).toISOString()} (${waitSec}s left, ${cd.limitType}). Excluding ${modelId} from candidates.`);
      continue; // EXCLUSIÓN ABSOLUTA
    }

    if (!validCandidates.includes(modelId)) {
      validCandidates.push(modelId);
    }
  }

  // Ordenar por menor uso reciente
  validCandidates.sort((a, b) => {
    const lastA = modelCooldowns.get(a)?.lastUsed || 0;
    const lastB = modelCooldowns.get(b)?.lastUsed || 0;
    return lastA - lastB;
  });

  return validCandidates;
}

/**
 * Devuelve el modelo actualmente seleccionado o disponible que NO esté en cooldown.
 */
export function getGroqModel(): string {
  const envCustom = (process.env.GROQ_VISION_MODEL || process.env.GROQ_MODEL || '').trim();
  if (envCustom && !DEPRECATED_GROQ_MODELS.has(envCustom)) {
    const cd = modelCooldowns.get(envCustom);
    if (!cd || cd.cooldownUntil <= Date.now()) {
      return envCustom;
    }
  }

  const available = getOrderedVisionModels(Array.from(cachedVisionModels?.models || DEFAULT_GROQ_VISION_FALLBACKS));
  if (available.length > 0) {
    return available[0];
  }

  return 'Ninguno disponible (todos en cooldown por TPD/TPM)';
}

export interface SelectModelOptions {
  taskType?: string;
  inputType?: 'text' | 'image' | 'audio';
  language?: SupportedLanguage;
  requiresJson?: boolean;
  requiresVision?: boolean;
  requiresAudio?: boolean;
}

/**
 * Enrutador centralizado para seleccionar de forma dinámica e inteligente el mejor modelo de Groq
 * basándose en capacidades técnicas reales, estado activo, deprecación y cooldowns.
 */
export function selectGroqModel(options: SelectModelOptions): string | null {
  const now = Date.now();
  const requiresVision = options.requiresVision || options.inputType === 'image';
  const requiresAudio = options.requiresAudio || options.inputType === 'audio';

  const candidates = getAllDiscoveredModels().filter(m => {
    // 1. Debe estar activo y no estar deprecado
    if (!m.active || m.isDeprecated) return false;
    // 2. Debe estar libre de cooldown
    if (m.isInCooldown) return false;
    
    // 3. Filtrar por requerimiento de visión
    if (requiresVision) {
      return m.canProcessImages;
    }
    
    // 4. Filtrar por requerimiento de audio
    if (requiresAudio) {
      return m.canProcessAudio;
    }
    
    // 5. Filtrar por requerimiento de texto puro (excluyendo audio y guardias de seguridad)
    const isGuard = m.id.toLowerCase().includes('guard') && !m.id.toLowerCase().includes('safeguard');
    return m.canProcessText && !m.canProcessAudio && !isGuard;
  });

  // Ordenar candidatos por orden de preferencia y uso reciente
  candidates.sort((a, b) => {
    // Si NO requiere visión ni audio, preferir modelos de texto puro que NO procesan imágenes
    if (!requiresVision && !requiresAudio) {
      const aIsVision = a.canProcessImages;
      const bIsVision = b.canProcessImages;
      if (aIsVision !== bIsVision) {
        return aIsVision ? 1 : -1;
      }
    }

    const lastA = modelCooldowns.get(a.id)?.lastUsed || 0;
    const lastB = modelCooldowns.get(b.id)?.lastUsed || 0;
    if (lastA !== lastB) return lastA - lastB;

    const priority = (id: string) => {
      const lower = id.toLowerCase();
      if (lower.includes('gpt-oss-20b')) return 100;
      if (lower.includes('gpt-oss-120b')) return 90;
      if (lower.includes('safeguard-20b')) return 80;
      if (lower.includes('minimax')) return 70;
      if (lower.includes('qwen3.8')) return 60;
      return 1;
    };
    return priority(b.id) - priority(a.id);
  });

  const selected = candidates.length > 0 ? candidates[0].id : null;

  // Logs detallados y estandarizados para desarrollo (Requirement 21)
  console.log(`[Groq Router]`);
  console.log(`Task: ${options.taskType || 'unknown'}`);
  console.log(`Input: ${options.inputType || 'text'}`);
  console.log(`hasImage: ${requiresVision}`);
  console.log(`requiresVision: ${requiresVision}`);
  console.log(`Selected model: ${selected || 'NONE'}`);

  return selected;
}

export function getHealthDiagnostic() {
  const now = Date.now();
  
  const totalModels = discoveredGroqModels.length;
  const activeModels = discoveredGroqModels.filter(m => m.active).map(m => m.id);
  const deprecatedModels = discoveredGroqModels.filter(m => m.isDeprecated).map(m => m.id);
  const textModels = discoveredGroqModels.filter(m => m.canProcessText).map(m => m.id);
  const visionModels = discoveredGroqModels.filter(m => m.canProcessImages).map(m => m.id);
  const audioModels = discoveredGroqModels.filter(m => m.canProcessAudio).map(m => m.id);
  
  const securityModels = discoveredGroqModels
    .filter(m => m.id.toLowerCase().includes('guard') && !m.id.toLowerCase().includes('safeguard'))
    .map(m => m.id);

  const availableTextModels = getOrderedVisionModels(discoveredGroqModels.filter(m => m.canProcessText).map(m => m.id));
  const availableVisionModels = getOrderedVisionModels(discoveredGroqModels.filter(m => m.canProcessImages).map(m => m.id));

  const cooldownModels = Array.from(modelCooldowns.entries())
    .filter(([_, cd]) => cd.cooldownUntil > now)
    .map(([id, cd]) => `${id} (${cd.limitType}, ${Math.ceil((cd.cooldownUntil - now) / 1000)}s left)`);

  const selectedTextModel = selectGroqModel({ inputType: 'text' }) || 'None';
  const selectedVisionModel = selectGroqModel({ inputType: 'image' }) || 'None';

  const allDiscoveredDetail = discoveredGroqModels.map(m => {
    const cd = modelCooldowns.get(m.id);
    const inCooldown = !!(cd && cd.cooldownUntil > now);
    return {
      id: m.id,
      active: m.active,
      capabilities: m.capabilities,
      input_modalities: m.inputModalities,
      output_modalities: m.outputModalities,
      cooldown: inCooldown,
      cooldown_remaining: inCooldown ? Math.ceil((cd!.cooldownUntil - now) / 1000) : 0,
      cooldown_reason: inCooldown ? cd!.limitType : ''
    };
  });

  return {
    gateway: "Groq",
    totalModels,
    activeModels,
    deprecatedModels,
    textModels,
    visionModels,
    audioModels,
    securityModels,
    availableTextModels,
    availableVisionModels,
    cooldownModels,
    selectedTextModel,
    selectedVisionModel,
    allDiscoveredDetail
  };
}

export interface PreparedGroqRequest {
  system: string;
  user: any;
  maxTokens: number;
  estimatedInputTokens: number;
  estimatedTotalTokens: number;
  contextWindow: number;
}

/**
 * Función central de control y preparación de contexto (Context Guard)
 * Evalúa, previene y reduce de forma proactiva el tamaño de la petición
 * antes de despacharla a Groq para evitar context_length_exceeded.
 */
export function prepareGroqRequest(
  model: string,
  system: string,
  user: any,
  requestedMaxTokens: number
): PreparedGroqRequest {
  const modelMeta = discoveredGroqModels.find(m => m.id === model);
  const contextWindow = modelMeta?.contextWindow || 8192; // fallback a 8k
  
  // Estimación de tokens del System Prompt (1 token cada 3.5 caracteres aprox.)
  let systemTokens = Math.ceil((system || '').length / 3.5);
  
  // Estimación de tokens del User Prompt
  let userTokens = 0;
  let imageCount = 0;
  
  if (typeof user === 'string') {
    userTokens = Math.ceil(user.length / 3.5);
  } else if (Array.isArray(user)) {
    for (const item of user) {
      if (item && typeof item === 'object') {
        if (item.type === 'text' && typeof item.text === 'string') {
          userTokens += Math.ceil(item.text.length / 3.5);
        } else if (item.type === 'image_url') {
          userTokens += 1200; // Costo estimado de procesamiento por imagen para Groq Vision
          imageCount++;
        }
      }
    }
  }

  let estimatedInputTokens = systemTokens + userTokens + 50; // Margen adicional por formateo
  const safetyMargin = Math.min(2000, Math.ceil(contextWindow * 0.15)); // Margen de seguridad dinámico del 15%
  
  let targetMaxTokens = requestedMaxTokens;
  let estimatedTotalTokens = estimatedInputTokens + targetMaxTokens;

  // Registro del Context Guard para depuración
  console.log(`[Groq Context Guard]`);
  console.log(`model: ${model}`);
  console.log(`contextWindow: ${contextWindow}`);
  console.log(`estimatedInputTokens: ${estimatedInputTokens}`);
  console.log(`requestedMaxTokens: ${requestedMaxTokens}`);
  console.log(`estimatedTotalTokens: ${estimatedTotalTokens}`);
  console.log(`safetyMargin: ${safetyMargin}`);

  // Si se supera el límite de contexto del modelo, compactar proactivamente (Orden de Reducción)
  if (estimatedTotalTokens > contextWindow - safetyMargin) {
    console.warn(`[Groq Context Guard] Límite de contexto superado. Iniciando reducción de contenido...`);
    
    let historyRemoved = 'None';
    let duplicateContentRemoved = 'None';
    let promptReduced = 'None';
    
    // 1. Reducir max_tokens de forma inteligente para acomodar la entrada
    const maxAvailableForCompletion = contextWindow - estimatedInputTokens - safetyMargin;
    if (maxAvailableForCompletion >= 150) {
      targetMaxTokens = Math.max(150, Math.min(requestedMaxTokens, maxAvailableForCompletion));
      estimatedTotalTokens = estimatedInputTokens + targetMaxTokens;
      promptReduced = `Reduced max_tokens from ${requestedMaxTokens} to ${targetMaxTokens}`;
    }

    // 2. Si todavía excede, compactar system y user prompts eliminando descripciones o detalles secundarios
    if (estimatedTotalTokens > contextWindow - safetyMargin) {
      let compactedSystem = system;
      if (compactedSystem.length > 400) {
        compactedSystem = compactedSystem
          .replace(/CRITICAL INSTRUCTION:/g, 'Rule:')
          .replace(/STRICT LANGUAGE RULE:/g, 'Lang rule:')
          .replace(/Return EXACTLY this JSON structure with concise values[\s\S]*?{/g, 'Return EXACTLY this JSON:\n{');
        promptReduced = 'System prompt compacted';
      }
      
      let compactedUser = user;
      if (typeof compactedUser === 'string' && compactedUser.length > 400) {
        compactedUser = compactedUser.slice(0, 400) + '... (truncated for context)';
        duplicateContentRemoved = 'User prompt truncated';
      } else if (Array.isArray(compactedUser)) {
        compactedUser = compactedUser.map(item => {
          if (item && item.type === 'text' && typeof item.text === 'string' && item.text.length > 400) {
            return { ...item, text: item.text.slice(0, 400) + '... (truncated)' };
          }
          return item;
        });
        duplicateContentRemoved = 'User text contents truncated';
      }

      // Recalcular tokens
      systemTokens = Math.ceil(compactedSystem.length / 3.5);
      if (typeof compactedUser === 'string') {
        userTokens = Math.ceil(compactedUser.length / 3.5);
      } else if (Array.isArray(compactedUser)) {
        userTokens = 0;
        for (const item of compactedUser) {
          if (item && typeof item === 'object') {
            if (item.type === 'text' && typeof item.text === 'string') {
              userTokens += Math.ceil(item.text.length / 3.5);
            } else if (item.type === 'image_url') {
              userTokens += 1200;
            }
          }
        }
      }

      estimatedInputTokens = systemTokens + userTokens + 50;
      targetMaxTokens = Math.max(150, Math.min(targetMaxTokens, contextWindow - estimatedInputTokens - safetyMargin));
      estimatedTotalTokens = estimatedInputTokens + targetMaxTokens;

      system = compactedSystem;
      user = compactedUser;
    }

    console.log(`[Groq Context Reduction]`);
    console.log(`historyRemoved: ${historyRemoved}`);
    console.log(`duplicateContentRemoved: ${duplicateContentRemoved}`);
    console.log(`promptReduced: ${promptReduced}`);
    console.log(`imageCount: ${imageCount}`);
    console.log(`finalEstimatedInputTokens: ${estimatedInputTokens}`);
  }

  return {
    system,
    user,
    maxTokens: targetMaxTokens,
    estimatedInputTokens,
    estimatedTotalTokens,
    contextWindow
  };
}

/**
 * Invalida el caché de modelos para forzar una nueva consulta a la API de Groq en la próxima petición.
 */
export function invalidateGroqModelCache(): void {
  cachedVisionModels = null;
}

/**
 * Extractor y validador de respuestas JSON para Groq con alta tolerancia a formatos
 */
export function extractAndParseJson(rawContent: string): any {
  if (!rawContent || typeof rawContent !== 'string') {
    throw new BotanyAiError('EMPTY_RESPONSE', 'La respuesta del servicio está vacía', 502);
  }

  let text = rawContent.trim();

  // 1. Eliminar etiquetas de razonamiento <think> ... </think> y comentarios JS
  text = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n\r]*/g, '')
    .trim();

  // 2. Extraer de bloques Markdown ```json ... ``` o ``` ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const inner = codeBlockMatch[1].trim();
    try {
      return JSON.parse(inner);
    } catch {}
    text = inner;
  }

  // 3. Intento directo de parseo JSON
  try {
    return JSON.parse(text);
  } catch {}

  // 4. Buscar llaves de objeto JSON más externas { ... }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}

    try {
      const fixed = candidate
        .replace(/,\s*([\}\]])/g, '$1')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*)'/g, ':"$1"')
        .replace(/[\u0000-\u001F]+/g, ' ');
      return JSON.parse(fixed);
    } catch {}
  }

  // 5. Buscar corchetes de array JSON [ ... ]
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.slice(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  throw new BotanyAiError(
    'INVALID_JSON_RESPONSE',
    'El modelo devolvió una respuesta que no pudo ser procesada como JSON válido.',
    502,
    { rawPreview: text.slice(0, 300) }
  );
}

/**
 * Construye el prompt y mensajes para Groq según la operación botánica solicitada
 */
function buildGroqMessages(request: GroqApiRequestPayload): { system: string; user: any; hasImage: boolean } {
  const lang = request.language || 'es';
  const langMap: Record<SupportedLanguage, string> = {
    es: 'español',
    ca: 'català (Catalan)',
    en: 'English',
    ar: 'العربية (Arabic)'
  };
  const targetLangName = langMap[lang] || 'español';

  const baseJsonRule = `CRITICAL INSTRUCTION: You MUST respond ONLY with a single, valid, parseable JSON object. No explanations, no markdown wrap outside json, no chit-chat. ALL textual field values, common names (except scientific binomial name in Latin), category, care recommendations, toxicity details, plant type, life cycle, and characteristics MUST be written strictly and entirely in ${targetLangName}. NEVER use Spanish if ${targetLangName} is not Spanish.`;

  switch (request.operation) {
    case 'plant_identification': {
      const { imageBase64 } = request.payload;
      const system = `You are a world-class botanical expert for GreenLens.
Analyze the image and identify the plant species, generating a compact technical card.

${baseJsonRule}

STRICT LANGUAGE RULE: Every text value in the JSON MUST be in ${targetLangName}.

Return EXACTLY this JSON structure with concise values (1 to 4 words per field):
{
  "isPlant": boolean, // true if plant/flower/tree/cactus/succulent; false otherwise
  "name": string, // Common name strictly in ${targetLangName}
  "scientificName": string, // Latin scientific binomial name
  "confidencePercentage": number, // 0 to 100
  "isCertain": boolean, // true if confidencePercentage >= 70
  "category": string, // Category in ${targetLangName} (e.g. "Indoor ornamental", "Aromàtica d'interior", "زينة داخلية")
  "family": string, // Botanical family (e.g. "Araceae")
  "description": string, // Single visual descriptive sentence of 10 to 15 words max in ${targetLangName}
  "origin": string, // Origin region in 1-3 words in ${targetLangName} (e.g. "Central America", "Amèrica Central", "أمريكا الوسطى")
  "naturalHabitat": string, // Short habitat in ${targetLangName} (e.g. "Tropical rainforest", "Selva tropical", "غابة استوائية")
  "care": {
    "light": string, // In ${targetLangName} (e.g. "Bright indirect light", "Llum indirecta brillant", "ضوء غير مباشر ساطع")
    "watering": string, // In ${targetLangName} (e.g. "Dry soil between waterings", "Sostrat sec entre regs", "ري عند جفاف التربة")
    "temperature": string // In ${targetLangName} (e.g. "18-25°C, frost free", "18-25°C, sense gelades", "18-25°م، حماية من الصقيع")
  },
  "toxicity": {
    "isToxicToHumans": boolean,
    "isToxicToPets": boolean,
    "details": string // In ${targetLangName} if toxic, or "" if safe
  },
  "plantType": string, // In ${targetLangName} (e.g. "Indoor climber", "Enredadera d'interior", "متسلقة داخلية")
  "lifeCycle": string, // In ${targetLangName} (e.g. "Perennial", "Perenne", "معمر", "Annual", "Anual", "سنوي")
  "characteristics": {
    "approximateHeight": string, // E.g. "1–3 m"
    "leafColor": string, // In ${targetLangName} (e.g. "Dark green", "Verd fosc", "أخضر داكن")
    "leafType": string, // In ${targetLangName} (e.g. "Large fenestrated", "Gran fenestrada", "كبيرة ومخرمة")
    "flowerColor": string, // In ${targetLangName} (e.g. "White / Rare", "Blanca / Rara", "أبيض / نادر")
    "plantingSeason": string // In ${targetLangName} (e.g. "Spring", "Primavera", "الربيع")
  }
}`;

      const userContent: any[] = [
        {
          type: 'text',
          text: `Identify the plant in this photo and return the JSON card strictly in ${targetLangName}.`
        }
      ];

      if (imageBase64) {
        const formattedImageUrl = imageBase64.startsWith('data:')
          ? imageBase64
          : `data:image/jpeg;base64,${imageBase64}`;

        userContent.push({
          type: 'image_url',
          image_url: {
            url: formattedImageUrl
          }
        });
      }

      return { system, user: userContent, hasImage: Boolean(imageBase64) };
    }

    case 'plant_info': {
      const { className } = request.payload;
      const system = `Eres un botánico experto para GreenLens.
Proporciona la ficha botánica enciclopédica completa para la especie botánica solicitada.
${baseJsonRule}
Devuelve el mismo esquema JSON completo de identificación botánica (isPlant=true, name, scientificName, confidencePercentage=98, isCertain=true, category, family, origin, size, location, tags, description, care, toxicityAlert, naturalHabitat, curiosities, observedCharacteristics, possibleAlternatives).`;

      const userContent = `Genera la ficha botánica completa en ${targetLangName} para: "${className}".`;
      return { system, user: userContent, hasImage: false };
    }

    case 'care_guide': {
      const { imageBase64, plantName } = request.payload;
      const system = `Eres un experto en agronomía y botánica de GreenLens.
Crea una guía de cuidados profesional personalizada y exhaustiva para la planta.
${baseJsonRule}
Devuelve un JSON con:
{
  "plantName": string,
  "scientificName": string,
  "watering": { "frequency": string, "tips": string, "amount": string },
  "light": { "requirement": string, "placement": string },
  "temperature": { "min": string, "max": string, "ideal": string },
  "humidity": { "percentage": string, "advice": string },
  "soil": { "type": string, "drainage": string },
  "fertilizer": { "frequency": string, "type": string },
  "pruning": { "season": string, "technique": string },
  "seasonalAdvice": { "spring": string, "summer": string, "autumn": string, "winter": string },
  "commonMistakes": string[]
}`;

      const userContent: any[] = [
        {
          type: 'text',
          text: `Genera una guía de cuidados completa en ${targetLangName} para: ${plantName || 'la planta de la imagen'}.`
        }
      ];

      if (imageBase64) {
        const formattedImageUrl = imageBase64.startsWith('data:')
          ? imageBase64
          : `data:image/jpeg;base64,${imageBase64}`;
        userContent.push({
          type: 'image_url',
          image_url: { url: formattedImageUrl }
        });
      }

      return { system, user: userContent, hasImage: Boolean(imageBase64) };
    }

    case 'watering_calculation': {
      const { imageBase64, plantName } = request.payload || {};
      const system = `Botanical watering advisor. Language: ${targetLangName}. Respond ONLY with a compact JSON object with exactly these 4 keys:
{"plantName":"name in ${targetLangName}","wateringFrequency":"approximate frequency in ${targetLangName}","wateringAmount":"approximate volume with unit (e.g. 250–350 ml)","recommendation":"one concise sentence in ${targetLangName}"}`;

      const userText = plantName
        ? `Plant: "${plantName}". Calculate watering in ${targetLangName}. Output JSON only.`
        : `Identify plant in photo and calculate watering in ${targetLangName}. Output JSON only.`;

      const userContent: any[] = [
        {
          type: 'text',
          text: userText
        }
      ];

      if (imageBase64) {
        const formattedImageUrl = imageBase64.startsWith('data:')
          ? imageBase64
          : `data:image/jpeg;base64,${imageBase64}`;
        userContent.push({
          type: 'image_url',
          image_url: { url: formattedImageUrl }
        });
      }

      return {
        system,
        user: imageBase64 ? userContent : userText,
        hasImage: Boolean(imageBase64)
      };
    }

    case 'ideal_conditions': {
      const system = `Eres un experto en climatología de plantas para GreenLens.
Evalúa las condiciones ambientales ideales para la planta indicada.
${baseJsonRule}
Devuelve un JSON con:
{
  "light": { "type": string, "hoursPerDay": number, "notes": string },
  "temperature": { "min": number, "max": number, "optimal": number },
  "humidity": { "min": number, "max": number, "optimal": number },
  "airFlow": string,
  "summary": string
}`;
      return { system, user: `Evalúa las condiciones ideales para: ${JSON.stringify(request.payload)}`, hasImage: false };
    }

    case 'plant_health': {
      const system = `Eres un fitopatólogo experto de GreenLens.
Diagnostica la salud de la planta e identifica plagas, enfermedades, carencias o excesos de riego basándote en los datos e imágenes suministradas.
${baseJsonRule}
Devuelve un JSON con:
{
  "healthStatus": "healthy" | "warning" | "critical",
  "issues": [
    {
      "name": string,
      "severity": "low" | "medium" | "high",
      "symptoms": string[],
      "treatment": string,
      "prevention": string
    }
  ],
  "urgency": string,
  "overallAdvice": string
}`;
      const userContent: any[] = [
        {
          type: 'text',
          text: `Diagnostica la salud botánica con esta información: ${JSON.stringify(request.payload?.plantName || '')}`
        }
      ];

      let hasImg = false;
      if (Array.isArray(request.payload?.images)) {
        for (const img of request.payload.images) {
          if (img) {
            hasImg = true;
            const formatted = img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
            userContent.push({ type: 'image_url', image_url: { url: formatted } });
          }
        }
      }

      return { system, user: userContent, hasImage: hasImg };
    }

    case 'light_evaluation': {
      const system = `Eres un asesor de iluminación hortícola para GreenLens.
Evalúa la medición de luz en lux/fc y determina qué especies vegetales prosperan en ese nivel de luz.
${baseJsonRule}
Devuelve un JSON con:
{
  "lightLevelCategory": string,
  "luxAssessment": string,
  "suitablePlantTypes": string[],
  "placementAdvice": string
}`;
      return { system, user: `Evalúa este nivel de luz: ${JSON.stringify(request.payload)}`, hasImage: false };
    }

    default:
      throw new BotanyAiError('UNSUPPORTED_OPERATION', `Operación no soportada: ${request.operation}`, 400);
  }
}

/**
 * Función interna de llamada individual a Groq API con un modelo específico
 */
async function sendSingleGroqRequest(
  endpoint: string,
  apiKey: string,
  model: string,
  system: string,
  user: any,
  maxTokens: number = 1500
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  const requestBody: any = {
    model: model,
    messages: [
      {
        role: 'system',
        content: system
      },
      {
        role: 'user',
        content: user
      }
    ],
    temperature: 0.1,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'GreenLens-App/2.0'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = '';
      let failedGeneration: string | null = null;
      let errorCode = '';
      try {
        const errJson = await response.json();
        errorDetail = errJson?.error?.message || JSON.stringify(errJson);
        failedGeneration = errJson?.error?.failed_generation || null;
        errorCode = errJson?.error?.code || '';
        
        if (failedGeneration) {
          console.warn(`[Groq JSON Validation Error] Groq returned json_validate_failed. Capturing failed_generation (length ${failedGeneration.length}):`, failedGeneration);
        }
      } catch {
        errorDetail = await response.text().catch(() => '');
      }

      // Si Groq rechazó por json_validate_failed pero devolvió failed_generation, intentamos recuperar el JSON generado
      if ((errorCode === 'json_validate_failed' || errorDetail.includes('json_validate_failed') || errorDetail.includes('Failed to validate JSON')) && failedGeneration) {
        try {
          const recovered = extractAndParseJson(failedGeneration);
          if (recovered && typeof recovered === 'object' && Object.keys(recovered).length > 0) {
            console.log(`[Groq JSON Recovery] Se recuperó exitosamente el objeto JSON desde failed_generation.`);
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify(recovered)
                  },
                  finish_reason: 'stop'
                }
              ]
            };
          }
        } catch {
          console.warn('[Groq JSON Recovery] No se pudo parsear failed_generation directamente.');
        }
      }

      // Si es un error de modelo retirado o inexistente, lanzamos un código específico para activar el fallback automático
      const lowerDetail = (errorDetail || '').toLowerCase();
      const isModelDecommissioned =
        lowerDetail.includes('decommissioned') ||
        lowerDetail.includes('no longer supported') ||
        lowerDetail.includes('does not exist') ||
        lowerDetail.includes('model_not_found') ||
        lowerDetail.includes('model not found') ||
        (response.status === 404 && lowerDetail.includes('model'));

      if (isModelDecommissioned) {
        throw new BotanyAiError(
          'GROQ_MODEL_DECOMMISSIONED',
          `El modelo ${model} no está disponible en Groq: ${sanitizeErrorMessage(errorDetail)}`,
          response.status,
          { model, rawError: errorDetail }
        );
      }

      if (response.status === 401) {
        throw new BotanyAiError(
          'GROQ_AUTH_FAILED',
          'Autenticación fallida con Groq (401). Verifica que la variable GROQ_API_KEY esté configurada correctamente.',
          401
        );
      } else if (response.status === 403) {
        throw new BotanyAiError(
          'GROQ_FORBIDDEN',
          'Acceso denegado en Groq (403). Comprueba los permisos de tu GROQ_API_KEY.',
          403
        );
      } else if (response.status === 429) {
        const retryAfterHeader = response.headers.get('retry-after');
        const rateLimitInfo = parseGroqRateLimitDetails(errorDetail, retryAfterHeader);

        throw new BotanyAiError(
          'GROQ_RATE_LIMIT',
          `Límite de peticiones (${rateLimitInfo.limitType}) alcanzado en el modelo ${model}.`,
          429,
          {
            model,
            limitType: rateLimitInfo.limitType,
            retryMs: rateLimitInfo.retryMs,
            rawError: errorDetail
          }
        );
      }

      throw new BotanyAiError(
        'GROQ_HTTP_ERROR',
        `Error ${response.status} de Groq: ${sanitizeErrorMessage(errorDetail || 'Petición rechazada')}`,
        response.status
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new BotanyAiError(
        'NON_JSON_RESPONSE',
        'Groq devolvió una respuesta que no es JSON.',
        502
      );
    }

    const data = await response.json();

    if (data?.error) {
      const upstreamMsg = data.error.message || 'Error del proveedor en Groq';
      throw new BotanyAiError(
        'GROQ_UPSTREAM_ERROR',
        `Groq: ${sanitizeErrorMessage(upstreamMsg)}`,
        502
      );
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new BotanyAiError('TIMEOUT', 'Tiempo de espera agotado al consultar Groq API.', 504);
    }
    throw err;
  }
}

export function modelSupportsVision(modelId: string): boolean {
  const model = discoveredGroqModels.find(m => m.id === modelId);
  if (model) return model.canProcessImages;
  
  // Fallback pattern matching
  const lower = modelId.toLowerCase();
  return lower.includes('qwen') || lower.includes('vision') || lower.includes('-vl') || lower.includes('llava');
}

export function validateBotanicalResponse(data: any): any {
  if (!data || typeof data !== 'object') {
    throw new BotanyAiError('INVALID_SCHEMA', 'La respuesta obtenida no es un objeto botánico válido.', 502);
  }

  // Comprobar campos mínimos esperados
  const requiredFields = ['isPlant', 'name', 'scientificName', 'confidencePercentage', 'category', 'family', 'description'];
  const missing = requiredFields.filter(f => data[f] === undefined || data[f] === null);
  
  if (missing.length > 0) {
    console.warn(`[Groq Schema Warning] Respuesta JSON válida pero incompleta. Campos faltantes: ${missing.join(', ')}`);
    // Rellenar campos faltantes de forma segura para no romper la renderización en el frontend
    if (data.isPlant === undefined) data.isPlant = true;
    if (!data.name) data.name = 'Planta';
    if (!data.scientificName) data.scientificName = 'Especie botánica';
    if (data.confidencePercentage === undefined) data.confidencePercentage = 80;
    if (!data.category) data.category = 'Identificada';
    if (!data.family) data.family = 'No determinada';
    if (!data.description) data.description = 'Identificación botánica con GreenLens.';
  }

  // Garantizar isPlant coherente
  data.isPlant = Boolean(data.isPlant);
  
  // Evitar renderizado incorrecto de objetos (como care.watering que podría venir como objeto o string)
  if (data.care && typeof data.care === 'object') {
    if (typeof data.care.light === 'object' && data.care.light !== null) {
      data.care.light = data.care.light.desc || data.care.light.requirement || 'Luz indirecta brillante';
    }
    if (typeof data.care.watering === 'object' && data.care.watering !== null) {
      data.care.watering = data.care.watering.desc || data.care.watering.tips || 'Riego moderado';
    }
    if (typeof data.care.temperature === 'object' && data.care.temperature !== null) {
      data.care.temperature = data.care.temperature.desc || data.care.temperature.ideal || 'Temperatura templada';
    }
  }

  return data;
}

/**
 * Capa centralizada para despachar peticiones a Groq API con selección automática de modelo y fallback resiliente dentro de Groq.
 */
export async function executeGroqApiCall<T>(
  request: GroqApiRequestPayload,
  clientKey?: string,
  maxTokens: number = 1500
): Promise<T> {
  const apiKey = getSanitizedGroqApiKey(clientKey);
  const endpoint = getGroqEndpoint();

  if (!apiKey) {
    throw new BotanyAiError(
      'GROQ_NOT_CONFIGURED',
      'El servicio de identificación requiere la variable de entorno GROQ_API_KEY en el servidor.',
      503
    );
  }

  const { system, user, hasImage } = buildGroqMessages(request);

  // 1. Descubrir dinámicamente todos los modelos disponibles en Groq
  await discoverGroqVisionModels(apiKey);

  // requiresVision es estrictamente true si y solo si la petición tiene imagen (hasImage)
  const requiresVision = hasImage === true;

  let attempts = 0;
  const maxAttempts = 5;
  let lastError: any = null;

  try {
    while (attempts < maxAttempts) {
      // 2. Obtener el candidato ideal enrutando a través del router centralizado
      const candidateModel = selectGroqModel({
        taskType: request.operation,
        inputType: requiresVision ? 'image' : 'text',
        language: request.language,
        requiresVision,
        requiresJson: true
      });

      // Si el router no devuelve ningún modelo (todos están en cooldown o no hay compatibles)
      if (!candidateModel) {
        const shortestWaitMs = getShortestCooldownWaitMs();
        const waitSec = Math.ceil(shortestWaitMs / 1000);
        
        if (requiresVision) {
          console.error(`[Groq] No compatible vision model available. All vision models are rate limited.`);
          throw new BotanyAiError(
            'GROQ_VISION_RATE_LIMITED',
            'El servicio de identificación de imágenes está temporalmente limitado. Inténtalo de nuevo más tarde.',
            429,
            {
              error: true,
              code: 'GROQ_VISION_RATE_LIMITED',
              message: 'El servicio de identificación de imágenes está temporalmente limitado. Inténtalo de nuevo más tarde.',
              retryAfterMs: shortestWaitMs,
              availableVisionModels: []
            }
          );
        } else {
          console.error(`[Groq] No compatible text model available. All text models are rate limited.`);
          throw new BotanyAiError(
            'GROQ_ALL_MODELS_LIMITED',
            `Todos los modelos de texto de Groq están temporalmente limitados por rate limit. Por favor espera ${waitSec} segundos.`,
            429,
            { retryMs: shortestWaitMs }
          );
        }
      }

      // REGLA ABSOLUTA: Impedir que un modelo sin visión procese una petición de imágenes
      if (requiresVision && !modelSupportsVision(candidateModel)) {
        console.error(`[Groq Error] Selected model ${candidateModel} does not support vision for a vision task.`);
        throw new BotanyAiError(
          'INCOMPATIBLE_MODEL_SELECTION',
          `El modelo seleccionado ${candidateModel} no soporta entrada de imágenes para esta tarea.`,
          500
        );
      }

      // Logs obligatorios antes del envío (Requirement 27)
      console.log(`[Groq Router]`);
      console.log(`Task: ${request.operation}`);
      console.log(`Input: ${requiresVision ? 'image' : 'text'}`);
      console.log(`requiresVision: ${requiresVision}`);

      const allVisionModels = discoveredGroqModels.filter(m => m.canProcessImages).map(m => m.id);
      console.log(`\n[Groq]`);
      console.log(`Vision candidates: [${allVisionModels.join(', ')}]`);

      console.log(`\n[Groq Router]`);
      console.log(`Selected model: ${candidateModel}`);

      // 3. Ejecutar Context Guard para verificar límites del modelo y realizar reducciones preventivas si procede
      const prep = prepareGroqRequest(candidateModel, system, user, maxTokens);

      console.log(`\n[Groq Request]`);
      console.log(`Model: ${candidateModel}`);
      console.log(`Input: ${requiresVision ? 'image' : 'text'}`);

      console.log(`\n[Groq Check]`);
      console.log(`Selected model = ${candidateModel}`);
      console.log(`Actual request model = ${candidateModel}`);

      try {
        const data = await sendSingleGroqRequest(endpoint, apiKey, candidateModel, prep.system, prep.user, prep.maxTokens);

        const choice = data?.choices?.[0];
        const rawContent = choice?.message?.content;

        if (!rawContent || typeof rawContent !== 'string') {
          throw new BotanyAiError('EMPTY_RESPONSE', `Groq devolvió un contenido vacío con el modelo ${candidateModel}.`, 502);
        }

        // Éxito: limpiar cooldown del modelo seleccionado
        modelCooldowns.delete(candidateModel);
        persistCooldownsToFile();

        console.log(`[Groq] Task successful with model: ${candidateModel}`, {
          model: data.model || candidateModel,
          finishReason: choice?.finish_reason,
          usage: data?.usage
        });

        const parsed = extractAndParseJson(rawContent);
        if (request.operation === 'plant_identification') {
          return validateBotanicalResponse(parsed) as T;
        }
        return parsed as T;
      } catch (err: any) {
        lastError = err;
        attempts++;

        const lowerMsg = (err.message || '').toLowerCase();
        const isContextLengthError = lowerMsg.includes('context_length_exceeded') || 
                                     lowerMsg.includes('context length exceeded') ||
                                     lowerMsg.includes('reduce the length of') ||
                                     err.statusCode === 400 && lowerMsg.includes('context');

        // Manejo del error de contexto mediante reintento ultra-compactado agresivo (Requirement 8)
        if (isContextLengthError) {
          console.warn(`[Groq Context Guard] context_length_exceeded detectado en el modelo ${candidateModel}. Iniciando reintento comprimido...`);
          
          let systemUltra = prep.system;
          let userUltra = prep.user;

          // Simplificación extrema de system prompt
          systemUltra = `Botanical expert. Respond ONLY with a concise valid JSON object matching the requested fields. Language: ${request.language}.`;
          
          if (typeof userUltra === 'string') {
            userUltra = userUltra.slice(0, 150) + '... (compressed)';
          } else if (Array.isArray(userUltra)) {
            userUltra = userUltra.map(item => {
              if (item && item.type === 'text' && typeof item.text === 'string') {
                return { ...item, text: item.text.slice(0, 150) + '... (compressed)' };
              }
              return item;
            });
          }

          const ultraPrep = prepareGroqRequest(candidateModel, systemUltra, userUltra, 150);

          console.log(`[Groq Retry]`);
          console.log(`model: ${candidateModel}`);
          console.log(`estimatedTotalTokens: ${ultraPrep.estimatedTotalTokens}`);
          console.log(`maxTokens: 150`);

          try {
            const data = await sendSingleGroqRequest(endpoint, apiKey, candidateModel, ultraPrep.system, ultraPrep.user, 150);
            
            const choice = data?.choices?.[0];
            const rawContent = choice?.message?.content;

            if (!rawContent || typeof rawContent !== 'string') {
              throw new BotanyAiError('EMPTY_RESPONSE', `Groq devolvió un contenido vacío tras el reintento compacto.`, 502);
            }

            console.log(`[Groq] Retry successful after context compaction!`);
            
            const parsed = extractAndParseJson(rawContent);
            if (request.operation === 'plant_identification') {
              return validateBotanicalResponse(parsed) as T;
            }
            return parsed as T;
          } catch (retryErr: any) {
            console.error('[Groq Context Guard] El reintento compacto también falló:', retryErr.message);
            throw new BotanyAiError(
              'CONTEXT_LIMIT_EXCEEDED_FATAL',
              'No se pudo completar la consulta botánica porque la longitud del contenido excede el contexto máximo del modelo de Groq.',
              400,
              {
                error: true,
                code: 'CONTEXT_LIMIT_EXCEEDED_FATAL',
                message: 'No se pudo completar la consulta botánica porque la longitud del contenido excede el contexto máximo del modelo de Groq.',
                retryAfterMs: 0,
                availableVisionModels: []
              }
            );
          }
        }

        // Manejo de Rate Limit HTTP 429
        if (err.statusCode === 429 || err.code === 'GROQ_RATE_LIMIT') {
          const limitType = err.details?.limitType || 'GENERIC_429';
          const retryMs = err.details?.retryMs || 30000;
          const cooldownUntil = Date.now() + retryMs;

          modelCooldowns.set(candidateModel, {
            cooldownUntil,
            limitType,
            retryMs,
            lastUsed: Date.now(),
            rawError: err.details?.rawError
          });
          persistCooldownsToFile();

          console.warn(`[Groq] Model ${candidateModel} → RATE LIMITED`);
          console.warn(`[Groq] Limit type: ${limitType}`);
          console.warn(`[Groq] Cooldown: ${Math.round(retryMs / 1000)} seconds`);

          const nextModel = selectGroqModel({
            taskType: request.operation,
            inputType: requiresVision ? 'image' : 'text',
            language: request.language,
            requiresVision,
            requiresJson: true
          });

          console.log(`[Groq] Next compatible model: ${nextModel || 'NONE'}`);
          if (!nextModel) {
            console.warn(`[Groq] No compatible vision model available.`);
          }
          continue;
        }

        // Manejo de Modelo Decommissioned / deprecado / no soportado
        if (err.code === 'GROQ_MODEL_DECOMMISSIONED' || err.statusCode === 400 || err.statusCode === 404) {
          console.warn(`[Groq] Model ${candidateModel} is unavailable. Marking as deprecated and rotating...`);
          DEPRECATED_GROQ_MODELS.add(candidateModel);
          continue;
        }

        if (err.code === 'GROQ_AUTH_FAILED' || err.code === 'GROQ_FORBIDDEN') {
          throw err;
        }

        console.warn(`[Groq] Error with model ${candidateModel}: ${sanitizeErrorMessage(err.message)}. Trying next candidate...`);
      }
    }

    throw lastError || new BotanyAiError('GROQ_UNAVAILABLE', 'No se pudo procesar la solicitud con ninguno de los modelos compatibles de Groq.', 502);
  } catch (err: any) {
    const errorStatus = err.statusCode || 500;
    const errorCode = err.code || 'UNKNOWN_ERROR';
    const errorMessage = err.message || '';
    
    if (requiresVision) {
      const now = Date.now();
      const cooldownedList = Array.from(modelCooldowns.entries())
        .filter(([_, cd]) => cd.cooldownUntil > now)
        .map(([id]) => id);
        
      console.error(`\n[Groq Error]`);
      console.error(`taskType: ${request.operation}`);
      console.error(`inputType: image`);
      console.error(`requiresVision: true`);
      console.error(`selectedModel: ${getGroqModel()}`);
      console.error(`actualRequestModel: ${lastSelectedModel || 'None'}`);
      console.error(`httpStatus: ${errorStatus}`);
      console.error(`errorCode: ${errorCode}`);
      console.error(`errorMessage: ${errorMessage}`);
      console.error(`responseContent: ${err.details ? JSON.stringify(err.details) : 'None'}`);
      console.error(`availableVisionModels: [${discoveredGroqModels.filter(m => m.canProcessImages && !DEPRECATED_GROQ_MODELS.has(m.id)).map(m => m.id).join(', ')}]`);
      console.error(`cooldownModels: [${cooldownedList.join(', ')}]\n`);
    }
    throw err;
  }
}

/**
 * Despachadores de endpoints botánicos
 */

export async function handleIdentifyPlant(
  imageBase64: string,
  clientKey?: string,
  language: SupportedLanguage = 'es'
): Promise<any> {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new BotanyAiError('MISSING_IMAGE', 'Se requiere una imagen en formato base64 para identificar la planta.', 400);
  }

  const request: GroqApiRequestPayload = {
    operation: 'plant_identification',
    language,
    payload: { imageBase64 }
  };

  return await executeGroqApiCall(request, clientKey, 220);
}

export async function handleIdentifyInfo(
  className: string,
  clientKey?: string,
  language: SupportedLanguage = 'es'
): Promise<any> {
  if (!className || typeof className !== 'string') {
    throw new BotanyAiError('MISSING_NAME', 'Se requiere el nombre de la planta para consultar su ficha.', 400);
  }

  const request: GroqApiRequestPayload = {
    operation: 'plant_info',
    language,
    payload: { className }
  };

  return await executeGroqApiCall(request, clientKey);
}

export async function handleCareGuide(
  imageBase64?: string,
  plantName?: string,
  clientKey?: string,
  language: SupportedLanguage = 'es'
): Promise<any> {
  if (!imageBase64 && !plantName) {
    throw new BotanyAiError('MISSING_PARAMS', 'Se requiere el nombre o una imagen de la planta para generar la guía de cuidados.', 400);
  }

  const request: GroqApiRequestPayload = {
    operation: 'care_guide',
    language,
    payload: { imageBase64, plantName }
  };

  return await executeGroqApiCall(request, clientKey);
}

export async function handleWateringCalc(
  params: any,
  clientKey?: string,
  language: SupportedLanguage = 'es'
): Promise<any> {
  const request: GroqApiRequestPayload = {
    operation: 'watering_calculation',
    language,
    payload: params
  };

  const rawResult = await executeGroqApiCall<any>(request, clientKey, 450);

  const plantName = rawResult?.plantName || params?.plantName || 'Planta';
  const wateringFrequency = rawResult?.wateringFrequency || rawResult?.frequency || 'Cada 5–7 días';
  let wateringAmount = String(rawResult?.wateringAmount || rawResult?.amount || '250–350 ml').trim();
  if (/^\d+(\s*[-–—/]\s*\d+)?$/.test(wateringAmount)) {
    wateringAmount = `${wateringAmount} ml`;
  }
  const recommendation = rawResult?.recommendation || (Array.isArray(rawResult?.recommendations) ? rawResult.recommendations[0] : 'Comprueba la humedad del sustrato antes de volver a regar.');

  return {
    plantName,
    wateringFrequency,
    wateringAmount,
    recommendation,
    frequency: wateringFrequency,
    amount: wateringAmount,
    recommendations: [recommendation]
  };
}

export async function handleConditions(
  params: any,
  clientKey?: string,
  language: SupportedLanguage = 'es'
): Promise<any> {
  const request: GroqApiRequestPayload = {
    operation: 'ideal_conditions',
    language,
    payload: params
  };

  return await executeGroqApiCall(request, clientKey);
}

export async function handlePlantHealth(
  params: any,
  clientKey?: string,
  language: SupportedLanguage = 'es'
): Promise<any> {
  const request: GroqApiRequestPayload = {
    operation: 'plant_health',
    language,
    payload: params
  };

  return await executeGroqApiCall(request, clientKey);
}

export async function handleLightMeter(
  params: any,
  clientKey?: string,
  language: SupportedLanguage = 'es'
): Promise<any> {
  const request: GroqApiRequestPayload = {
    operation: 'light_evaluation',
    language,
    payload: params
  };

  return await executeGroqApiCall(request, clientKey);
}
