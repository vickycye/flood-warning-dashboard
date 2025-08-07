// lib/mapTypes.ts - Map-specific type definitions

export interface MapRiverSite {
    id: string;
    usgsId: string;
    name: string;
    latitude: number;
    longitude: number;
    floodThresholds: {
      minor: number;
      moderate: number;
      major: number;
      action: number;
    };
    currentStage?: number;
    forecastRisk?: 'low' | 'moderate' | 'high';
    lastUpdated?: string;
  }
  
  export interface LocationStatus {
    status: 'asking' | 'success' | 'error' | 'denied';
    hasAskedBefore: boolean;
  }
  
  export interface UserLocation {
    lat: number;
    lng: number;
    city: string;
  }
  
  export interface NOAAForecast {
    site: string;
    forecast: Array<{
      date: string;
      stage: number;
      riskLevel: 'low' | 'moderate' | 'high';
    }>;
  }
  
  export interface GeocodeResult {
    city: string;
    lat: number;
    lng: number;
  }

  export interface RiskSite {
    id: number;
    status: string;
    latitude: number;
    longitude: number;
  };