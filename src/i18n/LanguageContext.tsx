import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LanguageCode } from '../types';
import { translations, TranslationKey } from './translations';
import { getAppSettings, saveAppSettings } from '../services/storageService';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const savedSettings = getAppSettings();
      if (savedSettings?.language && ['es', 'ca', 'en', 'ar'].includes(savedSettings.language)) {
        return savedSettings.language;
      }
    } catch (e) {
      // Fallback
    }
    return 'es';
  });

  // Aplicar atributos HTML de dirección e idioma
  useEffect(() => {
    const isRtl = language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((newLang: LanguageCode) => {
    setLanguageState(newLang);
    saveAppSettings({ language: newLang });
    const isRtl = newLang === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const langDict = translations[language] || translations.es;
      let text: string =
        (langDict as any)?.[key] ||
        (translations.es as any)?.[key] ||
        (translations.en as any)?.[key];

      // Si la clave no existiera por cualquier motivo, garantizar NUNCA mostrar la clave técnica
      if (!text || text === key) {
        const parts = String(key).split('.');
        const lastPart = parts[parts.length - 1];
        // Humanizar el fragmento separando camelCase
        text = lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
      }

      if (params) {
        Object.entries(params).forEach(([paramKey, val]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
        });
      }

      return text || '';
    },
    [language]
  );

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
