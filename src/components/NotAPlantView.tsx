import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface NotAPlantViewProps {
  image?: string | null;
  onRetry: () => void;
  onBack?: () => void;
  title?: string;
  message?: string;
}

export const NotAPlantView: React.FC<NotAPlantViewProps> = ({
  image,
  onRetry,
  onBack,
  title,
  message
}) => {
  const { t } = useTranslation();

  const isGenericTitle = !title || /no parece ser una planta|does not appear to be a plant|no sembla ser una planta|لا يبدو/i.test(title);
  const displayTitle = isGenericTitle ? t('notAPlant.title') : title;

  const isGenericMessage = !message || /no parece contener|does not appear to contain|no sembla contenir|لا يبدو أن الصورة/i.test(message);
  const displayMessage = isGenericMessage ? t('notAPlant.message') : message;

  return (
    <div
      id="not-a-plant-screen"
      className="min-h-screen bg-[#f8fafb] text-[#191c1d] flex flex-col justify-between selection:bg-[#2bb19e] selection:text-[#003d35]"
    >
      {/* Barra superior minimalista */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#e1e3e4] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              id="not-a-plant-back-btn"
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-[#f2f4f5] hover:bg-[#e1e3e4] text-[#191c1d] flex items-center justify-center transition-colors cursor-pointer"
              aria-label={t('nav.back')}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006b5e]" />
            <span className="font-extrabold text-sm tracking-tight text-[#191c1d]">GreenLens</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-[#526360] px-3 py-1 rounded-full bg-[#f2f4f5]">
          <span className="material-symbols-outlined text-[16px]">psychiatry</span>
          <span>{t('notAPlant.badge')}</span>
        </div>
      </header>

      {/* Tarjeta central unificada */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div
          id="not-a-plant-card"
          className="w-full bg-white rounded-3xl border border-[#e1e3e4] p-6 sm:p-8 shadow-sm flex flex-col items-center text-center space-y-6 animate-fade-in"
        >
          {/* Miniatura de la fotografía capturada o icono */}
          <div className="relative">
            {image ? (
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-2 border-[#e1e3e4] shadow-sm bg-neutral-900">
                <img
                  src={image}
                  alt={t('notAPlant.analyzedPhoto')}
                  className="w-full h-full object-cover grayscale-[30%] contrast-[95%]"
                />
                <div className="absolute inset-0 bg-black/10" />
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold tracking-wide flex items-center gap-1 whitespace-nowrap">
                  <span className="material-symbols-outlined text-[12px] text-amber-400">info</span>
                  {t('notAPlant.notBotanical')}
                </span>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-sm">
                <span className="material-symbols-outlined text-[44px]">eco_off</span>
              </div>
            )}
          </div>

          {/* Textos descriptivos */}
          <div className="space-y-2.5 max-w-sm">
            <h2 className="text-xl sm:text-2xl font-black text-[#191c1d] tracking-tight leading-snug">
              {displayTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#526360] leading-relaxed">
              {displayMessage}
            </p>
          </div>

          {/* Consejos breves para una captura exitosa */}
          <div className="w-full bg-[#f8fafb] rounded-2xl p-4 border border-[#e1e3e4] text-left space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006b5e] block">
              {t('notAPlant.tipsTitle')}
            </span>
            <ul className="text-xs text-[#526360] space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#006b5e] shrink-0">check</span>
                <span>{t('notAPlant.tip1')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#006b5e] shrink-0">check</span>
                <span>{t('notAPlant.tip2')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#006b5e] shrink-0">check</span>
                <span>{t('notAPlant.tip3')}</span>
              </li>
            </ul>
          </div>

          {/* Botones de acción directa */}
          <div className="w-full space-y-2.5 pt-2">
            <button
              id="not-a-plant-retry-btn"
              type="button"
              onClick={onRetry}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#006b5e] hover:bg-[#005247] text-white font-bold text-xs shadow-sm hover:shadow active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>{t('notAPlant.retry')}</span>
            </button>

            {onBack && (
              <button
                id="not-a-plant-home-btn"
                type="button"
                onClick={onBack}
                className="w-full py-2.5 px-4 rounded-2xl text-xs font-semibold text-[#6d7a76] hover:text-[#191c1d] hover:bg-[#f2f4f5] transition-colors cursor-pointer"
              >
                {t('nav.back')}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Pie de pantalla */}
      <footer className="w-full text-center py-4 text-[11px] text-[#89938f]">
        {t('notAPlant.footer')}
      </footer>
    </div>
  );
};
