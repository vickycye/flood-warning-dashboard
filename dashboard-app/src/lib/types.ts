// types.ts - Centralized type definitions

export interface RiverCoordinates {
    lat: number;
    lng: number;
  }
  
  export interface FloodThresholds {
    minor: number;
    moderate: number;
    major: number;
    action: number;
  }
  
  export interface FloodHistory {
    totalEvents: number;
    majorEvents: number;
    moderateEvents: number;
    minorEvents: number;
    recentYears: number[];
  }
  
  export interface FutureProjections {
    current: { minor: number; moderate: number; major: number };
    mid: { minor: number; moderate: number; major: number };
    end: { minor: number; moderate: number; major: number };
  }
  
  export interface RiverData {
    name: string;
    location: string;
    coordinates: string;
    usgsId: string;
    floodHistory: FloodHistory;
    futureProjections: FutureProjections;
    floodThresholds?: FloodThresholds;
  }
  
  export interface TimeSeriesPoint {
    dateTime: string;
    value: number;
    qualifiers?: string[];
  }
  
  export interface TimeSeriesData {
    stage: TimeSeriesPoint[];
    discharge: TimeSeriesPoint[];
  }
  
  export interface FloodEvent {
    date: string;
    stage: number;
    discharge: number;
    severity: 'minor' | 'moderate' | 'major';
  }
  
  export interface HoveredPoint {
    x: number;
    y: number;
    data: TimeSeriesPoint;
    type: 'stage' | 'discharge';
  }
  
  export interface ChartDimensions {
    min: number;
    max: number;
    range: number;
  }
  
  export interface SidebarTab {
    id: string;
    label: string;
    icon: React.ComponentType<{className?: string}>;
    description: string;
  }
  
  export interface MainTab {
    id: string;
    label: string;
    icon: React.ComponentType<{className?: string}>;
  }
  
  export interface DateRangeOption {
    value: string;
    label: string;
    years: number | null;
  }
  
  export interface FloodCountsData {
    totalEvents: number;
    majorEvents: number;
    moderateEvents: number;
    minorEvents: number;
  }
  
  export interface CSVFloodSite {
    site_code: number;
    usgsId: number;
    siteName: string;
    state: string;
    latitude: number;
    longitude: number;
    major_stage: number;
    mod_stage: number;
    minor_stage: number;
    action_stage: number;
    hist_major: number;
    hist_mod: number;
    hist_minor: number;
    action_trig: number;
    total_historic_crests: number;
    has_usgs_id: string;
    valid: string;
  }
  
  export interface USGSPeakValue {
    value: string;
    discharge?: string;
    dateTime?: string;
    qualifiers?: string[];
  }
  
  export interface USGSResponse {
    value?: {
      timeSeries?: Array<{
        values?: Array<{
          value?: USGSPeakValue[];
        }>;
      }>;
    };
  }