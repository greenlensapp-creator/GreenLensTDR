import React from 'react';
import { CareToolType, ScanHistoryItem } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface CuidadosHubViewProps {
  onSelectTool: (tool: CareToolType) => void;
  recentScans: ScanHistoryItem[];
}

export const CuidadosHubView: React.FC<CuidadosHubViewProps> = ({
  onSelectTool,
  recentScans
}) => {
  const { t } = useTranslation();

  const tools: Array<{
    id: CareToolType;
    icon: string;
    titleKey: string;
    descKey: string;
    color: string;
    bgColor: string;
    borderColor: string;
    badgeKey?: string;
  }> = [
    {
      id: 'light_meter',
      icon: 'wb_sunny',
      titleKey: 'care.tool.light.title',
      descKey: 'care.tool.light.desc',
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-200/60'
    },
    {
      id: 'watering_calc',
      icon: 'water_drop',
      titleKey: 'care.tool.watering.title',
      descKey: 'care.tool.watering.desc',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-200/60'
    },
    {
      id: 'ideal_conditions',
      icon: 'thermostat',
      titleKey: 'care.tool.conditions.title',
      descKey: 'care.tool.conditions.desc',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-200/60'
    },
    {
      id: 'care_guide',
      icon: 'menu_book',
      titleKey: 'care.tool.guide.title',
      descKey: 'care.tool.guide.desc',
      color: 'text-teal-600',
      bgColor: 'bg-teal-500/10',
      borderColor: 'border-teal-200/60'
    },
    {
      id: 'plant_health',
      icon: 'health_and_safety',
      titleKey: 'care.tool.health.title',
      descKey: 'care.tool.health.desc',
      color: 'text-rose-600',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-200/60',
      badgeKey: 'care.badge3Photos'
    }
  ];

  return (
    <div className="space-y-6 pb-28">
      {/* Header Banner */}
      <div
        id="care-header-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#006b5e] via-[#005046] to-[#0d3b34] p-6 text-white shadow-xl shadow-[#006b5e]/15"
      >
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-[#7ef7e2]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide text-[#7ef7e2] border border-white/10">
            <span className="material-symbols-outlined text-sm">spa</span>
            <span>{t('care.title')}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t('care.title')}
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed max-w-sm">
            {t('care.subtitle')}
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="space-y-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            id={`care-tool-card-${tool.id}`}
            onClick={() => onSelectTool(tool.id)}
            className="w-full text-left bg-white rounded-2xl p-4 sm:p-5 border border-[#e1e3e4] hover:border-[#006b5e]/40 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4 group active:scale-[0.99]"
          >
            <div
              className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${tool.bgColor} ${tool.color} border ${tool.borderColor} group-hover:scale-105 transition-transform duration-200`}
            >
              <span className="material-symbols-outlined text-2xl font-semibold">
                {tool.icon}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-base font-bold text-[#191c1d] group-hover:text-[#006b5e] transition-colors">
                  {t(tool.titleKey as any)}
                </h2>
                {tool.badgeKey && (
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {t(tool.badgeKey as any)}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#526360] leading-relaxed line-clamp-2">
                {t(tool.descKey as any)}
              </p>
            </div>

            <div className="flex-shrink-0 self-center text-[#89938f] group-hover:text-[#006b5e] group-hover:translate-x-0.5 transition-all">
              <span className="material-symbols-outlined text-xl">
                arrow_forward_ios
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick History Selector info if available */}
      {recentScans.length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-700 text-xl flex-shrink-0">
            auto_awesome
          </span>
          <p className="text-xs text-emerald-900 leading-relaxed">
            {t('care.recentScansHint', { count: recentScans.length })}
          </p>
        </div>
      )}
    </div>
  );
};
