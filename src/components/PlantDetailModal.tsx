import React from 'react';
import { PlantInfo } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import {
  getLocalizedCategory,
  getLocalizedSpeciesName,
  getLocalizedScientificName,
  getLocalizedCareTitle
} from '../services/speciesLocalization';

interface PlantDetailModalProps {
  plant: PlantInfo;
  onClose: () => void;
  onScanSimilar?: () => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  onClose,
  onScanSimilar
}) => {
  const { t, language } = useTranslation();

  const sanitizedTags = (plant.tags || [])
    .filter((tag) => !/teachable|machine|tensorflow|modelo|clasificador/i.test(tag))
    .map((tag) => getLocalizedCategory(tag, t));
  const displayTags = sanitizedTags.length > 0 ? sanitizedTags : [t('history.botanical'), t('history.collection')];

  const localizeCategory = (category: string) => {
    return getLocalizedCategory(category, t);
  };

  const sanitizedCuriosities = (plant.curiosities || []).filter(
    (item) => !/teachable|machine|tensorflow|clasificador/i.test(item)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-[#f8fafb] w-full max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e1e3e4] text-[#191c1d] relative animate-slide-up">
        {/* Hero Image */}
        <div className="relative w-full h-64 sm:h-72 bg-neutral-900 overflow-hidden">
          {plant.imageUrl ? (
            <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#002b25] text-[#7ef7e2]">
              <span className="material-symbols-outlined text-6xl">spa</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
            aria-label={t('plantModal.close')}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {/* Categoría y Título */}
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-[11px] uppercase tracking-wider text-[#7ef7e2] font-bold">
              {localizeCategory(plant.category)}
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              {getLocalizedSpeciesName(plant.name, t, language)}
            </h2>
            <p className="text-xs text-white/80 italic">
              {getLocalizedScientificName(plant.scientificName, language)}
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-[#eceeef] text-[#006b5e] text-xs font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Descripción */}
          <div className="p-4 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow">
            <h3 className="text-xs font-bold text-[#191c1d] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006b5e] text-[18px]">info</span>
              {t('plantModal.generalInfo')}
            </h3>
            <p className="text-xs text-[#3d4946] leading-relaxed">{plant.description}</p>
          </div>

          {/* Cuidados Bento */}
          <div className="p-4 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow">
            <h3 className="text-xs font-bold text-[#191c1d] mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006b5e] text-[18px]">spa</span>
              {t('plantModal.careGuide')}
            </h3>

            {/* Cuidados Bento */}
            {(() => {
              const safeCare = plant.care || ({} as any);
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#f2f4f5]">
                    <span className="text-[11px] font-bold text-[#191c1d] block">
                      ☀️ {getLocalizedCareTitle(lightItem.title, 'light', t)}
                    </span>
                    {lightItem.desc && (
                      <p className="text-[10px] text-[#3d4946] mt-0.5">{lightItem.desc}</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#f2f4f5]">
                    <span className="text-[11px] font-bold text-[#191c1d] block">
                      💧 {getLocalizedCareTitle(waterItem.title, 'watering', t)}
                    </span>
                    {waterItem.desc && (
                      <p className="text-[10px] text-[#3d4946] mt-0.5">{waterItem.desc}</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#f2f4f5]">
                    <span className="text-[11px] font-bold text-[#191c1d] block">
                      🌡️ {getLocalizedCareTitle(tempItem.title, 'temperature', t)}
                    </span>
                    {tempItem.desc && (
                      <p className="text-[10px] text-[#3d4946] mt-0.5">{tempItem.desc}</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Alerta de Seguridad y Toxicidad */}
          {(plant.toxicity || plant.toxicityAlert) && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs ${
                (plant.toxicity?.isToxicToHumans || plant.toxicity?.isToxicToPets)
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                {(plant.toxicity?.isToxicToHumans || plant.toxicity?.isToxicToPets) ? 'warning' : 'shield'}
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold block">
                    {t('toxicity.title')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (plant.toxicity?.isToxicToHumans || plant.toxicity?.isToxicToPets)
                        ? 'bg-amber-200/80 text-amber-950'
                        : 'bg-emerald-200/80 text-emerald-950'
                    }`}
                  >
                    {(plant.toxicity?.isToxicToHumans || plant.toxicity?.isToxicToPets)
                      ? t('toxicity.isToxic')
                      : t('toxicity.isSafe')}
                  </span>
                </div>

                {/* Status badges */}
                {plant.toxicity && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        plant.toxicity.isToxicToHumans
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {plant.toxicity.isToxicToHumans ? t('toxicity.humans') : t('toxicity.humansSafe')}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        plant.toxicity.isToxicToPets
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {plant.toxicity.isToxicToPets ? t('toxicity.pets') : t('toxicity.petsSafe')}
                    </span>
                  </div>
                )}

                <p className="text-[11px] opacity-90 leading-normal pt-0.5">
                  {plant.toxicity?.details || plant.toxicityAlert?.desc}
                </p>
              </div>
            </div>
          )}

          {/* Curiosidades */}
          {sanitizedCuriosities && sanitizedCuriosities.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow">
              <h3 className="text-xs font-bold text-[#191c1d] mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006b5e] text-[18px]">
                  psychology
                </span>
                {t('plantModal.curiosities')}
              </h3>
              <ul className="space-y-1.5 text-xs text-[#3d4946]">
                {sanitizedCuriosities.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#006b5e] font-bold">•</span>
                    <span>{typeof c === 'string' ? c : String(c?.text || c || '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botón Escanear */}
          {onScanSimilar && (
            <button
              onClick={() => {
                onClose();
                onScanSimilar();
              }}
              className="w-full py-3 rounded-2xl bg-[#006b5e] hover:bg-[#2bb19e] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
              {t('plantModal.scanSimilar')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
