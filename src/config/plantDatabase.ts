import { PlantInfo } from '../types';

/**
 * =========================================================================
 * 🌿 GREENLENS - CONFIGURACIÓN Y ESTRUCTURAS DE DATOS BOTÁNICOS
 * =========================================================================
 * No contiene datos ficticios ni objetos inventados.
 * Todas las identificaciones e información son generadas de forma estructurada
 * mediante la capa de inteligencia artificial botánica de GreenLens.
 */

export const EXPLORE_CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'auto_awesome' },
  { id: 'interior', name: 'Interior', icon: 'home' },
  { id: 'suculentas', name: 'Suculentas', icon: 'nature' },
  { id: 'arboles', name: 'Árboles', icon: 'park' },
  { id: 'flores', name: 'Con Flor', icon: 'local_florist' },
  { id: 'otros', name: 'Otras Especies', icon: 'category' }
];

/**
 * Plantas destacadas vacías por defecto. Se poblarán únicamente con las identificaciones reales del usuario.
 */
export const FEATURED_ITEMS: PlantInfo[] = [];
