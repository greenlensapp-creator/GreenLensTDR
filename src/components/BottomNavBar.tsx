import React from 'react';
import { ActiveTab } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
  onOpenScanner
}) => {
  const { t } = useTranslation();

  const tabs: Array<{ id: ActiveTab; label: string; icon: string }> = [
    { id: 'inicio', label: t('nav.home'), icon: 'home' },
    { id: 'cuidados', label: t('nav.care'), icon: 'yard' },
    { id: 'escanear', label: t('nav.scan'), icon: 'center_focus_strong' },
    { id: 'historial', label: t('nav.history'), icon: 'history' },
    { id: 'ajustes', label: t('nav.settings'), icon: 'settings' }
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#f8fafb]/90 backdrop-blur-xl border-t border-[#e1e3e4]/80 px-2 py-1.5 transition-all duration-300"
    >
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.id === 'escanear') {
            return (
              <div key={tab.id} className="relative -top-5 flex flex-col items-center">
                <button
                  id="nav-scan-fab-btn"
                  onClick={onOpenScanner}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#006b5e] to-[#2bb19e] text-white flex items-center justify-center shadow-lg shadow-[#006b5e]/30 hover:scale-105 active:scale-95 transition-all duration-200 ring-4 ring-[#f8fafb] dark:ring-[#1e2426]"
                  aria-label={t('topBar.scanAria')}
                >
                  <span className="material-symbols-outlined text-[28px]">
                    center_focus_strong
                  </span>
                </button>
                <span className="text-[11px] font-semibold text-[#006b5e] dark:text-[#2bb19e] mt-1">
                  {t('nav.scan')}
                </span>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-[#006b5e] dark:text-[#2bb19e] font-semibold'
                  : 'text-[#6d7a76] dark:text-[#94a3a0] hover:text-[#191c1d] dark:hover:text-[#f1f5f4]'
              }`}
            >
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#7ef7e2]/30 dark:bg-[#2bb19e]/20 text-[#006b5e] dark:text-[#2bb19e]' : ''
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[22px] ${
                    isActive ? 'font-bold fill' : ''
                  }`}
                >
                  {tab.icon}
                </span>
              </div>
              <span className="text-[11px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
