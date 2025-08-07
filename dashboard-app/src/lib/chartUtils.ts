// chartUtils.ts - Chart calculation and positioning utilities

import { TimeSeriesPoint, ChartDimensions, FloodEvent } from './types';

/**
 * Calculates chart dimensions with padding for better visualization
 * @param data - Array of time series points
 * @returns ChartDimensions object with min, max, and range
 */
export const getChartDimensions = (data: TimeSeriesPoint[]): ChartDimensions => {
  if (data.length === 0) {
    return { min: 0, max: 10, range: 10 };
  }
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  // Add 10% padding for better visualization
  const padding = range * 0.1;
  return {
    min: Math.max(0, min - padding),
    max: max + padding,
    range: (max + padding) - Math.max(0, min - padding)
  };
};

/**
 * Calculates point position for SVG chart
 * @param index - Point index in array
 * @param total - Total number of points
 * @param value - Point value
 * @param dimensions - Chart dimensions
 * @param chartHeight - Height of chart area
 * @returns Object with x, y coordinates
 */
export const getPointPosition = (
  index: number,
  total: number,
  value: number,
  dimensions: ChartDimensions,
  chartHeight: number
): { x: number; y: number } => {
  const x = (index / Math.max(total - 1, 1)) * 400;
  const y = chartHeight - ((value - dimensions.min) / dimensions.range) * chartHeight;
  return { x, y };
};

/**
 * Filters flood events by date range
 * @param events - Array of flood events
 * @param years - Number of years to filter (null for all time)
 * @returns Filtered array of flood events
 */
export const filterFloodEventsByDateRange = (
  events: FloodEvent[],
  years: number | null
): FloodEvent[] => {
  if (years === null) return events;
  
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - years);
  
  return events.filter(event => new Date(event.date) >= cutoffDate);
};

/**
 * Groups flood events into 5-year periods for analysis
 * @param events - Array of flood events
 * @returns Object with period labels as keys and counts as values
 */
export const groupFloodEventsByPeriods = (events: FloodEvent[]): Record<string, number> => {
  if (events.length === 0) return {};

  // Find earliest and latest years
  const years = events.map(event => new Date(event.date).getFullYear());
  const earliestYear = Math.min(...years);
  const latestYear = Math.max(...years);
  
  // Create 5-year periods
  const periods: Record<string, number> = {};
  
  for (let year = earliestYear; year <= latestYear; year += 5) {
    const periodStart = year;
    const periodEnd = Math.min(year + 4, latestYear);
    const periodLabel = periodStart === periodEnd ? 
      `${periodStart}` : 
      `${periodStart}-${periodEnd}`;
    
    const periodEvents = events.filter(event => {
      const eventYear = new Date(event.date).getFullYear();
      return eventYear >= periodStart && eventYear <= periodEnd;
    });
    
    periods[periodLabel] = periodEvents.length;
  }
  
  return periods;
};

/**
 * Calculates flood counts by severity
 * @param events - Array of flood events
 * @returns Object with counts for each severity level
 */
export const calculateFloodCounts = (events: FloodEvent[]) => {
  return {
    totalEvents: events.length,
    majorEvents: events.filter(e => e.severity === 'major').length,
    moderateEvents: events.filter(e => e.severity === 'moderate').length,
    minorEvents: events.filter(e => e.severity === 'minor').length
  };
};

/**
 * Gets the earliest year from flood events
 * @param events - Array of flood events
 * @returns String representation of earliest year or "No Data"
 */
export const getEarliestYear = (events: FloodEvent[]): string => {
  if (events.length === 0) return "No Data";
  
  const earliestEvent = events.reduce((earliest, current) => 
    new Date(current.date) < new Date(earliest.date) ? current : earliest
  );
  
  return new Date(earliestEvent.date).getFullYear().toString();
};