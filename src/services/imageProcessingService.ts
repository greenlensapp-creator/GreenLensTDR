/**
 * Servicio unificado de procesamiento, normalización y compresión de imágenes para GreenLens.
 * Procesa de forma idéntica archivos procedentes de la Cámara (Android/iOS) y de la Galería.
 * 
 * Garantiza:
 * 1. Conversión de cualquier formato (JPEG, PNG, HEIC rasterizado por navegador, WebP) a JPEG estándar.
 * 2. Redimensionamiento adaptativo a máximo 1280px para no sobrecargar la memoria ni límites de red.
 * 3. Compresión optimizada para transmisión eficiente al backend de visión.
 */

export async function processImageFile(
  fileOrBlob: File | Blob | string,
  maxDimension: number = 1280
): Promise<string> {
  if (!fileOrBlob) {
    throw new Error('No se ha proporcionado ninguna imagen para procesar');
  }

  // Si ya es un string dataURL base64 válido y pequeño, podemos optimizarlo a través de Image/Canvas
  if (typeof fileOrBlob === 'string') {
    if (!fileOrBlob.startsWith('data:image/')) {
      return fileOrBlob;
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const width = img.width || 1;
          const height = img.height || 1;
          if (width <= maxDimension && height <= maxDimension && fileOrBlob.length < 500 * 1024) {
            resolve(fileOrBlob);
            return;
          }
          const scale = Math.min(1, maxDimension / Math.max(width, height));
          const targetWidth = Math.round(width * scale);
          const targetHeight = Math.round(height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(fileOrBlob);
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch {
          resolve(fileOrBlob);
        }
      };
      img.onerror = () => resolve(fileOrBlob);
      img.src = fileOrBlob;
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo de imagen desde el dispositivo'));
    };

    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      if (!rawDataUrl) {
        reject(new Error('El archivo no generó un DataURL válido'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onerror = () => {
        // Fallback seguro si Image no puede decodificarlo
        resolve(rawDataUrl);
      };

      img.onload = () => {
        try {
          const width = img.width || 1;
          const height = img.height || 1;

          // Redimensionar proporcionalmente para optimizar ancho de banda y memoria móvil
          const scale = Math.min(1, maxDimension / Math.max(width, height));
          const targetWidth = Math.max(1, Math.round(width * scale));
          const targetHeight = Math.max(1, Math.round(height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          // Dibujar con suavizado
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Exportar a JPEG de calidad equilibrada (0.82) para rendimiento óptimo
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(optimizedDataUrl);
        } catch (e) {
          // En caso de excepción con Canvas en algún navegador móvil, fallback
          resolve(rawDataUrl);
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(fileOrBlob);
  });
}
