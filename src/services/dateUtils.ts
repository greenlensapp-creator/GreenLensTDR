import { LanguageCode } from '../types';

/**
 * Formatea una fecha respetando la zona horaria local del navegador/dispositivo.
 * Compara por día calendario exacto:
 * - "Hoy · HH:mm" (o formato correspondiente según idioma)
 * - "Ayer · HH:mm"
 * - "DD/MM/YYYY · HH:mm"
 * 
 * Si el registro no tiene fecha o es inválida, retorna "Fecha no disponible" en vez de inventar una fecha.
 */
export function formatScanDate(
  rawTimestamp?: string | number | { seconds?: number; nanoseconds?: number; toDate?: () => Date } | null,
  lang: LanguageCode = 'es'
): string {
  if (!rawTimestamp) {
    return lang === 'es' ? 'Fecha no disponible' : lang === 'ca' ? 'Data no disponible' : lang === 'ar' ? 'التاريخ غير متوفر' : 'Date not available';
  }

  let date: Date;

  try {
    if (typeof rawTimestamp === 'object') {
      if (typeof rawTimestamp.toDate === 'function') {
        date = rawTimestamp.toDate();
      } else if (typeof rawTimestamp.seconds === 'number') {
        date = new Date(rawTimestamp.seconds * 1000);
      } else {
        date = new Date(rawTimestamp as any);
      }
    } else if (typeof rawTimestamp === 'number') {
      date = new Date(rawTimestamp);
    } else if (typeof rawTimestamp === 'string') {
      // Intentar parsear ISO string o timestamp numérico como string
      const num = Number(rawTimestamp);
      if (!isNaN(num) && num > 100000000000) {
        date = new Date(num);
      } else {
        date = new Date(rawTimestamp);
      }
    } else {
      date = new Date(rawTimestamp as any);
    }

    if (isNaN(date.getTime())) {
      return lang === 'es' ? 'Fecha no disponible' : lang === 'ca' ? 'Data no disponible' : lang === 'ar' ? 'التاريخ غير متوفر' : 'Date not available';
    }
  } catch {
    return lang === 'es' ? 'Fecha no disponible' : lang === 'ca' ? 'Data no disponible' : lang === 'ar' ? 'التاريخ غير متوفر' : 'Date not available';
  }

  const now = new Date();

  // Comparación por día de calendario en la zona horaria local
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  // Formato de hora en 2 dígitos (HH:mm)
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  // Formato de fecha numérica DD/MM/YYYY
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const dateStr = `${day}/${month}/${year}`;

  if (isSameDay) {
    const todayLabel = lang === 'es' ? 'Hoy' : lang === 'ca' ? 'Avui' : lang === 'ar' ? 'اليوم' : 'Today';
    return `${todayLabel} · ${timeStr}`;
  }

  if (isYesterday) {
    const yesterdayLabel = lang === 'es' ? 'Ayer' : lang === 'ca' ? 'Ahir' : lang === 'ar' ? 'أمس' : 'Yesterday';
    return `${yesterdayLabel} · ${timeStr}`;
  }

  return `${dateStr} · ${timeStr}`;
}

/**
 * Obtiene el valor numérico en milisegundos de cualquier timestamp válido
 * para ordenar estrictamente de más reciente a más antiguo (o null si es inválido).
 */
export function getTimestampMillis(
  rawTimestamp?: string | number | { seconds?: number; nanoseconds?: number; toDate?: () => Date } | null
): number {
  if (!rawTimestamp) return 0;

  try {
    if (typeof rawTimestamp === 'object') {
      if (typeof rawTimestamp.toDate === 'function') {
        return rawTimestamp.toDate().getTime();
      }
      if (typeof rawTimestamp.seconds === 'number') {
        return rawTimestamp.seconds * 1000;
      }
    }
    if (typeof rawTimestamp === 'number') {
      return rawTimestamp;
    }
    if (typeof rawTimestamp === 'string') {
      const num = Number(rawTimestamp);
      if (!isNaN(num) && num > 100000000000) {
        return num;
      }
      const t = new Date(rawTimestamp).getTime();
      return isNaN(t) ? 0 : t;
    }
  } catch {
    return 0;
  }
  return 0;
}
