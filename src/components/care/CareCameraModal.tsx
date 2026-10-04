import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

interface CareCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string, file: File) => void;
  onFallbackToGallery?: () => void;
  title?: string;
}

export const CareCameraModal: React.FC<CareCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onFallbackToGallery,
  title
}) => {
  const { t } = useTranslation();
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // Ignore track stop errors
        }
      });
      streamRef.current = null;
    }
    setStream(null);
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  const startCamera = useCallback(
    async (facing: 'environment' | 'user') => {
      stopStream();
      setError(null);
      setIsInitializing(true);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setError(t('care.camera.errorDesc'));
        setIsInitializing(false);
        return;
      }

      try {
        let mediaStream: MediaStream | null = null;

        // 1. Try with ideal facingMode
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facing },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          });
        } catch (idealErr) {
          // 2. Fallback to basic facingMode
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: facing },
              audio: false
            });
          } catch (basicErr) {
            // 3. Fallback to any available video camera
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          }
        }

        if (mediaStream) {
          streamRef.current = mediaStream;
          setStream(mediaStream);

          // Check torch support
          try {
            const track = mediaStream.getVideoTracks()[0];
            const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
            if (capabilities && capabilities.torch) {
              setHasTorch(true);
            }
          } catch {
            setHasTorch(false);
          }

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            await videoRef.current.play().catch(() => {});
          }
        }
      } catch (err: any) {
        console.error('[CareCameraModal] Camera init error:', err);
        setError(t('care.camera.errorDesc'));
      } finally {
        setIsInitializing(false);
      }
    },
    [stopStream, t]
  );

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  // Flip camera between environment and user
  const handleToggleFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  // Toggle torch/flashlight
  const handleToggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('[CareCameraModal] Torch toggle error:', e);
    }
  };

  // Capture current frame
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Convert to File object
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `greenlens-care-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          stopStream();
          onCapture(dataUrl, file);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-3 sm:p-4"
    >
      <div className="relative w-full max-w-lg bg-[#121615] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[92vh]">
        {/* Top bar with title and action buttons */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-black/40 border-b border-white/10 z-10">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-emerald-400 text-xl">
              photo_camera
            </span>
            <span className="text-xs font-bold tracking-wide">
              {title || t('care.camera.title')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {hasTorch && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2 rounded-full transition-colors ${
                  torchOn ? 'bg-amber-400 text-black' : 'text-white/80 hover:bg-white/10'
                }`}
                title={t('scanner.torch')}
              >
                <span className="material-symbols-outlined text-lg">
                  {torchOn ? 'flashlight_on' : 'flashlight_off'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleFacing}
              className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors"
              title={t('care.camera.flip')}
            >
              <span className="material-symbols-outlined text-lg">flip_camera_ios</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors"
              title={t('care.camera.cancel')}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Video stream container */}
        <div className="relative flex-1 min-h-[320px] max-h-[65vh] bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            webkit-playsinline="true"
            muted
            autoPlay
            className="w-full h-full object-cover"
          />

          <canvas ref={canvasRef} className="hidden" />

          {/* Guide reticle */}
          {!error && !isInitializing && (
            <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-white/30 rounded-2xl flex items-center justify-center">
              <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
            </div>
          )}

          {/* Initializing Spinner */}
          {isInitializing && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 text-white">
              <span className="material-symbols-outlined text-3xl animate-spin text-emerald-400">
                progress_activity
              </span>
              <span className="text-xs font-semibold">{t('scanner.smartVision')}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="absolute inset-0 bg-black/85 p-6 flex flex-col items-center justify-center text-center gap-3 z-20">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">no_photography</span>
              </div>
              <p className="text-sm font-bold text-white">{t('care.camera.error')}</p>
              <p className="text-xs text-white/70 max-w-xs leading-relaxed">{error}</p>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  <span>{t('care.camera.retry')}</span>
                </button>
                {onFallbackToGallery && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFallbackToGallery();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">photo_library</span>
                    <span>{t('care.camera.useGalleryInstead')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom capture button bar */}
        <div className="px-6 py-4 bg-black/60 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors"
          >
            {t('care.camera.cancel')}
          </button>

          {/* Shutter button */}
          <button
            type="button"
            onClick={handleCapture}
            disabled={isInitializing || !!error}
            aria-label={t('care.camera.captureAria')}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-white text-2xl">
              photo_camera
            </span>
          </button>

          {onFallbackToGallery ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onFallbackToGallery();
              }}
              className="px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors inline-flex items-center gap-1"
              title={t('care.camera.useGalleryInstead')}
            >
              <span className="material-symbols-outlined text-base">photo_library</span>
              <span className="hidden sm:inline">{t('health.galleryBtn')}</span>
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </div>
    </div>
  );
};
