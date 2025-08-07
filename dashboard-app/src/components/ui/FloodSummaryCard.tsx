// components/FloodSummaryCard.tsx - Historical Flood Summary Component

import React from 'react';
import { DateRangeOption, FloodCountsData } from '../../lib/types';
import { getEarliestYear } from '../../lib/chartUtils';

interface FloodSummaryCardProps {
  floodCounts: FloodCountsData;
  selectedDateRange: string;
  onDateRangeChange: (range: string) => void;
  dateRangeOptions: DateRangeOption[];
  floodEvents: Array<{ date: string }>;
  isLoading?: boolean;
}

/**
 * Component displaying historical flood summary with date range filtering
 */
export const FloodSummaryCard: React.FC<FloodSummaryCardProps> = ({
  floodCounts,
  selectedDateRange,
  onDateRangeChange,
  dateRangeOptions,
  floodEvents,
  isLoading = false
}) => {
  const earliestYear = getEarliestYear(floodEvents.map(e => ({ ...e, stage: 0, discharge: 0, severity: 'minor' as const })));

  if (isLoading) {
    return (
      <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary-purple">Historical Flood Summary</h2>
          <div className="animate-pulse">
            <div className="h-10 w-32 bg-secondary-gray bg-opacity-20 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="text-center p-4 bg-background-lightpurple rounded">
              <div className="animate-pulse">
                <div className="h-8 bg-primary-purple bg-opacity-20 rounded mb-2"></div>
                <div className="h-4 bg-secondary-black bg-opacity-20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-primary-purple">Historical Flood Summary</h2>
        <select
          value={selectedDateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="px-3 py-2 border border-secondary-gray rounded-lg text-sm text-primary-purple bg-white focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-primary-purple"
          aria-label="Select date range for flood data"
        >
          {dateRangeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-background-lightpurple rounded">
          <div className="text-2xl font-bold text-primary-purple">{floodCounts.totalEvents}</div>
          <div className="text-sm text-secondary-black">Total Floods Since {earliestYear}</div>
        </div>
        <div className="text-center p-4 bg-supp-bright-brick rounded">
          <div className="text-2xl font-bold text-secondary-white">{floodCounts.majorEvents}</div>
          <div className="text-sm text-secondary-white">Major Floods</div>
        </div>
        <div className="text-center p-4 bg-supp-bright-gold rounded">
          <div className="text-2xl font-bold text-secondary-white">{floodCounts.moderateEvents}</div>
          <div className="text-sm text-secondary-white">Moderate Floods</div>
        </div>
        <div className="text-center p-4 bg-supp-bright-green rounded">
          <div className="text-2xl font-bold text-secondary-white">{floodCounts.minorEvents}</div>
          <div className="text-sm text-secondary-white">Minor Floods</div>
        </div>
      </div>
    </div>
  );
};