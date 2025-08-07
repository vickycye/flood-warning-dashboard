// usgsApi.ts - USGS API service functions

import { TimeSeriesData, TimeSeriesPoint, FloodEvent, FloodThresholds, USGSResponse } from './types';

/**
 * Fetches real-time stage and discharge data from USGS Water Services API
 * @param siteId - USGS site identifier
 * @param daysPast - Number of days in the past to fetch data (default: 7)
 * @returns Promise<TimeSeriesData> - Processed time series data
 */
export const fetchUSGSTimeSeriesData = async (
  siteId: string,
  daysPast: number = 7
): Promise<TimeSeriesData> => {
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - daysPast * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Fetch stage data (parameter code: 00065 for stage)
    const stageResponse = await fetch(
      `https://waterservices.usgs.gov/nwis/iv/?sites=${siteId}&parameterCd=00065&startDT=${startDate}&endDT=${endDate}&format=json`
    );
    
    if (!stageResponse.ok) {
      throw new Error(`Stage data fetch failed: ${stageResponse.status}`);
    }
    
    const stageData: USGSResponse = await stageResponse.json();

    // Fetch discharge data (parameter code: 00060 for discharge)
    const dischargeResponse = await fetch(
      `https://waterservices.usgs.gov/nwis/iv/?sites=${siteId}&parameterCd=00060&startDT=${startDate}&endDT=${endDate}&format=json`
    );
    
    if (!dischargeResponse.ok) {
      throw new Error(`Discharge data fetch failed: ${dischargeResponse.status}`);
    }
    
    const dischargeData: USGSResponse = await dischargeResponse.json();

    // Process stage data
    const processedStage: TimeSeriesPoint[] = stageData.value?.timeSeries?.[0]?.values?.[0]?.value?.map(point => ({
      dateTime: point.dateTime || '',
      value: parseFloat(point.value) || 0,
      qualifiers: point.qualifiers || []
    })) || [];

    // Process discharge data
    const processedDischarge: TimeSeriesPoint[] = dischargeData.value?.timeSeries?.[0]?.values?.[0]?.value?.map(point => ({
      dateTime: point.dateTime || '',
      value: parseFloat(point.value) || 0,
      qualifiers: point.qualifiers || []
    })) || [];

    if (processedStage.length === 0 && processedDischarge.length === 0) {
      throw new Error('No data available for the specified time period');
    }

    return {
      stage: processedStage,
      discharge: processedDischarge
    };
  } catch (error) {
    console.error('Error fetching USGS time series data:', error);
    throw error;
  }
};

/**
 * Fetches historical peak flow data and converts to flood events
 * @param siteId - USGS site identifier
 * @param floodThresholds - Flood stage thresholds for the site
 * @returns Promise<FloodEvent[]> - Array of historical flood events
 */
export const fetchUSGSFloodEvents = async (
  siteId: string,
  floodThresholds: FloodThresholds
): Promise<FloodEvent[]> => {
  try {
    // Fetch historical peak streamflow data from USGS NWIS
    const peakResponse = await fetch(
      `https://nwis.waterdata.usgs.gov/nwis/peak?site_no=${siteId}&agency_cd=USGS&format=json`
    );

    if (!peakResponse.ok) {
      throw new Error(`Peak data fetch failed: ${peakResponse.status}`);
    }

    const peakData: USGSResponse = await peakResponse.json();

    const peaks = peakData?.value?.timeSeries?.[0]?.values?.[0]?.value || [];

    const processedFloodEvents: FloodEvent[] = peaks
      .filter(peak => {
        const stage = parseFloat(peak.value || '0');
        return stage >= floodThresholds.minor;
      })
      .map(peak => {
        const stage = parseFloat(peak.value || '0');
        const discharge = peak.discharge ? parseFloat(peak.discharge) : Math.round(stage * 1000);
        const date = peak.dateTime || '';

        // Determine severity level based on actual thresholds
        let severity: 'minor' | 'moderate' | 'major' = 'minor';
        if (stage >= floodThresholds.major) {
          severity = 'major';
        } else if (stage >= floodThresholds.moderate) {
          severity = 'moderate';
        }

        return {
          date,
          stage,
          discharge,
          severity
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50); // Get top 50 most recent events

    return processedFloodEvents;
  } catch (error) {
    console.error('Error fetching flood events:', error);
    throw error;
  }
};

/**
 * Formats date and time for display
 * @param dateTime - ISO date string
 * @returns Formatted date string
 */
export const formatDateTime = (dateTime: string): string => {
  return new Date(dateTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats values with appropriate units
 * @param value - Numeric value
 * @param type - Type of measurement ('stage' or 'discharge')
 * @returns Formatted string with units
 */
export const formatValue = (value: number, type: 'stage' | 'discharge'): string => {
  if (type === 'stage') {
    return `${value.toFixed(2)} ft`;
  } else {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k cfs` : `${value.toFixed(0)} cfs`;
  }
};