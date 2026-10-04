import React, { useState, useRef, useEffect, useCallback } from 'react';
import { classifyImage } from '../services/classifierService';
import { ClassificationResult } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface CameraScanViewProps {
  onClose: () => void;
  onImageCaptured?: (dataUrl: string) => void;
  onAnalysisComplete?: (result: ClassificationResult) => void;
}

export const CameraScanView: React.FC<CameraScanViewProps> = ({
  onClose,
  onImageCaptured,
  onAnalysisComplete
}) => {
  const { t, language } = useTranslation();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCapturingRef = useRef<boolean>(false);

  // Detener el stream activo de manera segura
  const stopCurrentStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // Ignorar error al detener track
        }
      });
      streamRef.current = null;
    }
    setStream(null);
    setIsCameraActive(false);
    setTorchOn(false);
    setHasTorchSupport(false);
  }, []);

  // Iniciar la cámara con fallback progresivo de restricciones
  const startCamera = useCallback(
    async (facing: 'environment' | 'user') => {
      stopCurrentStream();
      setCameraError(null);
      setErrorMessage(null);

      const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
      console.log('[CAMERA_REQUEST] Iniciando solicitud de cámara', {
        facingMode: facing,
        isSecureContext: isSecure,
        hasMediaDevices: Boolean(navigator?.mediaDevices),
        hasGetUserMedia: Boolean(navigator?.mediaDevices?.getUserMedia)
      });

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        console.warn('[CAMERA_PERMISSION] getUserMedia no está disponible en este entorno', {
          isSecureContext: isSecure
        });
        const msg = !isSecure
          ? 'El acceso a la cámara requiere un contexto seguro (HTTPS o localhost). Puedes usar la opción de Galería.'
          : t('scanner.notAvailableDesc');
        setCameraError(msg);
        return;
      }

      try {
        let newStream: MediaStream | null = null;

        // 1. Intento con facingMode ideal y resolución óptima (compatible con móvil)
        try {
          console.log('[CAMERA_REQUEST] Intento 1: facingMode ideal + 720p');
          newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facing },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        } catch (idealErr: any) {
          console.warn('[CAMERA_REQUEST] Intento 1 falló:', idealErr?.name || idealErr?.message);
          // 2. Intento de fallback sin restricciones específicas de resolución
          try {
            console.log('[CAMERA_REQUEST] Intento 2: facingMode básico');
            newStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: facing },
              audio: false
            });
          } catch (basicFacingErr: any) {
            console.warn('[CAMERA_REQUEST] Intento 2 falló:', basicFacingErr?.name || basicFacingErr?.message);
            // 3. Fallback universal: cualquier cámara disponible (laptops, webcams simples)
            console.log('[CAMERA_REQUEST] Intento 3: video genérico (fallback universal)');
            newStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          }
        }

        if (newStream) {
          const videoTracks = newStream.getVideoTracks();
          const mainTrack = videoTracks[0];
          console.log('[CAMERA_PERMISSION] Permiso concedido');
          console.log('[CAMERA_STREAM] Stream de vídeo obtenido', {
            trackCount: videoTracks.length,
            trackLabel: mainTrack?.label || 'default',
            trackReadyState: mainTrack?.readyState || 'unknown'
          });

          streamRef.current = newStream;
          setStream(newStream);
          setIsCameraActive(true);

          // Verificar si soporta linterna (torch)
          try {
            const capabilities = (mainTrack?.getCapabilities && mainTrack.getCapabilities()) as any;
            if (capabilities && capabilities.torch) {
              setHasTorchSupport(true);
            }
          } catch {
            setHasTorchSupport(false);
          }

          // Conectar el stream al elemento de video
          if (videoRef.current) {
            const video = videoRef.current;
            video.srcObject = newStream;
            video.muted = true;
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            
            video.onloadedmetadata = () => {
              console.log('[CAMERA_VIDEO_READY] Video listo para reproducir', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
              });
              video.play().catch((playErr) => {
                console.warn('[GreenLens] Error auto-playing video:', playErr?.name || playErr?.message);
              });
            };
          }
        }
      } catch (err: any) {
        console.warn('[CAMERA_PERMISSION] Error al obtener acceso a la cámara:', {
          errorName: err?.name,
          errorMessage: err?.message
        });
        setIsCameraActive(false);

        const isPermissionDenied =
          err?.name === 'NotAllowedError' ||
          err?.name === 'PermissionDeniedError' ||
          err?.message?.toLowerCase().includes('denied') ||
          err?.message?.toLowerCase().includes('permission');

        setCameraError(
          isPermissionDenied
            ? t('scanner.permissionDenied')
            : t('scanner.notAvailableDesc')
        );
      }
    },
    [stopCurrentStream, t]
  );

  // Conectar el stream al video cuando se monte o cambie
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.play().catch((e) => console.warn('[GreenLens] Error auto-playing video:', e));
    }
  }, [stream]);

  // Ciclo de vida principal del escáner
  useEffect(() => {
    startCamera(cameraFacing);
    return () => {
      stopCurrentStream();
    };
  }, [cameraFacing, startCamera, stopCurrentStream]);

  // Reconexión si el usuario regresa de otra pestaña
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopCurrentStream();
      } else if (!capturedPreview && !isAnalyzing) {
        startCamera(cameraFacing);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [cameraFacing, capturedPreview, isAnalyzing, startCamera, stopCurrentStream]);

  // Alternar entre cámara trasera y frontal
  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Alternar linterna (si el hardware lo soporta)
  const handleToggleTorch = async () => {
    const activeStream = streamRef.current || stream;
    if (!activeStream) return;
    try {
      const track = activeStream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
      if (capabilities && capabilities.torch) {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any]
        });
        setTorchOn(nextState);
      } else {
        setTorchOn(!torchOn);
      }
    } catch (e) {
      setTorchOn(!torchOn);
    }
  };

  // Capturar fotograma actual del video (con bloqueo contra doble clic)
  const handleCapture = async () => {
    if (!videoRef.current || isCapturingRef.current || isCapturing || isAnalyzing) return;
    isCapturingRef.current = true;
    setIsCapturing(true);

    const video = videoRef.current;
    console.log('[CAMERA_CAPTURE] Disparador pulsado', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      paused: video.paused
    });

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      const width = video.videoWidth > 0 ? video.videoWidth : 1280;
      const height = video.videoHeight > 0 ? video.videoHeight : 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.warn('[CAMERA_CAPTURE] No se pudo obtener el contexto 2D del canvas');
        setIsCapturing(false);
        isCapturingRef.current = false;
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      console.log('[CAMERA_IMAGE_READY] Fotograma capturado y convertido a Base64', {
        width,
        height,
        dataLength: dataUrl.length
      });

      console.log('[SCAN] Escaneo iniciado (Cámara)');
      console.log('[SCAN] Imagen recibida', { sizeBytes: dataUrl.length });

      stopCurrentStream();

      if (onImageCaptured) {
        onImageCaptured(dataUrl);
        return;
      }

      setCapturedPreview(dataUrl);
      await processImageAnalysis(video, dataUrl);
    } catch (err: any) {
      console.error('[CAMERA_CAPTURE] Error al capturar foto:', {
        errorName: err?.name,
        errorMessage: err?.message
      });
      setIsCapturing(false);
      isCapturingRef.current = false;
    }
  };

  // Subir imagen real desde la galería del dispositivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCapturingRef.current || isCapturing || isAnalyzing) return;
    const file = e.target.files?.[0];
    if (!file) return;
    isCapturingRef.current = true;
    setIsCapturing(true);

    console.log('[CAMERA_CAPTURE] Carga de imagen desde galería seleccionada', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      console.log('[CAMERA_IMAGE_READY] Imagen de galería cargada en Base64', {
        dataLength: dataUrl?.length
      });
      console.log('[SCAN] Escaneo iniciado (Galería)');
      console.log('[SCAN] Imagen recibida', { sizeBytes: dataUrl?.length });
      stopCurrentStream();

      if (onImageCaptured) {
        onImageCaptured(dataUrl);
        return;
      }

      setCapturedPreview(dataUrl);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        await processImageAnalysis(img, dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Procesar análisis visual botánico con el motor de IA
  const processImageAnalysis = async (
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    dataUrl: string
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const result = await classifyImage(source, dataUrl, 0.6, language);
      stopCurrentStream();
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err: any) {
      console.error('[GreenLens] Error al clasificar imagen:', err);
      setIsAnalyzing(false);
      setIsCapturing(false);
      setCapturedPreview(null);
      setErrorMessage(t('validation.cannotProcess') || 'Ha ocurrido un problema al analizar la imagen. Inténtalo de nuevo.');
    }
  };

  return (
    <div
      id="camera-scan-screen"
      className="fixed inset-0 z-50 bg-[#111415] flex flex-col justify-between overflow-hidden text-white select-none"
    >
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Barra superior del escáner */}
      <header className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          id="scanner-close-btn"
          onClick={() => {
            stopCurrentStream();
            onClose();
          }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          aria-label={t('scanner.close')}
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs text-white/90">
          <span className="w-2 h-2 rounded-full bg-[#2bb19e] animate-pulse"></span>
          <span className="font-medium">{t('scanner.smartVision')}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Linterna (disponible si el hardware lo soporta o visible como toggle) */}
          <button
            id="scanner-torch-btn"
            onClick={handleToggleTorch}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${
              torchOn ? 'bg-amber-400 text-black' : 'bg-black/40 text-white hover:bg-black/60'
            }`}
            aria-label={t('scanner.torch')}
            title={hasTorchSupport ? t('scanner.torch') : undefined}
          >
            <span className="material-symbols-outlined text-[20px]">
              {torchOn ? 'flash_on' : 'flash_off'}
            </span>
          </button>

          {/* Botón Girar Cámara */}
          <button
            id="scanner-flip-btn"
            onClick={handleFlipCamera}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            aria-label={t('scanner.flip')}
          >
            <span className="material-symbols-outlined text-[20px]">flip_camera_ios</span>
          </button>
        </div>
      </header>

      {/* Visor central de la cámara */}
      <main className="relative flex-1 flex items-center justify-center px-6">
        {/* Video en vivo siempre montado en el DOM para enlace de hardware fiable */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            capturedPreview || !isCameraActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />

        {/* Preview congelado al capturar */}
        {capturedPreview && (
          <img
            src={capturedPreview}
            alt="Captura botánica"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Tarjeta de fallback si la cámara no está accesible o se bloqueó */}
        {cameraError && !capturedPreview && (
          <div className="relative z-30 max-w-xs p-6 rounded-3xl bg-[#1c2224]/95 backdrop-blur-xl border border-[#283134] text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#006b5e]/20 text-[#2bb19e] flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[30px]">photo_camera</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">{t('scanner.notAvailable')}</h3>
            <p className="text-xs text-[#94a3a0] mb-5 leading-relaxed">{cameraError}</p>

            <div className="space-y-2.5">
              <button
                id="scanner-retry-camera-btn"
                onClick={() => startCamera(cameraFacing)}
                className="w-full py-3 px-4 rounded-2xl bg-[#006b5e] hover:bg-[#2bb19e] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                {t('scanner.retryCamera')}
              </button>

              <button
                id="scanner-fallback-gallery-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-2xl bg-[#242b2e] hover:bg-[#2b3336] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-[#333d41]"
              >
                <span className="material-symbols-outlined text-[18px]">photo_library</span>
                {t('scanner.uploadGallery')}
              </button>
            </div>
          </div>
        )}

        {/* Error durante análisis si ocurre */}
        {errorMessage && (
          <div className="absolute top-6 left-6 right-6 z-30 p-3.5 rounded-2xl bg-red-950/90 backdrop-blur-md border border-red-500/50 text-white text-xs text-center shadow-lg">
            {errorMessage}
          </div>
        )}

        {/* Marco de enfoque con esquinas botánicas */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-white/20 rounded-3xl overflow-hidden flex items-center justify-center pointer-events-none">
          {/* Esquinas destacadas */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#2bb19e] rounded-tl-2xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#2bb19e] rounded-tr-2xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#2bb19e] rounded-bl-2xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#2bb19e] rounded-br-2xl"></div>

          {/* Línea de escaneo láser animada */}
          {!cameraError && !capturedPreview && <div className="scan-line"></div>}

          {/* Estado de análisis */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-3 border-[#2bb19e] border-t-transparent animate-spin"></div>
              <span className="text-xs font-semibold tracking-wide text-white">
                {t('scanner.identifying')}
              </span>
            </div>
          )}
        </div>

        {/* Texto de ayuda debajo del visor */}
        {!isAnalyzing && !cameraError && (
          <div className="absolute bottom-4 left-0 right-0 text-center px-4">
            <span className="inline-block px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-medium text-white/90">
              {t('scanner.frameHelp')}
            </span>
          </div>
        )}
      </main>

      {/* Barra de Controles Inferior */}
      <footer className="relative z-20 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-4">
        <div className="flex items-center justify-around max-w-sm mx-auto w-full">
          {/* Botón Galería */}
          <button
            id="scanner-gallery-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCapturing || isAnalyzing}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-40"
            aria-label={t('scanner.uploadGallery')}
          >
            <span className="material-symbols-outlined text-[24px]">photo_library</span>
          </button>

          {/* Botón Disparador Central */}
          <button
            id="scanner-shutter-btn"
            onClick={handleCapture}
            disabled={isCapturing || isAnalyzing}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 active:scale-95 transition-transform disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Hacer foto"
          >
            <div className="w-full h-full rounded-full bg-white hover:bg-[#2bb19e] transition-colors flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[#006b5e] text-[28px]">
                center_focus_strong
              </span>
            </div>
          </button>

          {/* Botón Cerrar */}
          <button
            onClick={() => {
              stopCurrentStream();
              onClose();
            }}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label={t('scanner.cancel')}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
