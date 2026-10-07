import React, { useState, useRef } from 'react';
import { ScanHistoryItem, PlantHealthRequest, PlantHealthResponse, ImageValidationResult } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { validateImageForCare } from '../../services/imageValidationService';
import { processImageFile } from '../../services/imageProcessingService';
import { analyzePlantHealth } from '../../services/careToolsService';
import { CareCameraModal } from './CareCameraModal';

interface PlantHealthViewProps {
  onBack: () => void;
  recentScans?: ScanHistoryItem[];
}

export const PlantHealthView: React.FC<PlantHealthViewProps> = ({
  onBack
}) => {
  const { t, language } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PlantHealthResponse | null>(null);
  const [calculatedPlantName, setCalculatedPlantName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSelectPhoto = async (file: File, precomputedDataUrl?: string) => {
    if (!file || isLoading) return;

    setValidationError(null);
    setError(null);

    try {
      const dataUrl = precomputedDataUrl || (await processImageFile(file));
      setPhotoPreview(dataUrl);

      const val = await validateImageForCare(dataUrl);
      setValidationResult(val);

      if (!val.isValid) {
        const errKey = val.errorMessageKey || 'validation.notAPlant';
        setValidationError(t(errKey as any));
      }
    } catch (err: any) {
      console.error('[PlantHealth] Error procesando imagen:', err);
      setValidationError(t('care.error.analysisFailed'));
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectPhoto(file);
    }
    e.target.value = '';
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectPhoto(file);
    }
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (isLoading || !photoPreview) return;

    setResult(null);
    setError(null);
    setValidationError(null);
    setIsLoading(true);

    try {
      const request: PlantHealthRequest = {
        imageBase64: photoPreview,
        images: [photoPreview]
      };

      const res = await analyzePlantHealth(request, language);

      const isNonPlant =
        res?.isPlant === false ||
        /no se ha identificado|no s'ha identificat|no plant identified|not a plant|لم يتم/i.test(res?.plantName || res?.problem || '');

      if (isNonPlant) {
        setError(res?.recommendation || res?.problem || t('notAPlant.message'));
        setResult(null);
        return;
      }

      const returnedPlantName = res?.plantName || t('health.title');
      setCalculatedPlantName(returnedPlantName);
      setResult(res);

      // Limpiar entrada tras respuesta exitosa
      setPhotoPreview(null);
      setValidationResult(null);
      setValidationError(null);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    } catch (err: any) {
      console.error('[GreenLens: PlantHealth error]', err);
      setError(t('care.error.analysisFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPhoto = () => {
    setPhotoPreview(null);
    setValidationResult(null);
    setValidationError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Live Camera Modal */}
      <CareCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file, dataUrl) => {
          setIsCameraOpen(false);
          handleSelectPhoto(file, dataUrl);
        }}
        onFallbackToGallery={() => galleryInputRef.current?.click()}
        title={t('health.title')}
      />

      {/* Hidden inputs para cámara y galería */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryChange}
        className="hidden"
      />

      {/* Top navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#006b5e] hover:text-[#005046] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span>{t('care.tool.backToHub')}</span>
      </button>

      {/* Tool Header */}
      <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200/80 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">health_and_safety</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#191c1d]">{t('health.title')}</h1>
            <p className="text-xs text-[#526360]">{t('health.desc')}</p>
          </div>
        </div>
      </div>

      {/* Photo capture or upload */}
      {!photoPreview ? (
        <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-[#c5c8c7] hover:border-[#006b5e] transition-colors text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#191c1d]">
              {t('watering.photoTitle')}
            </h2>
            <p className="text-xs text-[#526360] max-w-xs mx-auto">
              {t('watering.photoDesc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="health-take-photo-btn"
              disabled={isLoading}
              onClick={() => setIsCameraOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white text-xs font-bold hover:shadow-md active:scale-95 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              <span>{t('watering.takePhotoBtn')}</span>
            </button>
            <button
              id="health-gallery-btn"
              disabled={isLoading}
              onClick={() => galleryInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-rose-600 text-rose-700 text-xs font-bold hover:bg-rose-50 active:scale-95 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">photo_library</span>
              <span>{t('watering.galleryBtn')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-4">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black/5 max-h-56 flex items-center justify-center">
            <img
              src={photoPreview}
              alt="Planta para análisis de problemas"
              className="w-full h-full object-cover"
            />
            {!isLoading && (
              <button
                onClick={handleResetPhoto}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                title={t('watering.changePhoto')}
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {!isLoading && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setIsCameraOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-rose-600/40 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                <span>{t('watering.retakeCamera')}</span>
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-[#526360] text-xs font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">photo_library</span>
                <span>{t('watering.changeGallery')}</span>
              </button>
            </div>
          )}

          {validationError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 space-y-2 text-left">
              <div className="flex items-start gap-2 text-rose-800 font-semibold text-xs">
                <span className="material-symbols-outlined text-rose-600 text-lg flex-shrink-0">
                  error
                </span>
                <span>{validationError}</span>
              </div>
              <p className="text-[11px] text-rose-700">
                {t('validation.notAPlantHelp')}
              </p>
            </div>
          )}

          <div className="pt-1">
            <button
              id="health-analyze-btn"
              disabled={isLoading || !photoPreview}
              onClick={handleAnalyze}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white text-xs font-bold hover:shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                  <span>{t('health.analyzing')}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">health_and_safety</span>
                  <span>{t('health.analyzeBtn')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-6 border border-[#e1e3e4] flex items-center justify-center gap-3 text-xs text-rose-700 font-semibold">
          <span className="material-symbols-outlined animate-spin text-xl">
            progress_activity
          </span>
          <span>{t('health.analyzing')}</span>
        </div>
      )}

      {/* Error with retry */}
      {error && !isLoading && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span className="font-semibold">{error}</span>
          </div>
          <div className="pt-1">
            <button
              onClick={handleAnalyze}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>{t('health.retry')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Result Modal Overlay (Exacto al estilo del Calculador de riego) */}
      {result && !isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#192b27] rounded-3xl shadow-2xl border border-[#dce0e0] dark:border-white/10 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button Top Right */}
            <button
              onClick={() => setResult(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={t('common.close') || 'Cerrar'}
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Header / Plant Reference */}
            <div className="flex items-center gap-2.5 pr-8">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">health_and_safety</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#191c1d] dark:text-white truncate">
                  {calculatedPlantName || t('health.title')}
                </h3>
                <p className="text-[11px] text-[#526360] dark:text-gray-400 truncate">
                  {t('health.desc')}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* PLANTA */}
              <div className="bg-[#f8fafb] dark:bg-white/5 border border-[#e1e3e4] dark:border-white/10 rounded-2xl p-4 space-y-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#526360] dark:text-gray-400">
                  {t('watering.plantSpecies') || 'PLANTA'}
                </span>
                <p className="text-lg sm:text-xl font-bold text-[#191c1d] dark:text-white capitalize">
                  {result.plantName || calculatedPlantName || t('health.title')}
                </p>
              </div>

              {/* 1. PROBLEMA */}
              <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-4 space-y-1">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  {t('health.problem')}
                </span>
                <p className="text-base sm:text-lg font-bold text-[#191c1d] dark:text-white leading-snug">
                  {result.problem}
                </p>
              </div>

              {/* 2. POSIBLES CAUSAS */}
              <div className="bg-[#f8fafb] dark:bg-white/5 border border-[#e1e3e4] dark:border-white/10 rounded-2xl p-4 space-y-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#526360] dark:text-gray-400">
                  {t('health.possibleCauses')}
                </span>
                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {result.possibleCauses}
                </p>
              </div>

              {/* 3. SOLUCIONES */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-4 space-y-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {t('health.solutions')}
                </span>
                <p className="text-xs sm:text-sm text-[#191c1d] dark:text-gray-100 leading-relaxed font-medium">
                  {result.solutions}
                </p>
              </div>

              {/* 4. GRAVEDAD (PROTAGONISTA EN GRANDE) */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-100/60 dark:from-amber-950/40 dark:to-orange-900/20 border border-amber-300/80 dark:border-amber-700/50 rounded-2xl p-4 sm:p-5 space-y-1">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  {t('health.severity')}
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#191c1d] dark:text-white tracking-tight">
                  {result.severity}
                </p>
              </div>

              {/* 5. RECOMENDACIÓN (UNA SOLA FRASE AL FINAL) */}
              {result.recommendation && (
                <div className="bg-[#f8fafb] dark:bg-white/5 border border-[#e1e3e4] dark:border-white/10 rounded-xl p-3.5 space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#526360] dark:text-gray-400">
                    {t('health.recommendation')}
                  </span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                    {result.recommendation}
                  </p>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="pt-2">
              <button
                onClick={() => setResult(null)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t('care.tool.backToHub')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
