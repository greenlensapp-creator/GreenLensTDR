import React, { useState, useEffect, useRef } from 'react';
import { ScanHistoryItem, CareGuideResponse, ImageValidationResult } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { getLocalizedSpeciesName } from '../../services/speciesLocalization';
import { validateImageForCare } from '../../services/imageValidationService';
import { processImageFile } from '../../services/imageProcessingService';
import { fetchCareGuide } from '../../services/careToolsService';
import { CareCameraModal } from './CareCameraModal';

interface CareGuideViewProps {
  onBack: () => void;
  recentScans: ScanHistoryItem[];
}

export const CareGuideView: React.FC<CareGuideViewProps> = ({ onBack, recentScans }) => {
  const { t, language } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  const [query, setQuery] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [guide, setGuide] = useState<CareGuideResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processAndAnalyzePhoto = async (file: File, precomputedDataUrl?: string) => {
    if (!file || isLoading) return;

    // Resetear inmediatamente estados previos
    setGuide(null);
    setValidationError(null);
    setError(null);
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

      // Con fotografía válida: la foto tiene prioridad absoluta
      const res = await fetchCareGuide({
        imageBase64: dataUrl,
        plantName: query.trim() || undefined
      });
      setGuide(res);
    } catch (err: any) {
      console.error('[GreenLens: CareGuide error]', err);
      setError(t('guide.analysisError'));
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

  const handleSearch = async (plantName: string) => {
    if (!plantName.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setValidationError(null);
    setGuide(null);

    try {
      const res = await fetchCareGuide({
        plantName: plantName.trim(),
        imageBase64: photoPreview || undefined
      });
      setGuide(res);
    } catch (err: any) {
      setError(t('guide.analysisError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPhoto = () => {
    setQuery('');
    setPhotoPreview(null);
    setValidationResult(null);
    setValidationError(null);
    setGuide(null);
    setError(null);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Care Camera Modal */}
      <CareCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl, file) => {
          setIsCameraOpen(false);
          processAndAnalyzePhoto(file, dataUrl);
        }}
        onFallbackToGallery={() => {
          setIsCameraOpen(false);
          galleryInputRef.current?.click();
        }}
        title={t('guide.takePhotoBtn')}
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
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#006b5e] hover:text-[#005046] transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        <span>{t('care.tool.backToHub')}</span>
      </button>

      {/* Tool Header */}
      <div className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-200/80 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-700 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">menu_book</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#191c1d]">{t('guide.title')}</h1>
            <p className="text-xs text-[#526360]">{t('guide.desc')}</p>
          </div>
        </div>
      </div>

      {/* Photo Capture & Upload */}
      {!photoPreview ? (
        <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-[#c5c8c7] hover:border-[#006b5e] transition-colors text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#191c1d]">
              {t('guide.photoTitle')}
            </h2>
            <p className="text-xs text-[#526360] max-w-xs mx-auto">
              {t('guide.photoDesc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="guide-take-photo-btn"
              disabled={isLoading}
              onClick={() => setIsCameraOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#006b5e] to-[#005046] text-white text-xs font-bold hover:shadow-md active:scale-95 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              <span>{t('guide.takePhotoBtn')}</span>
            </button>
            <button
              id="guide-gallery-btn"
              disabled={isLoading}
              onClick={() => galleryInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#006b5e] text-[#006b5e] text-xs font-bold hover:bg-[#006b5e]/5 active:scale-95 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">photo_library</span>
              <span>{t('guide.galleryBtn')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-3">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black/5 max-h-56 flex items-center justify-center">
            <img
              src={photoPreview}
              alt="Planta para guía"
              className="w-full h-full object-cover"
            />
            {!isLoading && (
              <button
                onClick={handleResetPhoto}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title={t('guide.changePhoto')}
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {/* Acciones para cambiar de foto */}
          {!isLoading && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setIsCameraOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-[#006b5e]/40 text-[#006b5e] text-xs font-semibold hover:bg-[#006b5e]/5 transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                <span>{t('guide.retakeCamera')}</span>
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-[#526360] text-xs font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">photo_library</span>
                <span>{t('guide.changeGallery')}</span>
              </button>
            </div>
          )}

          {/* Error de validación si no es planta */}
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
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <span>{t('guide.takePhotoBtn')}</span>
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  <span>{t('guide.galleryBtn')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Or Search / Select from History */}
      <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#526360]">
          {t('guide.searchByName')}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#526360] text-lg">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder={t('guide.searchPlaceholder')}
              className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl pl-10 pr-3.5 py-3 text-[#191c1d] focus:ring-2 focus:ring-[#006b5e]"
            />
          </div>
          <button
            id="guide-fetch-btn"
            onClick={() => handleSearch(query)}
            disabled={isLoading || !query.trim()}
            className="px-4 rounded-xl bg-[#006b5e] text-white text-xs font-bold hover:bg-[#005046] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shadow-sm"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-lg">
                progress_activity
              </span>
            ) : (
              t('guide.fetchBtn')
            )}
          </button>
        </div>

        {/* Quick pills from history */}
        {recentScans.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] text-[#526360] font-medium block mb-2">
              {t('guide.recentScans')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {recentScans.slice(0, 5).map((scan) => (
                <button
                  key={scan.id}
                  disabled={isLoading}
                  onClick={() => {
                    const localized = getLocalizedSpeciesName(scan.name, t, language);
                    setQuery(localized);
                    handleSearch(localized);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    guide?.name && scan?.name && guide.name.toLowerCase() === scan.name.toLowerCase()
                      ? 'bg-[#006b5e] text-white border-[#006b5e]'
                      : 'bg-[#f8fafb] text-[#191c1d] border-[#e1e3e4] hover:border-[#006b5e]/40'
                  }`}
                >
                  {getLocalizedSpeciesName(scan.name, t, language)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-6 border border-[#e1e3e4] flex items-center justify-center gap-3 text-xs text-[#006b5e] font-semibold">
          <span className="material-symbols-outlined animate-spin text-xl">
            progress_activity
          </span>
          <span>{t('guide.fetching')}</span>
        </div>
      )}

      {/* Error message with retry */}
      {error && !isLoading && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span className="font-semibold">{error}</span>
          </div>
          <div className="pt-1">
            <button
              onClick={() => {
                if (photoPreview) {
                  fetchCareGuide({ imageBase64: photoPreview, plantName: query.trim() || undefined })
                    .then((res) => { setGuide(res); setError(null); })
                    .catch((e) => setError(e?.message || 'Error al reintentar'));
                } else if (query.trim()) {
                  handleSearch(query);
                }
              }}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>{t('guide.retry')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Guide Content Display */}
      {guide && !isLoading && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#191c1d]">
                {guide.name || guide.plantName || 'Guía Botánica'}
              </h2>
              {guide.scientificName && (
                <span className="text-xs italic text-[#526360]">
                  {guide.scientificName}
                </span>
              )}
            </div>
            {guide.description && (
              <p className="text-xs text-[#526360] leading-relaxed pt-1">
                {guide.description}
              </p>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Light */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                <span className="material-symbols-outlined text-lg">wb_sunny</span>
                <span>{t('guide.light')}</span>
              </div>
              {typeof guide.light === 'object' && guide.light !== null ? (
                <div className="space-y-1 text-xs text-[#191c1d] leading-relaxed">
                  {guide.light.requirement && (
                    <p>
                      <span className="font-semibold text-[#526360]">
                        {t('conditions.lightAssessment') || 'Requisito'}:{' '}
                      </span>
                      {guide.light.requirement}
                    </p>
                  )}
                  {guide.light.placement && (
                    <p>
                      <span className="font-semibold text-[#526360]">
                        {t('light.locationAdvice') || 'Ubicación'}:{' '}
                      </span>
                      {guide.light.placement}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#191c1d] leading-relaxed">
                  {String(guide.light || '')}
                </p>
              )}
            </div>

            {/* Watering */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-700">
                <span className="material-symbols-outlined text-lg">water_drop</span>
                <span>{t('guide.watering')}</span>
              </div>
              {typeof guide.watering === 'object' && guide.watering !== null ? (
                <div className="space-y-1 text-xs text-[#191c1d] leading-relaxed">
                  {guide.watering.frequency && (
                    <p>
                      <span className="font-semibold text-[#526360]">
                        {t('watering.frequency') || 'Frecuencia'}:{' '}
                      </span>
                      {guide.watering.frequency}
                    </p>
                  )}
                  {guide.watering.amount && (
                    <p>
                      <span className="font-semibold text-[#526360]">
                        {t('watering.amount') || 'Cantidad'}:{' '}
                      </span>
                      {guide.watering.amount}
                    </p>
                  )}
                  {guide.watering.tips && (
                    <p className="text-[#526360] pt-0.5">{guide.watering.tips}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#191c1d] leading-relaxed">
                  {String(guide.watering || '')}
                </p>
              )}
            </div>

            {/* Temperature */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-700">
                <span className="material-symbols-outlined text-lg">device_thermostat</span>
                <span>{t('guide.temperature')}</span>
              </div>
              {typeof guide.temperature === 'object' && guide.temperature !== null ? (
                <div className="space-y-1 text-xs text-[#191c1d] leading-relaxed">
                  {guide.temperature.ideal && (
                    <p>
                      <span className="font-semibold text-[#526360]">
                        {t('conditions.ideal') || 'Ideal'}:{' '}
                      </span>
                      {guide.temperature.ideal}
                    </p>
                  )}
                  {(guide.temperature.min || guide.temperature.max) && (
                    <p>
                      <span className="font-semibold text-[#526360]">Rango: </span>
                      {guide.temperature.min ? `${guide.temperature.min} mín` : ''}
                      {guide.temperature.min && guide.temperature.max ? ' - ' : ''}
                      {guide.temperature.max ? `${guide.temperature.max} máx` : ''}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#191c1d] leading-relaxed">
                  {String(guide.temperature || '')}
                </p>
              )}
            </div>

            {/* Humidity */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
                <span className="material-symbols-outlined text-lg">water</span>
                <span>{t('guide.humidity')}</span>
              </div>
              {typeof guide.humidity === 'object' && guide.humidity !== null ? (
                <div className="space-y-1 text-xs text-[#191c1d] leading-relaxed">
                  {guide.humidity.percentage && (
                    <p>
                      <span className="font-semibold text-[#526360]">Humedad: </span>
                      {guide.humidity.percentage}
                    </p>
                  )}
                  {guide.humidity.advice && (
                    <p className="text-[#526360]">{guide.humidity.advice}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#191c1d] leading-relaxed">
                  {String(guide.humidity || '')}
                </p>
              )}
            </div>

            {/* Soil */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                <span className="material-symbols-outlined text-lg">landscape</span>
                <span>{t('guide.soil')}</span>
              </div>
              {typeof guide.soil === 'object' && guide.soil !== null ? (
                <div className="space-y-1 text-xs text-[#191c1d] leading-relaxed">
                  {guide.soil.type && (
                    <p>
                      <span className="font-semibold text-[#526360]">Tipo: </span>
                      {guide.soil.type}
                    </p>
                  )}
                  {guide.soil.drainage && (
                    <p>
                      <span className="font-semibold text-[#526360]">Drenaje: </span>
                      {guide.soil.drainage}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#191c1d] leading-relaxed">
                  {String(guide.soil || '')}
                </p>
              )}
            </div>

            {/* Fertilizer */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <span className="material-symbols-outlined text-lg">eco</span>
                <span>{t('guide.fertilizer')}</span>
              </div>
              {typeof guide.fertilizer === 'object' && guide.fertilizer !== null ? (
                <div className="space-y-1 text-xs text-[#191c1d] leading-relaxed">
                  {guide.fertilizer.frequency && (
                    <p>
                      <span className="font-semibold text-[#526360]">Frecuencia: </span>
                      {guide.fertilizer.frequency}
                    </p>
                  )}
                  {guide.fertilizer.type && (
                    <p>
                      <span className="font-semibold text-[#526360]">Tipo: </span>
                      {guide.fertilizer.type}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#191c1d] leading-relaxed">
                  {String(guide.fertilizer || '')}
                </p>
              )}
            </div>

            {/* Pruning */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                <span className="material-symbols-outlined text-lg">content_cut</span>
                <span>{t('guide.pruning')}</span>
              </div>
              {typeof guide.pruning === 'object' && guide.pruning !== null ? (
                <div className="space-y-1 text-xs text-[#191c1d] leading-relaxed">
                  {guide.pruning.season && (
                    <p>
                      <span className="font-semibold text-[#526360]">Época: </span>
                      {guide.pruning.season}
                    </p>
                  )}
                  {guide.pruning.technique && (
                    <p>
                      <span className="font-semibold text-[#526360]">Técnica: </span>
                      {guide.pruning.technique}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#191c1d] leading-relaxed">
                  {String(guide.pruning || '')}
                </p>
              )}
            </div>

            {/* Precautions */}
            {guide.precautions && (
              <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                  <span className="material-symbols-outlined text-lg">verified_user</span>
                  <span>{t('guide.precautions')}</span>
                </div>
                <p className="text-xs text-[#191c1d] leading-relaxed">
                  {typeof guide.precautions === 'object'
                    ? JSON.stringify(guide.precautions)
                    : String(guide.precautions)}
                </p>
              </div>
            )}
          </div>

          {/* Seasonal Advice */}
          {guide.seasonalAdvice && typeof guide.seasonalAdvice === 'object' && (
            <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#526360] flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-base">
                  calendar_month
                </span>
                <span>Consejos por Estación</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#191c1d]">
                {guide.seasonalAdvice.spring && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="font-bold text-emerald-800 block mb-0.5">🌱 Primavera</span>
                    <p className="text-[#3d4946]">{guide.seasonalAdvice.spring}</p>
                  </div>
                )}
                {guide.seasonalAdvice.summer && (
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                    <span className="font-bold text-amber-800 block mb-0.5">☀️ Verano</span>
                    <p className="text-[#3d4946]">{guide.seasonalAdvice.summer}</p>
                  </div>
                )}
                {guide.seasonalAdvice.autumn && (
                  <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-100">
                    <span className="font-bold text-orange-800 block mb-0.5">🍂 Otoño</span>
                    <p className="text-[#3d4946]">{guide.seasonalAdvice.autumn}</p>
                  </div>
                )}
                {guide.seasonalAdvice.winter && (
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                    <span className="font-bold text-blue-800 block mb-0.5">❄️ Invierno</span>
                    <p className="text-[#3d4946]">{guide.seasonalAdvice.winter}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Common Issues / Mistakes */}
          {((guide.commonIssues && guide.commonIssues.length > 0) ||
            (guide.commonMistakes && guide.commonMistakes.length > 0)) && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-base">
                  warning
                </span>
                <span>{t('guide.commonIssues')}</span>
              </h3>
              <ul className="space-y-1.5">
                {(guide.commonIssues || guide.commonMistakes || []).map((issue: any, i: number) => (
                  <li
                    key={i}
                    className="text-xs text-amber-950 leading-relaxed flex items-start gap-2"
                  >
                    <span className="material-symbols-outlined text-amber-600 text-sm flex-shrink-0 mt-0.5">
                      arrow_right
                    </span>
                    <span>
                      {typeof issue === 'string'
                        ? issue
                        : issue?.name || issue?.mistake || issue?.issue || String(issue)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
