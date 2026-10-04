import { LanguageCode } from '../types';

/**
 * Normaliza una cadena de texto para facilitar el emparejamiento insensible a mayúsculas, diacríticos y espacios.
 */
function normalizeStr(str: any): string {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Diccionario de especies botánicas populares frecuentemente identificadas o guardadas en el historial.
 * Permite que nombres en español, catalán o inglés se traduzcan de manera nativa e inmediata al cambiar de idioma (por ej. a Árabe o Catalán).
 */
const KNOWN_SPECIES_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  // Girasol / Sunflower
  girasol: {
    es: 'Girasol',
    ca: 'Gira-sol',
    en: 'Sunflower',
    ar: 'دوار الشمس'
  },
  'gira-sol': {
    es: 'Girasol',
    ca: 'Gira-sol',
    en: 'Sunflower',
    ar: 'دوار الشمس'
  },
  sunflower: {
    es: 'Girasol',
    ca: 'Gira-sol',
    en: 'Sunflower',
    ar: 'دوار الشمس'
  },
  'دوار الشمس': {
    es: 'Girasol',
    ca: 'Gira-sol',
    en: 'Sunflower',
    ar: 'دوار الشمس'
  },

  // Monstera / Costilla de Adán
  monstera: {
    es: 'Costilla de Adán (Monstera)',
    ca: 'Costella d’Adan (Monstera)',
    en: 'Swiss Cheese Plant (Monstera)',
    ar: 'نبتة القفص الصدري (مونستيرا)'
  },
  'costilla de adan': {
    es: 'Costilla de Adán',
    ca: 'Costella d’Adan',
    en: 'Swiss Cheese Plant',
    ar: 'نبتة القفص الصدري'
  },

  // Pothos / Poto
  poto: {
    es: 'Poto',
    ca: 'Potos',
    en: 'Golden Pothos',
    ar: 'نبات البوتس'
  },
  pothos: {
    es: 'Poto',
    ca: 'Potos',
    en: 'Golden Pothos',
    ar: 'نبات البوتس'
  },

  // Ficus
  ficus: {
    es: 'Ficus',
    ca: 'Ficus',
    en: 'Ficus',
    ar: 'فيكوس'
  },

  // Sansevieria / Lengua de suegra / Snake Plant
  sansevieria: {
    es: 'Sansevieria (Lengua de suegra)',
    ca: 'Sansevièria (Llengua de sogra)',
    en: 'Snake Plant (Sansevieria)',
    ar: 'نبات الثعبان (جلد النمر)'
  },
  'lengua de suegra': {
    es: 'Lengua de suegra',
    ca: 'Llengua de sogra',
    en: 'Snake Plant',
    ar: 'جلد النمر'
  },

  // Aloe Vera
  'aloe vera': {
    es: 'Aloe Vera',
    ca: 'Àloe Vera',
    en: 'Aloe Vera',
    ar: 'ألوفيرا (الصبار الحقيقي)'
  },
  aloe: {
    es: 'Aloe',
    ca: 'Àloe',
    en: 'Aloe',
    ar: 'صبار الألوفيرا'
  },

  // Lavanda / Lavender
  lavanda: {
    es: 'Lavanda',
    ca: 'Lavanda',
    en: 'Lavender',
    ar: 'الخزامى (لافندر)'
  },
  lavender: {
    es: 'Lavanda',
    ca: 'Lavanda',
    en: 'Lavender',
    ar: 'الخزامى (لافندر)'
  },

  // Romero / Rosemary
  romero: {
    es: 'Romero',
    ca: 'Romer',
    en: 'Rosemary',
    ar: 'إكليل الجبل (روزماري)'
  },
  rosemary: {
    es: 'Romero',
    ca: 'Romer',
    en: 'Rosemary',
    ar: 'إكليل الجبل (روزماري)'
  },

  // Orquídea / Orchid
  orquidea: {
    es: 'Orquídea',
    ca: 'Orquídia',
    en: 'Orchid',
    ar: 'أوركيد (سحلبية)'
  },
  orchid: {
    es: 'Orquídea',
    ca: 'Orquídia',
    en: 'Orchid',
    ar: 'أوركيد (سحلبية)'
  },

  // Suculenta / Succulent
  suculenta: {
    es: 'Suculenta',
    ca: 'Suculenta',
    en: 'Succulent',
    ar: 'نبات عصاري'
  },
  succulent: {
    es: 'Suculenta',
    ca: 'Suculenta',
    en: 'Succulent',
    ar: 'نبات عصاري'
  },

  // Cactus
  cactus: {
    es: 'Cactus',
    ca: 'Cactus',
    en: 'Cactus',
    ar: 'صبّار'
  },

  // Helecho / Fern
  helecho: {
    es: 'Helecho',
    ca: 'Falguera',
    en: 'Fern',
    ar: 'سرخس'
  },
  fern: {
    es: 'Helecho',
    ca: 'Falguera',
    en: 'Fern',
    ar: 'سرخس'
  },

  // Rosa / Rose
  rosa: {
    es: 'Rosa',
    ca: 'Rosa',
    en: 'Rose',
    ar: 'وردة'
  },
  rose: {
    es: 'Rosa',
    ca: 'Rosa',
    en: 'Rose',
    ar: 'وردة'
  },

  // Espatifilo / Lirio de la paz / Peace Lily
  espatifilo: {
    es: 'Espatifilo (Lirio de la paz)',
    ca: 'Espatifil·le (Lliri de la pau)',
    en: 'Peace Lily',
    ar: 'زنبق السلام'
  },
  'lirio de la paz': {
    es: 'Lirio de la paz',
    ca: 'Lliri de la pau',
    en: 'Peace Lily',
    ar: 'زنبق السلام'
  },
  'peace lily': {
    es: 'Lirio de la paz',
    ca: 'Lliri de la pau',
    en: 'Peace Lily',
    ar: 'زنبق السلام'
  }
};

/**
 * Traduce o localiza la categoría o etiquetas de una planta al idioma actual de la aplicación.
 * Maneja cadenas guardadas en cualquier idioma (es, ca, en, ar) y las unifica dinámicamente.
 */
export function getLocalizedCategory(
  category: string | undefined | null,
  t: (key: any, params?: any) => string
): string {
  if (!category || typeof category !== 'string') {
    return t('history.identifiedSpecies');
  }

  const raw = category.trim();
  const norm = normalizeStr(category);

  // 1. Especie Identificada / Identified Species
  if (
    norm === 'especie identificada' ||
    norm === 'identified species' ||
    norm === 'especie' ||
    norm === 'especie botanica' ||
    norm === 'botanical specimen' ||
    norm.includes('especie identificada') ||
    norm.includes('identified species') ||
    raw.includes('نوع محدد') ||
    raw.includes('نوع نباتي')
  ) {
    return t('history.identifiedSpecies');
  }

  // 2. No botánico / Objeto no botánico / Non-botanical
  if (
    norm.includes('no botanic') ||
    norm.includes('no botan') ||
    norm.includes('non-botanic') ||
    norm.includes('non botanic') ||
    norm.includes('not a plant') ||
    norm.includes('objeto no') ||
    norm.includes('objecte no') ||
    raw.includes('غير نباتي') ||
    raw.includes('عنصر غير نباتي')
  ) {
    return t('notAPlant.notBotanical');
  }

  // 3. Botánica / Botanical
  if (
    norm === 'botanica' ||
    norm === 'botanical' ||
    norm === 'botanic' ||
    norm.includes('botanica') ||
    norm.includes('botanical') ||
    raw.includes('نباتي')
  ) {
    return t('history.botanical');
  }

  // 4. Colección / Collection
  if (
    norm === 'coleccion' ||
    norm === 'colleccio' ||
    norm === 'collection' ||
    norm.includes('coleccion') ||
    norm.includes('colleccio') ||
    norm.includes('collection') ||
    raw.includes('مجموعة')
  ) {
    return t('history.collection');
  }

  // 5. Categorías botánicas de entorno (Interior / Exterior / Env Indoor / Env Outdoor)
  if (
    norm.includes('env indoor') ||
    norm.startsWith('indoor') ||
    norm === 'interior' ||
    norm === 'indoor' ||
    norm.includes('interior') ||
    raw.includes('داخلي')
  ) {
    return t('care.envIndoor' as any);
  }

  if (
    norm.includes('env outdoor') ||
    norm.startsWith('outdoor') ||
    norm === 'exterior' ||
    norm === 'outdoor' ||
    norm.includes('exterior') ||
    raw.includes('خارجي')
  ) {
    return t('care.envOutdoor' as any);
  }

  // 6. Tipos y órganos botánicos frecuentes en tags
  if (norm === 'flor' || norm === 'flower' || norm === 'flors' || raw.includes('زهرة') || raw.includes('أزهار')) {
    return t('plant.tagFlower' as any);
  }
  if (norm === 'hoja' || norm === 'leaf' || norm === 'fulla' || raw.includes('ورقة') || raw.includes('أوراق')) {
    return t('plant.tagLeaf' as any);
  }
  if (norm.includes('polinizador') || norm.includes('pollinator') || norm.includes('atractivo para polinizadores') || raw.includes('ملقحات') || raw.includes('جاذب للملقحات')) {
    return t('plant.tagPollinators' as any);
  }
  if (norm === 'arbol' || norm === 'tree' || norm === 'arbre' || raw.includes('شجرة')) {
    return t('plant.tagTree' as any);
  }
  if (norm === 'arbusto' || norm === 'shrub' || norm === 'bush' || raw.includes('شجيرة')) {
    return t('plant.tagShrub' as any);
  }
  if (norm.includes('ornamental') || raw.includes('زينة')) {
    return t('plant.tagOrnamental' as any);
  }

  // Si tiene prefijo 'Env ' o 'Entorno ', extraer el valor
  if (norm.startsWith('env ')) {
    const subVal = norm.replace(/^env\s+/, '');
    if (subVal === 'outdoor' || subVal === 'exterior') return t('care.envOutdoor' as any);
    if (subVal === 'indoor' || subVal === 'interior') return t('care.envIndoor' as any);
  }

  return category;
}

/**
 * Traduce o localiza nombres de plantas guardados previamente en cualquier idioma
 */
export function getLocalizedSpeciesName(
  name: string | undefined | null,
  t: (key: any, params?: any) => string,
  language?: LanguageCode
): string {
  if (!name || typeof name !== 'string') return '';
  const norm = normalizeStr(name);

  // Nombres de elementos no botánicos
  if (
    norm.includes('no parece ser una planta') ||
    norm.includes('no sembla ser una planta') ||
    norm.includes('does not appear to be a plant') ||
    norm.includes('no es una planta') ||
    (typeof name === 'string' && (name.includes('لا يبدو أنه نبات') || name.includes('لا يبدو أن')))
  ) {
    return t('notAPlant.title');
  }

  // Traducción dinámica de especies botánicas conocidas según el idioma activo
  if (language) {
    for (const [key, map] of Object.entries(KNOWN_SPECIES_TRANSLATIONS)) {
      if (norm === key || norm.includes(key) || (typeof name === 'string' && name.includes(key))) {
        return map[language] || name;
      }
    }
  }

  return name;
}

/**
 * Traduce o localiza el nombre científico cuando es un valor reservado (ej: "No disponible", "Especie botánica")
 */
export function getLocalizedScientificName(
  scientificName: string | undefined | null,
  language: LanguageCode
): string {
  if (!scientificName || typeof scientificName !== 'string') return '';
  const norm = normalizeStr(scientificName);

  if (
    norm === 'no disponible' ||
    norm === 'not available' ||
    norm === 'no aplicable' ||
    norm === 'not applicable' ||
    (typeof scientificName === 'string' && (scientificName.includes('غير متوفر') || scientificName.includes('لا ينطبق')))
  ) {
    return language === 'en'
      ? 'Not applicable'
      : language === 'ca'
      ? 'No aplicable'
      : language === 'ar'
      ? 'لا ينطبق'
      : 'No aplicable';
  }

  if (
    norm === 'especie botanica' ||
    norm === 'botanical specimen' ||
    norm === 'especie no determinada' ||
    norm === 'undetermined species' ||
    scientificName.includes('نوع نباتي') ||
    scientificName.includes('نوع غير محدد')
  ) {
    return language === 'en'
      ? 'Botanical specimen'
      : language === 'ca'
      ? 'Espècie botànica'
      : language === 'ar'
      ? 'عينة نباتية'
      : 'Especie botánica';
  }

  // Nombres científicos populares con transcripción árabe o formatos localizados
  const SCIENTIFIC_NAMES_LOCALIZED: Record<string, Record<LanguageCode, string>> = {
    'helianthus annuus': {
      es: 'Helianthus annuus',
      ca: 'Helianthus annuus',
      en: 'Helianthus annuus',
      ar: 'هيليانثوس أنوس (Helianthus annuus)'
    },
    'monstera deliciosa': {
      es: 'Monstera deliciosa',
      ca: 'Monstera deliciosa',
      en: 'Monstera deliciosa',
      ar: 'مونستيرا ديليسيوسا (Monstera deliciosa)'
    },
    'epipremnum aureum': {
      es: 'Epipremnum aureum',
      ca: 'Epipremnum aureum',
      en: 'Epipremnum aureum',
      ar: 'إبيبرمنوم أوريوم (Epipremnum aureum)'
    },
    'spathiphyllum wallisii': {
      es: 'Spathiphyllum wallisii',
      ca: 'Spathiphyllum wallisii',
      en: 'Spathiphyllum wallisii',
      ar: 'سباثيفيلوم واليسي (Spathiphyllum wallisii)'
    },
    'sansevieria trifasciata': {
      es: 'Sansevieria trifasciata',
      ca: 'Sansevieria trifasciata',
      en: 'Sansevieria trifasciata',
      ar: 'سانسيفيريا تريفاسياتا (Sansevieria trifasciata)'
    },
    'ficus elastica': {
      es: 'Ficus elastica',
      ca: 'Ficus elastica',
      en: 'Ficus elastica',
      ar: 'فيكوس إلاستيكا (Ficus elastica)'
    }
  };

  const directMatch = SCIENTIFIC_NAMES_LOCALIZED[norm];
  if (directMatch && directMatch[language]) {
    return directMatch[language];
  }

  return scientificName;
}

/**
 * Traduce o localiza los títulos y descripciones de cuidado cuando han sido guardados
 * en un idioma previo o provienen de una ficha botánica estándar
 */
export function getLocalizedCareTitle(
  title: string | undefined | null,
  category: 'light' | 'watering' | 'temperature',
  t: (key: any, params?: any) => string
): string {
  if (!title || typeof title !== 'string') {
    return category === 'light'
      ? t('result.light')
      : category === 'watering'
      ? t('result.watering')
      : t('result.temperature');
  }

  const norm = normalizeStr(title);

  // Luz
  if (category === 'light') {
    if (norm.includes('direct') || norm.includes('pleno sol') || norm.includes('directa') || (typeof title === 'string' && title.includes('مباشر'))) {
      return t('care.lightDirect' as any);
    }
    if (norm.includes('indirect') || norm.includes('brillante') || (typeof title === 'string' && title.includes('غير مباشر'))) {
      return t('care.lightIndirect' as any);
    }
    if (norm.includes('baja') || norm.includes('sombra') || norm.includes('low') || (typeof title === 'string' && title.includes('منخفض'))) {
      return t('care.lightLow' as any);
    }
    return t('result.light');
  }

  // Riego
  if (category === 'watering') {
    if (norm.includes('regular') || norm.includes('moderado') || (typeof title === 'string' && title.includes('منتظم'))) {
      return t('care.waterRegular' as any);
    }
    if (norm.includes('frecuente') || norm.includes('alto') || (typeof title === 'string' && title.includes('متكرر'))) {
      return t('care.waterFrequent' as any);
    }
    if (norm.includes('escaso') || norm.includes('poco') || norm.includes('bajo') || (typeof title === 'string' && title.includes('قليل'))) {
      return t('care.waterLow' as any);
    }
    return t('result.watering');
  }

  // Temperatura
  if (category === 'temperature') {
    if (norm.includes('calid') || norm.includes('templad') || norm.includes('warm') || (typeof title === 'string' && title.includes('دافئ'))) {
      return t('care.tempWarm' as any);
    }
    if (norm.includes('fria') || norm.includes('cold') || (typeof title === 'string' && title.includes('بارد'))) {
      return t('care.tempCold' as any);
    }
    if (norm.includes('moderada') || norm.includes('mild') || (typeof title === 'string' && title.includes('معتدل'))) {
      return t('care.tempMild' as any);
    }
    return t('result.temperature');
  }

  return title;
}
