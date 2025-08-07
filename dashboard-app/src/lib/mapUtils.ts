// lib/mapUtils.ts - Map utility functions

import { MapRiverSite, GeocodeResult, NOAAForecast } from './mapTypes';
import { CSVFloodSite } from './types';

/**
 * Creates map river sites from CSV data and site codes
 * @param csvData - Parsed CSV flood site data
 * @param siteCodes - Array of valid site codes
 * @returns Array of map river sites
 */
export const createMapRiverSites = (
  csvData: CSVFloodSite[],
  siteCodes: string[]
): MapRiverSite[] => {
  return csvData
    .filter(site => 
      site && 
      site.valid === 'yes' && 
      siteCodes.includes(site.usgsId?.toString()) &&
      site.latitude && 
      site.longitude
    )
    .map(site => ({
      id: site.usgsId.toString(),
      usgsId: site.usgsId.toString(),
      name: site.siteName,
      latitude: site.latitude,
      longitude: site.longitude,
      floodThresholds: {
        minor: site.minor_stage,
        moderate: site.mod_stage,
        major: site.major_stage,
        action: site.action_stage
      }
    }));
};

/**
 * Geocodes a location query to coordinates
 * @param query - Location query (city, ZIP, address)
 * @returns Promise<GeocodeResult | null>
 */
export const geocodeLocation = async (query: string): Promise<GeocodeResult | null> => {
  try {
    let searchQuery = query.trim();
    
    // Add USA context for ZIP codes
    if (/^\d{5}(-\d{4})?$/.test(searchQuery)) {
      searchQuery = `${searchQuery}, USA`;
    }
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1&countrycodes=us`
    );
    
    const data = await response.json();
    
    if (data?.[0]) {
      const result = data[0];
      const city = result.address?.city || 
                  result.address?.town || 
                  result.address?.village || 
                  result.address?.county ||
                  result.address?.state ||
                  result.display_name?.split(',')[0] ||
                  'Unknown Location';
      
      return {
        city,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Reverse geocodes coordinates to get city name
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise<string> - City name
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    
    if (data?.address) {
      return data.address.city || 
             data.address.town || 
             data.address.village || 
             data.address.county ||
             data.address.state ||
             'Unknown Location';
    }
    return 'Unknown Location';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Unknown Location';
  }
};

/**
 * Fetches current stage data for a site
 * @param usgsId - USGS site identifier
 * @returns Promise<number | null> - Current stage in feet
 */
export const fetchCurrentStage = async (usgsId: string): Promise<number | null> => {
  try {
    const response = await fetch(
      `https://waterservices.usgs.gov/nwis/iv/?sites=${usgsId}&parameterCd=00065&period=PT1H&format=json`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const latestValue = data.value?.timeSeries?.[0]?.values?.[0]?.value?.slice(-1)[0];
    
    return latestValue ? parseFloat(latestValue.value) : null;
  } catch (error) {
    console.error(`Error fetching current stage for ${usgsId}:`, error);
    return null;
  }
};

/**
 * Determines flood risk level based on current stage and thresholds
 * @param currentStage - Current river stage in feet
 * @param thresholds - Flood stage thresholds
 * @returns Risk level string
 */
export const determineFloodRisk = (
  currentStage: number,
  thresholds: { minor: number; moderate: number; major: number; action: number }
): 'low' | 'moderate' | 'high' => {
  if (thresholds.major === -9999 || thresholds.moderate === -9999 || thresholds.minor === -9999) return 'low';
  if (currentStage >= thresholds.major) return 'high';
  if (currentStage >= thresholds.moderate) return 'high';
  if (currentStage >= thresholds.minor) return 'moderate';
  if (currentStage >= thresholds.action) return 'moderate';
  return 'low';
};

/**
 * Gets color for flood risk level
 * @param riskLevel - Risk level
 * @returns CSS color string
 */
export const getRiskColor = (riskLevel: 'low' | 'moderate' | 'high'): string => {
  switch (riskLevel) {
    case 'high':
      return '#c75b12'; // supp-bright-brick
    case 'moderate':
      return '#ebb700'; // supp-bright-gold
    case 'low':
      return '#5b8f22'; // supp-bright-green
    default:
      return '#939598'; // secondary-gray
  }
};

/**
 * Gets marker size based on flood risk
 * @param riskLevel - Risk level
 * @returns Marker radius
 */
export const getRiskMarkerSize = (riskLevel: 'low' | 'moderate' | 'high'): number => {
  switch (riskLevel) {
    case 'high':
      return 12;
    case 'moderate':
      return 8;
    case 'low':
      return 6;
    default:
      return 6;
  }
};

/**
 * Session storage utilities for location persistence
 * Includes safety checks for server-side rendering
 */
export const LocationStorage = {
  setHasAskedForLocation: (): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hasAskedForLocation', 'true');
    }
  },
  
  hasAskedForLocation: (): boolean => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('hasAskedForLocation') === 'true';
  },
  
  setUserLocation: (location: { lat: number; lng: number; city: string }): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('userLocation', JSON.stringify(location));
    }
  },
  
  getUserLocation: (): { lat: number; lng: number; city: string } | null => {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem('userLocation');
    return stored ? JSON.parse(stored) : null;
  },
  
  clearSession: (): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hasAskedForLocation');
      sessionStorage.removeItem('userLocation');
    }
  }
};