// components/TimeSeriesChart.tsx - Professional time series visualization

import React, { useState } from 'react';
import { TimeSeriesPoint, HoveredPoint } from '../../lib/types';
import { formatDateTime, formatValue } from '../../lib/usgsApi';
import { getChartDimensions, getPointPosition } from '../../lib/chartUtils';

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  title: string;
  type: 'stage' | 'discharge';
  color: string;
  isLoading?: boolean;
}

/**
 * Professional time series chart component with interactive features
 */
export const ProfessionalTimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  type,
  color,
  isLoading = false
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);

  if (isLoading) {
    return (
      <div className="bg-secondary-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-primary-purple">{title}</h3>
        <div className="h-80 flex items-center justify-center bg-supp-bright-cream rounded border border-secondary-gray">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-secondary-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-primary-purple">{title}</h3>
        <div className="h-80 flex items-center justify-center bg-supp-bright-cream rounded border border-secondary-gray text-secondary-gray">
          No {type} data available
        </div>
      </div>
    );
  }

  const dimensions = getChartDimensions(data);
  const chartWidth = 520;
  const chartHeight = 300;
  const latestValue = data[data.length - 1]?.value;

  return (
    <div className="bg-secondary-white p-6 rounded-lg shadow-sm">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-purple">{title}</h3>
        <div className="text-right">
          <div className="text-sm text-secondary-gray">Latest Reading</div>
          <div className="text-lg font-semibold text-primary-purple">
            {latestValue !== undefined ? formatValue(latestValue, type) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Professional Chart Container */}
      <div className="bg-white rounded-lg border border-secondary-gray overflow-hidden">
        <div className="h-80 relative">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 600 320"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Chart Background */}
            <rect x="0" y="0" width="600" height="320" fill="#fafafa" />
            
            {/* Grid Lines */}
            <defs>
              <pattern id={`grid-${type}`} width="50" height="30" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect x="60" y="10" width={chartWidth} height={chartHeight} fill={`url(#grid-${type})`} />
            
            {/* Chart Border */}
            <rect x="60" y="10" width={chartWidth} height={chartHeight} fill="none" stroke="#cbd5e1" strokeWidth="1" />
            
            {/* Y-axis Labels and Grid Lines */}
            {(() => {
              const numTicks = 8;
              const tickInterval = dimensions.range / (numTicks - 1);
              
              return Array.from({length: numTicks}, (_, i) => {
                const value = dimensions.min + (i * tickInterval);
                const y = 10 + chartHeight - ((value - dimensions.min) / dimensions.range) * chartHeight;
                
                return (
                  <g key={i}>
                    <line x1="60" y1={y} x2="580" y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                    <text x="55" y={y + 4} textAnchor="end" fontSize="12" fill="#64748b" fontFamily="monospace">
                      {type === 'stage' ? value.toFixed(1) : 
                       value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
                    </text>
                  </g>
                );
              });
            })()}
            
            {/* X-axis Time Labels */}
            {data.map((point, index) => {
              // Show labels for every 6th point or so
              if (index % Math.max(Math.ceil(data.length / 8), 1) === 0) {
                const x = 60 + (index / Math.max(data.length - 1, 1)) * chartWidth;
                return (
                  <text key={index} x={x} y="335" textAnchor="middle" fontSize="10" fill="#64748b">
                    {new Date(point.dateTime).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </text>
                );
              }
              return null;
            })}
            
            {/* Data Line */}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={data.map((point, index) => {
                const pos = getPointPosition(index, data.length, point.value, dimensions, chartHeight);
                return `${60 + pos.x},${10 + chartHeight - pos.y}`;
              }).join(' ')}
            />
            
            {/* Interactive Data Points */}
            {data.map((point, index) => {
              const pos = getPointPosition(index, data.length, point.value, dimensions, chartHeight);
              const x = 60 + pos.x;
              const y = 10 + chartHeight - pos.y;
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={color}
                    opacity="0.8"
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 transition-all"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
                      if (svgRect) {
                        setHoveredPoint({
                          x: rect.left - svgRect.left,
                          y: rect.top - svgRect.top - 10,
                          data: point,
                          type
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Hover indicator line */}
                  {hoveredPoint?.data === point && (
                    <line
                      x1={x}
                      y1="10"
                      x2={x}
                      y2={10 + chartHeight}
                      stroke={color}
                      strokeWidth="1"
                      strokeDasharray="4,4"
                      opacity="0.6"
                    />
                  )}
                </g>
              );
            })}
            
            {/* Chart Labels */}
            <text x="30" y="170" textAnchor="middle" fontSize="12" fill="#475569" transform="rotate(-90 30 170)">
              {type === 'stage' ? 'Stage (ft)' : 'Discharge (cfs)'}
            </text>
            <text x="340" y="350" textAnchor="middle" fontSize="12" fill="#475569">
              Time
            </text>
          </svg>
          
          {/* Tooltip */}
          {hoveredPoint && hoveredPoint.type === type && (
            <div 
              className="absolute bg-primary-purple text-secondary-white p-3 rounded-lg shadow-lg text-sm z-20 pointer-events-none"
              style={{
                left: Math.max(10, Math.min(hoveredPoint.x - 80, 520)),
                top: Math.max(10, hoveredPoint.y - 70),
                minWidth: '160px'
              }}
            >
              <div className="font-semibold border-b border-secondary-gold pb-1 mb-1">
                {formatValue(hoveredPoint.data.value, type)}
              </div>
              <div className="text-secondary-gold text-xs">
                {formatDateTime(hoveredPoint.data.dateTime)}
              </div>
              {hoveredPoint.data.qualifiers && hoveredPoint.data.qualifiers.length > 0 && (
                <div className="text-xs mt-1 text-supp-bright-cream">
                  Qualifiers: {hoveredPoint.data.qualifiers.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Chart Footer */}
        <div className="px-4 py-2 bg-gray-50 text-xs text-secondary-gray border-t border-secondary-gray">
          <div className="flex justify-between items-center">
            <span>Data points: {data.length}</span>
            <span>Range: {formatValue(dimensions.min, type)} - {formatValue(dimensions.max, type)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};