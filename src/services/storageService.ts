import { ScanHistoryItem, UserProfile, AppSettings } from '../types';
import { formatScanDate, getTimestampMillis } from './dateUtils';

const STORAGE_KEYS = {
  HISTORY: 'greenlens_scan_history_v1',
  PROFILE: 'greenlens_user_profile_v1',
  SETTINGS: 'greenlens_app_settings_v1'
};

const DEFAULT_PROFILE: UserProfile = {
  firstName: 'Explorador',
  lastName: '',
  email: '',
  birthDate: '',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  isLoggedIn: false
};

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  notifications: true,
  language: 'es',
  confidenceThreshold: 0.6
};

/**
 * Miniatura síncrona segura: sólo dibuja en canvas si la imagen ya está 100% cargada y decodificada.
 * Si no está disponible de inmediato, devuelve el dataUrl original intacto para NUNCA producir un rectángulo negro.
 */
function createHistoryThumbnail(dataUrl: string, maxDimension: number = 280, quality: number = 0.6): string {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return dataUrl || '';
  }

  if (typeof document === 'undefined') return dataUrl;

  try {
    const img = document.createElement('img');
    img.src = dataUrl;

    // Si la imagen no está completamente cargada y decodificada, NO dibujar en canvas
    // porque un canvas sin pintar exportado a JPEG produce un rectángulo completamente negro.
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      return dataUrl;
    }

    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    // Rellenar fondo blanco para evitar que transparencias se conviertan en negro en JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return dataUrl;
  }
}

/**
 * Crea de forma asíncrona y segura una miniatura optimizada de la imagen para el historial,
 * garantizando que la imagen esté totalmente cargada y decodificada antes de dibujar en canvas,
 * y rellenando un fondo blanco para evitar que las transparencias se conviertan en negro en JPEG.
 */
export function createHistoryThumbnailAsync(
  dataUrl: string,
  maxDimension: number = 320,
  quality: number = 0.7
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return Promise.resolve(dataUrl || '');
  }

  // Si ya es muy pequeña (< 30KB), no es necesario recomprimirla
  if (dataUrl.length < 30 * 1024) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    try {
      if (typeof document === 'undefined') {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          if (!width || !height) {
            resolve(dataUrl);
            return;
          }

          const scale = Math.min(1, maxDimension / Math.max(width, height));
          const targetW = Math.max(1, Math.round(width * scale));
          const targetH = Math.max(1, Math.round(height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Fondo blanco para prevenir que transparencias (PNG/WebP) o zonas vacías se vuelvan negras en JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const result = canvas.toDataURL('image/jpeg', quality);
          resolve(result);
        } catch {
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

/**
 * Guarda el historial de forma segura gestionando posibles excepciones de cuota (QuotaExceededError).
 */
export function safeSaveHistory(items: ScanHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(items));
  } catch (err: any) {
    console.warn('[GreenLens Storage] Cuota de almacenamiento excedida, optimizando historial:', err);
    try {
      // 1. Reducir lista a los 30 más recientes
      const trimmed = items.slice(0, 30).map((item) => ({
        ...item,
        image: createHistoryThumbnail(item.image, 200, 0.5),
        details: item.details
          ? {
              ...item.details,
              imageUrl: createHistoryThumbnail(item.details.imageUrl, 200, 0.5)
            }
          : undefined
      }));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
    } catch (fallbackErr1) {
      try {
        // 2. Reducir a los 15 más recientes
        const minimal = items.slice(0, 15).map((item) => ({
          ...item,
          image: createHistoryThumbnail(item.image, 160, 0.4),
          details: item.details
            ? {
                ...item.details,
                imageUrl: ''
              }
            : undefined
        }));
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(minimal));
      } catch (fallbackErr2) {
        console.error('[GreenLens Storage] Imposible guardar historial local completo:', fallbackErr2);
      }
    }
  }
}

/**
 * Obtener historial de escaneos reales del usuario (sin ningún dato ficticio),
 * ordenado estrictamente por timestamp real decreciente (el más reciente arriba).
 */
export function getScanHistory(): ScanHistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!data) {
      return [];
    }
    const parsed: ScanHistoryItem[] = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    const sanitized = parsed.map((item) => {
      if (!item.image && item.details?.imageUrl) {
        item.image = item.details.imageUrl;
      }
      if (item.details && !item.details.imageUrl && item.image) {
        item.details.imageUrl = item.image;
      }
      return item;
    });

    // Ordenar de más reciente a más antiguo basándose en el timestamp real
    return sanitized.sort((a, b) => {
      const timeA = getTimestampMillis(a.timestamp);
      const timeB = getTimestampMillis(b.timestamp);
      return timeB - timeA;
    });
  } catch (e) {
    console.error('Error leyendo historial:', e);
    return [];
  }
}

/**
 * Guardar un nuevo escaneo real en el historial con preservación fiel de la imagen
 * y compresión adaptativa asíncrona en segundo plano para proteger la cuota de localStorage.
 */
export function addScanToHistory(
  item: Omit<ScanHistoryItem, 'id' | 'formattedDate'>
): ScanHistoryItem {
  const history = getScanHistory();
  const rawTimestamp = item.timestamp || new Date().toISOString();

  // Guardar siempre con la imagen original para visualización inmediata impecable y sin áreas negras
  const newItem: ScanHistoryItem = {
    ...item,
    image: item.image,
    details: item.details
      ? {
          ...item.details,
          imageUrl: item.details.imageUrl || item.image
        }
      : undefined,
    timestamp: rawTimestamp,
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    formattedDate: formatScanDate(rawTimestamp)
  };

  const updated = [newItem, ...history].sort((a, b) => {
    return getTimestampMillis(b.timestamp) - getTimestampMillis(a.timestamp);
  });

  safeSaveHistory(updated);

  // Optimización asíncrona segura en segundo plano para ahorrar cuota de localStorage sin alterar la visualización inmediata
  if (typeof window !== 'undefined' && item.image && item.image.startsWith('data:image/')) {
    createHistoryThumbnailAsync(item.image, 320, 0.7).then((optimizedImg) => {
      if (optimizedImg && optimizedImg !== item.image && optimizedImg.length < item.image.length) {
        newItem.image = optimizedImg;
        if (newItem.details) {
          newItem.details.imageUrl = optimizedImg;
        }
        try {
          const currentHistory = getScanHistory();
          const idx = currentHistory.findIndex((h) => h.id === newItem.id);
          if (idx !== -1) {
            currentHistory[idx].image = optimizedImg;
            if (currentHistory[idx].details) {
              currentHistory[idx].details!.imageUrl = optimizedImg;
            }
            safeSaveHistory(currentHistory);
          }
        } catch {
          // Ignorar si falla la optimización secundaria
        }
      }
    });
  }

  return newItem;
}

/**
 * Eliminar un escaneo específico
 */
export function deleteScan(id: string): ScanHistoryItem[] {
  const history = getScanHistory();
  const updated = history.filter((item) => String(item.id) !== String(id));
  safeSaveHistory(updated);
  return updated;
}

/**
 * Limpiar todo el historial
 */
export function clearHistory(): void {
  safeSaveHistory([]);
}

/**
 * Alternar favorito en un item del historial
 */
export function toggleFavorite(id: string): ScanHistoryItem[] {
  const history = getScanHistory();
  const updated = history.map((item) => {
    if (item.id === id) {
      return { ...item, isFavorite: !item.isFavorite };
    }
    return item;
  });
  safeSaveHistory(updated);
  return updated;
}

/**
 * Obtener el perfil del usuario
 */
export function getUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!data) {
      return DEFAULT_PROFILE;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error leyendo perfil:', e);
    return DEFAULT_PROFILE;
  }
}

/**
 * Guardar datos del perfil
 */
export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated = { ...current, ...profile };
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error guardando perfil:', err);
  }
  return updated;
}

/**
 * Obtener ajustes de la aplicación
 */
export function getAppSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error leyendo ajustes:', e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Guardar ajustes
 */
export function saveAppSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error guardando ajustes:', err);
  }
  return updated;
}

/**
 * Limpia todos los datos y estados locales del usuario al cerrar sesión o eliminar cuenta
 */
export function clearAllLocalUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem('greenlens_welcome_completed');
    localStorage.removeItem('greenlens_theme_mode');
    localStorage.removeItem('greenlens_care_state');
    localStorage.removeItem('greenlens_last_result');
  } catch (e) {
    console.error('Error limpiando datos locales:', e);
  }
}
