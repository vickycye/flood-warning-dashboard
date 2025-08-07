// csvUtils.ts - Utilities for processing CSV flood data

import { FloodThresholds, CSVFloodSite } from './types';

/**
 * Parses CSV content and returns flood site data
 * @param csvContent - Raw CSV content as string
 * @returns Promise<CSVFloodSite[]> - Array of parsed flood site data
 */
export const parseFloodSitesCSV = async (csvContent: string): Promise<CSVFloodSite[]> => {
  // Dynamic import to avoid issues with SSR
  const Papa = await import('papaparse');
  
  const parsed = Papa.parse(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimitersToGuess: [',', '\t', '|', ';']
  });

  // Strip whitespace from headers and validate data
  return (parsed.data as CSVFloodSite[]).filter(row => 
    row && row.usgsId && row.valid === 'yes'
  );
};

/**
 * Extracts flood thresholds for a specific USGS site
 * @param usgsId - USGS site identifier
 * @param floodSites - Array of flood site data from CSV
 * @returns FloodThresholds or null if not found
 */
export const getFloodThresholds = (
  usgsId: string, 
  floodSites: CSVFloodSite[]
): FloodThresholds | null => {
  const site = floodSites.find(row => 
    row.usgsId?.toString() === usgsId.toString()
  );

  if (!site) {
    console.warn(`No flood thresholds found for USGS site ${usgsId}`);
    return null;
  }

  return {
    minor: site.minor_stage,
    moderate: site.mod_stage,
    major: site.major_stage,
    action: site.action_stage
  };
};

/**
 * Gets historical flood counts for a specific USGS site
 * @param usgsId - USGS site identifier
 * @param floodSites - Array of flood site data from CSV
 * @returns Historical flood counts or null if not found
 */
export const getHistoricalFloodCounts = (
  usgsId: string,
  floodSites: CSVFloodSite[]
): { major: number; moderate: number; minor: number; total: number } | null => {
  const site = floodSites.find(row => 
    row.usgsId?.toString() === usgsId.toString()
  );

  if (!site) {
    console.warn(`No historical flood data found for USGS site ${usgsId}`);
    return null;
  }

  return {
    major: site.hist_major || 0,
    moderate: site.hist_mod || 0,
    minor: site.hist_minor || 0,
    total: site.total_historic_crests || 0
  };
};