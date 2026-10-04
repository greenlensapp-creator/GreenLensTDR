import React from 'react';
import { UserProfile, ScanHistoryItem, PlantInfo } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { formatScanDate } from '../services/dateUtils';
import {
  getLocalizedCategory,
  getLocalizedSpeciesName,
  getLocalizedScientificName
} from '../services/speciesLocalization';

interface HomeViewProps {
  user: UserProfile;
  recentScans: ScanHistoryItem[];
  onStartScan: () => void;
  onSelectScan: (item: ScanHistoryItem) => void;
  onSelectPlant: (plant: PlantInfo) => void;
  onNavigateToHistory: () => void;
  onNavigateToCare: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  recentScans,
  onStartScan,
  onSelectScan,
  onSelectPlant,
  onNavigateToHistory,
  onNavigateToCare
}) => {
  const { t, language } = useTranslation();

  // Estadísticas reales basadas exclusivamente en los datos del usuario
  const totalScans = recentScans.length;
  const totalFavorites = recentScans.filter((s) => s.isFavorite).length;
  const averageConfidence =
    totalScans > 0
      ? Math.round(recentScans.reduce((acc, curr) => acc + curr.confidence, 0) / totalScans)
      : 0;

  // Especies únicas identificadas en el historial del usuario
  const identifiedSpeciesMap = new Map<string, PlantInfo>();
  recentScans.forEach((scan) => {
    if (scan.details && !identifiedSpeciesMap.has(scan.details.name)) {
      identifiedSpeciesMap.set(scan.details.name, scan.details);
    }
  });
  const identifiedSpecies = Array.from(identifiedSpeciesMap.values());

  return (
    <div id="home-view" className="space-y-6 pb-28">
      {/* Header con Saludo y Perfil */}
      <header className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#006b5e]">
            {t('home.subtitle')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1d] tracking-tight">
            {t('home.greeting', { name: user.firstName || 'Explorador' })}
          </h1>
        </div>

        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.firstName || 'Usuario'}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#006b5e]/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#006b5e]/10 text-[#006b5e] flex items-center justify-center font-bold text-base ring-2 ring-[#006b5e]/20">
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'E'}
            </div>
          )}
          {user.isLoggedIn && (
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"
              title="Cuenta sincronizada"
            ></span>
          )}
        </div>
      </header>

      {/* Banner Principal de Escaneo (Hero Card) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#006b5e] via-[#005247] to-[#003d35] p-6 text-white shadow-lg">
        {/* Elemento decorativo de fondo */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-[#7ef7e2]/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-sm space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-[#7ef7e2]">
            <span className="material-symbols-outlined text-[16px]">center_focus_strong</span>
            <span>{t('home.heroBadge')}</span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black leading-tight">
              {t('home.heroTitle')}
            </h2>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              {t('home.heroDesc')}
            </p>
          </div>

          <button
            id="home-hero-scan-btn"
            onClick={onStartScan}
            className="py-3.5 px-5 rounded-2xl bg-white text-[#006b5e] hover:bg-[#7ef7e2] active:scale-[0.98] transition-all font-bold text-xs flex items-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
            <span>{t('home.startScan')}</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas Reales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow text-center">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#006b5e] flex items-center justify-center mx-auto mb-1.5">
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          </div>
          <span className="text-lg font-black text-[#191c1d] block leading-tight">{totalScans}</span>
          <span className="text-[10px] text-[#6d7a76] font-medium">{t('home.statsScans')}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow text-center">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1.5">
            <span className="material-symbols-outlined text-[18px]">star</span>
          </div>
          <span className="text-lg font-black text-[#191c1d] block leading-tight">{totalFavorites}</span>
          <span className="text-[10px] text-[#6d7a76] font-medium">{t('home.statsFavorites')}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <span className="text-lg font-black text-[#191c1d] block leading-tight">
            {averageConfidence > 0 ? `${averageConfidence}%` : '--'}
          </span>
          <span className="text-[10px] text-[#6d7a76] font-medium">{t('home.statsAccuracy')}</span>
        </div>
      </div>

      {/* Sección: Escaneos Recientes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#191c1d] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#006b5e] text-[20px]">history</span>
            {t('home.recentScans')}
          </h2>
          {recentScans.length > 0 && (
            <button
              id="home-view-all-history-btn"
              onClick={onNavigateToHistory}
              className="text-xs font-bold text-[#006b5e] hover:underline flex items-center gap-0.5"
            >
              {t('home.viewAll', { count: recentScans.length })}
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          )}
        </div>

        {recentScans.length === 0 ? (
          /* Estado vacío real */
          <div className="p-6 rounded-2xl bg-white border border-[#e1e3e4] text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-[#006b5e] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">psychiatry</span>
            </div>
            <h3 className="text-xs font-bold text-[#191c1d]">{t('home.emptyTitle')}</h3>
            <p className="text-[11px] text-[#6d7a76] max-w-xs mx-auto">
              {t('home.emptyDesc')}
            </p>
            <button
              onClick={onStartScan}
              className="mt-2 py-2 px-4 rounded-xl bg-[#006b5e] text-white text-xs font-bold hover:bg-[#005247] transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              {t('home.emptyAction')}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentScans.slice(0, 4).map((scan) => (
              <div
                key={scan.id}
                onClick={() => onSelectScan(scan)}
                className="p-3 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow flex items-center justify-between cursor-pointer hover:border-[#006b5e]/40 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  {scan.image ? (
                    <img
                      src={scan.image}
                      alt={scan.name}
                      className="w-12 h-12 rounded-xl object-cover bg-neutral-100 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center text-[#006b5e] shrink-0">
                      <span className="material-symbols-outlined text-[20px]">yard</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-[#191c1d] line-clamp-1">
                      {getLocalizedSpeciesName(scan.name, t, language)}
                    </h3>
                    <p className="text-[10px] text-[#6d7a76] italic line-clamp-1">
                      {getLocalizedScientificName(scan.scientificName, language)}
                    </p>
                    <span className="text-[9px] text-[#6d7a76]/80">
                      {formatScanDate(scan.timestamp, language)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                      scan.confidence >= 80
                        ? 'bg-emerald-50 text-[#006b5e]'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {scan.confidence}%
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#6d7a76]">
                    chevron_right
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección: Especies Desbloqueadas por el Usuario */}
      {identifiedSpecies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#191c1d] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006b5e] text-[20px]">local_florist</span>
              {t('home.identifiedSpecies', { count: identifiedSpecies.length })}
            </h2>
            <button
              onClick={onNavigateToCare}
              className="text-xs font-bold text-[#006b5e] hover:underline flex items-center gap-0.5"
            >
              {t('nav.care')}
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {identifiedSpecies.slice(0, 4).map((plant, idx) => (
              <div
                key={idx}
                onClick={() => onSelectPlant(plant)}
                className="rounded-2xl bg-white border border-[#e1e3e4] overflow-hidden ambient-shadow cursor-pointer hover:border-[#006b5e]/40 transition-all active:scale-[0.98]"
              >
                <div className="h-28 bg-neutral-100 overflow-hidden relative">
                  {plant.imageUrl ? (
                    <img
                      src={plant.imageUrl}
                      alt={plant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-teal-50 text-[#006b5e]">
                      <span className="material-symbols-outlined text-[32px]">psychiatry</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] font-bold text-white uppercase">
                    {getLocalizedCategory(plant.category, t)}
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="text-xs font-bold text-[#191c1d] line-clamp-1">
                    {getLocalizedSpeciesName(plant.name, t, language)}
                  </h3>
                  <p className="text-[10px] text-[#6d7a76] italic line-clamp-1">
                    {getLocalizedScientificName(plant.scientificName, language)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
