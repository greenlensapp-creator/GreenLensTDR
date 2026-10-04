import React, { useState, useRef } from 'react';
import { ScanHistoryItem, LightMeterResponse, ImageValidationResult } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { validateImageForCare } from '../../services/imageValidationService';
import { processImageFile } from '../../services/imageProcessingService';
import { evaluateLightLevel } from '../../services/careToolsService';
import { CareCameraModal } from './CareCameraModal';

interface LightMeterViewProps {
  onBack: () => void;
  recentScans: ScanHistoryItem[];
}

export const LightMeterView: React.FC<LightMeterViewProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LightMeterResponse | null>(null);

  const processAndAnalyzePhoto = async (file: File, precomputedDataUrl?: string) => {
    if (!file) return;

    // Limpiar estados previos inmediatamente
    setResult(null);
    setValidationError(null);
    setValidationResult(null);
    setIsLoading(true);

    try {
      const dataUrl = precomputedDataUrl || (await processImageFile(file));
      setPhotoPreview(dataUrl);

      // Validación de calidad y botánica local
      const val = await validateImageForCare(dataUrl);
      setValidationResult(val);

      if (!val.isValid) {
        const errKey = val.errorMessageKey || 'validation.notAPlant';
        setValidationError(t(errKey as any));
        setIsLoading(false);
        return;
      }

      // Consulta real a la IA sobre la fotografía del espacio
      const lightResult = await evaluateLightLevel({
        imageBase64: dataUrl,
        brightnessCategory: val.brightnessCategory
      });
      setResult(lightResult);
    } catch (err: any) {
      console.error('[GreenLens: LightMeter error]', err);
      setValidationError(t('care.error.analysisFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndAnalyzePhoto(file);
    }
    e.target.value = '';
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndAnalyzePhoto(file);
    }
    e.target.value = '';
  };

  const handleReset = () => {
    setPhotoPreview(null);
    setValidationResult(null);
    setValidationError(null);
    setResult(null);
  };

  const lightLevels = ['Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'];

  return (
    <div className="space-y-6 pb-28">
      {/* Live Camera Modal */}
      <CareCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file, dataUrl) => {
          setIsCameraOpen(false);
          processAndAnalyzePhoto(file, dataUrl);
        }}
        onFallbackToGallery={() => galleryInputRef.current?.click()}
        title={t('light.title')}
      />

      {/* Hidden inputs específicos para Cámara y Galería */}
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
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#006b5e] hover:text-[#005046] transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span>{t('care.tool.backToHub')}</span>
      </button>

      {/* Tool Header */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">wb_sunny</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#191c1d]">{t('light.title')}</h1>
            <p className="text-xs text-[#526360]">{t('light.desc')}</p>
          </div>
        </div>
      </div>

      {/* Photographed Space Action Box */}
      {!photoPreview ? (
        <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-[#c5c8c7] hover:border-[#006b5e] transition-colors text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">wb_incandescent</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#191c1d]">
              {t('light.photoTitle')}
            </h2>
            <p className="text-xs text-[#526360] max-w-xs mx-auto">
              {t('light.photoDesc')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="light-take-photo-btn"
              disabled={isLoading}
              onClick={() => setIsCameraOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#006b5e] to-[#005046] text-white text-xs font-bold hover:shadow-md active:scale-95 transition-all inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              <span>{t('light.takePhotoBtn')}</span>
            </button>
            <button
              id="light-gallery-btn"
              disabled={isLoading}
              onClick={() => galleryInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#006b5e] text-[#006b5e] text-xs font-bold hover:bg-[#006b5e]/5 active:scale-95 transition-all inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">photo_library</span>
              <span>{t('light.galleryBtn')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Photo Preview & Loading / Error */}
          <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-3">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-black/5 max-h-60 flex items-center justify-center">
              <img
                src={photoPreview}
                alt="Espacio fotografiado para medir luz"
                className="w-full h-full object-cover"
              />
              {!isLoading && (
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  title={t('light.changePhoto')}
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Acciones para cambiar de foto si no está cargando */}
            {!isLoading && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#006b5e]/40 text-[#006b5e] text-xs font-semibold hover:bg-[#006b5e]/5 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <span>{t('light.retakeCamera')}</span>
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-[#526360] text-xs font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  <span>{t('light.changeGallery')}</span>
                </button>
              </div>
            )}

            {/* Error banner */}
            {validationError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 space-y-2 text-left">
                <div className="flex items-start gap-2.5 text-rose-800 font-semibold text-xs">
                  <span className="material-symbols-outlined text-rose-600 text-lg flex-shrink-0">
                    error
                  </span>
                  <span>{validationError}</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  {t('validation.notAPlantHelp')}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    <span>{t('light.takePhotoBtn')}</span>
                  </button>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">photo_library</span>
                    <span>{t('light.galleryBtn')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center gap-3 py-6 text-xs text-[#006b5e] font-semibold">
                <span className="material-symbols-outlined animate-spin text-xl">
                  progress_activity
                </span>
                <span>{t('light.analyzing')}</span>
              </div>
            )}
          </div>

          {/* Results Display */}
          {result && !isLoading && (
            <div className="space-y-4">
              {/* Level indicator card */}
              <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#526360]">
                    {t('light.detectedLevel')}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      result.isAdequate
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {result.adequacyStatus}
                  </span>
                </div>

                <div className="text-xl font-bold text-[#191c1d]">
                  {result.detectedLevel}
                </div>

                {/* Visual Level Meter Bar */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-5 gap-1.5 h-3">
                    {lightLevels.map((lvl) => {
                      const isActive =
                        (result?.detectedLevel || '').toLowerCase().trim() ===
                        (lvl || '').toLowerCase().trim();
                      return (
                        <div
                          key={lvl}
                          className={`rounded-full transition-all ${
                            isActive
                              ? 'bg-amber-500 ring-2 ring-amber-400 ring-offset-1 scale-105'
                              : 'bg-gray-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-[#526360]">
                    <span>{t('light.veryLow')}</span>
                    <span>{t('light.medium')}</span>
                    <span>{t('light.veryHigh')}</span>
                  </div>
                </div>
              </div>

              {/* Advice card */}
              <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#526360]">
                  {t('light.locationAdvice')}
                </h3>
                <p className="text-xs text-[#191c1d] leading-relaxed">
                  {result.locationAdvice}
                </p>
                <div className="pt-2 border-t border-[#e1e3e4] space-y-1.5">
                  <span className="text-xs font-bold text-[#006b5e]">
                    {t('light.recommendation')}:
                  </span>
                  <p className="text-xs text-[#526360]">{result.recommendedLightType}</p>
                </div>
              </div>

              {/* Recommendations list */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900">
                    {t('light.guidelinesTitle')}
                  </h4>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-emerald-950 flex items-start gap-2"
                      >
                        <span className="material-symbols-outlined text-sm text-emerald-700 flex-shrink-0 mt-0.5">
                          check_circle
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
