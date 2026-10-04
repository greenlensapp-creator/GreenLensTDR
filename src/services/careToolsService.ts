import {
  WateringCalcRequest,
  WateringCalcResponse,
  ConditionsRequest,
  ConditionsResponse,
  CareGuideRequest,
  CareGuideResponse,
  PlantHealthRequest,
  PlantHealthResponse,
  LightMeterRequest,
  LightMeterResponse,
  LanguageCode
} from '../types';
import { postToApi } from './apiClient';

/**
 * 1. Calcula recomendación de riego
 */
export async function calculateWateringCare(
  params: WateringCalcRequest,
  language: LanguageCode = 'es'
): Promise<WateringCalcResponse> {
  return await postToApi<WateringCalcResponse>('care-tools/watering', {
    ...params,
    language
  });
}

/**
 * 2. Analiza condiciones ideales del entorno
 */
export async function analyzeIdealConditions(
  params: ConditionsRequest,
  language: LanguageCode = 'es'
): Promise<ConditionsResponse> {
  return await postToApi<ConditionsResponse>('care-tools/conditions', {
    ...params,
    language
  });
}

/**
 * 3. Obtiene guía de cuidados de una planta (por foto o nombre)
 */
export async function fetchCareGuide(
  params: CareGuideRequest | string,
  language: LanguageCode = 'es'
): Promise<CareGuideResponse> {
  const payload: CareGuideRequest =
    typeof params === 'string' ? { plantName: params.trim() } : params;
  const res = await postToApi<CareGuideResponse>('care-tools/guide', {
    ...payload,
    language
  });
  if (res && !res.name && res.plantName) {
    res.name = res.plantName;
  }
  return res;
}

/**
 * 4. Analiza salud y problemas de la planta (3 fotos validadas conjuntamente)
 */
export async function analyzePlantHealth(
  params: PlantHealthRequest,
  language: LanguageCode = 'es'
): Promise<PlantHealthResponse> {
  return await postToApi<PlantHealthResponse>('care-tools/health', {
    ...params,
    language
  });
}

/**
 * 5. Evaluación de nivel de luz ambiental
 */
export async function evaluateLightLevel(
  params: LightMeterRequest,
  language: LanguageCode = 'es'
): Promise<LightMeterResponse> {
  return await postToApi<LightMeterResponse>('care-tools/light', {
    ...params,
    language
  });
}
