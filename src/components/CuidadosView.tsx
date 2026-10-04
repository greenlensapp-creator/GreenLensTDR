import React, { useState } from 'react';
import { CareToolType, ScanHistoryItem } from '../types';
import { CuidadosHubView } from './care/CuidadosHubView';
import { LightMeterView } from './care/LightMeterView';
import { WateringCalculatorView } from './care/WateringCalculatorView';
import { IdealConditionsView } from './care/IdealConditionsView';
import { CareGuideView } from './care/CareGuideView';
import { PlantHealthView } from './care/PlantHealthView';

interface CuidadosViewProps {
  recentScans: ScanHistoryItem[];
  initialTool?: CareToolType;
}

export const CuidadosView: React.FC<CuidadosViewProps> = ({
  recentScans,
  initialTool = 'overview'
}) => {
  const [activeTool, setActiveTool] = useState<CareToolType>(initialTool);

  const handleBackToOverview = () => {
    setActiveTool('overview');
  };

  switch (activeTool) {
    case 'light_meter':
      return (
        <LightMeterView
          onBack={handleBackToOverview}
          recentScans={recentScans}
        />
      );

    case 'watering_calc':
      return (
        <WateringCalculatorView
          onBack={handleBackToOverview}
          recentScans={recentScans}
        />
      );

    case 'ideal_conditions':
      return (
        <IdealConditionsView
          onBack={handleBackToOverview}
          recentScans={recentScans}
        />
      );

    case 'care_guide':
      return (
        <CareGuideView
          onBack={handleBackToOverview}
          recentScans={recentScans}
        />
      );

    case 'plant_health':
      return (
        <PlantHealthView
          onBack={handleBackToOverview}
          recentScans={recentScans}
        />
      );

    case 'overview':
    default:
      return (
        <CuidadosHubView
          onSelectTool={(tool) => setActiveTool(tool)}
          recentScans={recentScans}
        />
      );
  }
};
