/**
 * Servicio de Identificación Botánica de GreenLens
 * Integrado con el motor de IA de GreenLens (Groq API)
 *
 * Flujo:
 * CÁMARA / GALERÍA -> OPTIMIZACIÓN IMAGEN -> BACKEND (/api/identify-plant) -> RESULTADO ESTRUCTURADO
 */

import { ClassificationResult, PredictionResult, PlantInfo, LanguageCode } from '../types';
import { postToApi, ApiError } from './apiClient';

/**
 * Optimiza y redimensiona una imagen en base64 para envío rápido y eficiente al motor de visión
 */
export async function optimizeImageForAi(base64Data: string, maxDimension: number = 800): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(base64Data);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= maxDimension && height <= maxDimension && base64Data.length < 200 * 1024) {
          resolve(base64Data);
          return;
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Data);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const optimized = canvas.toDataURL('image/jpeg', 0.80);
        resolve(optimized);
      } catch {
        resolve(base64Data);
      }
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
}

function normalizePlantCare(rawCare: any, language: LanguageCode): PlantCareInfo {
  const defaultLightTitle = language === 'en' ? 'Light' : language === 'ca' ? 'Llum' : language === 'ar' ? 'الضوء' : 'Iluminación';
  const defaultLightDesc = language === 'en' ? 'Check specific requirements.' : 'Consultar requerimientos específicos.';
  const defaultWateringTitle = language === 'en' ? 'Watering' : language === 'ca' ? 'Reg' : language === 'ar' ? 'الري' : 'Riego';
  const defaultWateringDesc = language === 'en' ? 'Check soil moisture before watering.' : 'Comprobar humedad antes de regar.';
  const defaultTempTitle = language === 'en' ? 'Temperature' : language === 'ca' ? 'Temperatura' : language === 'ar' ? 'درجة الحرارة' : 'Temperatura';
  const defaultTempDesc = language === 'en' ? 'Protect from extreme temperatures.' : 'Proteger de temperaturas extremas.';

  if (!rawCare || typeof rawCare !== 'object') {
    return {
      light: { title: defaultLightTitle, desc: defaultLightDesc },
      watering: { title: defaultWateringTitle, desc: defaultWateringDesc },
      temperature: { title: defaultTempTitle, desc: defaultTempDesc }
    };
  }

  const formatCareItem = (item: any, defaultTitle: string, defaultDesc: string) => {
    if (typeof item === 'string') {
      return { title: defaultTitle, desc: item };
    }
    if (item && typeof item === 'object') {
      const desc = item.desc || item.requirement || item.tips || item.frequency || item.advice || defaultDesc;
      const title = item.title || item.placement || defaultTitle;
      return {
        title: typeof title === 'string' ? title : defaultTitle,
        desc: typeof desc === 'string' ? desc : defaultDesc
      };
    }
    return { title: defaultTitle, desc: defaultDesc };
  };

  return {
    light: formatCareItem(rawCare.light, defaultLightTitle, defaultLightDesc),
    watering: formatCareItem(rawCare.watering, defaultWateringTitle, defaultWateringDesc),
    temperature: formatCareItem(rawCare.temperature, defaultTempTitle, defaultTempDesc)
  };
}

// Bloqueo de peticiones en vuelo para evitar llamadas duplicadas simultáneas con la misma imagen
const inFlightScans = new Map<string, Promise<ClassificationResult>>();

/**
 * Identifica la especie botánica a partir de una imagen utilizando el backend de GreenLens.
 */
export async function identifyPlantWithAi(
  capturedBase64: string,
  threshold: number = 0.6,
  language: LanguageCode = 'es'
): Promise<ClassificationResult> {
  if (!capturedBase64) {
    throw new Error('Debes proporcionar una imagen válida para realizar la identificación.');
  }

  // Generar una clave de deduplicación ligera basada en tamaño y fragmento
  const dedupKey = `${language}-${capturedBase64.length}-${capturedBase64.slice(0, 100)}`;
  const existingPromise = inFlightScans.get(dedupKey);
  if (existingPromise) {
    console.log('[SCAN] Petición idéntica en vuelo reutilizada (deduplicada)');
    return existingPromise;
  }

  const scanPromise = (async () => {
    console.log('[SCAN] Escaneo iniciado y optimizando imagen');

    // 1. Optimizar imagen para transmisión ultra rápida
    const optimizedImage = await optimizeImageForAi(capturedBase64, 800);
    console.log('[SCAN] Petición preparada para backend', {
      language,
      optimizedLength: optimizedImage.length
    });

    // 2. Enviar petición al backend botánico
    let data: any;
    try {
      data = await postToApi<any>('identify-plant', {
        imageBase64: optimizedImage,
        language
      });
      console.log('[SCAN] Identificación completada con éxito', {
        name: data?.name,
        confidence: data?.confidencePercentage,
        isPlant: data?.isPlant
      });
    } catch (err: any) {
      console.error('[GreenLens] Error identificando planta:', err);
      if (err instanceof ApiError) {
        throw err;
      }
      throw new Error(err?.message || 'Ha ocurrido un problema al analizar la imagen. Inténtalo de nuevo.');
    }

    const confidencePercentage =
      typeof data?.confidencePercentage === 'number'
        ? data.confidencePercentage
        : data?.isPlant
        ? 85
        : 0;

    const isPlant = data?.isPlant !== false;
    const isConfident = Boolean(data?.isCertain && isPlant && confidencePercentage / 100 >= threshold);

    const fallbackNonPlantName =
      language === 'en'
        ? 'Does not appear to be a plant'
        : language === 'ca'
        ? 'No sembla ser una planta'
        : language === 'ar'
        ? 'لا يبدو أنه نبات'
        : 'No parece ser una planta';

    const fallbackPlantName =
      language === 'en'
        ? 'Botanical specimen'
        : language === 'ca'
        ? 'Espècie botànica'
        : language === 'ar'
        ? 'نوع نباتي'
        : 'Especie botánica';

    const topPrediction: PredictionResult = {
      className: data?.name || (isPlant ? fallbackPlantName : fallbackNonPlantName),
      probability: confidencePercentage / 100,
      percentage: confidencePercentage
    };

    // Posibles alternativas botánicas proporcionadas por el análisis
    const alternatives: string[] = Array.isArray(data?.possibleAlternatives)
      ? data.possibleAlternatives.map((alt: any) => typeof alt === 'string' ? alt : alt?.name).filter(Boolean)
      : [];

    const allPredictions: PredictionResult[] = [topPrediction];
    if (alternatives.length > 0) {
      const remainingProb = Math.max(0.05, 1 - confidencePercentage / 100);
      const perAlt = remainingProb / alternatives.length;
      alternatives.forEach((altName) => {
        allPredictions.push({
          className: altName,
          probability: Math.round(perAlt * 100) / 100,
          percentage: Math.round(perAlt * 100)
        });
      });
    }

    const fallbackCategory = isPlant
      ? language === 'en'
        ? 'Identified Species'
        : language === 'ca'
        ? 'Espècie Identificada'
        : language === 'ar'
        ? 'نوع محدد'
        : 'Especie Identificada'
      : language === 'en'
      ? 'Non-botanical entity'
      : language === 'ca'
      ? 'Objecte no botànic'
      : language === 'ar'
      ? 'عنصر غير نباتي'
      : 'Objeto no botánico';

    const fallbackTags = isPlant
      ? language === 'en'
        ? ['Botanical', 'Collection']
        : language === 'ca'
        ? ['Botànica', 'Col·lecció']
        : language === 'ar'
        ? ['نباتي', 'مجموعة']
        : ['Botánica', 'Colección']
      : language === 'en'
      ? ['Non-botanical']
      : language === 'ca'
      ? ['No botànic']
      : language === 'ar'
      ? ['غير نباتي']
      : ['No botánico'];

    const fallbackDescription = isPlant
      ? language === 'en'
        ? `Botanical identification of ${data?.name || fallbackPlantName} with GreenLens.`
        : language === 'ca'
        ? `Identificació botànica de ${data?.name || fallbackPlantName} amb GreenLens.`
        : language === 'ar'
        ? `تحديد نباتي لـ ${data?.name || fallbackPlantName} بواسطة جرين لينس.`
        : `Identificación botánica con GreenLens de ${data?.name || fallbackPlantName}.`
      : language === 'en'
      ? 'The analyzed image does not appear to contain a plant.'
      : language === 'ca'
      ? 'La imatge analitzada no sembla contenir cap planta.'
      : language === 'ar'
      ? 'لا يبدو أن الصورة المحللة تحتوي على نبتة.'
      : 'No parece ser una planta.';

    const derivedToxicityAlert = data?.toxicityAlert || (data?.toxicity ? {
      title: (data.toxicity.isToxicToHumans || data.toxicity.isToxicToPets)
        ? (language === 'en' ? 'Toxic' : language === 'ca' ? 'Tòxica' : language === 'ar' ? 'سام' : 'Planta tóxica')
        : (language === 'en' ? 'Safe' : language === 'ca' ? 'Segura' : language === 'ar' ? 'آمن' : 'Planta segura'),
      desc: data.toxicity.details || (
        (data.toxicity.isToxicToHumans || data.toxicity.isToxicToPets)
          ? (language === 'en' ? 'Keep out of reach of pets and children.' : 'Mantener fuera del alcance de mascotas y niños.')
          : (language === 'en' ? 'Non-toxic for pets and humans.' : 'No tóxica para mascotas ni humanos.')
      )
    } : undefined);

    const generatedTags = [data?.category, data?.plantType, data?.lifeCycle]
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
    const finalTags = Array.isArray(data?.tags) && data.tags.length > 0
      ? data.tags
      : (generatedTags.length > 0 ? generatedTags : fallbackTags);

    const plantDetails: PlantInfo = {
      id: data?.id || `scan-${Date.now()}`,
      name: data?.name || (isPlant ? fallbackPlantName : fallbackNonPlantName),
      scientificName:
        data?.scientificName ||
        (isPlant
          ? language === 'en'
            ? 'Undetermined species'
            : 'Especie no determinada'
          : language === 'en'
          ? 'Not applicable'
          : language === 'ar'
          ? 'لا ينطبق'
          : 'No aplicable'),
      category: data?.category || fallbackCategory,
      tags: finalTags,
      family: data?.family || (language === 'en' ? 'Family undetermined' : 'Familia no determinada'),
      origin: data?.origin || (language === 'en' ? 'Tropical / Subtropical' : 'Origen tropical / subtropical'),
      size: data?.characteristics?.approximateHeight || data?.size || '0,5–1,5 m',
      location: data?.care?.light || data?.location || (language === 'en' ? 'Bright indirect light' : 'Luz indirecta brillante'),
      care: normalizePlantCare(data?.care, language),
      plantType: data?.plantType,
      lifeCycle: data?.lifeCycle,
      characteristics: data?.characteristics,
      toxicity: data?.toxicity,
      toxicityAlert: derivedToxicityAlert,
      naturalHabitat: data?.naturalHabitat || (language === 'en' ? 'Tropical forest ecosystem' : 'Bosque tropical húmedo'),
      curiosities: Array.isArray(data?.curiosities) ? data.curiosities : [],
      description: data?.description || fallbackDescription,
      imageUrl: capturedBase64,
      matchScore: confidencePercentage,
      isPlant,
      confidencePercentage,
      isCertain: data?.isCertain,
      observedCharacteristics: Array.isArray(data?.observedCharacteristics) ? data.observedCharacteristics : [],
      possibleAlternatives: alternatives,
      identificationMessage: data?.message
    };

    return {
      topPrediction,
      allPredictions,
      isConfident,
      threshold,
      capturedImage: capturedBase64,
      timestamp: new Date().toISOString(),
      details: plantDetails
    };
  })();

  inFlightScans.set(dedupKey, scanPromise);
  try {
    const result = await scanPromise;
    return result;
  } finally {
    inFlightScans.delete(dedupKey);
  }
}

/**
 * Clasifica la imagen tomada por la cámara o cargada desde la galería.
 * Mantiene la firma para compatibilidad total con la UI de escáner.
 */
export async function classifyImage(
  _source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  capturedBase64: string,
  threshold: number = 0.6,
  language: LanguageCode = 'es'
): Promise<ClassificationResult> {
  return await identifyPlantWithAi(capturedBase64, threshold, language);
}
