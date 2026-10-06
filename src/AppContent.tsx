import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, ClassificationResult, PlantInfo, ScanHistoryItem, AppSettings } from './types';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { HomeView } from './components/HomeView';
import { CuidadosView } from './components/CuidadosView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { CameraScanView } from './components/CameraScanView';
import { ScanAnalysisLoadingView } from './components/ScanAnalysisLoadingView';
import { NotAPlantView } from './components/NotAPlantView';
import { ResultView } from './components/ResultView';
import { PlantDetailModal } from './components/PlantDetailModal';
import { EditProfileModal } from './components/EditProfileModal';
import { AuthScreen } from './components/AuthScreen';
import { WelcomeView } from './components/WelcomeView';
import { ProfilePhotoSetupView } from './components/ProfilePhotoSetupView';
import { useAuth } from './services/AuthContext';
import { useTranslation } from './i18n/LanguageContext';
import {
  getScanHistory,
  getAppSettings,
  saveAppSettings,
  addScanToHistory,
  deleteScan,
  clearHistory,
  toggleFavorite,
  safeSaveHistory
} from './services/storageService';
import {
  fetchUserScans,
  syncAddScan,
  syncDeleteScan,
  syncClearAllUserScans,
  syncToggleFavorite
} from './services/firestoreSync';

interface ActiveResultState {
  result: ClassificationResult;
  scanId: string;
  isFavorite: boolean;
  isNewScan: boolean;
}

export default function AppContent() {
  const {
    currentUser,
    userProfile,
    updateUserData,
    signOut,
    loading,
    clearNewUserSignup
  } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);
  const [notAPlantState, setNotAPlantState] = useState<{
    image: string | null;
    title?: string;
    message?: string;
  } | null>(null);
  const [currentResult, setCurrentResult] = useState<ActiveResultState | null>(null);
  const [selectedPlantModal, setSelectedPlantModal] = useState<PlantInfo | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [authNotification, setAuthNotification] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);

  // Estados persistentes
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());

  // Sincronizar showWelcome con el estado en Firestore del usuario autenticado
  useEffect(() => {
    if (currentUser && userProfile) {
      if (userProfile.welcomeCompleted === true) {
        setShowWelcome(false);
      }
    }
  }, [currentUser, userProfile?.welcomeCompleted]);

  // Carga inicial y recarga al cambiar de usuario autenticado
  useEffect(() => {
    async function loadData() {
      if (currentUser) {
        const cloudScans = await fetchUserScans();
        setHistory(cloudScans);
        safeSaveHistory(cloudScans);
      } else {
        setHistory(getScanHistory());
      }
    }
    loadData();
    setSettings(getAppSettings());
  }, [currentUser]);

  // Manejador cuando la cámara o galería captura la foto (con prevención de duplicados)
  const handleImageCaptured = useCallback((dataUrl: string) => {
    setCurrentResult(null);
    setNotAPlantState(null);
    setIsScannerOpen(false);
    setAnalyzingImage(dataUrl);
  }, []);

  // Manejador cuando la identificación botánica finaliza con éxito
  const handleAnalysisSuccess = useCallback((result: ClassificationResult) => {
    const isPlant =
      result.details?.isPlant !== false &&
      (result.topPrediction?.percentage ?? 0) > 0 &&
      !/no parece ser una planta|no es una planta|objeto no bot|does not appear to be a plant|not a plant|no sembla ser una planta|no se ha identificado|no s'ha identificat|no plant identified|لم يتم/i.test(result.details?.name || '');

    if (!isPlant) {
      setAnalyzingImage(null);
      setCurrentResult(null);
      setNotAPlantState({
        image: result.capturedImage || null,
        title: result.details?.name && !/no parece ser una planta|does not appear to be a plant|no sembla ser una planta|no se ha identificado|no s'ha identificat|no plant identified|لم يتم/i.test(result.details.name) ? result.details.name : undefined,
        message: result.details?.identificationMessage || result.details?.description
      });
      return;
    }

    const saved = addScanToHistory({
      name: result.details.name,
      scientificName: result.details.scientificName,
      confidence: result.topPrediction.percentage,
      timestamp: new Date().toISOString(),
      image: result.capturedImage || result.details.imageUrl,
      category: result.details.category,
      isFavorite: false,
      allPredictions: result.allPredictions,
      details: result.details
    });

    if (currentUser) {
      syncAddScan(saved).catch((err) => {
        console.warn('[GreenLens] Sincronización diferida en segundo plano con Firestore:', err);
      });
    }

    setHistory((prev) => [saved, ...prev.filter((p) => String(p.id) !== String(saved.id))]);

    setCurrentResult({
      result,
      scanId: saved.id,
      isFavorite: false,
      isNewScan: true
    });
    setAnalyzingImage(null);
    setNotAPlantState(null);
  }, [currentUser]);

  // Manejadores de historial
  const handleToggleFavorite = async (id: string) => {
    if (!id) return;
    const item = history.find((h) => String(h.id) === String(id));
    const newFavState = !item?.isFavorite;

    // 1. Actualizar estado React
    setHistory((prev) =>
      prev.map((h) => (String(h.id) === String(id) ? { ...h, isFavorite: newFavState } : h))
    );

    // 2. Actualizar almacenamiento local
    toggleFavorite(id);

    // 3. Sincronizar con Firestore si está autenticado
    if (currentUser) {
      await syncToggleFavorite(id, newFavState);
    }
  };

  const handleDeleteScan = async (id: string) => {
    if (!id) return;

    // 1. Eliminar estrictamente SOLO el elemento seleccionado mediante su ID
    setHistory((prev) => prev.filter((item) => String(item.id) !== String(id)));

    // 2. Eliminar del almacenamiento local
    deleteScan(id);

    // 3. Eliminar de Firestore si está autenticado
    if (currentUser) {
      try {
        await syncDeleteScan(id);
      } catch (err) {
        console.error('Error eliminando escaneo de Firestore:', err);
      }
    }
  };

  const handleClearHistory = async () => {
    // 1. Vaciar todo el historial del estado React
    setHistory([]);

    // 2. Vaciar almacenamiento local
    clearHistory();

    // 3. Vaciar Firestore si está autenticado
    if (currentUser) {
      try {
        await syncClearAllUserScans();
      } catch (err) {
        console.error('Error al limpiar historial remoto:', err);
      }
    }
  };

  // Abrir resultado desde el escaneo o desde el historial sin duplicar
  const handleSelectHistoryItem = (item: ScanHistoryItem) => {
    if (item.details) {
      setCurrentResult({
        result: {
          topPrediction: {
            className: item.name,
            probability: item.confidence / 100,
            percentage: item.confidence
          },
          allPredictions: item.allPredictions || [
            { className: item.name, probability: item.confidence / 100, percentage: item.confidence }
          ],
          isConfident: item.confidence >= (settings.confidenceThreshold || 0.6) * 100,
          threshold: settings.confidenceThreshold || 0.6,
          capturedImage: item.image,
          timestamp: item.timestamp,
          details: item.details
        },
        scanId: item.id,
        isFavorite: !!item.isFavorite,
        isNewScan: false
      });
    } else {
      setSelectedPlantModal({
        id: item.id,
        name: item.name,
        scientificName: item.scientificName,
        category: item.category,
        tags: [item.category],
        family: 'Desconocida',
        origin: 'Registro previo',
        size: 'Estándar',
        location: 'Historial',
        care: {
          light: { title: 'Luz', desc: 'Información guardada en registro.' },
          watering: { title: 'Riego', desc: 'Consultar ficha técnica.' },
          temperature: { title: 'Temperatura', desc: 'Condición ambiental templada.' }
        },
        description: `Registro guardado el ${item.formattedDate}.`,
        imageUrl: item.image
      });
    }
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = saveAppSettings(newSettings);
    setSettings(updated);
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Pantalla de carga mientras Firebase verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafb] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-[#006b5e]/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[#006b5e] text-3xl animate-spin">
            psychiatry
          </span>
        </div>
        <p className="text-sm font-semibold text-[#191c1d]">{t('auth.checkingSession')}</p>
      </div>
    );
  }

  // Si no está autenticado, renderizar la pantalla obligatoria de autenticación (sin modo invitado)
  if (!currentUser) {
    return <AuthScreen notificationMessage={authNotification} />;
  }

  // 1. Configuración de perfil obligatoria (nombre y fecha de nacimiento requeridos)
  const isProfileComplete = Boolean(
    userProfile.profileCompleted && userProfile.firstName && userProfile.birthDate
  );

  if (!isProfileComplete) {
    return (
      <ProfilePhotoSetupView
        user={userProfile}
        onComplete={() => {
          clearNewUserSignup();
        }}
      />
    );
  }

  // 2. Tutorial / Bienvenida obligatorio de 5 pasos:
  // Se muestra si el usuario no ha completado el onboarding O si lo abrió voluntariamente desde Ajustes (showWelcome)
  if (!userProfile.onboardingCompleted || showWelcome) {
    return (
      <WelcomeView
        onStart={async () => {
          setShowWelcome(false);
          await updateUserData({
            onboardingCompleted: true,
            welcomeCompleted: true
          });
        }}
      />
    );
  }

  // 1. Estado LOADING: Pantalla de carga especializada del escaneo principal de GreenLens.
  if (analyzingImage) {
    return (
      <ScanAnalysisLoadingView
        image={analyzingImage}
        onSuccess={handleAnalysisSuccess}
        onRetake={() => {
          setAnalyzingImage(null);
          setIsScannerOpen(true);
        }}
        onCancel={() => {
          setAnalyzingImage(null);
        }}
      />
    );
  }

  // 2. Estado NOT_A_PLANT: Pantalla específica limpia cuando el objeto no es botánico
  if (notAPlantState) {
    return (
      <NotAPlantView
        image={notAPlantState.image}
        title={notAPlantState.title}
        message={notAPlantState.message}
        onRetry={() => {
          setNotAPlantState(null);
          setIsScannerOpen(true);
        }}
        onBack={() => {
          setNotAPlantState(null);
        }}
      />
    );
  }

  // 3. Estado PLANT_DETECTED: Ficha botánica completa de planta identificada
  if (currentResult) {
    return (
      <ResultView
        result={currentResult.result}
        scanId={currentResult.scanId}
        isFavorite={currentResult.isFavorite}
        isNewScan={currentResult.isNewScan}
        onToggleFavorite={() => {
          setHistory(getScanHistory());
        }}
        onBack={() => setCurrentResult(null)}
        onRescan={() => {
          setCurrentResult(null);
          setAnalyzingImage(null);
          setIsScannerOpen(true);
        }}
        onNavigateToCare={() => {
          setCurrentResult(null);
          setActiveTab('cuidados');
        }}
      />
    );
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'inicio':
        return 'GreenLens';
      case 'cuidados':
        return t('nav.care');
      case 'historial':
        return t('nav.history');
      case 'ajustes':
        return t('nav.settings');
      default:
        return 'GreenLens';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] text-[#191c1d] flex flex-col selection:bg-[#2bb19e] selection:text-[#003d35]">
      {/* Barra de Navegación Superior */}
      <TopAppBar
        title={getTabTitle()}
        rightAction={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ajustes')}
              className="w-8 h-8 rounded-full ring-2 ring-[#006b5e]/20 overflow-hidden flex items-center justify-center bg-[#006b5e]/10"
              aria-label={t('nav.settings')}
            >
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.firstName || 'Usuario'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#006b5e]">
                  {userProfile.firstName ? userProfile.firstName.charAt(0).toUpperCase() : 'E'}
                </span>
              )}
            </button>

            <button
              id="top-bar-scanner-btn"
              onClick={() => setIsScannerOpen(true)}
              className="w-10 h-10 rounded-full bg-[#006b5e] text-white hover:bg-[#005247] flex items-center justify-center transition-colors shadow-sm"
              aria-label={t('nav.scan')}
            >
              <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
            </button>
          </div>
        }
      />

      {/* Contenedor Principal de Vistas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-4">
        {activeTab === 'inicio' && (
          <HomeView
            user={userProfile}
            recentScans={history}
            onStartScan={() => setIsScannerOpen(true)}
            onSelectScan={handleSelectHistoryItem}
            onSelectPlant={(plant) => setSelectedPlantModal(plant)}
            onNavigateToCare={() => setActiveTab('cuidados')}
            onNavigateToHistory={() => setActiveTab('historial')}
          />
        )}

        {activeTab === 'cuidados' && (
          <CuidadosView
            recentScans={history}
          />
        )}

        {activeTab === 'historial' && (
          <HistoryView
            history={history}
            onSelectScan={handleSelectHistoryItem}
            onToggleFavorite={handleToggleFavorite}
            onDeleteScan={handleDeleteScan}
            onClearHistory={handleClearHistory}
            onStartScan={() => setIsScannerOpen(true)}
          />
        )}

        {activeTab === 'ajustes' && (
          <SettingsView
            user={userProfile}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onEditProfile={() => setIsEditProfileOpen(true)}
            onLogout={handleLogout}
            onOpenWelcome={() => setShowWelcome(true)}
            onAccountDeleted={() => {
              setAuthNotification(t('settings.accountDeletedSuccess'));
            }}
          />
        )}
      </main>

      {/* Barra de Navegación Inferior Fija */}
      <BottomNavBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (analyzingImage) return;
          setCurrentResult(null);
          setNotAPlantState(null);
          if (tab === 'escanear') {
            setIsScannerOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenScanner={() => {
          if (analyzingImage) return;
          setCurrentResult(null);
          setNotAPlantState(null);
          setIsScannerOpen(true);
        }}
      />

      {/* Overlay de la Cámara en Vivo / Escáner */}
      {isScannerOpen && (
        <CameraScanView
          onClose={() => setIsScannerOpen(false)}
          onImageCaptured={handleImageCaptured}
          onAnalysisComplete={handleAnalysisSuccess}
        />
      )}

      {/* Modal de Ficha Detallada de Planta u Objeto */}
      {selectedPlantModal && (
        <PlantDetailModal
          plant={selectedPlantModal}
          onClose={() => setSelectedPlantModal(null)}
          onScanSimilar={() => setIsScannerOpen(true)}
        />
      )}

      {/* Modal de Edición de Perfil */}
      {isEditProfileOpen && (
        <EditProfileModal
          user={userProfile}
          onSave={updateUserData}
          onClose={() => setIsEditProfileOpen(false)}
        />
      )}
    </div>
  );
}
