import React from 'react';
import { LanguageCode } from '../types';

interface LanguageFlagProps {
  code: LanguageCode;
  className?: string;
}

export const LanguageFlag: React.FC<LanguageFlagProps> = ({ code, className = 'w-5 h-3.5' }) => {
  const containerClass = `inline-block overflow-hidden rounded-[2px] border border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.1)] align-middle shrink-0 ${className}`;

  if (code === 'ca') {
    // Senyera de Catalunya
    return (
      <span className={containerClass} title="Català" aria-label="Senyera de Catalunya">
        <svg viewBox="0 0 900 600" className="w-full h-full block" preserveAspectRatio="none">
          <rect width="900" height="600" fill="#FDD216" />
          <rect y="66.66" width="900" height="66.66" fill="#DA121A" />
          <rect y="200" width="900" height="66.66" fill="#DA121A" />
          <rect y="333.33" width="900" height="66.66" fill="#DA121A" />
          <rect y="466.66" width="900" height="66.66" fill="#DA121A" />
        </svg>
      </span>
    );
  }

  if (code === 'es') {
    // Bandera de España
    return (
      <span className={containerClass} title="Español" aria-label="Bandera de España">
        <svg viewBox="0 0 900 600" className="w-full h-full block" preserveAspectRatio="none">
          <rect width="900" height="150" fill="#AA151B" />
          <rect y="150" width="900" height="300" fill="#F1BF00" />
          <rect y="450" width="900" height="150" fill="#AA151B" />
          {/* Sencillo escudo estilizado de España */}
          <g transform="translate(240, 240) scale(0.6)">
            <rect x="0" y="0" width="80" height="100" rx="20" fill="#AA151B" stroke="#800" strokeWidth="4" />
            <rect x="15" y="15" width="50" height="70" rx="10" fill="#F1BF00" />
            <circle cx="40" cy="50" r="14" fill="#00529C" />
          </g>
        </svg>
      </span>
    );
  }

  if (code === 'en') {
    // Union Flag (Reino Unido)
    return (
      <span className={containerClass} title="English" aria-label="Flag of the United Kingdom">
        <svg viewBox="0 0 60 30" className="w-full h-full block" preserveAspectRatio="none">
          <clipPath id="s">
            <path d="M0,0 v30 h60 v-30 z"/>
          </clipPath>
          <clipPath id="t">
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
          </clipPath>
          <g clipPath="url(#s)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
          </g>
        </svg>
      </span>
    );
  }

  // code === 'ar'
  // Bandera de la Liga Árabe / Árabe tradicional
  return (
    <span className={containerClass} title="العربية" aria-label="العلم العربي">
      <svg viewBox="0 0 900 600" className="w-full h-full block" preserveAspectRatio="none">
        {/* Franjas panárabes reconocibles: negro, blanco, verde y triángulo rojo */}
        <rect width="900" height="200" fill="#000000" />
        <rect y="200" width="900" height="200" fill="#FFFFFF" />
        <rect y="400" width="900" height="200" fill="#007A3D" />
        <polygon points="0,0 360,300 0,600" fill="#CE1126" />
      </svg>
    </span>
  );
};
