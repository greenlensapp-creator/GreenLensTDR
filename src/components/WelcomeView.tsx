import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface WelcomeViewProps {
  onStart: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onStart }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onStart();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onStart();
  };

  const slides = [
    {
      step: 1,
      icon: 'center_focus_strong',
      badge: 'Paso 1 de 5',
      title: t('onboarding.step1Title'),
      desc: t('onboarding.step1Desc'),
      feature1Icon: 'bolt',
      feature1Text: t('onboarding.step1Feature1'),
      feature2Icon: 'timer',
      feature2Text: t('onboarding.step1Feature2'),
      accentColor: 'from-[#006b5e] to-[#004d43]'
    },
    {
      step: 2,
      icon: 'verified',
      badge: 'Paso 2 de 5',
      title: t('onboarding.step2Title'),
      desc: t('onboarding.step2Desc'),
      feature1Icon: 'menu_book',
      feature1Text: t('onboarding.step2Feature1'),
      feature2Icon: 'percent',
      feature2Text: t('onboarding.step2Feature2'),
      accentColor: 'from-[#005e54] to-[#003d36]'
    },
    {
      step: 3,
      icon: 'potted_plant',
      badge: 'Paso 3 de 5',
      title: t('onboarding.step3Title'),
      desc: t('onboarding.step3Desc'),
      feature1Icon: 'water_drop',
      feature1Text: t('onboarding.step3Feature1'),
      feature2Icon: 'pets',
      feature2Text: t('onboarding.step3Feature2'),
      accentColor: 'from-[#006b5e] to-[#005247]'
    },
    {
      step: 4,
      icon: 'cloud_sync',
      badge: 'Paso 4 de 5',
      title: t('onboarding.step4Title'),
      desc: t('onboarding.step4Desc'),
      feature1Icon: 'devices',
      feature1Text: t('onboarding.step4Feature1'),
      feature2Icon: 'favorite',
      feature2Text: t('onboarding.step4Feature2'),
      accentColor: 'from-[#005c50] to-[#003f37]'
    },
    {
      step: 5,
      icon: 'local_florist',
      badge: 'Paso 5 de 5',
      title: t('onboarding.step5Title'),
      desc: t('onboarding.step5Desc'),
      feature1Icon: 'category',
      feature1Text: t('onboarding.step5Feature1'),
      feature2Icon: 'check_circle',
      feature2Text: t('onboarding.step5Feature2'),
      accentColor: 'from-[#006b5e] to-[#003d35]'
    }
  ];

  const currentSlide = slides[currentStep - 1];

  return (
    <div
      id="welcome-onboarding-screen"
      className="min-h-screen bg-gradient-to-b from-[#003831] via-[#005a4e] to-[#00473e] text-white flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden select-none"
    >
      {/* Luces difusas de fondo */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#3ecfb5]/15 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#7ef7e2]/10 blur-3xl pointer-events-none"></div>

      {/* Header superior con logo y botón saltar */}
      <header className="relative z-10 flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white text-[#006b5e] flex items-center justify-center shadow-lg font-black text-xl">
            <span className="material-symbols-outlined text-[24px]">psychiatry</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">GreenLens</h1>
            <span className="text-[10px] text-[#7ef7e2] font-semibold tracking-wider uppercase">
              {t('topBar.subtitle')}
            </span>
          </div>
        </div>

        {currentStep < totalSteps && (
          <button
            id="onboarding-skip-btn"
            onClick={handleSkip}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#7ef7e2] transition-colors border border-white/10"
          >
            {t('onboarding.skip')}
          </button>
        )}
      </header>

      {/* Indicador de progreso de 5 barras */}
      <div className="relative z-10 my-4 flex items-center gap-2 max-w-sm mx-auto w-full">
        {slides.map((s, idx) => (
          <div
            key={s.step}
            onClick={() => setCurrentStep(idx + 1)}
            className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
              idx + 1 === currentStep
                ? 'bg-[#7ef7e2] scale-y-125'
                : idx + 1 < currentStep
                ? 'bg-white/60'
                : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Contenido principal del slide activo */}
      <div className="relative z-10 my-auto py-4 text-center max-w-sm mx-auto w-full space-y-5">
        {/* Icono central estilizado */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto shadow-2xl pulse-ring">
          <span className="material-symbols-outlined text-[48px] sm:text-[54px] text-[#7ef7e2]">
            {currentSlide.icon}
          </span>
        </div>

        {/* Título y descripción */}
        <div className="space-y-2.5">
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#7ef7e2] text-[11px] font-bold tracking-wide uppercase border border-white/10">
            {t('onboarding.pageIndicator', { current: currentStep, total: totalSteps })}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-white">
            {currentSlide.title}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal px-2">
            {currentSlide.desc}
          </p>
        </div>

        {/* 2 características clave del paso actual */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#7ef7e2] text-[22px] shrink-0">
              {currentSlide.feature1Icon}
            </span>
            <span className="text-[11px] font-bold text-white leading-tight">
              {currentSlide.feature1Text}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#7ef7e2] text-[22px] shrink-0">
              {currentSlide.feature2Icon}
            </span>
            <span className="text-[11px] font-bold text-white leading-tight">
              {currentSlide.feature2Text}
            </span>
          </div>
        </div>
      </div>

      {/* Controles de navegación inferiores */}
      <footer className="relative z-10 space-y-3 max-w-sm mx-auto w-full pb-2">
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              id="onboarding-prev-btn"
              onClick={handlePrev}
              className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] transition-all font-bold text-sm text-white flex items-center justify-center border border-white/10"
              aria-label={t('onboarding.prev')}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )}

          <button
            id="onboarding-next-btn"
            onClick={handleNext}
            className="flex-1 py-4 px-6 rounded-2xl bg-white text-[#006b5e] hover:bg-[#7ef7e2] active:scale-[0.98] transition-all font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
          >
            <span>{currentStep === totalSteps ? t('onboarding.start') : t('onboarding.next')}</span>
            <span className="material-symbols-outlined text-[18px]">
              {currentStep === totalSteps ? 'check_circle' : 'arrow_forward'}
            </span>
          </button>
        </div>

        <p className="text-[10px] text-center text-white/50">
          GreenLens • {t('topBar.subtitle')}
        </p>
      </footer>
    </div>
  );
};
