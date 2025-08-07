// components/FloodAnalysisChart.tsx - Historical flood analysis bar chart

import React from 'react';
import { FloodEvent } from '../../lib/types';
import { groupFloodEventsByPeriods } from '../../lib/chartUtils';

interface FloodAnalysisChartProps {
  floodEvents: FloodEvent[];
  isLoading?: boolean;
}

/**
 * Component displaying historical flood events grouped by 5-year periods in a bar chart
 */
export const FloodAnalysisChart: React.FC<FloodAnalysisChartProps> = ({
  floodEvents,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-primary-purple">Historical Flood Analysis</h2>
        <div className="h-96 flex items-center justify-center bg-supp-bright-cream rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple"></div>
        </div>
      </div>
    );
  }

  const periodData = groupFloodEventsByPeriods(floodEvents);
  const periods = Object.keys(periodData).sort();
  const maxCount = Math.max(...Object.values(periodData), 1);

  if (periods.length === 0) {
    return (
      <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-primary-purple">Historical Flood Analysis</h2>
        <div className="h-96 flex items-center justify-center bg-supp-bright-cream rounded text-secondary-gray">
          No flood data available for analysis
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-primary-purple">Historical Flood Analysis</h2>
      <p className="text-sm text-secondary-gray mb-6">
        Number of flood events grouped by 5-year periods
      </p>
      
      <div className="bg-white rounded-lg border border-secondary-gray p-6">
        <div className="h-80 relative">
          <svg className="w-full h-full" viewBox="0 0 800 350">
            {/* Chart Background */}
            <rect x="0" y="0" width="800" height="350" fill="#fafafa" />
            
            {/* Chart Area */}
            <rect x="80" y="20" width="680" height="280" fill="white" stroke="#e2e8f0" strokeWidth="1" />
            
            {/* Y-axis Grid Lines and Labels */}
            {Array.from({length: 6}, (_, i) => {
              const value = Math.round((maxCount / 5) * i);
              const y = 300 - (value / maxCount) * 280;
              
              return (
                <g key={i}>
                  <line x1="80" y1={y} x2="760" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x="75" y={y + 4} textAnchor="end" fontSize="12" fill="#64748b">
                    {value}
                  </text>
                </g>
              );
            })}
            
            {/* Bars */}
            {periods.map((period, index) => {
              const barWidth = Math.max(40, (680 - (periods.length * 10)) / periods.length);
              const barHeight = (periodData[period] / maxCount) * 280;
              const x = 80 + (index * (barWidth + 10)) + 5;
              const y = 300 - barHeight;
              
              // Color based on flood count intensity
              const intensity = periodData[period] / maxCount;
              let barColor = '#5b8f22'; // supp-bright-green (low)
              if (intensity > 0.7) {
                barColor = '#c75b12'; // supp-bright-brick (high)
              } else if (intensity > 0.4) {
                barColor = '#ebb700'; // supp-bright-gold (medium)
              }
              
              return (
                <g key={period}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={barColor}
                    stroke="white"
                    strokeWidth="1"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                  
                  {/* Bar Value Label */}
                  {periodData[period] > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#374151"
                      fontWeight="600"
                    >
                      {periodData[period]}
                    </text>
                  )}
                  
                  {/* X-axis Label */}
                  <text
                    x={x + barWidth / 2}
                    y="320"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#64748b"
                    transform={`rotate(-45 ${x + barWidth / 2} 320)`}
                  >
                    {period}
                  </text>
                </g>
              );
            })}
            
            {/* Axis Labels */}
            <text x="40" y="160" textAnchor="middle" fontSize="12" fill="#475569" transform="rotate(-90 40 160)">
              Number of Flood Events
            </text>
            <text x="420" y="345" textAnchor="middle" fontSize="12" fill="#475569">
              Time Period (Years)
            </text>
            
            {/* Chart Title */}
            <text x="420" y="15" textAnchor="middle" fontSize="14" fill="#1e293b" fontWeight="600">
              Flood Events by 5-Year Periods
            </text>
          </svg>
        </div>
        
        {/* Chart Legend */}
        <div className="mt-4 pt-4 border-t border-secondary-gray">
          <div className="flex items-center justify-center space-x-6 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-supp-bright-green rounded mr-2"></div>
              <span>Low Activity (0-40%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-supp-bright-gold rounded mr-2"></div>
              <span>Moderate Activity (40-70%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-supp-bright-brick rounded mr-2"></div>
              <span>High Activity (70%+)</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-supp-bright-cream p-3 rounded text-center">
          <div className="text-lg font-semibold text-primary-purple">{periods.length}</div>
          <div className="text-xs text-secondary-gray">Time Periods</div>
        </div>
        <div className="bg-supp-bright-cream p-3 rounded text-center">
          <div className="text-lg font-semibold text-primary-purple">{floodEvents.length}</div>
          <div className="text-xs text-secondary-gray">Total Events</div>
        </div>
        <div className="bg-supp-bright-cream p-3 rounded text-center">
          <div className="text-lg font-semibold text-primary-purple">
            {periods.length > 0 ? (floodEvents.length / periods.length).toFixed(1) : '0'}
          </div>
          <div className="text-xs text-secondary-gray">Avg/Period</div>
        </div>
      </div>
    </div>
  );
};