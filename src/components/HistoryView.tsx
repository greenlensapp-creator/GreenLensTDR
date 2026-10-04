import React, { useState } from 'react';
import { ScanHistoryItem } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { formatScanDate } from '../services/dateUtils';
import {
  getLocalizedCategory,
  getLocalizedSpeciesName,
  getLocalizedScientificName
} from '../services/speciesLocalization';

interface HistoryViewProps {
  history: ScanHistoryItem[];
  onSelectScan: (item: ScanHistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteScan: (id: string) => void;
  onClearHistory: () => Promise<void> | void;
  onStartScan: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectScan,
  onToggleFavorite,
  onDeleteScan,
  onClearHistory,
  onStartScan
}) => {
  const { t, language } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);

  const localizeCategory = (category?: string) => {
    return getLocalizedCategory(category || '', t);
  };

  const filteredHistory = history.filter((item) => {
    if (!item) return false;
    if (filter === 'favorites' && !item.isFavorite) return false;

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const rawName = (item.name || '').toLowerCase();
      const rawSci = (item.scientificName || '').toLowerCase();
      const rawCat = (item.category || '').toLowerCase();
      const localizedCategory = (localizeCategory(item.category) || '').toLowerCase();
      const localizedName = (getLocalizedSpeciesName(item.name || '', t, language) || '').toLowerCase();
      const localizedSci = (getLocalizedScientificName(item.scientificName || '', language) || '').toLowerCase();
      return (
        rawName.includes(q) ||
        localizedName.includes(q) ||
        rawSci.includes(q) ||
        localizedSci.includes(q) ||
        rawCat.includes(q) ||
        localizedCategory.includes(q)
      );
    }
    return true;
  });

  const handleConfirmClear = async () => {
    setIsDeletingAll(true);
    try {
      await onClearHistory();
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Error al vaciar historial:', err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div id="history-view" className="space-y-5 pb-28">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#191c1d] tracking-tight">{t('history.title')}</h2>
          <p className="text-xs text-[#6d7a76]">
            {t('history.subtitle')}
          </p>
        </div>

        {history.length > 0 && (
          <button
            id="history-clear-all-btn"
            onClick={() => setShowConfirmModal(true)}
            className="p-2 px-3 rounded-xl text-red-600 bg-red-50/70 hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1.5"
            title={t('history.clear')}
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            <span>{t('history.clear')}</span>
          </button>
        )}
      </div>

      {/* Modal de confirmación estilizado para borrar todo el historial */}
      {showConfirmModal && (
        <div
          id="clear-history-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingAll) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div
            id="clear-history-modal-content"
            className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#e1e3e4] shadow-2xl space-y-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-[#191c1d]">
                {t('history.clearConfirm')}
              </h3>
              <p className="text-xs text-[#6d7a76] leading-relaxed">
                {t('history.clearWarning')}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                id="cancel-clear-history-btn"
                type="button"
                disabled={isDeletingAll}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-[#e1e3e4] bg-[#f8faf9] hover:bg-[#eceeef] text-[#3d4946] text-xs font-bold transition-colors disabled:opacity-50"
              >
                {t('history.cancel')}
              </button>

              <button
                id="confirm-clear-history-btn"
                type="button"
                disabled={isDeletingAll}
                onClick={handleConfirmClear}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingAll ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('history.deleting')}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>{t('history.confirmDeleteAll')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda */}
      {history.length > 0 && (
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6d7a76] text-[20px]">
            search
          </span>
          <input
            id="history-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('history.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#e1e3e4] text-xs text-[#191c1d] focus:outline-none focus:border-[#006b5e] ambient-shadow placeholder-[#6d7a76]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6d7a76] hover:text-[#191c1d]"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>
      )}

      {/* Píldoras de Filtro */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === 'all'
              ? 'bg-[#006b5e] text-white shadow-sm'
              : 'bg-white text-[#3d4946] border border-[#e1e3e4] hover:bg-[#f2f4f5]'
          }`}
        >
          {t('history.filterAll', { count: history.length })}
        </button>

        <button
          onClick={() => setFilter('favorites')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
            filter === 'favorites'
              ? 'bg-[#006b5e] text-white shadow-sm'
              : 'bg-white text-[#3d4946] border border-[#e1e3e4] hover:bg-[#f2f4f5]'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">star</span>
          {t('history.filterFavorites', { count: history.filter((i) => i.isFavorite).length })}
        </button>
      </div>

      {/* Lista de Registros */}
      {filteredHistory.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white border border-[#e1e3e4] text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#006b5e] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[30px]">history</span>
          </div>
          <h3 className="text-sm font-bold text-[#191c1d]">
            {history.length === 0
              ? t('history.emptyTitle')
              : t('history.emptyFilteredTitle')}
          </h3>
          <p className="text-xs text-[#6d7a76] max-w-xs mx-auto leading-relaxed">
            {history.length === 0
              ? t('history.emptyDesc')
              : t('history.emptyFilteredDesc')}
          </p>
          {history.length === 0 && (
            <button
              onClick={onStartScan}
              className="py-2.5 px-4 rounded-xl bg-[#006b5e] text-white text-xs font-bold hover:bg-[#005247] transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              {t('history.startScan')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-white border border-[#e1e3e4] ambient-shadow flex items-center justify-between gap-3 hover:border-[#006b5e]/40 transition-all"
            >
              <div
                onClick={() => onSelectScan(item)}
                className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center text-[#006b5e] shrink-0">
                    <span className="material-symbols-outlined text-[24px]">yard</span>
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-[#006b5e] tracking-wider block">
                    {localizeCategory(item.category)}
                  </span>
                  <h3 className="text-xs font-bold text-[#191c1d] truncate mt-0.5">
                    {getLocalizedSpeciesName(item.name, t, language)}
                  </h3>
                  <p className="text-[10px] text-[#6d7a76] italic truncate">
                    {getLocalizedScientificName(item.scientificName, language)}
                  </p>
                  <span className="text-[9px] text-[#6d7a76]/80 mt-0.5 block">
                    {formatScanDate(item.timestamp, language)}
                  </span>
                </div>
              </div>

              {/* Acciones y Precisión */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-extrabold px-2 py-1 rounded-lg ${
                    item.confidence >= 80
                      ? 'bg-emerald-50 text-[#006b5e]'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {item.confidence}%
                </span>

                <button
                  onClick={() => onToggleFavorite(item.id)}
                  className="p-2 rounded-xl text-[#6d7a76] hover:text-amber-500 hover:bg-amber-50 transition-colors"
                  aria-label={item.isFavorite ? t('history.favoriteRemoved') : t('history.favoriteAdded')}
                  title={item.isFavorite ? t('history.favoriteRemoved') : t('history.favoriteAdded')}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      item.isFavorite ? 'fill text-amber-500' : ''
                    }`}
                  >
                    {item.isFavorite ? 'star' : 'star_border'}
                  </span>
                </button>

                <button
                  onClick={() => onDeleteScan(item.id)}
                  className="p-2 rounded-xl text-[#6d7a76] hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label={t('history.delete')}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
