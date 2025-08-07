// lib/mapDataLoader.ts - Functions for loading map data

import { MapRiverSite } from './mapTypes';
import { CSVFloodSite } from './types';
import { parseFloodSitesCSV } from './csvUtils';
import { createMapRiverSites } from './mapUtils';
import { fetchCurrentStage, determineFloodRisk } from './mapUtils';

/**
 * Loads site codes from text file
 * @returns Promise<string[]> - Array of USGS site codes
 */
export const loadSiteCodes = async (): Promise<string[]> => {
  try {
    const response = await fetch('/data/site_codes_all.txt');
    if (!response.ok) {
      throw new Error(`Failed to fetch site codes: ${response.status}`);
    }
    const content = await response.text();

    return content.trim().split('\n').map(code => code.trim()).filter(Boolean);
  } catch (error) {
    console.error('Error loading site codes:', error);
    return [];
  }
};

/**
 * Loads all map river sites with current data
 * @returns Promise<MapRiverSite[]> - Array of map river sites
 */
export const loadAllMapRiverSites = async (): Promise<MapRiverSite[]> => {
    try {
        // Load site codes and JSON thresholds
        const [siteCodes, thresholdsResponse] = await Promise.all([
          loadSiteCodes(),
          fetch('/data/flood_thresholds.json')
        ]);
     
        if (!thresholdsResponse.ok) {
          throw new Error('Failed to load thresholds JSON');
        }
     
        const thresholds = await thresholdsResponse.json();

        interface ThresholdSite {
          usgsId: string | number;
          name: string;
          latitude: number;
          longitude: number;
          floodThresholds: {
            minor: number;
            moderate: number;
            major: number;
            action?: number;
          };
        }
        
        // Create sites directly from JSON thresholds data
        const mapSites: MapRiverSite[] = thresholds
          .filter((site: ThresholdSite) => siteCodes.includes(String(site.usgsId)))
          .map((site: ThresholdSite) => ({
            id: site.usgsId, 
            usgsId: site.usgsId,
            name: site.name,
            latitude: site.latitude,
            longitude: site.longitude,
            floodThresholds: {
              minor: site.floodThresholds.minor,
              moderate: site.floodThresholds.moderate,
              major: site.floodThresholds.major,
              action: site.floodThresholds.action
            }
          }));
     
        console.log(`Loaded ${mapSites.length} river sites from JSON thresholds`);
        return mapSites;
      } catch (error) {
        console.error('Error loading map river sites:', error);
        return [];
      }
};

/**
 * Updates river sites with current stage and risk data
 * This function loads current conditions for visible sites
 * @param sites - Array of map river sites
 * @param maxSites - Maximum number of sites to update (for performance)
 * @returns Promise<MapRiverSite[]> - Updated sites with current data
 */
export const updateSitesWithCurrentData = async (
  sites: MapRiverSite[],
): Promise<MapRiverSite[]> => {
  // Limit concurrent requests for performance
  const sitesToUpdate = sites.slice(0);
  
  const updatePromises = sitesToUpdate.map(async (site) => {
    try {
      const currentStage = await fetchCurrentStage(site.usgsId);
      
      if (currentStage !== null) {
        const risk = determineFloodRisk(currentStage, site.floodThresholds);
        return {
          ...site,
          currentStage,
          forecastRisk: risk,
          lastUpdated: new Date().toISOString()
        };
      }
      
      return site;
    } catch (error) {
      console.error(`Error updating data for site ${site.usgsId}:`, error);
      return site;
    }
  });

  const updatedSites = await Promise.all(updatePromises);
  
  // Return all sites, with updates applied to the first maxSites
  return [
    ...updatedSites
  ];
};