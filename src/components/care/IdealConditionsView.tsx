import React, { useState, useRef } from 'react';
import { ScanHistoryItem, ConditionsRequest, ConditionsResponse, ImageValidationResult } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { getLocalizedSpeciesName } from '../../services/speciesLocalization';
import { validateImageForCare } from '../../services/imageValidationService';
import { processImageFile } from '../../services/imageProcessingService';
import { analyzeIdealConditions } from '../../services/careToolsService';
import { CareCameraModal } from './CareCameraModal';

interface IdealConditionsViewProps {
  onBack: () => void;
  recentScans: ScanHistoryItem[];
}

export const IdealConditionsView: React.FC<IdealConditionsViewProps> = ({
  onBack,
  recentScans
}) => {
  const { t } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [customPlant, setCustomPlant] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [temperature, setTemperature] = useState<string>('21°C');
  const [humidity, setHumidity] = useState<string>('50%');
  const [light, setLight] = useState<string>('Luz indirecta brillante');
  const [location, setLocation] = useState<string>('Interior');
  const [showOptionalSettings, setShowOptionalSettings] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ConditionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectivePlantName = customPlant.trim() || selectedPlant || undefined;

  const processAndAnalyzePhoto = async (file: File, precomputedDataUrl?: string) => {
    if (!file || isLoading) return;

    setResult(null);
    setValidationError(null);
    setError(null);
    setIsLoading(true);

    try {
      const dataUrl = precomputedDataUrl || (await processImageFile(file));
      setPhotoPreview(dataUrl);

      const val = await validateImageForCare(dataUrl);
      setValidationResult(val);

      if (!val.isValid) {
        const errKey = val.errorMessageKey || 'validation.notAPlant';
        setValidationError(t(errKey as any));
        setIsLoading(false);
        return;
      }

      // Imagen válida: invocar backend
      const request: ConditionsRequest = {
        imageBase64: dataUrl,
        plantName: effectivePlantName,
        temperature: showOptionalSettings ? temperature : undefined,
        humidity: showOptionalSettings ? humidity : undefined,
        light: showOptionalSettings ? light : undefined,
        location: showOptionalSettings ? location : undefined
      };

      const res = await analyzeIdealConditions(request);
      setResult(res);
    } catch (err: any) {
      console.error('[GreenLens: IdealConditions error]', err);
      setError(t('conditions.analysisError'));
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

  const handleAnalyzeManual = async () => {
    if (isLoading) return;
    setResult(null);
    setIsLoading(true);
    setError(null);
    setValidationError(null);
    try {
      const request: ConditionsRequest = {
        imageBase64: photoPreview || undefined,
        plantName: effectivePlantName,
        temperature,
        humidity,
        light,
        location
      };

      const res = await analyzeIdealConditions(request);
      setResult(res);
    } catch (err: any) {
      setError(t('conditions.analysisError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPhoto = () => {
    setSelectedPlant('');
    setCustomPlant('');
    setPhotoPreview(null);
    setValidationResult(null);
    setValidationError(null);
    setResult(null);
    setError(null);
  };

  const getScoreBadge = (score: string, text: string) => {
    if (score === 'green') {
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>{text}</span>
        </span>
      );
    }
    if (score === 'yellow') {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-600" />
          <span>{text}</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-600" />
        <span>{text}</span>
      </span>
    );
  };

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
        title={t('conditions.title')}
      />

      {/* Hidden inputs */}
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
      <div className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border border-orange-200/80 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-700 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">device_thermostat</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#191c1d]">{t('conditions.title')}</h1>
            <p className="text-xs text-[#526360]">{t('conditions.desc')}</p>
          </div>
        </div>
      </div>

      {/* Photo capture or upload */}
      {!photoPreview ? (
        <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-[#c5c8c7] hover:border-[#006b5e] transition-colors text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#191c1d]">
              {t('conditions.photoTitle')}
            </h2>
            <p className="text-xs text-[#526360] max-w-xs mx-auto">
              {t('conditions.photoDesc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="conditions-take-photo-btn"
              disabled={isLoading}
              onClick={() => setIsCameraOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold hover:shadow-md active:scale-95 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              <span>{t('conditions.takePhotoBtn')}</span>
            </button>
            <button
              id="conditions-gallery-btn"
              disabled={isLoading}
              onClick={() => galleryInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-orange-600 text-orange-700 text-xs font-bold hover:bg-orange-50 active:scale-95 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">photo_library</span>
              <span>{t('conditions.galleryBtn')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-3">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black/5 max-h-56 flex items-center justify-center">
            <img
              src={photoPreview}
              alt="Entorno y planta"
              className="w-full h-full object-cover"
            />
            {!isLoading && (
              <button
                onClick={handleResetPhoto}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title={t('conditions.changePhoto')}
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {!isLoading && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setIsCameraOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-orange-600/40 text-orange-700 text-xs font-semibold hover:bg-orange-50 transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                <span>{t('conditions.retakeCamera')}</span>
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg border border-gray-300 text-[#526360] text-xs font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">photo_library</span>
                <span>{t('conditions.changeGallery')}</span>
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
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <span>{t('conditions.takePhotoBtn')}</span>
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  <span>{t('conditions.galleryBtn')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Plant & Environment Controls */}
      <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#526360]">
            {t('conditions.plantSpecies')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={customPlant}
              onChange={(e) => setCustomPlant(e.target.value)}
              placeholder={t('conditions.plantPlaceholder')}
              className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl px-3.5 py-2.5 text-[#191c1d] focus:ring-2 focus:ring-[#006b5e]"
            />
            {recentScans.length > 0 && (
              <select
                value={selectedPlant}
                onChange={(e) => {
                  setSelectedPlant(e.target.value);
                  setCustomPlant('');
                }}
                className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl px-3.5 py-2.5 text-[#191c1d] focus:ring-2 focus:ring-[#006b5e]"
              >
                <option value="">{t('conditions.selectFromHistory')}</option>
                {recentScans.map((s) => (
                  <option key={s.id} value={s.name}>
                    {getLocalizedSpeciesName(s.name, t)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Toggle Advanced Environment Settings */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOptionalSettings(!showOptionalSettings)}
            className="text-xs font-semibold text-[#006b5e] hover:underline inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">
              {showOptionalSettings ? 'expand_less' : 'tune'}
            </span>
            <span>
              {showOptionalSettings
                ? t('conditions.hideEnvSettings')
                : t('conditions.showEnvSettings')}
            </span>
          </button>
        </div>

        {showOptionalSettings && (
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#e1e3e4]/60">
            <div>
              <label className="block text-[11px] font-semibold text-[#526360] mb-1">
                {t('conditions.currentTemp')}
              </label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl px-3 py-2 text-[#191c1d]"
              >
                <option>{t('conditions.tempCold')}</option>
                <option>{t('conditions.tempCool')}</option>
                <option>{t('conditions.tempIdeal')}</option>
                <option>{t('conditions.tempWarm')}</option>
                <option>{t('conditions.tempHot')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#526360] mb-1">
                {t('conditions.relHumidity')}
              </label>
              <select
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl px-3 py-2 text-[#191c1d]"
              >
                <option>{t('conditions.humVeryDry')}</option>
                <option>{t('conditions.humDry')}</option>
                <option>{t('conditions.humMedium')}</option>
                <option>{t('conditions.humTropical')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#526360] mb-1">
                {t('conditions.lightType')}
              </label>
              <select
                value={light}
                onChange={(e) => setLight(e.target.value)}
                className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl px-3 py-2 text-[#191c1d]"
              >
                <option>{t('conditions.lightLow')}</option>
                <option>{t('conditions.lightIndirect')}</option>
                <option>{t('conditions.lightMorningSun')}</option>
                <option>{t('conditions.lightIntenseSun')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#526360] mb-1">
                {t('conditions.location')}
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl px-3 py-2 text-[#191c1d]"
              >
                <option>{t('conditions.locLiving')}</option>
                <option>{t('conditions.locKitchen')}</option>
                <option>{t('conditions.locNearAC')}</option>
                <option>{t('conditions.locBalcony')}</option>
                <option>{t('conditions.locGarden')}</option>
              </select>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            id="conditions-analyze-btn"
            disabled={isLoading || (!photoPreview && !effectivePlantName)}
            onClick={handleAnalyzeManual}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold hover:shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">
                  progress_activity
                </span>
                <span>{t('conditions.analyzing')}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">assessment</span>
                <span>{t('conditions.analyzeBtn')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-6 border border-[#e1e3e4] flex items-center justify-center gap-3 text-xs text-orange-700 font-semibold">
          <span className="material-symbols-outlined animate-spin text-xl">
            progress_activity
          </span>
          <span>{t('conditions.analyzingLoading')}</span>
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
              onClick={handleAnalyzeManual}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>{t('conditions.retry')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="space-y-4">
          {/* Header Assessment Badge */}
          <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#526360] font-bold block">
                {t('conditions.generalEval')}
              </span>
              <h3 className="text-lg font-bold text-[#191c1d]">{result.rating}</h3>
            </div>
            <div>{getScoreBadge(result.ratingScore, result.rating)}</div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Temperature */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-700">
                  <span className="material-symbols-outlined text-lg">device_thermostat</span>
                  <span>{t('conditions.tempAssessment')}</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#191c1d]">
                  {result.temperatureAssessment.status}
                </span>
              </div>
              <p className="text-xs text-[#191c1d]">
                <strong className="text-[#526360]">{t('conditions.ideal')}</strong>{' '}
                {result.temperatureAssessment.idealRange}
              </p>
              <p className="text-xs text-[#526360] leading-relaxed pt-1">
                {result.temperatureAssessment.comment}
              </p>
            </div>

            {/* Humidity */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-700">
                  <span className="material-symbols-outlined text-lg">water</span>
                  <span>{t('conditions.humidityAssessment')}</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#191c1d]">
                  {result.humidityAssessment.status}
                </span>
              </div>
              <p className="text-xs text-[#191c1d]">
                <strong className="text-[#526360]">{t('conditions.ideal')}</strong>{' '}
                {result.humidityAssessment.idealRange}
              </p>
              <p className="text-xs text-[#526360] leading-relaxed pt-1">
                {result.humidityAssessment.comment}
              </p>
            </div>

            {/* Light */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                  <span className="material-symbols-outlined text-lg">wb_sunny</span>
                  <span>{t('conditions.lightAssessment')}</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#191c1d]">
                  {result.lightAssessment.status}
                </span>
              </div>
              <p className="text-xs text-[#191c1d]">
                <strong className="text-[#526360]">{t('conditions.ideal')}</strong>{' '}
                {result.lightAssessment.idealRange}
              </p>
              <p className="text-xs text-[#526360] leading-relaxed pt-1">
                {result.lightAssessment.comment}
              </p>
            </div>

            {/* Soil */}
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                  <span className="material-symbols-outlined text-lg">landscape</span>
                  <span>{t('conditions.soilAssessment')}</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#191c1d]">
                  {result.soilAssessment.status}
                </span>
              </div>
              <p className="text-xs text-[#191c1d]">
                <strong className="text-[#526360]">{t('conditions.ideal')}</strong>{' '}
                {result.soilAssessment.idealRange}
              </p>
              <p className="text-xs text-[#526360] leading-relaxed pt-1">
                {result.soilAssessment.comment}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#526360] flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600 text-base">
                  tips_and_updates
                </span>
                <span>{t('conditions.recommendations')}</span>
              </h3>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-[#191c1d] leading-relaxed flex items-start gap-2">
                    <span className="material-symbols-outlined text-orange-600 text-sm flex-shrink-0 mt-0.5">
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
  );
};
