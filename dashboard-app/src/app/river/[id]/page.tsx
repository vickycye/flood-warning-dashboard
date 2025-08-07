"use client";
import React, { useState, useEffect } from "react";
import { MapPin, Eye, EyeOff, Calendar, TrendingUp, Info, Download, BarChart3, Droplets, Activity } from "lucide-react";
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

// Type imports
import { 
  RiverData, 
  RiverCoordinates, 
  TimeSeriesData, 
  FloodEvent, 
  FloodThresholds,
  SidebarTab, 
  MainTab, 
  DateRangeOption,
  CSVFloodSite,
  FloodCountsData
} from '../../../lib/types';

// Utility imports
import { fetchUSGSTimeSeriesData, fetchUSGSFloodEvents } from '../../../lib/usgsApi';
import { parseFloodSitesCSV, getFloodThresholds } from '../../../lib/csvUtils';
import { filterFloodEventsByDateRange, calculateFloodCounts } from '../../../lib/chartUtils';

// Component imports
import { FloodSummaryCard } from '../../../components/ui/FloodSummaryCard';
import { ProfessionalTimeSeriesChart } from '../../../components/ui/TimeSeriesChart';
import { FloodAnalysisChart } from '../../../components/ui/FloodAnalysisChart';
import { FloodEventsList } from '../../../components/ui/FloodEventsList';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// USGS gauge site data mapping with accurate site names
const riversData: Record<string, RiverData> = {
  "1": {
    name: "Snohomish River near Monroe, WA",
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
  },
  "2": {
    name: "Nooksack River at Ferndale, WA",
    location: "Ferndale, WA",
    coordinates: "48.85°N, 122.59°W",
    usgsId: "12213100",
    floodHistory: {
      totalEvents: 18,
      majorEvents: 7,
      moderateEvents: 8,
      minorEvents: 3,
      recentYears: [2023, 2021, 2018, 2016, 2013]
    },
    futureProjections: {
      current: { minor: 3.1, moderate: 1.2, major: 0.4 },
      mid: { minor: 4.2, moderate: 1.8, major: 0.7 },
      end: { minor: 5.3, moderate: 2.4, major: 1.1 }
    }
  },
  "3": {
    name: "Skagit River near Mount Vernon, WA",
    location: "Mount Vernon, WA",
    coordinates: "48.42°N, 122.33°W",
    usgsId: "12194000",
    floodHistory: {
      totalEvents: 15,
      majorEvents: 3,
      moderateEvents: 7,
      minorEvents: 5,
      recentYears: [2019, 2017, 2014, 2012, 2010]
    },
    futureProjections: {
      current: { minor: 1.8, moderate: 0.6, major: 0.1 },
      mid: { minor: 2.5, moderate: 1.0, major: 0.3 },
      end: { minor: 3.2, moderate: 1.4, major: 0.6 }
    }
  },
  "4": {
    name: "North Fork Stillaguamish River near Arlington, WA",
    location: "Arlington, WA",
    coordinates: "48.20°N, 122.13°W",
    usgsId: "12167000",
    floodHistory: {
      totalEvents: 20,
      majorEvents: 4,
      moderateEvents: 10,
      minorEvents: 6,
      recentYears: [2021, 2019, 2016, 2014, 2011]
    },
    futureProjections: {
      current: { minor: 2.5, moderate: 0.9, major: 0.3 },
      mid: { minor: 3.4, moderate: 1.3, major: 0.5 },
      end: { minor: 4.3, moderate: 1.8, major: 0.8 }
    }
  },
  "5": {
    name: "Puyallup River at Puyallup, WA",
    location: "Puyallup, WA",
    coordinates: "47.19°N, 122.29°W",
    usgsId: "12092000",
    floodHistory: {
      totalEvents: 25,
      majorEvents: 8,
      moderateEvents: 11,
      minorEvents: 6,
      recentYears: [2023, 2021, 2018, 2016, 2013]
    },
    futureProjections: {
      current: { minor: 3.8, moderate: 1.5, major: 0.6 },
      mid: { minor: 4.9, moderate: 2.1, major: 0.9 },
      end: { minor: 6.0, moderate: 2.7, major: 1.3 }
    }
  },
  "6": {
    name: "Cedar River at Renton, WA",
    location: "Renton, WA",
    coordinates: "47.48°N, 122.22°W",
    usgsId: "12119000",
    floodHistory: {
      totalEvents: 16,
      majorEvents: 3,
      moderateEvents: 8,
      minorEvents: 5,
      recentYears: [2022, 2020, 2017, 2015, 2012]
    },
    futureProjections: {
      current: { minor: 2.2, moderate: 0.7, major: 0.2 },
      mid: { minor: 3.0, moderate: 1.1, major: 0.4 },
      end: { minor: 3.8, moderate: 1.5, major: 0.7 }
    }
  }
};

// Configuration constants
const SIDEBAR_TABS: SidebarTab[] = [
  { id: "timeseries", label: "Time Series", icon: Activity, description: "Stage & Discharge" },
  { id: "floods", label: "Flood Events", icon: Droplets, description: "Historical Floods" },
  { id: "analysis", label: "Analysis", icon: BarChart3, description: "Data Analysis" },
];

const MAIN_TABS: MainTab[] = [
  { id: "history", label: "Flood History", icon: Calendar },
  { id: "projections", label: "Future Risk", icon: TrendingUp },
  { id: "learn", label: "Learn More", icon: Info },
  { id: "data", label: "Download Data", icon: Download }
];

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { value: "all", label: "All Time", years: null },
  { value: "last1", label: "Last Year", years: 1 },
  { value: "last5", label: "Last 5 Years", years: 5 },
  { value: "last10", label: "Last 10 Years", years: 10 },
  { value: "last20", label: "Last 20 Years", years: 20 },
  { value: "last50", label: "Last 50 Years", years: 50 }
];

export default function RiverDashboardPage(): React.ReactElement {
  const params = useParams();
  const riverId = params.id as string;
  const riverData = riversData[riverId] || riversData["1"];
  
  // UI State
  const [activeTab, setActiveTab] = useState<string>("history");
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>("timeseries");
  const [expertMode, setExpertMode] = useState<boolean>(false);
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  
  // Map State
  const [riverCoordinates, setRiverCoordinates] = useState<RiverCoordinates | null>(null);
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  
  // Data State
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData>({ stage: [], discharge: [] });
  const [floodEvents, setFloodEvents] = useState<FloodEvent[]>([]);
  const [floodThresholds, setFloodThresholds] = useState<FloodThresholds | null>(null);
  const [floodSitesData, setFloodSitesData] = useState<CSVFloodSite[]>([]);
  
  // Loading States
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [floodDataLoading, setFloodDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  /**
   * Load and parse the CSV flood sites data
   */
  const loadFloodSitesData = async (): Promise<void> => {
    try {
      // In Next.js, read CSV from public directory or use static import
      const response = await fetch('/data/flood_levels_all_sites_valid.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`);
      }
      const csvContent = await response.text();
      
      const parsedData = await parseFloodSitesCSV(csvContent);
      setFloodSitesData(parsedData);
      
      // Extract flood thresholds for current river
      const thresholds = getFloodThresholds(riverData.usgsId, parsedData);
      setFloodThresholds(thresholds);
    } catch (error) {
      console.error('Error loading flood sites data:', error);
    }
  };

  /**
   * Fetch real-time USGS time series data
   */
  const loadTimeSeriesData = async (): Promise<void> => {
    try {
      setDataLoading(true);
      setDataError(null);
      
      const data = await fetchUSGSTimeSeriesData(riverData.usgsId, 7);
      setTimeSeriesData(data);
    } catch (error) {
      console.error('Error fetching USGS time series data:', error);
      setDataError(`Failed to load real-time data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDataLoading(false);
    }
  };

  /**
   * Fetch historical flood events data
   */
  const loadFloodEventsData = async (): Promise<void> => {
    if (!floodThresholds) return;
    
    try {
      setFloodDataLoading(true);
      const events = await fetchUSGSFloodEvents(riverData.usgsId, floodThresholds);
      setFloodEvents(events);
    } catch (error) {
      console.error('Error fetching flood events:', error);
    } finally {
      setFloodDataLoading(false);
    }
  };

  /**
   * Geocode river location for map display
   */
  const geocodeRiverLocation = async (): Promise<void> => {
    try {
      const searchQuery = `${riverData.name}, ${riverData.location}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data?.[0]) {
        setRiverCoordinates({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
      } else {
        // Fallback coordinates for Monroe, WA area
        setRiverCoordinates({ lat: 47.8311, lng: -122.0472 });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setRiverCoordinates({ lat: 47.8554, lng: -121.9709 });
    } finally {
      setMapLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      await loadFloodSitesData();
      await loadTimeSeriesData();
      await geocodeRiverLocation();
    };
    
    initializeData();
  }, [riverData.usgsId]);

  // Load flood events when thresholds are available
  useEffect(() => {
    if (floodThresholds) {
      loadFloodEventsData();
    }
  }, [floodThresholds]);

  /**
   * Get filtered flood events based on selected date range
   */
  const getFilteredFloodEvents = (): FloodEvent[] => {
    const selectedOption = DATE_RANGE_OPTIONS.find(opt => opt.value === selectedDateRange);
    return filterFloodEventsByDateRange(floodEvents, selectedOption?.years ?? null);
  };

  /**
   * Calculate flood counts for current date range
   */
  const getFloodCounts = (): FloodCountsData => {
    const filteredEvents = getFilteredFloodEvents();
    return calculateFloodCounts(filteredEvents);
  };

  /**
   * Handle date range selection change
   */
  const handleDateRangeChange = (range: string): void => {
    setSelectedDateRange(range);
  };

  /**
   * Toggle expert mode display
   */
  const toggleExpertMode = (): void => {
    setExpertMode(prev => !prev);
  };

  /**
   * Navigate to home page
   */
  const navigateToHome = (): void => {
    window.location.assign("/");
  };

  return (
    <div className="min-h-screen bg-background-lightpurple">
      {/* Header Section */}
      <div className="bg-primary-purple border-b-2 border-secondary-gold shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={navigateToHome}
              className="text-secondary-white hover:text-supp-bright-brick flex items-center transition-colors"
              aria-label="Back to search"
            >
              ← Back to Search
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleExpertMode}
                className={`flex items-center px-3 py-1 text-sm border-2 rounded transition-colors ${
                  expertMode 
                    ? "bg-supp-bright-cream text-primary-purple border-secondary-gold" 
                    : "bg-secondary-gray text-secondary-white border-secondary-gray"
                }`}
                aria-label={`Switch to ${expertMode ? 'simple' : 'expert'} view`}
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
                  <span className="text-sm text-secondary-gray pt-6">
                    USGS ID: {riverData.usgsId}
                  </span>
                )}
              </div>
            </div>
            
            {/* Location Mini-Map */}
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

      {/* Navigation Tabs */}
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
                aria-label={`Switch to ${tab.label} tab`}
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
        {/* History Tab Content */}
        {activeTab === "history" && (
          <div className="space-y-8">
            {/* Flood Summary Card */}
            <FloodSummaryCard
              floodCounts={getFloodCounts()}
              selectedDateRange={selectedDateRange}
              onDateRangeChange={handleDateRangeChange}
              dateRangeOptions={DATE_RANGE_OPTIONS}
              floodEvents={getFilteredFloodEvents()}
              isLoading={floodDataLoading}
            />

            {/* Main Content with Sidebar */}
            <div className="flex">
              {/* Vertical Sidebar */}
              <div className="w-64 bg-supp-bright-cream border-r border-secondary-gold">
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
                        aria-label={`Switch to ${tab.label} view`}
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

              {/* Content Area */}
              <div className="flex-1 pl-8">
                {/* Time Series Tab */}
                {activeSidebarTab === "timeseries" && (
                  <div className="space-y-6">
                    {dataError && (
                      <div className="bg-supp-bright-brick bg-opacity-10 border border-supp-bright-brick text-supp-bright-brick p-3 rounded-lg">
                        <p className="text-sm">{dataError}</p>
                      </div>
                    )}

                    <ProfessionalTimeSeriesChart
                      data={timeSeriesData.stage}
                      title="River Stage"
                      type="stage"
                      color="#39275b"
                      isLoading={dataLoading}
                    />

                    <ProfessionalTimeSeriesChart
                      data={timeSeriesData.discharge}
                      title="Discharge"
                      type="discharge"
                      color="#c75b12"
                      isLoading={dataLoading}
                    />

                    <div className="bg-secondary-white p-4 rounded-lg border border-secondary-gray">
                      <div className="text-xs text-secondary-gray space-y-1">
                        <p><strong>Data source:</strong> USGS Water Services API</p>
                        <p><strong>Site ID:</strong> {riverData.usgsId}</p>
                        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
                        {floodThresholds && (
                          <p><strong>Flood stages:</strong> Minor: {floodThresholds.minor}ft, Moderate: {floodThresholds.moderate}ft, Major: {floodThresholds.major}ft</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Flood Events Tab */}
                {activeSidebarTab === "floods" && (
                  <FloodEventsList
                    floodEvents={getFilteredFloodEvents()}
                    isLoading={floodDataLoading}
                  />
                )}

                {/* Analysis Tab */}
                {activeSidebarTab === "analysis" && (
                  <FloodAnalysisChart
                    floodEvents={getFilteredFloodEvents()}
                    isLoading={floodDataLoading}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Future Risk Projections Tab */}
        {activeTab === "projections" && (
          <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-primary-purple">Future Risk Projections</h2>
            <div className="bg-supp-bright-cream p-8 rounded-lg text-center">
              <TrendingUp className="h-12 w-12 text-primary-purple mx-auto mb-4" />
              <p className="text-primary-purple">Climate change impact projections coming soon</p>
            </div>
          </div>
        )}

        {/* Learn More Tab */}
        {activeTab === "learn" && (
          <div className="bg-secondary-white shadow-sm p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-primary-purple">Learn More</h2>
            <div className="bg-supp-bright-cream p-8 rounded-lg text-center">
              <Info className="h-12 w-12 text-primary-purple mx-auto mb-4" />
              <p className="text-primary-purple">Educational resources and methodology information</p>
            </div>
          </div>
        )}

        {/* Download Data Tab */}
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