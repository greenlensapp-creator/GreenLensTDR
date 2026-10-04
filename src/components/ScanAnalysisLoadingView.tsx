import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClassificationResult } from '../types';
import { classifyImage } from '../services/classifierService';
import { useTranslation } from '../i18n/LanguageContext';

interface ScanAnalysisLoadingViewProps {
  image: string;
  onSuccess: (result: ClassificationResult) => void;
  onRetake: () => void;
  onCancel: () => void;
}

export const ScanAnalysisLoadingView: React.FC<ScanAnalysisLoadingViewProps> = ({
  image,
  onSuccess,
  onRetake,
  onCancel
}) => {
  const { t, language } = useTranslation();

  const dynamicMessages = [
    t('loading.msg1'),
    t('loading.msg2'),
    t('loading.msg3'),
    t('loading.msg4'),
    t('loading.msg5'),
    t('loading.msg6')
  ];

  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<number>(1);
  const isMountedRef = useRef<boolean>(true);
  const inProgressRef = useRef<boolean>(false);

  // Ciclo automático y suave de mensajes informativos cada 2.6 segundos
  useEffect(() => {
    isMountedRef.current = true;
    if (!isLoading) return;

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setMessageIndex((prev) => (prev + 1) % dynamicMessages.length);
        setIsFading(false);
      }, 300);
    }, 2600);

    return () => {
      clearInterval(interval);
    };
  }, [isLoading, dynamicMessages.length]);

  // Ejecución real y única de la petición botánica con IA
  const executeAnalysis = useCallback(async () => {
    if (inProgressRef.current) {
      console.log('[SCAN] Análisis ya en curso, ignorando llamada redundante');
      return;
    }

    inProgressRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    setMessageIndex(0);

    console.log('[SCAN] Preparando análisis botánico con IA');

    try {
      const dummyElement = document.createElement('img');
      dummyElement.src = image || '';

      // classifyImage realiza la optimización y la llamada a /api/identify-plant con idioma
      const result = await classifyImage(dummyElement, image, 0.6, language);
      console.log('[SCAN] Análisis completado con éxito', {
        name: result.details?.name,
        confidence: result.topPrediction?.percentage
      });

      if (isMountedRef.current) {
        setIsLoading(false);
        onSuccess(result);
      }
    } catch (err: any) {
      console.error('[GreenLens] Error en análisis durante pantalla de carga:', err);
      if (isMountedRef.current) {
        setIsLoading(false);
        const fallbackMsg = t('care.error.analysisFailed') || 'Ha ocurrido un problema al analizar la imagen. Inténtalo de nuevo.';
        setErrorMessage(err?.message && err.message !== 'Failed to fetch' ? err.message : fallbackMsg);
      }
    } finally {
      inProgressRef.current = false;
    }
  }, [image, onSuccess, language, t]);

  useEffect(() => {
    isMountedRef.current = true;
    executeAnalysis();
    return () => {
      isMountedRef.current = false;
    };
  }, [attemptId]);

  const handleRetry = () => {
    setAttemptId((prev) => prev + 1);
  };

  return (
    <div
      id="scan-analysis-loading-view"
      className="fixed inset-0 z-50 bg-[#002620] text-white flex flex-col justify-between overflow-hidden select-none"
      style={{
        background: 'radial-gradient(circle at 50% 30%, #004d43 0%, #002b25 50%, #001a16 100%)'
      }}
    >
      {/* Elementos decorativos de fondo: hojas orgánicas flotantes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Halo de luz difusa ambiental */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#2bb19e]/15 blur-3xl animate-botanical-glow" />

        {/* Hojas flotantes y partículas sutiles */}
        <div
          className="absolute top-12 left-8 text-[#7ef7e2]/25 animate-botanical-float"
          style={{ animationDelay: '0s', animationDuration: '6s' }}
        >
          <span className="material-symbols-outlined text-[36px]">nature</span>
        </div>

        <div
          className="absolute top-24 right-10 text-[#2bb19e]/20 animate-botanical-float"
          style={{ animationDelay: '1.5s', animationDuration: '7s' }}
        >
          <span className="material-symbols-outlined text-[28px]">eco</span>
        </div>

        <div
          className="absolute bottom-32 left-10 text-[#7ef7e2]/20 animate-botanical-float"
          style={{ animationDelay: '3s', animationDuration: '6.5s' }}
        >
          <span className="material-symbols-outlined text-[32px]">spa</span>
        </div>

        <div
          className="absolute bottom-24 right-8 text-[#2bb19e]/25 animate-botanical-float"
          style={{ animationDelay: '2s', animationDuration: '8s' }}
        >
          <span className="material-symbols-outlined text-[30px]">psychiatry</span>
        </div>

        {/* Puntos de luz orgánicos */}
        <div className="absolute top-1/3 left-1/5 w-2 h-2 rounded-full bg-[#7ef7e2]/40 blur-xs animate-ping" style={{ animationDuration: '3.5s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-[#2bb19e]/40 blur-xs animate-ping" style={{ animationDuration: '4.2s', animationDelay: '1s' }} />
      </div>

      {/* Barra superior de estado y marca GreenLens */}
      <header className="relative z-10 w-full px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#2bb19e]/20 border border-[#2bb19e]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#7ef7e2] text-[20px]">
              eco
            </span>
          </div>
          <span className="text-sm font-bold tracking-wider uppercase text-[#7ef7e2]">
            GreenLens AI
          </span>
        </div>

        {/* Botón cancelar */}
        <button
          id="loading-cancel-btn"
          onClick={onCancel}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all"
          aria-label={t('loading.cancelScan')}
          title={t('loading.cancelScan')}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </header>

      {/* Contenido Central */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4 max-w-lg mx-auto w-full">
        {isLoading ? (
          <>
            {/* Animación Central de Análisis Botánico */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-6">
              {/* Anillo exterior decorativo de hojas botánicas */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-botanical-spin">
                <svg className="w-full h-full" viewBox="0 0 240 240" fill="none">
                  {/* Círculo guía tenue */}
                  <circle
                    cx="120"
                    cy="120"
                    r="110"
                    stroke="#2bb19e"
                    strokeWidth="1.5"
                    strokeDasharray="4 8"
                    opacity="0.3"
                  />
                  {/* 8 pequeñas hojas estilizadas en círculo */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
                    const rad = (angle * Math.PI) / 180;
                    const cx = 120 + 110 * Math.cos(rad);
                    const cy = 120 + 110 * Math.sin(rad);
                    return (
                      <g
                        key={idx}
                        transform={`translate(${cx}, ${cy}) rotate(${angle + 90})`}
                      >
                        <path
                          d="M0,-8 C5,-4 6,4 0,8 C-6,4 -5,-4 0,-8 Z"
                          fill={idx % 2 === 0 ? '#7ef7e2' : '#2bb19e'}
                          opacity={idx % 2 === 0 ? 0.8 : 0.5}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Anillo de progreso / giro continuo */}
              <div className="absolute -inset-2 flex items-center justify-center pointer-events-none">
                <svg
                  className="w-full h-full animate-botanical-reverse"
                  viewBox="0 0 260 260"
                  fill="none"
                >
                  <circle
                    cx="130"
                    cy="130"
                    r="124"
                    stroke="url(#botanical-gradient)"
                    strokeWidth="2.5"
                    strokeDasharray="70 200"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <defs>
                    <linearGradient id="botanical-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7ef7e2" />
                      <stop offset="100%" stopColor="#006b5e" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Marco fotográfico de la planta capturada con efecto de haz de escáner */}
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-3xl overflow-hidden shadow-2xl border-2 border-[#7ef7e2]/40 bg-black/40">
                {/* Imagen del usuario */}
                {image ? (
                  <img
                    src={image}
                    alt={t('loading.capturedAlt')}
                    className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-950">
                    <span className="material-symbols-outlined text-4xl text-[#7ef7e2]">photo_camera</span>
                  </div>
                )}

                {/* Línea de escaneo láser suave */}
                <div className="scan-line" />

                {/* Resplandor interno de lente */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#003d35]/70 via-transparent to-transparent pointer-events-none" />

                {/* Glifo botánico en esquina inferior */}
                <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <span className="material-symbols-outlined text-[#7ef7e2] text-[18px]">
                    psychiatry
                  </span>
                </div>
              </div>
            </div>

            {/* Indicador de fases / puntos interactivos */}
            <div className="flex items-center gap-2 mb-4">
              {dynamicMessages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === messageIndex
                      ? 'w-6 bg-[#7ef7e2] shadow-[0_0_8px_#7ef7e2]'
                      : idx < messageIndex
                      ? 'w-2 bg-[#2bb19e]'
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Mensajes Dinámicos Secuenciales con Transición Suave */}
            <div className="h-14 flex items-center justify-center text-center px-4 w-full">
              <h2
                className={`text-xl sm:text-2xl font-extrabold text-white tracking-tight transition-all duration-300 transform ${
                  isFading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                }`}
              >
                {dynamicMessages[messageIndex % dynamicMessages.length]}
              </h2>
            </div>

            {/* Texto secundario de tranquilidad para el usuario */}
            <p className="text-xs sm:text-sm text-white/70 text-center font-medium max-w-xs sm:max-w-sm mt-1 leading-relaxed">
              {t('loading.pleaseWait')}
            </p>
          </>
        ) : (
          /* Estado de Error si la llamada a la API falla */
          <div
            id="scan-error-card"
            className="w-full max-w-sm p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 text-center space-y-4 shadow-2xl animate-fade-in"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">
                error_outline
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">
                {t('loading.errorTitle')}
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                {errorMessage}
              </p>
            </div>

            {/* Botones de acción en caso de fallo */}
            <div className="space-y-2 pt-2">
              <button
                id="scan-retry-btn"
                onClick={handleRetry}
                className="w-full py-3 px-4 rounded-xl bg-[#006b5e] hover:bg-[#005247] active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>{t('loading.retryBtn')}</span>
              </button>

              <button
                id="scan-retake-btn"
                onClick={onRetake}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-98 text-white/90 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                <span>{t('loading.retakeBtn')}</span>
              </button>

              <button
                id="scan-cancel-error-btn"
                onClick={onCancel}
                className="w-full py-2 text-white/60 hover:text-white/90 text-xs font-medium transition-colors"
              >
                {t('loading.cancelBtn')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Pie de pantalla seguro */}
      <footer className="relative z-10 w-full px-6 py-4 text-center">
        <span className="text-[11px] text-white/40 font-medium tracking-wide">
          {t('loading.footer')}
        </span>
      </footer>
    </div>
  );
};
