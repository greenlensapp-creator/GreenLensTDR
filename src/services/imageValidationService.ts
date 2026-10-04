import { ImageValidationResult } from '../types';

/**
 * Carga una imagen base64 en un elemento HTMLImageElement
 */
function loadImageFromBase64(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

/**
 * Calcula la luminosidad media y distribución cromática de una imagen en Canvas
 */
function analyzeCanvasPixels(img: HTMLImageElement): {
  averageLuminance: number;
  greenRatio: number;
  colorVariance: number;
  laplacianVariance: number;
} {
  const canvas = document.createElement('canvas');
  const maxDim = 200;
  const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
  const w = Math.max(10, Math.floor((img.width || 200) * scale));
  const h = Math.max(10, Math.floor((img.height || 200) * scale));

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { averageLuminance: 128, greenRatio: 0.3, colorVariance: 50, laplacianVariance: 100 };
  }

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const pixelCount = w * h;

  let totalLuminance = 0;
  let greenCount = 0;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;

  // Grises para cálculo de bordes/nitidez
  const gray: number[] = new Array(pixelCount);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Fórmula estándar de luminancia perceptual (ITU-R BT.601)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += lum;
    gray[i / 4] = lum;

    rSum += r;
    gSum += g;
    bSum += b;

    // Detectar presencia de tonos botánicos (hojas verdes, clorofila, flores, tallos)
    const isGreenish = g > r * 0.85 && g > b * 0.85 && g > 30;
    const isBotanicalHue = (g > 40 && (r > 30 || b > 20)) || (r > g && g > b && r - b < 100);
    if (isGreenish || isBotanicalHue) {
      greenCount++;
    }
  }

  const averageLuminance = totalLuminance / pixelCount;
  const greenRatio = greenCount / pixelCount;

  // Varianza de color (para descartar paredes planas o superficies monocromáticas vacías)
  const meanR = rSum / pixelCount;
  const meanG = gSum / pixelCount;
  const meanB = bSum / pixelCount;
  let colorVarSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - meanR;
    const dg = data[i + 1] - meanG;
    const db = data[i + 2] - meanB;
    colorVarSum += (dr * dr + dg * dg + db * db) / 3;
  }
  const colorVariance = Math.sqrt(colorVarSum / pixelCount);

  // Estimación de nitidez / bordes mediante aproximación de Laplaciano
  let laplacianSum = 0;
  let laplacianCount = 0;
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const idx = y * w + x;
      const center = gray[idx];
      const lap =
        Math.abs(gray[idx - 1] - center) +
        Math.abs(gray[idx + 1] - center) +
        Math.abs(gray[idx - w] - center) +
        Math.abs(gray[idx + w] - center);
      laplacianSum += lap;
      laplacianCount++;
    }
  }
  const laplacianVariance = laplacianCount > 0 ? laplacianSum / laplacianCount : 50;

  return { averageLuminance, greenRatio, colorVariance, laplacianVariance };
}

/**
 * Convierte el valor de luminancia (0-255) a las categorías requeridas
 */
export function getLuminanceCategory(
  luminance: number
): 'Muy baja' | 'Baja' | 'Media' | 'Alta' | 'Muy alta' {
  if (luminance < 45) return 'Muy baja';
  if (luminance < 95) return 'Baja';
  if (luminance < 175) return 'Media';
  if (luminance < 225) return 'Alta';
  return 'Muy alta';
}

/**
 * Valida de forma estricta e instantánea en el cliente:
 * 1. Calidad de imagen (oscura, quemada, borrosa)
 * 2. Que la fotografía corresponda efectivamente a una planta
 */
export async function validateImageForCare(dataUrl: string): Promise<ImageValidationResult> {
  try {
    const img = await loadImageFromBase64(dataUrl);
    const { averageLuminance, greenRatio, colorVariance, laplacianVariance } =
      analyzeCanvasPixels(img);

    const brightnessCategory = getLuminanceCategory(averageLuminance);
    const isTooDark = averageLuminance < 18;
    const isTooBright = averageLuminance > 242;
    const isBlurry = laplacianVariance < 4 && colorVariance < 8;

    // Si la imagen es totalmente oscura
    if (isTooDark) {
      return {
        isValid: false,
        isPlant: false,
        brightnessScore: averageLuminance,
        brightnessCategory,
        blurScore: laplacianVariance,
        isTooDark: true,
        isTooBright: false,
        isBlurry: false,
        errorMessageKey: 'validation.tooDark'
      };
    }

    // Si la imagen está completamente quemada de luz
    if (isTooBright) {
      return {
        isValid: false,
        isPlant: false,
        brightnessScore: averageLuminance,
        brightnessCategory,
        blurScore: laplacianVariance,
        isTooDark: false,
        isTooBright: true,
        isBlurry: false,
        errorMessageKey: 'validation.tooBright'
      };
    }

    // Si la imagen es un plano plano/liso sin textura ni elementos visibles
    if (colorVariance < 4 && !isTooDark && !isTooBright) {
      return {
        isValid: false,
        isPlant: false,
        brightnessScore: averageLuminance,
        brightnessCategory,
        blurScore: laplacianVariance,
        isTooDark: false,
        isTooBright: false,
        isBlurry: true,
        errorMessageKey: 'validation.insufficientQuality'
      };
    }

    // Comprobación botánica local
    // Si la proporción de tonos botánicos / texturas orgánicas es razonable (> 0.08) o varianza adecuada
    const hasBotanicalFeatures = greenRatio >= 0.07 || (colorVariance > 18 && laplacianVariance > 8);

    if (!hasBotanicalFeatures && colorVariance < 12) {
      return {
        isValid: false,
        isPlant: false,
        brightnessScore: averageLuminance,
        brightnessCategory,
        blurScore: laplacianVariance,
        isTooDark: false,
        isTooBright: false,
        isBlurry: false,
        errorMessageKey: 'validation.notAPlant'
      };
    }

    return {
      isValid: true,
      isPlant: true,
      brightnessScore: averageLuminance,
      brightnessCategory,
      blurScore: laplacianVariance,
      isTooDark: false,
      isTooBright: false,
      isBlurry: false
    };
  } catch (err) {
    console.error('[GreenLens] Error validando imagen:', err);
    return {
      isValid: false,
      isPlant: false,
      brightnessScore: 128,
      brightnessCategory: 'Media',
      blurScore: 50,
      isTooDark: false,
      isTooBright: false,
      isBlurry: false,
      errorMessageKey: 'validation.cannotProcess'
    };
  }
}

/**
 * Comprueba si las fotografías proporcionadas son idénticas o casi idénticas
 */
export async function checkImagesSimilarity(
  images: string[]
): Promise<{ isTooSimilar: boolean; similarityWarning?: string }> {
  if (images.length < 2) {
    return { isTooSimilar: false };
  }

  try {
    const loaded = await Promise.all(images.map((b) => loadImageFromBase64(b)));
    const stats = loaded.map((img) => analyzeCanvasPixels(img));

    for (let i = 0; i < stats.length; i++) {
      for (let j = i + 1; j < stats.length; j++) {
        const lumDiff = Math.abs(stats[i].averageLuminance - stats[j].averageLuminance);
        const greenDiff = Math.abs(stats[i].greenRatio - stats[j].greenRatio);
        const varDiff = Math.abs(stats[i].colorVariance - stats[j].colorVariance);

        // Si luminancia, proporción de color y varianza son idénticas a menos del 1%
        if (lumDiff < 1.5 && greenDiff < 0.015 && varDiff < 1.5) {
          return {
            isTooSimilar: true,
            similarityWarning: 'validation.photosTooSimilar'
          };
        }
      }
    }
  } catch (e) {
    // Si falla el cálculo, no bloquear al usuario
  }

  return { isTooSimilar: false };
}
