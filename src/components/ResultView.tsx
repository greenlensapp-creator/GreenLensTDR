import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ClassificationResult } from '../types';
import { addScanToHistory, toggleFavorite } from '../services/storageService';
import { syncAddScan, syncToggleFavorite } from '../services/firestoreSync';
import { useTranslation } from '../i18n/LanguageContext';
import {
  getLocalizedCategory,
  getLocalizedSpeciesName,
  getLocalizedScientificName,
  getLocalizedCareTitle
} from '../services/speciesLocalization';

interface ResultViewProps {
  result: ClassificationResult;
  scanId?: string;
  isFavorite?: boolean;
  isNewScan?: boolean;
  onBack: () => void;
  onRescan: () => void;
  onNavigateToCare: () => void;
  onToggleFavorite?: (id: string) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  scanId: initialScanId,
  isFavorite: initialIsFavorite = false,
  isNewScan = false,
  onBack,
  onRescan,
  onNavigateToCare,
  onToggleFavorite
}) => {
  const { t, language } = useTranslation();
  const [isFavorite, setIsFavorite] = useState<boolean>(initialIsFavorite);
  const [savedScanId, setSavedScanId] = useState<string | null>(initialScanId || null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { topPrediction, allPredictions, isConfident, threshold, capturedImage, details } =
    result;

  // Filtrar etiquetas y curiosidades para no mostrar jamás jerga técnica o Teachable Machine
  const sanitizedTags = (details.tags || [])
    .filter((tag) => !/teachable|machine|tensorflow|modelo|clasificador/i.test(tag))
    .map((tag) => getLocalizedCategory(tag, t));
  const displayTags = sanitizedTags.length > 0 ? sanitizedTags : [t('history.botanical'), t('history.collection')];

  const sanitizedCuriosities = (details.curiosities || []).filter(
    (item) => !/teachable|machine|tensorflow|clasificador/i.test(item)
  );

  useEffect(() => {
    // Disparar confetti sutil si es un nuevo escaneo con alta precisión
    if (isNewScan && topPrediction.percentage >= 80) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#006b5e', '#2bb19e', '#7ef7e2', '#91f78d']
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isNewScan, topPrediction.percentage]);

  const handleToggleFavorite = () => {
    if (savedScanId) {
      toggleFavorite(savedScanId);
      const newFavState = !isFavorite;
      setIsFavorite(newFavState);
      syncToggleFavorite(savedScanId, newFavState);
      if (onToggleFavorite) {
        onToggleFavorite(savedScanId);
      }
      showToast(newFavState ? t('history.favoriteAdded') : t('history.favoriteRemoved'));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShare = async () => {
    const shareText = t('result.shareText', {
      name: details.name,
      percentage: topPrediction.percentage
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: `GreenLens: ${details.name}`,
          text: shareText,
          url: window.location.href
        });
      } catch {
        showToast(t('result.copied'));
      }
    } else {
      navigator.clipboard?.writeText(shareText);
      showToast(t('result.copied'));
    }
  };

  return (
    <div id="scan-result-view" className="min-h-screen bg-[#f8fafb] pb-28 text-[#191c1d]">
      {/* Toast flotante */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#191c1d] text-white text-xs font-medium shadow-lg animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#2bb19e]">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Hero Header con la foto capturada */}
      <div className="relative w-full h-80 sm:h-96 bg-neutral-900 overflow-hidden">
        {(capturedImage || details.imageUrl) ? (
          <img
            src={capturedImage || details.imageUrl}
            alt={details.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#002b25] flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-[#7ef7e2]/40">yard</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"></div>

        {/* Barra superior flotante */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <button
            id="result-back-btn"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label={t('nav.back')}
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="result-share-btn"
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              aria-label={t('result.shareLabel')}
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>

            <button
              id="result-favorite-btn"
              onClick={handleToggleFavorite}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-[#006b5e] text-white'
                  : 'bg-black/40 text-white hover:bg-black/60'
              }`}
              aria-label={isFavorite ? t('history.favoriteRemoved') : t('history.favoriteAdded')}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isFavorite ? 'fill text-amber-300' : ''
                }`}
              >
                {isFavorite ? 'star' : 'star_border'}
              </span>
            </button>
          </div>
        </div>

        {/* Badge de Porcentaje de Coincidencia */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {getLocalizedSpeciesName(details.name, t, language)}
            </h1>
            <p className="text-xs sm:text-sm text-white/80 italic font-light">
              {getLocalizedScientificName(details.scientificName, language)}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <div
              className={`px-3 py-1.5 rounded-2xl backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                topPrediction.percentage >= threshold * 100
                  ? 'bg-[#006b5e]/90 text-[#7ef7e2] border border-[#2bb19e]/40'
                  : 'bg-amber-900/90 text-amber-200 border border-amber-500/40'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {topPrediction.percentage >= threshold * 100 ? 'verified' : 'help'}
              </span>
              <span className="text-base font-extrabold">{topPrediction.percentage}%</span>
            </div>
            <span className="text-[10px] text-white/70 mt-0.5">{t('result.match')}</span>
          </div>
        </div>
      </div>

      {/* Contenido principal en tarjetas Bento */}
      <div className="max-w-3xl mx-auto px-4 -mt-3 relative z-10 space-y-4">
        {/* Banner de baja confianza si la certeza botánica no es concluyente */}
        {!isConfident && (
          <div
            id="low-confidence-warning"
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 flex items-start gap-3 shadow-sm"
          >
            <span className="material-symbols-outlined text-amber-600 text-[24px] shrink-0 mt-0.5">
              warning
            </span>
            <div className="text-xs flex-1">
              <h4 className="font-bold text-amber-900 mb-0.5">
                {t('result.inconclusiveTitle')}
              </h4>
              <p className="text-amber-800/90 leading-relaxed mb-2">
                {t('result.inconclusiveDesc')}
              </p>
              <button
                onClick={onRescan}
                className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                {t('result.rescanBtn')}
              </button>
            </div>
          </div>
        )}

        {/* Tags de clasificación */}
        <div className="flex flex-wrap gap-2 pt-2">
          {displayTags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full bg-[#eceeef] text-[#006b5e] text-xs font-semibold flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2bb19e]"></span>
              {tag}
            </span>
          ))}
        </div>

        {/* Descripción general */}
        <div className="p-5 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow">
          <h3 className="text-sm font-bold text-[#191c1d] mb-1.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006b5e] text-[20px]">
              description
            </span>
            {t('result.description')}
          </h3>
          <p className="text-xs sm:text-sm text-[#3d4946] leading-relaxed">
            {details.description}
          </p>
        </div>

        {/* Bento Grid: Guía de Mantenimiento / Cuidados */}
        <div className="p-5 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow">
          <h3 className="text-sm font-bold text-[#191c1d] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006b5e] text-[20px]">spa</span>
            {t('result.careGuide')}
          </h3>

          {(() => {
            const safeCare = details.care || ({} as any);
            const lightItem = typeof safeCare.light === 'object' && safeCare.light !== null
              ? {
                  title: typeof safeCare.light.title === 'string' ? safeCare.light.title : (typeof safeCare.light.placement === 'string' ? safeCare.light.placement : 'Luz'),
                  desc: typeof safeCare.light.desc === 'string' ? safeCare.light.desc : (typeof safeCare.light.requirement === 'string' ? safeCare.light.requirement : '')
                }
              : { title: 'Luz', desc: typeof safeCare.light === 'string' ? safeCare.light : '' };

            const waterItem = typeof safeCare.watering === 'object' && safeCare.watering !== null
              ? {
                  title: typeof safeCare.watering.title === 'string' ? safeCare.watering.title : (typeof safeCare.watering.frequency === 'string' ? safeCare.watering.frequency : 'Riego'),
                  desc: typeof safeCare.watering.desc === 'string' ? safeCare.watering.desc : (typeof safeCare.watering.tips === 'string' ? safeCare.watering.tips : '')
                }
              : { title: 'Riego', desc: typeof safeCare.watering === 'string' ? safeCare.watering : '' };

            const tempItem = typeof safeCare.temperature === 'object' && safeCare.temperature !== null
              ? {
                  title: typeof safeCare.temperature.title === 'string' ? safeCare.temperature.title : (typeof safeCare.temperature.ideal === 'string' ? safeCare.temperature.ideal : 'Temperatura'),
                  desc: typeof safeCare.temperature.desc === 'string' ? safeCare.temperature.desc : (typeof safeCare.temperature.min === 'string' ? `${safeCare.temperature.min} - ${safeCare.temperature.max || ''}` : '')
                }
              : { title: 'Temperatura', desc: typeof safeCare.temperature === 'string' ? safeCare.temperature : '' };

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Luz */}
                <div className="p-3.5 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4]/60">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-[18px]">light_mode</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#191c1d]">
                    {getLocalizedCareTitle(lightItem.title, 'light', t)}
                  </h4>
                  {lightItem.desc && (
                    <p className="text-[11px] text-[#3d4946] mt-1 leading-normal">
                      {lightItem.desc}
                    </p>
                  )}
                </div>

                {/* Riego / Lavado */}
                <div className="p-3.5 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4]/60">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-[18px]">water_drop</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#191c1d]">
                    {getLocalizedCareTitle(waterItem.title, 'watering', t)}
                  </h4>
                  {waterItem.desc && (
                    <p className="text-[11px] text-[#3d4946] mt-1 leading-normal">
                      {waterItem.desc}
                    </p>
                  )}
                </div>

                {/* Temperatura / Almacenamiento */}
                <div className="p-3.5 rounded-xl bg-[#f2f4f5] border border-[#e1e3e4]/60">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#006b5e] flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-[18px]">thermostat</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#191c1d]">
                    {getLocalizedCareTitle(tempItem.title, 'temperature', t)}
                  </h4>
                  {tempItem.desc && (
                    <p className="text-[11px] text-[#3d4946] mt-1 leading-normal">
                      {tempItem.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Alerta de Seguridad y Toxicidad */}
        {(details.toxicity || details.toxicityAlert) && (
          <div
            id="toxicity-alert-card"
            className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs ${
              (details.toxicity?.isToxicToHumans || details.toxicity?.isToxicToPets)
                ? 'bg-amber-50/90 border-amber-200/80 text-amber-950'
                : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                (details.toxicity?.isToxicToHumans || details.toxicity?.isToxicToPets)
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-[#006b5e]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {(details.toxicity?.isToxicToHumans || details.toxicity?.isToxicToPets) ? 'warning' : 'shield'}
              </span>
            </div>
            <div className="flex-1 space-y-1 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <h4 className="font-bold text-sm">
                  {t('toxicity.title')}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    (details.toxicity?.isToxicToHumans || details.toxicity?.isToxicToPets)
                      ? 'bg-amber-200/80 text-amber-950'
                      : 'bg-emerald-200/80 text-emerald-950'
                  }`}
                >
                  {(details.toxicity?.isToxicToHumans || details.toxicity?.isToxicToPets)
                    ? t('toxicity.isToxic')
                    : t('toxicity.isSafe')}
                </span>
              </div>

              {/* Indicadores de toxicidad para Humanos y Mascotas */}
              {details.toxicity && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                      details.toxicity.isToxicToHumans
                        ? 'bg-amber-100/90 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100/90 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {details.toxicity.isToxicToHumans ? 'person_alert' : 'person_check'}
                    </span>
                    {details.toxicity.isToxicToHumans ? t('toxicity.humans') : t('toxicity.humansSafe')}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                      details.toxicity.isToxicToPets
                        ? 'bg-amber-100/90 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100/90 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {details.toxicity.isToxicToPets ? 'pets' : 'pets'}
                    </span>
                    {details.toxicity.isToxicToPets ? t('toxicity.pets') : t('toxicity.petsSafe')}
                  </span>
                </div>
              )}

              {/* Explicación/detalles en el idioma activo */}
              {(details.toxicity?.details || details.toxicityAlert?.desc) && (
                <p className="text-xs opacity-90 leading-relaxed pt-1">
                  {details.toxicity?.details || details.toxicityAlert?.desc}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Origen y Hábitat */}
        <div className="p-5 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow space-y-3">
          <div>
            <h4 className="text-xs font-bold text-[#191c1d] flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-[#006b5e] text-[18px]">public</span>
              {t('result.originHabitat')}
            </h4>
            <p className="text-xs text-[#3d4946] leading-relaxed">
              {details.origin} {details.naturalHabitat ? `• ${details.naturalHabitat}` : ''}
            </p>
          </div>

          {/* Características Compactas */}
          {(details.characteristics || details.lifeCycle || details.plantType) && (
            <div className="pt-2.5 border-t border-[#e1e3e4]/60 space-y-2">
              <h4 className="text-xs font-bold text-[#191c1d] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006b5e] text-[18px]">tune</span>
                {t('result.botanicalProfile')}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {details.plantType && (
                  <div className="p-2 rounded-xl bg-[#f8faf9] border border-[#e1e3e4]/60">
                    <span className="text-[10px] text-[#6d7a76] block font-medium">{t('result.plantType')}</span>
                    <span className="font-semibold text-[#191c1d]">{details.plantType}</span>
                  </div>
                )}
                {details.lifeCycle && (
                  <div className="p-2 rounded-xl bg-[#f8faf9] border border-[#e1e3e4]/60">
                    <span className="text-[10px] text-[#6d7a76] block font-medium">{t('result.lifeCycle')}</span>
                    <span className="font-semibold text-[#191c1d]">{details.lifeCycle}</span>
                  </div>
                )}
                {details.characteristics?.approximateHeight && (
                  <div className="p-2 rounded-xl bg-[#f8faf9] border border-[#e1e3e4]/60">
                    <span className="text-[10px] text-[#6d7a76] block font-medium">{t('result.height')}</span>
                    <span className="font-semibold text-[#191c1d]">{details.characteristics.approximateHeight}</span>
                  </div>
                )}
                {details.characteristics?.leafColor && (
                  <div className="p-2 rounded-xl bg-[#f8faf9] border border-[#e1e3e4]/60">
                    <span className="text-[10px] text-[#6d7a76] block font-medium">{t('result.leafColor')}</span>
                    <span className="font-semibold text-[#191c1d]">{details.characteristics.leafColor}</span>
                  </div>
                )}
                {details.characteristics?.leafType && (
                  <div className="p-2 rounded-xl bg-[#f8faf9] border border-[#e1e3e4]/60">
                    <span className="text-[10px] text-[#6d7a76] block font-medium">{t('result.leafType')}</span>
                    <span className="font-semibold text-[#191c1d]">{details.characteristics.leafType}</span>
                  </div>
                )}
                {details.characteristics?.plantingSeason && (
                  <div className="p-2 rounded-xl bg-[#f8faf9] border border-[#e1e3e4]/60">
                    <span className="text-[10px] text-[#6d7a76] block font-medium">{t('result.plantingSeason')}</span>
                    <span className="font-semibold text-[#191c1d]">{details.characteristics.plantingSeason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {sanitizedCuriosities && sanitizedCuriosities.length > 0 && (
            <div className="pt-2 border-t border-[#e1e3e4]/60">
              <h4 className="text-xs font-bold text-[#191c1d] flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[#006b5e] text-[18px]">
                  psychology_alt
                </span>
                {t('result.curiosities')}
              </h4>
              <ul className="space-y-1.5">
                {sanitizedCuriosities.map((item, idx) => (
                  <li key={idx} className="text-xs text-[#3d4946] flex items-start gap-2">
                    <span className="text-[#006b5e] font-bold">•</span>
                    <span>{typeof item === 'string' ? item : String(item?.text || item || '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Análisis de Identificación y Certeza Botánica */}
        <div className="p-5 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#191c1d] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006b5e] text-[20px]">
                verified
              </span>
              <span>{t('result.analysisTitle')}</span>
            </h3>
            <span className="text-[10px] text-[#006b5e] font-bold px-2 py-0.5 rounded-full bg-emerald-50">
              {t('result.certainty', { percentage: topPrediction.percentage })}
            </span>
          </div>

          {/* Rasgos visuales observados en la imagen */}
          {details.observedCharacteristics && details.observedCharacteristics.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#f8faf9] border border-[#e1e3e4]/60">
              <span className="text-[11px] font-bold text-[#191c1d] block flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006b5e] text-[16px]">visibility</span>
                {t('result.observedTraits')}
              </span>
              <ul className="space-y-1 text-xs text-[#3d4946]">
                {details.observedCharacteristics.map((trait, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#006b5e] font-bold">•</span>
                    <span>{trait}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Posibles alternativas similares */}
          {details.possibleAlternatives && details.possibleAlternatives.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
              <span className="text-[11px] font-bold text-amber-900 block flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-[16px]">device_hub</span>
                {t('result.similarSpecies')}
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {details.possibleAlternatives.map((alt, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-medium text-amber-950 italic shadow-xs"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comparación de Coincidencias si existen alternativas en allPredictions */}
          {allPredictions.length > 1 && (
            <div className="space-y-2.5 pt-1">
              <span className="text-[11px] font-bold text-[#6d7a76] block">
                {t('result.relativeMatch')}
              </span>
              {allPredictions.map((pred, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#191c1d] flex items-center gap-1.5">
                      {index === 0 && (
                        <span className="material-symbols-outlined text-[#006b5e] text-[16px]">
                          check_circle
                        </span>
                      )}
                      {pred.className}
                    </span>
                    <span className="font-bold text-[#006b5e]">{pred.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#eceeef] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0
                          ? 'bg-gradient-to-r from-[#006b5e] to-[#2bb19e]'
                          : 'bg-[#bcc9c5]'
                      }`}
                      style={{ width: `${pred.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones principales fijas */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
          <button
            id="result-rescan-btn"
            onClick={onRescan}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#006b5e] to-[#2bb19e] text-white font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
            {t('result.scanAgain')}
          </button>

          <button
            id="result-care-btn"
            onClick={onNavigateToCare}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-[#eceeef] hover:bg-[#e1e3e4] text-[#006b5e] font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">yard</span>
            {t('nav.care')}
          </button>
        </div>
      </div>
    </div>
  );
};
