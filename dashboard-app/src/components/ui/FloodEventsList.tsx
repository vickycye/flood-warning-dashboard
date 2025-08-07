// components/FloodEventsList.tsx - Historical flood events list component

import React from 'react';
import { FloodEvent } from '../../lib/types';

interface FloodEventsListProps {
  floodEvents: FloodEvent[];
  isLoading?: boolean;
}

/**
 * Component displaying a list of historical flood events with severity indicators
 */
export const FloodEventsList: React.FC<FloodEventsListProps> = ({
  floodEvents,
  isLoading = false
}) => {
  const getSeverityStyles = (severity: 'minor' | 'moderate' | 'major') => {
    switch (severity) {
      case 'major':
        return 'bg-supp-bright-brick text-secondary-white';
      case 'moderate':
        return 'bg-supp-bright-gold text-secondary-white';
      case 'minor':
        return 'bg-supp-bright-green text-secondary-white';
      default:
        return 'bg-secondary-gray text-secondary-white';
    }
  };

  const formatEventDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-primary-purple">Historical Flood Events</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse">
                <div className="p-4 bg-background-lightpurple rounded-lg">
                  <div className="h-4 bg-primary-purple bg-opacity-20 rounded mb-2"></div>
                  <div className="h-3 bg-secondary-gray bg-opacity-20 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (floodEvents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-primary-purple">Historical Flood Events</h2>
          <div className="text-center py-8 bg-supp-bright-cream rounded-lg">
            <p className="text-secondary-gray">No flood events found for the selected time period.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary-purple">Historical Flood Events</h2>
          <div className="text-sm text-secondary-gray">
            Showing {floodEvents.length} event{floodEvents.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {floodEvents.map((event, index) => (
            <div 
              key={`${event.date}-${index}`} 
              className="flex items-center justify-between p-4 bg-background-lightpurple rounded-lg border-l-4 border-primary-purple hover:bg-supp-bright-cream transition-colors"
            >
              <div className="flex-1">
                <div className="font-semibold text-primary-purple mb-1">
                  {formatEventDate(event.date)}
                </div>
                <div className="text-sm text-secondary-gray space-x-4">
                  <span>Stage: {event.stage.toFixed(1)} ft</span>
                  <span>•</span>
                  <span>Discharge: {event.discharge.toLocaleString()} cfs</span>
                </div>
              </div>
              <div className="ml-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityStyles(event.severity)}`}>
                  {event.severity.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary Footer */}
        <div className="mt-4 pt-4 border-t border-secondary-gray">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-semibold text-supp-bright-brick">
                {floodEvents.filter(e => e.severity === 'major').length}
              </div>
              <div className="text-secondary-gray">Major Events</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-supp-bright-gold">
                {floodEvents.filter(e => e.severity === 'moderate').length}
              </div>
              <div className="text-secondary-gray">Moderate Events</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-supp-bright-green">
                {floodEvents.filter(e => e.severity === 'minor').length}
              </div>
              <div className="text-secondary-gray">Minor Events</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};