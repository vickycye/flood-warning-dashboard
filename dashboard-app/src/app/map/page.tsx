"use client";
import React, { useState, useEffect } from "react";
import { MapPin, Navigation, X, CheckCircle, AlertCircle, Info, ExternalLink } from "lucide-react";
import dynamic from 'next/dynamic';

// Type imports
import { MapRiverSite, LocationStatus, UserLocation, RiskSite} from '../../lib/mapTypes';
let cachedFloodSites: RiskSite[] = [];

// Utility imports
import { 
  geocodeLocation, 
  reverseGeocode, 
  getRiskColor, 
  getRiskMarkerSize,
  LocationStorage 
} from '../../lib/mapUtils';
import { loadAllMapRiverSites, updateSitesWithCurrentData } from '../../lib/mapDataLoader';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });


export default function MapViewPage(): React.ReactElement {
  // UI State
  const [showLocationPopup, setShowLocationPopup] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus['status']>('asking');
  const [manualLocation, setManualLocation] = useState<string>('');
  
  // Location State
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  
  // Data State
  const [riverSites, setRiverSites] = useState<MapRiverSite[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState<boolean>(true);
  const [isUpdatingCurrentData, setIsUpdatingCurrentData] = useState<boolean>(false);

  /**
   * manage state with risk description
   */
  const [siteRiskDescriptions, setSiteRiskDescriptions] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAllRiskDescriptions = async () => {
      const riskDescriptions: Record<string, string> = {};
  
      for (const site of riverSites) {
        const description = await getRiskDescription(site);
        riskDescriptions[site.usgsId] = description;
      }
  
      setSiteRiskDescriptions(riskDescriptions);
    };
  
    if (riverSites.length > 0) {
      fetchAllRiskDescriptions();
    }
  }, [riverSites]);


  /**
   * Initialize component and check for existing location data
   */
  useEffect(() => {
    const initializeComponent = async (): Promise<void> => {
      // Check if we've already asked for location this session
      const hasAskedBefore = LocationStorage.hasAskedForLocation();
      const storedLocation = LocationStorage.getUserLocation();
      
      if (storedLocation) {
        setUserLocation(storedLocation);
        setLocationStatus('success');
      } else if (!hasAskedBefore) {
        setShowLocationPopup(true);
      }
      
      // Load river sites data
      await loadRiverSitesData();
    };

    initializeComponent();
  }, []);

  /**
   * Load all river sites for map display
   */
  const loadRiverSitesData = async (): Promise<void> => {
    try {
      setIsLoadingSites(true);
      const sites = await loadAllMapRiverSites();
      setRiverSites(sites);
      
      // Update with current data for visible sites
      setIsUpdatingCurrentData(true);
      const updatedSites = await updateSitesWithCurrentData(sites);
      setRiverSites(updatedSites);
    } catch (error) {
      console.error('Error loading river sites:', error);
    } finally {
      setIsLoadingSites(false);
      setIsUpdatingCurrentData(false);
    }
  };

  /**
   * Request user's current location
   */
  const requestLocation = (): void => {
    setLocationStatus('asking');
    
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Get city name from coordinates
        const city = await reverseGeocode(coords.lat, coords.lng);
        const userLoc = { ...coords, city };
        
        setUserLocation(userLoc);
        setLocationStatus('success');
        
        // Store in session storage
        LocationStorage.setUserLocation(userLoc);
        LocationStorage.setHasAskedForLocation();
        
        setTimeout(() => setShowLocationPopup(false), 2000);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationStatus(error.code === 1 ? 'denied' : 'error');
        LocationStorage.setHasAskedForLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  /**
   * Handle manual location entry
   */
  const handleManualLocation = async (): Promise<void> => {
    if (!manualLocation.trim()) return;
    
    setLocationStatus('asking');
    
    const locationData = await geocodeLocation(manualLocation);
    
    if (locationData) {
      const userLoc = {
        lat: locationData.lat,
        lng: locationData.lng,
        city: locationData.city
      };
      
      setUserLocation(userLoc);
      setLocationStatus('success');
      
      // Store in session storage
      LocationStorage.setUserLocation(userLoc);
      LocationStorage.setHasAskedForLocation();
      
      setTimeout(() => setShowLocationPopup(false), 2000);
    } else {
      setLocationStatus('error');
    }
  };

  /**
   * Skip location request
   */
  const skipLocation = (): void => {
    LocationStorage.setHasAskedForLocation();
    setShowLocationPopup(false);
  };

  /**
   * Navigate to river dashboard for a specific site
   */
  const navigateToRiverDashboard = (site: MapRiverSite): void => {
    // Map USGS ID to our internal river IDs
    const riverIdMap: Record<string, string> = {
      '12150800': '1', // Snohomish River
      '12213100': '2', // Nooksack River
      '12194000': '3', // Skagit River
      '12167000': '4', // North Fork Stillaguamish River
      '12092000': '5', // Puyallup River
      '12119000': '6'  // Cedar River
    };
    
    const riverId = riverIdMap[site.usgsId];
    if (riverId) {
      window.location.assign(`/river/${riverId}`);
    } else {
      // For sites not in our detailed dashboard, could redirect to a generic page
      console.log(`Dashboard not available for site ${site.usgsId}`);
    }
  };

  /**
   * Get risk description for tooltip
   */
  const getRiskDescription = async (site: { latitude: number; longitude: number }) => {
    if (!site.latitude || !site.longitude) return "Location unknown";
  
    if (cachedFloodSites.length === 0) {
      try {
        const res = await fetch("/api/risk-sites", { cache: "no-store" });
        cachedFloodSites = await res.json();
      } catch (err) {
        console.error("Failed to fetch flood sites", err);
        return "Error fetching flood risk data.";
      }
    }
  
    const match = cachedFloodSites.find(
      (r) =>
        Math.abs(r.latitude - site.latitude) < 0.01 &&
        Math.abs(r.longitude - site.longitude) < 0.01
    );
  
    return match ? `Flood risk: ${match.status}` : "No flood risk";
  };

  /**
   * Render location popup
   */
  const renderLocationPopup = (): React.ReactElement | null => {
    if (!showLocationPopup) return null;

    return (
      <div className="fixed inset-0 bg-primary-purple bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-secondary-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-secondary-gold">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary-purple flex items-center">
              <Navigation className="h-5 w-5 mr-2" />
              Find Your Location
            </h2>
            <button
              onClick={skipLocation}
              className="text-secondary-gray hover:text-secondary-black transition-colors"
              aria-label="Skip location request"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {locationStatus === 'asking' && (
            <div className="text-center">
              <MapPin className="h-12 w-12 text-primary-purple mx-auto mb-4" />
              <p className="text-secondary-black mb-6">
                To show you the most relevant river data, we&apos;d like to know your approximate location.
              </p>
              <div className="space-y-3">
                <button
                  onClick={requestLocation}
                  className="w-full bg-primary-purple text-secondary-white py-3 px-4 rounded hover:bg-secondary-gold hover:text-secondary-black transition-colors border-2 border-primary-purple hover:border-secondary-gold"
                >
                  Use My Current Location
                </button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-secondary-gray"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-secondary-white text-secondary-gray">or</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter city, ZIP code, or address..."
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-gray rounded focus:ring-2 focus:ring-primary-purple focus:border-primary-purple"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                  />
                  <button
                    onClick={handleManualLocation}
                    disabled={!manualLocation.trim()}
                    className="w-full bg-secondary-gold text-secondary-black py-2 px-4 rounded hover:bg-supp-bright-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Location
                  </button>
                </div>
              </div>
              <button
                onClick={skipLocation}
                className="mt-4 text-secondary-gray hover:text-secondary-black text-sm underline"
              >
                Skip for now
              </button>
            </div>
          )}

          {locationStatus === 'success' && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-supp-bright-green mx-auto mb-4" />
              <p className="text-secondary-black mb-2">Location found!</p>
              <p className="text-sm text-secondary-gray">
                {userLocation?.city || 'Loading location...'}
              </p>
            </div>
          )}

          {locationStatus === 'error' && (
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-supp-bright-brick mx-auto mb-4" />
              <p className="text-secondary-black mb-4">Unable to get your location automatically.</p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter city, ZIP code, or address..."
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-gray rounded focus:ring-2 focus:ring-primary-purple focus:border-primary-purple"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                />
                <button
                  onClick={handleManualLocation}
                  disabled={!manualLocation.trim()}
                  className="w-full bg-secondary-gold text-secondary-black py-2 px-4 rounded hover:bg-supp-bright-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Location
                </button>
              </div>
            </div>
          )}

          {locationStatus === 'denied' && (
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-supp-bright-brick mx-auto mb-4" />
              <p className="text-secondary-black mb-4">Location access was denied.</p>
              <p className="text-sm text-secondary-gray mb-4">
                You can manually enter your location or skip for now.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter city, ZIP code, or address..."
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-gray rounded focus:ring-2 focus:ring-primary-purple focus:border-primary-purple"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
                />
                <button
                  onClick={handleManualLocation}
                  disabled={!manualLocation.trim()}
                  className="w-full bg-secondary-gold text-secondary-black py-2 px-4 rounded hover:bg-supp-bright-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set Location
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background-lightpurple">
      {/* Location Popup */}
      {renderLocationPopup()}

      {/* Main Map Interface */}
      <div className="p-8">
        <div className="bg-secondary-white rounded-lg shadow-lg overflow-hidden">
          {/* Map Header */}
          <div className="bg-primary-purple text-secondary-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Interactive River Map</h1>
                {userLocation && (
                  <p className="text-secondary-gold mt-1">Showing data for: {userLocation.city}</p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {isUpdatingCurrentData && (
                  <div className="flex items-center text-secondary-gold text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary-gold mr-2"></div>
                    Updating conditions...
                  </div>
                )}
                {/* <button
                  onClick={() => setShowLocationPopup(true)}
                  className="text-secondary-white hover:text-supp-bright-cream transition-colors text-sm underline"
                >
                  Change Location
                </button> */}
              </div>
            </div>
          </div>
          
          {/* Map Content */}
          <div className="h-[80vh] w-full relative z-3">
            {isLoadingSites ? (
              <div className="w-full h-full flex items-center justify-center bg-supp-bright-cream">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4"></div>
                  <p className="text-primary-purple">Loading river monitoring sites...</p>
                  <p className="text-sm text-secondary-gray mt-1">
                    Found {riverSites.length} sites so far
                  </p>
                </div>
              </div>
            ) : (userLocation || LocationStorage.hasAskedForLocation()) ? (
              <MapContainer
                center={userLocation ? [userLocation.lat, userLocation.lng] : [47.6062, -122.3321]}
                zoom={userLocation ? 10 : 8}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* User Location Marker */}
                {userLocation && (
                  <CircleMarker
                    center={[userLocation.lat, userLocation.lng]}
                    radius={10}
                    fillColor="#39275b"
                    color="#39275b"
                    weight={3}
                    opacity={1}
                    fillOpacity={0.8}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong>Your Location</strong><br />
                        {userLocation.city}
                      </div>
                    </Popup>
                  </CircleMarker>
                )}

                {/* River Site Markers */}
                {riverSites.map((site) => {
                  const riskLevel = site.forecastRisk || 'low';
                  const hasCurrentData = site.currentStage !== undefined;
                  
                  return (
                    <CircleMarker
                      key={site.usgsId}
                      center={[site.latitude, site.longitude]}
                      radius={getRiskMarkerSize(riskLevel)}
                      fillColor={getRiskColor(riskLevel)}
                      color={getRiskColor(riskLevel)}
                      weight={2}
                      opacity={hasCurrentData ? 1 : 0.6}
                      fillOpacity={hasCurrentData ? 0.8 : 0.4}
                    >
                      <Popup>
                        <div className="min-w-[250px] p-2">
                          {/* Site Header */}
                          <div className="border-b border-gray-200 pb-2 mb-3">
                            <h3 className="font-semibold text-lg text-gray-800 leading-tight">
                              {site.name}
                            </h3>
                            <p className="text-sm text-gray-600">USGS ID: {site.id}</p>
                          </div>
                          
                          {/* Current Conditions */}
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Current Stage:</span>
                              <span className="text-sm">
                                {site.currentStage != null
                                  ? `${site.currentStage.toFixed(2)} ft`
                                  : 'No data'}
                              </span>
                            </div>

                            {(() => {
                              const hasStage = site.currentStage != null;
                              const riskText = hasStage ? riskLevel.toUpperCase() : 'No data';
                              const riskClass = hasStage
                                ? riskLevel === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : riskLevel === 'moderate'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-600';

                              return (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Flood Risk:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${riskClass}`}>
                                    {riskText}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* 7-Day Outlook */}
                          <div className="bg-gray-50 p-2 rounded mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">7-Day Outlook</h4>
                            <p className="text-xs text-gray-600">{siteRiskDescriptions[site.usgsId] || "Loading..."}</p>
                          </div>
                          
                          {/* Flood Thresholds */}
                          <div className="text-xs text-gray-500 space-y-1 mb-3">
                            <div>Minor Flood: {site.floodThresholds.minor} ft</div>
                            <div>Moderate Flood: {site.floodThresholds.moderate} ft</div>
                            <div>Major Flood: {site.floodThresholds.major} ft</div>
                          </div>
                          
                          {/* Action Button */}
                          <button
                            onClick={() => navigateToRiverDashboard(site)}
                            className="w-full bg-primary-purple text-white py-2 px-3 rounded text-sm hover:bg-secondary-gold hover:text-black transition-colors flex items-center justify-center"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Details
                          </button>
                          
                          {site.lastUpdated && (
                            <p className="text-xs text-gray-400 mt-2 text-center">
                              Updated: {new Date(site.lastUpdated).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-supp-bright-cream">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4"></div>
                  <p className="text-primary-purple">Waiting for location selection...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map Legend and Controls */}
        <div className="absolute top-24 right-12 space-y-4 z-4">
          {/* Legend */}
          <div className="bg-white bg-opacity-95 rounded-lg p-4 shadow-lg border border-secondary-gold z-[1000]">
            <h3 className="font-semibold text-primary-purple mb-3 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Current Flood Risk
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-supp-bright-brick mr-2"></div>
                <span className="text-black">High Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-supp-bright-gold mr-2"></div>
                <span className="text-black">Moderate Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-supp-bright-green mr-2"></div>
                <span className="text-black">Low Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-primary-purple mr-2"></div>
                <span className="text-black">Your Location</span>
              </div>
            </div>
          </div>
          
          {/* Status Info */}
          <div className="bg-white bg-opacity-95 rounded-lg p-4 shadow-lg border border-secondary-gold z-4">
            <h3 className="font-semibold text-primary-purple mb-2">Map Status</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-black">Total Sites:</span>
                <span className="font-medium text-black">{riverSites.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">With Data:</span>
                <span className="font-medium text-black">
                  {riverSites.filter(site => site.currentStage !== undefined).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">High Risk:</span>
                <span className="font-medium text-supp-bright-brick">
                  {riverSites.filter(site => site.forecastRisk === 'high').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-12 left-12 z-4">
          <div className="bg-white bg-opacity-95 rounded-lg p-4 shadow-lg border border-secondary-gold z-[1000]">
            <div className="flex items-center space-x-3">
              <button
                onClick={loadRiverSitesData}
                disabled={isLoadingSites || isUpdatingCurrentData}
                className="bg-primary-purple text-white px-4 py-2 rounded text-sm hover:bg-secondary-gold hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingSites || isUpdatingCurrentData ? 'Updating...' : 'Refresh Data'}
              </button>
              <button
                onClick={() => window.location.assign('/')}
                className="bg-secondary-gray text-white px-4 py-2 rounded text-sm hover:bg-primary-purple transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}