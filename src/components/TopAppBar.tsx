import React from 'react';

interface TopAppBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  isTransparent?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title = 'GreenLens',
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  isTransparent = false
}) => {
  return (
    <header
      id="top-app-bar"
      className={`sticky top-0 z-30 transition-colors duration-200 ${
        isTransparent
          ? 'bg-transparent text-white'
          : 'bg-[#f8fafb]/90 dark:bg-[#0b0e0f]/90 backdrop-blur-md text-[#191c1d] dark:text-[#f1f5f4] border-b border-[#e1e3e4]/60 dark:border-[#1f2628]'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              id="top-bar-back-btn"
              onClick={onBack}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isTransparent
                  ? 'bg-black/30 hover:bg-black/50 text-white'
                  : 'hover:bg-[#eceeef] dark:hover:bg-[#1c2224] text-[#191c1d] dark:text-[#f1f5f4]'
              }`}
              aria-label="Volver"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {!showBack && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#006b5e] to-[#2bb19e] flex items-center justify-center text-white shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">psychiatry</span>
                </div>
              )}
              <h1 className="text-lg font-bold tracking-tight text-[#191c1d] dark:text-[#f1f5f4]">{title}</h1>
            </div>
            {subtitle && (
              <span
                className={`text-xs ${
                  isTransparent ? 'text-white/80' : 'text-[#3d4946] dark:text-[#94a3a0]'
                }`}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {rightAction && <div className="flex items-center gap-2">{rightAction}</div>}
      </div>
    </header>
  );
};
