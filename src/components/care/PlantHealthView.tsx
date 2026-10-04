import React, { useState, useRef } from 'react';
import { ScanHistoryItem, PlantHealthResponse } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { getLocalizedSpeciesName, getLocalizedScientificName } from '../../services/speciesLocalization';
import { validateImageForCare, checkImagesSimilarity } from '../../services/imageValidationService';
import { processImageFile } from '../../services/imageProcessingService';
import { analyzePlantHealth } from '../../services/careToolsService';
import { CareCameraModal } from './CareCameraModal';

interface PlantHealthViewProps {
  onBack: () => void;
  recentScans: ScanHistoryItem[];
}

interface PhotoSlot {
  titleKey: string;
  descKey: string;
  angleLabel: string;
  dataUrl: string | null;
  isValid: boolean;
  errorMessage: string | null;
}

export const PlantHealthView: React.FC<PlantHealthViewProps> = ({ onBack, recentScans }) => {
  const { t, language } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [customPlant, setCustomPlant] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');

  const [slots, setSlots] = useState<PhotoSlot[]>([
    {
      titleKey: 'health.photo1Title',
      descKey: 'health.photo1Desc',
      angleLabel: 'Vista general',
      dataUrl: null,
      isValid: false,
      errorMessage: null
    },
    {
      titleKey: 'health.photo2Title',
      descKey: 'health.photo2Desc',
      angleLabel: 'Hojas / Detalle',
      dataUrl: null,
      isValid: false,
      errorMessage: null
    },
    {
      titleKey: 'health.photo3Title',
      descKey: 'health.photo3Desc',
      angleLabel: 'Otro ángulo / Tallos',
      dataUrl: null,
      isValid: false,
      errorMessage: null
    }
  ]);

  const [similarityWarning, setSimilarityWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PlantHealthResponse | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const effectivePlantName = customPlant.trim() || selectedPlant || t('health.defaultPlantName');

  const allPhotosValid = slots.every((slot) => slot.dataUrl !== null && slot.isValid);
  const validPhotosCount = slots.filter((slot) => slot.dataUrl !== null && slot.isValid).length;

  const handleOpenSlot = (index: number, mode: 'camera' | 'gallery') => {
    setActiveSlotIndex(index);
    if (mode === 'camera') {
      setIsCameraOpen(true);
    } else {
      galleryInputRef.current?.click();
    }
  };

  const handleProcessSlotImage = async (file: File, precomputedDataUrl?: string) => {
    if (!file || activeSlotIndex === null) return;
    const slotIndex = activeSlotIndex;

    try {
      const dataUrl = precomputedDataUrl || (await processImageFile(file));

      // Validación estricta en tiempo real de la imagen
      const val = await validateImageForCare(dataUrl);

      let slotError: string | null = null;
      if (!val.isValid) {
        if (slotIndex === 0) {
          slotError = t('validation.photo1NotPlant');
        } else if (slotIndex === 1) {
          slotError = t('validation.photo2NotPlant');
        } else {
          slotError = t('validation.photo3NotPlant');
        }
      }

      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = {
          ...next[slotIndex],
          dataUrl,
          isValid: val.isValid,
          errorMessage: slotError
        };
        return next;
      });

      // Comprobar similitud de ángulos si hay al menos 2 fotos
      const currentUrls = slots
        .map((s, idx) => (idx === slotIndex ? dataUrl : s.dataUrl))
        .filter(Boolean) as string[];

      if (currentUrls.length >= 2) {
        const sim = await checkImagesSimilarity(currentUrls);
        if (sim.isTooSimilar) {
          setSimilarityWarning(t('validation.photosTooSimilar'));
        } else {
          setSimilarityWarning(null);
        }
      }
    } catch (err: any) {
      console.error('[GreenLens: Slot image processing error]', err);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessSlotImage(file);
    }
    e.target.value = '';
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessSlotImage(file);
    }
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!allPhotosValid || isLoading) return;

    setIsLoading(true);
    setGeneralError(null);
    setResult(null);

    try {
      const imagesList = slots.map((s) => s.dataUrl).filter(Boolean) as string[];
      const res = await analyzePlantHealth({
        images: imagesList,
        plantName: effectivePlantName,
        symptoms: symptoms.trim() || undefined,
        photoAngles: slots.map((s) => s.angleLabel)
      });
      setResult(res);
    } catch (err: any) {
      console.error('[GreenLens: PlantHealth error]', err);
      setGeneralError(t('health.analysisError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedPlant('');
    setCustomPlant('');
    setSymptoms('');
    setSlots([
      {
        titleKey: 'health.photo1Title',
        descKey: 'health.photo1Desc',
        angleLabel: 'Vista general',
        dataUrl: null,
        isValid: false,
        errorMessage: null
      },
      {
        titleKey: 'health.photo2Title',
        descKey: 'health.photo2Desc',
        angleLabel: 'Hojas / Detalle',
        dataUrl: null,
        isValid: false,
        errorMessage: null
      },
      {
        titleKey: 'health.photo3Title',
        descKey: 'health.photo3Desc',
        angleLabel: 'Otro ángulo / Tallos',
        dataUrl: null,
        isValid: false,
        errorMessage: null
      }
    ]);
    setResult(null);
    setSimilarityWarning(null);
    setGeneralError(null);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Care Camera Modal */}
      <CareCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl, file) => {
          setIsCameraOpen(false);
          handleProcessSlotImage(file, dataUrl);
        }}
        onFallbackToGallery={() => {
          setIsCameraOpen(false);
          galleryInputRef.current?.click();
        }}
        title={t('health.cameraBtn')}
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
      <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200/80 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">health_and_safety</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#191c1d]">{t('health.title')}</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 whitespace-nowrap">
                {t('health.threePhotosBadge')}
              </span>
            </div>
            <p className="text-xs text-[#526360]">{t('health.desc')}</p>
          </div>
        </div>
      </div>

      {/* Reference Plant & Symptoms */}
      <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#526360]">
            {t('watering.plant')}
          </label>
          {recentScans.length > 0 && (
            <select
              value={selectedPlant}
              onChange={(e) => {
                setSelectedPlant(e.target.value);
                setCustomPlant('');
              }}
              className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl px-3.5 py-2.5 text-[#191c1d] focus:ring-2 focus:ring-[#006b5e]"
            >
              {recentScans.map((scan) => (
                <option key={scan.id} value={scan.name}>
                  {getLocalizedSpeciesName(scan.name, t, language)} ({getLocalizedScientificName(scan.scientificName, language) || scan.category})
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={customPlant}
            onChange={(e) => setCustomPlant(e.target.value)}
            placeholder={t('care.plantPlaceholder')}
            className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl px-3.5 py-2.5 text-[#191c1d] focus:ring-2 focus:ring-[#006b5e]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#526360]">
            {t('health.symptomsLabel')}
          </label>
          <input
            type="text"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder={t('health.symptomsPlaceholder')}
            className="w-full text-xs bg-[#f8fafb] border border-[#dce0e0] rounded-xl px-3.5 py-2.5 text-[#191c1d] focus:ring-2 focus:ring-[#006b5e]"
          />
        </div>
      </div>

      {/* 3 Photos Section */}
      <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#191c1d]">
              {t('health.photosRequired')}
            </h2>
            <p className="text-[11px] text-[#526360]">{t('health.intro')}</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-[#006b5e] border border-emerald-200 whitespace-nowrap flex-shrink-0">
            {validPhotosCount} / 3
          </span>
        </div>

        {/* 3 Photo Slots */}
        <div className="space-y-3">
          {slots.map((slot, index) => (
            <div
              key={index}
              className={`rounded-2xl p-4 border transition-all ${
                slot.isValid
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : slot.errorMessage
                  ? 'border-rose-200 bg-rose-50/40'
                  : 'border-[#e1e3e4] bg-[#f8fafb]'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#006b5e] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <h3 className="text-xs font-bold text-[#191c1d]">
                      {t(slot.titleKey as any)}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#526360] mt-1">
                    {t(slot.descKey as any)}
                  </p>
                </div>

                {/* Slot Photo Thumbnail or Add buttons */}
                {slot.dataUrl ? (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/5 flex-shrink-0 border border-black/10">
                      <img
                        src={slot.dataUrl}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleOpenSlot(index, 'camera')}
                        className="px-2.5 py-1 rounded-lg border border-[#006b5e] text-[#006b5e] text-[10px] font-bold hover:bg-[#006b5e]/5 transition-colors flex items-center gap-1"
                        title={t('health.retakeCamera')}
                      >
                        <span className="material-symbols-outlined text-xs">photo_camera</span>
                        <span>{t('health.cameraBtn')}</span>
                      </button>
                      <button
                        onClick={() => handleOpenSlot(index, 'gallery')}
                        className="px-2.5 py-1 rounded-lg border border-gray-300 text-[#526360] text-[10px] font-bold hover:bg-gray-50 transition-colors flex items-center gap-1"
                        title={t('health.changeGallery')}
                      >
                        <span className="material-symbols-outlined text-xs">photo_library</span>
                        <span>{t('health.galleryBtn')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 self-end sm:self-center pt-1 sm:pt-0">
                    <button
                      onClick={() => handleOpenSlot(index, 'camera')}
                      className="px-3 py-2 rounded-xl bg-[#006b5e] text-white text-xs font-bold hover:bg-[#005046] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      <span>{t('health.cameraBtn')}</span>
                    </button>
                    <button
                      onClick={() => handleOpenSlot(index, 'gallery')}
                      className="px-3 py-2 rounded-xl bg-white border border-[#006b5e] text-[#006b5e] text-xs font-bold hover:bg-[#006b5e]/5 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-sm">photo_library</span>
                      <span>{t('health.galleryBtn')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Status or Error Banner */}
              {slot.errorMessage && (
                <div className="mt-3 rounded-xl bg-rose-100/80 border border-rose-300 p-2.5 text-[11px] text-rose-900 flex items-start gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-sm flex-shrink-0 mt-0.5">
                    error
                  </span>
                  <div className="flex-1">
                    <p>{slot.errorMessage}</p>
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={() => handleOpenSlot(index, 'camera')}
                        className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition-colors inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">photo_camera</span>
                        <span>{t('health.cameraBtn')}</span>
                      </button>
                      <button
                        onClick={() => handleOpenSlot(index, 'gallery')}
                        className="px-2.5 py-1 rounded-md bg-white border border-rose-400 text-rose-900 text-[10px] font-bold hover:bg-rose-50 transition-colors inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">photo_library</span>
                        <span>{t('health.galleryBtn')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {slot.isValid && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  <span>{t('health.photoReady')}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Similarity Warning if angles are identical */}
        {similarityWarning && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-600 text-base flex-shrink-0">
              lightbulb
            </span>
            <span>{similarityWarning}</span>
          </div>
        )}

        {/* Submit button (only enabled when all 3 photos are valid) */}
        <button
          id="health-analyze-btn"
          onClick={handleAnalyze}
          disabled={!allPhotosValid || isLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#006b5e] to-[#005046] text-white text-xs font-bold shadow-md shadow-[#006b5e]/20 hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-base">
                progress_activity
              </span>
              <span>{t('health.analyzing')}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">
                health_and_safety
              </span>
              <span>{t('health.analyzeBtn')}</span>
            </>
          )}
        </button>
      </div>

      {generalError && !isLoading && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span className="font-semibold">{generalError}</span>
          </div>
          <div className="pt-1">
            <button
              onClick={handleAnalyze}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>{t('health.retry')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="space-y-4">
          {/* Status Header */}
          <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526360]">
                {t('health.state')}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  result.statusLevel === 'healthy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : result.statusLevel === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {result.statusLabel}
              </span>
            </div>

            <p className="text-xs text-[#191c1d] leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Possible issues & causes */}
          {result.possibleIssues && result.possibleIssues.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-base">
                  stethoscope
                </span>
                <span>{t('health.possibleIssues')}</span>
              </h3>
              <ul className="space-y-1.5">
                {result.possibleIssues.map((issue, i) => (
                  <li key={i} className="text-xs text-amber-950 flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-sm flex-shrink-0 mt-0.5">
                      arrow_right
                    </span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Possible causes */}
          {result.possibleCauses && result.possibleCauses.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#526360] flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-base">
                  psychology_alt
                </span>
                <span>{t('health.possibleCauses')}</span>
              </h3>
              <ul className="space-y-1.5">
                {result.possibleCauses.map((cause, i) => (
                  <li key={i} className="text-xs text-[#191c1d] flex items-start gap-2">
                    <span className="material-symbols-outlined text-teal-600 text-sm flex-shrink-0 mt-0.5">
                      arrow_right
                    </span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evaluations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700">
                <span className="material-symbols-outlined text-base">water_drop</span>
                <span>{t('guide.watering')}</span>
              </div>
              <p className="text-xs text-[#191c1d] leading-relaxed">
                {result.wateringEvaluation}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <span className="material-symbols-outlined text-base">wb_sunny</span>
                <span>{t('guide.light')}</span>
              </div>
              <p className="text-xs text-[#191c1d] leading-relaxed">
                {result.lightEvaluation}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#e1e3e4] space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700">
                <span className="material-symbols-outlined text-base">device_thermostat</span>
                <span>{t('guide.temperature')}</span>
              </div>
              <p className="text-xs text-[#191c1d] leading-relaxed">
                {result.temperatureEvaluation}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-[#e1e3e4] space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#526360] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006b5e] text-base">
                  tips_and_updates
                </span>
                <span>{t('health.recommendations')}</span>
              </h3>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-[#191c1d] leading-relaxed flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#006b5e] text-sm flex-shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={handleReset}
              className="text-xs text-[#526360] hover:text-[#191c1d] font-semibold underline"
            >
              {t('health.newAnalysis')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
