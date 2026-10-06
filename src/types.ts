export interface PredictionResult {
  className: string;
  probability: number; // 0.0 to 1.0
  percentage: number;  // 0 to 100 integer or 1 decimal
}

export interface PlantCareInfo {
  light: { title: string; desc: string };
  watering: { title: string; desc: string };
  temperature: { title: string; desc: string };
}

export interface PlantInfo {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  tags: string[];
  family: string;
  origin: string;
  size: string;
  location: string;
  care: PlantCareInfo;
  plantType?: string;
  lifeCycle?: string;
  characteristics?: {
    approximateHeight?: string;
    leafColor?: string;
    leafType?: string;
    flowerColor?: string;
    plantingSeason?: string;
  };
  toxicityAlert?: {
    title: string;
    desc: string;
  };
  toxicity?: {
    isToxicToHumans?: boolean;
    isToxicToPets?: boolean;
    details?: string;
  };
  naturalHabitat?: string;
  curiosities?: string[];
  description: string;
  imageUrl: string;
  matchScore?: number;
  apiError?: string;
  isPlant?: boolean;
  confidencePercentage?: number;
  isCertain?: boolean;
  observedCharacteristics?: string[];
  possibleAlternatives?: string[];
  identificationMessage?: string;
}

export interface ClassificationResult {
  topPrediction: PredictionResult;
  allPredictions: PredictionResult[];
  isConfident: boolean;
  threshold: number;
  capturedImage: string;
  timestamp: string;
  details: PlantInfo;
}

export interface ScanHistoryItem {
  id: string;
  name: string;
  scientificName: string;
  confidence: number;
  timestamp: string;
  formattedDate: string;
  image: string;
  category: string;
  isFavorite: boolean;
  allPredictions?: PredictionResult[];
  details?: PlantInfo;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  uid?: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  avatarUrl: string;
  isLoggedIn: boolean;
  language?: LanguageCode;
  themeMode?: ThemeMode;
  welcomeCompleted?: boolean;
  onboardingCompleted?: boolean;
  profileCompleted?: boolean;
  authProvider?: 'google' | 'password';
}

export type LanguageCode = 'es' | 'ca' | 'en' | 'ar';

export interface AppSettings {
  darkMode: boolean;
  themeMode?: ThemeMode;
  notifications: boolean;
  language: LanguageCode;
  confidenceThreshold: number;
  welcomeCompleted?: boolean;
  backendUrl?: string;
}

export type ActiveTab = 'inicio' | 'cuidados' | 'escanear' | 'historial' | 'ajustes';

export type CareToolType =
  | 'overview'
  | 'light_meter'
  | 'watering_calc'
  | 'ideal_conditions'
  | 'care_guide'
  | 'plant_health';

export interface LightMeterRequest {
  imageBase64?: string;
  plantName?: string;
  brightnessCategory?: 'Muy baja' | 'Baja' | 'Media' | 'Alta' | 'Muy alta' | string;
}

export interface LightMeterResponse {
  isPlant?: boolean;
  plantName?: string;
  hoursOfLight: string;
  exposureType: string;
  adequateIntensity: string;
  recommendation: string;
  // Propiedades auxiliares de compatibilidad
  detectedLevel?: string;
  detectedLevelKey?: 'low' | 'adequate' | 'high' | string;
  adequateZone?: { minPercent: number; maxPercent: number };
  currentLevelPercent?: number;
  isAdequate?: boolean;
  adequacyStatus?: string;
  recommendedLightType?: string;
  locationAdvice?: string;
  recommendations?: string[];
}

export interface WateringCalcRequest {
  imageBase64?: string;
  plantName?: string;
  plantSize?: string;
  environment?: string;
  temperature?: string;
  humidity?: string;
  light?: string;
  potType?: string;
  potSize?: string;
  soilType?: string;
}

export interface WateringCalcResponse {
  isPlant?: boolean;
  plantName?: string;
  wateringFrequency: string;
  wateringAmount: string;
  recommendation?: string;
  frequency?: string;
  amount?: string;
  adjustmentNote?: string;
  recommendations?: string[];
  overwateringSigns?: string[];
  underwateringSigns?: string[];
}

export interface ConditionsRequest {
  imageBase64?: string;
  plantName?: string;
  temperature?: string;
  humidity?: string;
  light?: string;
  location?: string;
}

export interface ConditionFactorAssessment {
  status: 'Adecuado' | 'Mejorable' | 'No recomendado' | string;
  idealRange: string;
  comment: string;
}

export interface ConditionsResponse {
  isPlant?: boolean;
  plantName?: string;
  temperature: string;
  humidity: string;
  light: string;
  soil?: string;
  watering?: string;
  summary: string;
  rating?: 'Adecuado' | 'Mejorable' | 'No recomendado' | string;
  ratingScore?: 'green' | 'yellow' | 'red';
  temperatureAssessment?: ConditionFactorAssessment;
  humidityAssessment?: ConditionFactorAssessment;
  lightAssessment?: ConditionFactorAssessment;
  soilAssessment?: ConditionFactorAssessment;
  recommendations?: string[];
}

export interface CareGuideRequest {
  imageBase64?: string;
  plantName?: string;
}

export interface CareGuideResponse {
  isPlant?: boolean;
  name?: string;
  plantName?: string;
  scientificName?: string;
  description?: string;
  light?: string | { requirement?: string; placement?: string };
  watering?: string | { frequency?: string; tips?: string; amount?: string };
  temperature?: string | { min?: string; max?: string; ideal?: string };
  humidity?: string | { percentage?: string; advice?: string };
  soil?: string | { type?: string; drainage?: string };
  pruning?: string | { season?: string; technique?: string };
  fertilizer?: string | { frequency?: string; type?: string };
  precautions?: string;
  seasonalAdvice?: { spring?: string; summer?: string; autumn?: string; winter?: string };
  commonMistakes?: string[];
  commonIssues?: string[];
}

export interface PlantHealthRequest {
  imageBase64?: string;
  images?: string[];
  plantName?: string;
  symptoms?: string;
  photoAngles?: string[];
}

export interface PlantHealthResponse {
  isPlant?: boolean;
  plantName?: string;
  problem: string;
  possibleCauses: string;
  solutions: string;
  severity: 'Baja' | 'Media' | 'Alta' | string;
  recommendation: string;
  // Propiedades auxiliares de compatibilidad
  healthStatus?: 'healthy' | 'warning' | 'critical' | 'unknown' | string;
  statusLevel?: 'healthy' | 'warning' | 'alert' | string;
  statusLabel?: string;
  summary?: string;
  overallAdvice?: string;
  issues?: any[];
  possibleIssues?: string[];
  recommendations?: string[];
}

export interface LightMeterResponse {
  detectedLevel: 'Muy baja' | 'Baja' | 'Media' | 'Alta' | 'Muy alta' | string;
  isAdequate: boolean;
  adequacyStatus: string;
  recommendedLightType: string;
  locationAdvice: string;
  recommendations: string[];
}

export interface ImageValidationResult {
  isValid: boolean;
  isPlant: boolean;
  brightnessScore: number;
  brightnessCategory: 'Muy baja' | 'Baja' | 'Media' | 'Alta' | 'Muy alta';
  blurScore: number;
  isTooDark: boolean;
  isTooBright: boolean;
  isBlurry: boolean;
  errorMessageKey?: string;
  detectedPlantLabel?: string;
}
