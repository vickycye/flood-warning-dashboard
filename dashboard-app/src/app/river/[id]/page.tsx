"use client";
import React, { useState, useEffect } from "react";
import { MapPin, Eye, EyeOff, Calendar, TrendingUp, Info, Download, BarChart3, Droplets, Activity, Database, Settings } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

const riverData = {
  name: "Snohomish River",
  location: "Monroe, WA",
  coordinates: "47.86°N, 121.97°W",
  usgsId: "12150800",
  floodHistory: {
    totalEvents: 23,
    majorEvents: 5,
    moderateEvents: 12,
    minorEvents: 6,
    recentYears: [2022, 2020, 2017, 2015, 2012]
  },
  futureProjections: {
    current: { minor: 2.1, moderate: 0.8, major: 0.2 },
    mid: { minor: 3.2, moderate: 1.4, major: 0.5 },
    end: { minor: 4.1, moderate: 2.0, major: 0.8 }
  }
};

const SIDEBAR_TABS = [
  { id: "timeseries", label: "Time Series", icon: Activity, description: "Stage & Discharge" },
  { id: "floods", label: "Flood Events", icon: Droplets, description: "Historical Floods" },
  { id: "analysis", label: "Analysis", icon: BarChart3, description: "Data Analysis" },
  // { id: "settings", label: "Settings", icon: Settings, description: "Preferences" }
];

const MAIN_TABS = [
  { id: "history", label: "Flood History", icon: Calendar },
  { id: "projections", label: "Future Risk", icon: TrendingUp },
  { id: "learn", label: "Learn More", icon: Info },
  { id: "data", label: "Download Data", icon: Download }
];

export default function RiverDashboardPage() {
  const [activeTab, setActiveTab] = useState("history");
  const [activeSidebarTab, setActiveSidebarTab] = useState("timeseries");
  const [expertMode, setExpertMode] = useState(false);
  const [riverCoordinates, setRiverCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  // Real USGS API data with interactive features
  const [timeSeriesData, setTimeSeriesData] = useState<{
    stage: Array<{dateTime: string, value: number, qualifiers?: string[]}>;
    discharge: Array<{dateTime: string, value: number, qualifiers?: string[]}>;
  }>({
    stage: [],
    discharge: []
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, data: {dateTime: string, value: number, qualifiers?: string[]}, type: 'stage' | 'discharge'} | null>(null);

  // Fetch real USGS data - no fallbacks
  useEffect(() => {
    const fetchUSGSData = async () => {
      try {
        setDataLoading(true);
        setDataError(null);

        // USGS Water Services API endpoints - get more recent data
        const siteId = riverData.usgsId; // "12150800" for Snohomish River
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // Last 3 days for more recent data

        // Fetch stage data (parameter code: 00065 for stage)
        const stageResponse = await fetch(
          `https://waterservices.usgs.gov/nwis/iv/?sites=${siteId}&parameterCd=00065&startDT=${startDate}&endDT=${endDate}&format=json`
        );
        
        if (!stageResponse.ok) {
          throw new Error(`Stage data fetch failed: ${stageResponse.status}`);
        }
        
        const stageData = await stageResponse.json();

        // Fetch discharge data (parameter code: 00060 for discharge)
        const dischargeResponse = await fetch(
          `https://waterservices.usgs.gov/nwis/iv/?sites=${siteId}&parameterCd=00060&startDT=${startDate}&endDT=${endDate}&format=json`
        );
        
        if (!dischargeResponse.ok) {
          throw new Error(`Discharge data fetch failed: ${dischargeResponse.status}`);
        }
        
        const dischargeData = await dischargeResponse.json();

        // Process stage data with full datetime
        const processedStage = stageData.value?.timeSeries?.[0]?.values?.[0]?.value?.map((point: {dateTime: string, value: string, qualifiers?: string[]}) => ({
          dateTime: point.dateTime,
          value: parseFloat(point.value),
          qualifiers: point.qualifiers || []
        })) || [];

        // Process discharge data with full datetime
        const processedDischarge = dischargeData.value?.timeSeries?.[0]?.values?.[0]?.value?.map((point: {dateTime: string, value: string, qualifiers?: string[]}) => ({
          dateTime: point.dateTime,
          value: parseFloat(point.value),
          qualifiers: point.qualifiers || []
        })) || [];

        if (processedStage.length === 0 && processedDischarge.length === 0) {
          throw new Error('No data available for the specified time period');
        }

        setTimeSeriesData({
          stage: processedStage,
          discharge: processedDischarge
        });

        setDataLoading(false);
      } catch (error) {
        console.error('Error fetching USGS data:', error);
        setDataError(`Failed to load real-time data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setDataLoading(false);
      }
    };

    fetchUSGSData();
  }, []);

  // Helper functions for interactive chart
  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatValue = (value: number, type: 'stage' | 'discharge') => {
    if (type === 'stage') {
      return `${value.toFixed(2)} ft`;
    } else {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k cfs` : `${value.toFixed(0)} cfs`;
    }
  };

  const getChartDimensions = (data: {value: number}[]) => {
    if (data.length === 0) return { min: 0, max: 10, range: 10 };
    
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Add padding
    const padding = range * 0.1;
    return {
      min: Math.max(0, min - padding),
      max: max + padding,
      range: (max + padding) - Math.max(0, min - padding)
    };
  };

  const getPointPosition = (index: number, total: number, value: number, dimensions: {min: number, max: number, range: number}, chartHeight: number) => {
    const x = (index / (total - 1)) * 400;
    const y = chartHeight - ((value - dimensions.min) / dimensions.range) * chartHeight;
    return { x, y };
  };

  const floodEvents = [
    { date: '2022-12-15', stage: 8.2, discharge: 12000, severity: 'major' },
    { date: '2020-11-28', stage: 6.8, discharge: 8500, severity: 'moderate' },
    { date: '2017-10-12', stage: 5.4, discharge: 6200, severity: 'minor' },
    { date: '2015-09-20', stage: 7.1, discharge: 9500, severity: 'moderate' },
    { date: '2012-08-15', stage: 6.2, discharge: 7200, severity: 'minor' }
  ];

  // Geocode the river location to get coordinates
  useEffect(() => {
    const geocodeRiverLocation = async () => {
      try {
        const searchQuery = `${riverData.name}, ${riverData.location}`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          setRiverCoordinates({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          });
        } else {
          // Fallback to approximate coordinates for Monroe, WA
          setRiverCoordinates({
            lat: 47.8311,
            lng: -122.0472
          });
        }
        setMapLoading(false);
      } catch (error) {
        console.error('Geocoding error:', error);
        // Fallback coordinates
        setRiverCoordinates({
          lat: 47.8554,
          lng: -121.9709
        });
        setMapLoading(false);
      }
    };

    geocodeRiverLocation();
  }, []);

  return (
    <div className="min-h-screen bg-background-lightpurple">
      <div className="bg-primary-purple border-b-2 border-secondary-gold shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => window.location.assign("/")}
              className="text-secondary-white hover:text-supp-bright-brick flex items-center transition-colors"
            >
              ← Back to Search
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setExpertMode(!expertMode)}
                className={`flex items-center px-3 py-1 text-sm border-2 rounded transition-colors ${
                  expertMode 
                    ? "bg-supp-bright-cream text-primary-purple border-secondary-gold" 
                    : "bg-secondary-gray text-secondary-white border-secondary-gray"
                }`}
              >
                {expertMode ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                {expertMode ? "Expert View" : "Simple View"}
              </button>
            </div>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-white pt-6">{riverData.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-secondary-white">
                <span className="flex items-center pt-6">
                  <MapPin className="h-4 w-4 mr-1 text-supp-bright-cream" />
                  {riverData.location}
                </span>
                {expertMode && (
                  <span className="text-sm text-secondary-gray">USGS ID: {riverData.usgsId}</span>
                )}
              </div>
            </div>
                          <div className="bg-supp-bright-cream p-3 w-48 h-32 rounded">
                <div className="text-xs text-primary-purple mb-1">Location</div>
                <div className="w-full h-full rounded overflow-hidden border border-secondary-gold">
                  {mapLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-background-lightpurple">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-purple"></div>
                    </div>
                  ) : riverCoordinates ? (
                    <MapContainer
                      center={[riverCoordinates.lat, riverCoordinates.lng]}
                      zoom={12}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                      attributionControl={false}
                      dragging={false}
                      touchZoom={false}
                      scrollWheelZoom={false}
                      doubleClickZoom={false}
                      boxZoom={false}
                      keyboard={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[riverCoordinates.lat, riverCoordinates.lng]}>
                        <Popup>
                          <div className="text-center text-xs">
                            <strong>{riverData.name}</strong><br />
                            {riverData.location}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-background-lightpurple">
                      <MapPin className="h-6 w-6 text-primary-purple" />
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>
      <div className="bg-secondary-white">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-secondary-gold text-primary-purple"
                    : "border-transparent text-secondary-gray hover:text-primary-purple"
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 bg-supp-bright-cream">
          {/* Main tab content - always visible */}
          {activeTab === "history" && (
            <div className="space-y-8">
              {/* Historical Flood Summary - appears above everything */}
              <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-primary-purple">Historical Flood Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-background-lightpurple rounded">
                    <div className="text-2xl font-bold text-primary-purple">{riverData.floodHistory.totalEvents}</div>
                    <div className="text-sm text-secondary-black">Total Floods Since [date TBD]</div>
                  </div>
                  <div className="text-center p-4 bg-supp-bright-brick rounded">
                    <div className="text-2xl font-bold text-secondary-white">{riverData.floodHistory.majorEvents}</div>
                    <div className="text-sm text-secondary-white">Major Floods</div>
                  </div>
                  <div className="text-center p-4 bg-supp-bright-gold rounded">
                    <div className="text-2xl font-bold text-secondary-white">{riverData.floodHistory.moderateEvents}</div>
                    <div className="text-sm text-secondary-white">Moderate Floods</div>
                  </div>
                  <div className="text-center p-4 bg-supp-bright-green rounded">
                    <div className="text-2xl font-bold text-secondary-white">{riverData.floodHistory.minorEvents}</div>
                    <div className="text-sm text-secondary-white">Minor Floods</div>
                  </div>
                </div>
              </div>

              {/* Time Series Data + Sidebar - only when on history tab */}
              <div className="flex">
                {/* Vertical Sidebar */}
                <div className="w-64 bg-supp-bright-cream border-r border-secondary-gold max-h-screen">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-primary-purple mb-4">Data Views</h3>
                    <nav className="space-y-2">
                      {SIDEBAR_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveSidebarTab(tab.id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            activeSidebarTab === tab.id
                              ? "bg-primary-purple text-secondary-white"
                              : "bg-secondary-white text-secondary-black hover:bg-background-lightpurple"
                          }`}
                        >
                          <div className="flex items-center">
                            <tab.icon className="h-5 w-5 mr-3" />
                            <div>
                              <div className="font-medium">{tab.label}</div>
                              <div className={`text-xs ${activeSidebarTab === tab.id ? 'text-secondary-gold' : 'text-secondary-gray'}`}>
                                {tab.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Time Series Content */}
                <div className="flex-1 pl-8">
                  {activeSidebarTab === "timeseries" && (
                    <div className="space-y-6">
                      <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4 text-primary-purple">Time Series Data</h2>
                        
                        {dataError && (
                          <div className="bg-supp-bright-brick bg-opacity-10 border border-supp-bright-brick text-supp-bright-brick p-3 rounded-lg mb-4">
                            <p className="text-sm">{dataError}</p>
                          </div>
                        )}

                        {dataLoading ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-supp-bright-cream p-4 rounded-lg">
                              <h3 className="text-lg font-semibold mb-3 text-primary-purple">River Stage (ft)</h3>
                              <div className="h-64 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple"></div>
                              </div>
                            </div>
                            <div className="bg-supp-bright-cream p-4 rounded-lg">
                              <h3 className="text-lg font-semibold mb-3 text-primary-purple">Discharge (cfs)</h3>
                              <div className="h-64 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-purple"></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Interactive Stage Chart */}
                            <div className="bg-supp-bright-cream p-6 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-primary-purple">River Stage (ft)</h3>
                                <div className="text-sm text-secondary-gray">
                                  {timeSeriesData.stage.length > 0 && (
                                    <span>Latest: {formatValue(timeSeriesData.stage[timeSeriesData.stage.length - 1].value, 'stage')}</span>
                                  )}
                                </div>
                              </div>
                              <div className="h-96 relative bg-white rounded border border-secondary-gray">
                                {timeSeriesData.stage.length > 0 ? (
                                  <svg 
                                    className="w-full h-full" 
                                    viewBox="0 0 600 400"
                                    onMouseLeave={() => setHoveredPoint(null)}
                                  >
                                    {/* Background grid */}
                                    <defs>
                                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                                      </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                    
                                    {/* Chart area */}
                                    <rect x="60" y="20" width="520" height="360" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                                    
                                    {/* Calculate dimensions */}
                                    {(() => {
                                      const dimensions = getChartDimensions(timeSeriesData.stage);
                                      const chartWidth = 520;
                                      const chartHeight = 360;
                                      
                                      return (
                                        <>
                                          {/* Y-axis labels */}
                                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
                                            const y = 380 - ((value - dimensions.min) / dimensions.range) * chartHeight;
                                            return (
                                              <g key={value}>
                                                <line x1="60" y1={y} x2="580" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                                                <text x="55" y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                                                  {value.toFixed(1)}
                                                </text>
                                              </g>
                                            );
                                          })}
                                          
                                          {/* X-axis time labels */}
                                          {timeSeriesData.stage.map((point, index) => {
                                            if (index % Math.ceil(timeSeriesData.stage.length / 6) === 0) {
                                              const x = 60 + (index / (timeSeriesData.stage.length - 1)) * chartWidth;
                                              return (
                                                <text key={index} x={x} y="395" textAnchor="middle" fontSize="10" fill="#6b7280">
                                                  {formatDateTime(point.dateTime)}
                                                </text>
                                              );
                                            }
                                            return null;
                                          })}
                                          
                                          {/* Stage data line */}
                                          <polyline
                                            fill="none"
                                            stroke="#39275b"
                                            strokeWidth="2"
                                            points={timeSeriesData.stage.map((point, index) => {
                                              const pos = getPointPosition(index, timeSeriesData.stage.length, point.value, dimensions, chartHeight);
                                              return `${60 + pos.x},${380 - pos.y}`;
                                            }).join(' ')}
                                          />
                                          
                                          {/* Interactive data points */}
                                          {timeSeriesData.stage.map((point, index) => {
                                            const pos = getPointPosition(index, timeSeriesData.stage.length, point.value, dimensions, chartHeight);
                                            const x = 60 + pos.x;
                                            const y = 380 - pos.y;
                                            
                                            return (
                                              <g key={index}>
                                                <circle
                                                  cx={x}
                                                  cy={y}
                                                  r="4"
                                                  fill="#39275b"
                                                  opacity="0.8"
                                                  onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoveredPoint({
                                                      x: rect.left + rect.width / 2,
                                                      y: rect.top - 10,
                                                      data: point,
                                                      type: 'stage'
                                                    });
                                                  }}
                                                  onMouseLeave={() => setHoveredPoint(null)}
                                                />
                                                {/* Hover indicator line */}
                                                {hoveredPoint && hoveredPoint.data === point && (
                                                  <line
                                                    x1={x}
                                                    y1="20"
                                                    x2={x}
                                                    y2="380"
                                                    stroke="#39275b"
                                                    strokeWidth="1"
                                                    strokeDasharray="3,3"
                                                  />
                                                )}
                                              </g>
                                            );
                                          })}
                                        </>
                                      );
                                    })()}
                                  </svg>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-secondary-gray">
                                    No stage data available
                                  </div>
                                )}
                                
                                {/* Tooltip */}
                                {hoveredPoint && hoveredPoint.type === 'stage' && (
                                  <div 
                                    className="absolute bg-primary-purple text-secondary-white p-3 rounded shadow-lg text-sm z-10"
                                    style={{
                                      left: hoveredPoint.x - 100,
                                      top: hoveredPoint.y - 60,
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <div className="font-semibold">Stage: {formatValue(hoveredPoint.data.value, 'stage')}</div>
                                    <div className="text-secondary-gold">{formatDateTime(hoveredPoint.data.dateTime)}</div>
                                    {hoveredPoint.data.qualifiers && hoveredPoint.data.qualifiers.length > 0 && (
                                      <div className="text-xs mt-1">Qualifiers: {hoveredPoint.data.qualifiers.join(', ')}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Interactive Discharge Chart */}
                            <div className="bg-supp-bright-cream p-6 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-primary-purple">Discharge (cfs)</h3>
                                <div className="text-sm text-secondary-gray">
                                  {timeSeriesData.discharge.length > 0 && (
                                    <span>Latest: {formatValue(timeSeriesData.discharge[timeSeriesData.discharge.length - 1].value, 'discharge')}</span>
                                  )}
                                </div>
                              </div>
                              <div className="h-96 relative bg-white rounded border border-secondary-gray">
                                {timeSeriesData.discharge.length > 0 ? (
                                  <svg 
                                    className="w-full h-full" 
                                    viewBox="0 0 600 400"
                                    onMouseLeave={() => setHoveredPoint(null)}
                                  >
                                    {/* Background grid */}
                                    <defs>
                                      <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                                      </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#grid2)" />
                                    
                                    {/* Chart area */}
                                    <rect x="60" y="20" width="520" height="360" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                                    
                                    {/* Calculate dimensions */}
                                    {(() => {
                                      const dimensions = getChartDimensions(timeSeriesData.discharge);
                                      const chartWidth = 520;
                                      const chartHeight = 360;
                                      
                                      return (
                                        <>
                                          {/* Y-axis labels */}
                                          {(() => {
                                            const maxValue = Math.max(...timeSeriesData.discharge.map(d => d.value));
                                            const step = maxValue > 10000 ? 2000 : maxValue > 5000 ? 1000 : 500;
                                            const steps = Math.ceil(maxValue / step);
                                            return Array.from({length: steps + 1}, (_, i) => {
                                              const value = i * step;
                                              const y = 380 - ((value - dimensions.min) / dimensions.range) * chartHeight;
                                              return (
                                                <g key={value}>
                                                  <line x1="60" y1={y} x2="580" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                                                  <text x="55" y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                                                    {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                                                  </text>
                                                </g>
                                              );
                                            });
                                          })()}
                                          
                                          {/* X-axis time labels */}
                                          {timeSeriesData.discharge.map((point, index) => {
                                            if (index % Math.ceil(timeSeriesData.discharge.length / 6) === 0) {
                                              const x = 60 + (index / (timeSeriesData.discharge.length - 1)) * chartWidth;
                                              return (
                                                <text key={index} x={x} y="395" textAnchor="middle" fontSize="10" fill="#6b7280">
                                                  {formatDateTime(point.dateTime)}
                                                </text>
                                              );
                                            }
                                            return null;
                                          })}
                                          
                                          {/* Discharge data line */}
                                          <polyline
                                            fill="none"
                                            stroke="#c75b12"
                                            strokeWidth="2"
                                            points={timeSeriesData.discharge.map((point, index) => {
                                              const pos = getPointPosition(index, timeSeriesData.discharge.length, point.value, dimensions, chartHeight);
                                              return `${60 + pos.x},${380 - pos.y}`;
                                            }).join(' ')}
                                          />
                                          
                                          {/* Interactive data points */}
                                          {timeSeriesData.discharge.map((point, index) => {
                                            const pos = getPointPosition(index, timeSeriesData.discharge.length, point.value, dimensions, chartHeight);
                                            const x = 60 + pos.x;
                                            const y = 380 - pos.y;
                                            
                                            return (
                                              <g key={index}>
                                                <circle
                                                  cx={x}
                                                  cy={y}
                                                  r="4"
                                                  fill="#c75b12"
                                                  opacity="0.8"
                                                  onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoveredPoint({
                                                      x: rect.left + rect.width / 2,
                                                      y: rect.top - 10,
                                                      data: point,
                                                      type: 'discharge'
                                                    });
                                                  }}
                                                  onMouseLeave={() => setHoveredPoint(null)}
                                                />
                                                {/* Hover indicator line */}
                                                {hoveredPoint && hoveredPoint.data === point && (
                                                  <line
                                                    x1={x}
                                                    y1="20"
                                                    x2={x}
                                                    y2="380"
                                                    stroke="#c75b12"
                                                    strokeWidth="1"
                                                    strokeDasharray="3,3"
                                                  />
                                                )}
                                              </g>
                                            );
                                          })}
                                        </>
                                      );
                                    })()}
                                  </svg>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-secondary-gray">
                                    No discharge data available
                                  </div>
                                )}
                                
                                {/* Tooltip */}
                                {hoveredPoint && hoveredPoint.type === 'discharge' && (
                                  <div 
                                    className="absolute bg-primary-purple text-secondary-white p-3 rounded shadow-lg text-sm z-10"
                                    style={{
                                      left: hoveredPoint.x - 100,
                                      top: hoveredPoint.y - 60,
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <div className="font-semibold">Discharge: {formatValue(hoveredPoint.data.value, 'discharge')}</div>
                                    <div className="text-secondary-gold">{formatDateTime(hoveredPoint.data.dateTime)}</div>
                                    {hoveredPoint.data.qualifiers && hoveredPoint.data.qualifiers.length > 0 && (
                                      <div className="text-xs mt-1">Qualifiers: {hoveredPoint.data.qualifiers.join(', ')}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 text-xs text-secondary-gray">
                          <p>Data source: USGS Water Services API</p>
                          <p>Site ID: {riverData.usgsId} • Last updated: {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSidebarTab === "floods" && (
                    <div className="space-y-6">
                      <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4 text-primary-purple">Historical Flood Events</h2>
                        <div className="space-y-4">
                          {floodEvents.map((event, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-background-lightpurple rounded-lg border-l-4 border-primary-purple">
                              <div>
                                <div className="font-semibold text-primary-purple">{event.date}</div>
                                <div className="text-sm text-secondary-gray">
                                  Stage: {event.stage} ft • Discharge: {event.discharge.toLocaleString()} cfs
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                event.severity === 'major' ? 'bg-supp-bright-brick text-secondary-white' :
                                event.severity === 'moderate' ? 'bg-supp-bright-gold text-secondary-white' :
                                'bg-supp-bright-green text-secondary-white'
                              }`}>
                                {event.severity.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSidebarTab === "analysis" && (
                    <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
                      <h2 className="text-xl font-semibold mb-4 text-primary-purple">Data Analysis</h2>
                      <div className="bg-supp-bright-cream p-8 rounded-lg text-center">
                        <BarChart3 className="h-12 w-12 text-primary-purple mx-auto mb-4" />
                        <p className="text-primary-purple">Advanced analysis tools coming soon</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Other main tabs content */}
          {activeTab === "projections" && (
            <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-primary-purple">Future Risk Projections</h2>
              <div className="bg-supp-bright-cream p-8 rounded-lg text-center">
                <TrendingUp className="h-12 w-12 text-primary-purple mx-auto mb-4" />
                <p className="text-primary-purple">Climate change impact projections coming soon</p>
              </div>
            </div>
          )}

          {activeTab === "learn" && (
            <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-primary-purple">Learn More</h2>
              <div className="bg-supp-bright-cream p-8 rounded-lg text-center">
                <Info className="h-12 w-12 text-primary-purple mx-auto mb-4" />
                <p className="text-primary-purple">Educational resources and methodology information</p>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-primary-purple">Download Data</h2>
              <div className="bg-supp-bright-cream p-8 rounded-lg text-center">
                <Download className="h-12 w-12 text-primary-purple mx-auto mb-4" />
                <p className="text-primary-purple">Data export and download options</p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
} 