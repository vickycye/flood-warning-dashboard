"use client";
import React, { useState, useEffect } from "react";
import { Search, MapPin, AlertTriangle, ArrowLeft, Navigation, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

// USGS gauge site data with accurate site names
const riversData = [
  { 
    id: 1, 
    name: "Snohomish River near Monroe, WA", 
    location: "Monroe, WA", 
    coordinates: { lat: 47.8311, lng: -122.0472 },
    usgsId: "12150800",
    riskLevel: "moderate", 
    lastFlood: "2022",
    stage: null, // Will be fetched from API
    discharge: null // Will be fetched from API
  },
  { 
    id: 2, 
    name: "Nooksack River at Ferndale, WA", 
    location: "Ferndale, WA", 
    coordinates: { lat: 48.8465, lng: -122.5918 },
    usgsId: "12213100",
    riskLevel: "high", 
    lastFlood: "2023",
    stage: null,
    discharge: null
  },
  { 
    id: 3, 
    name: "Skagit River near Mount Vernon, WA", 
    location: "Mount Vernon, WA", 
    coordinates: { lat: 48.4209, lng: -122.3340 },
    usgsId: "12194000",
    riskLevel: "low", 
    lastFlood: "2019",
    stage: null,
    discharge: null
  },
  { 
    id: 4, 
    name: "North Fork Stillaguamish River near Arlington, WA", 
    location: "Arlington, WA", 
    coordinates: { lat: 48.1987, lng: -122.1251 },
    usgsId: "12167000",
    riskLevel: "moderate", 
    lastFlood: "2021",
    stage: null,
    discharge: null
  },
  { 
    id: 5, 
    name: "Puyallup River at Puyallup, WA", 
    location: "Puyallup, WA", 
    coordinates: { lat: 47.1854, lng: -122.2929 },
    usgsId: "12092000",
    riskLevel: "high", 
    lastFlood: "2023",
    stage: null,
    discharge: null
  },
  { 
    id: 6, 
    name: "Cedar River at Renton, WA", 
    location: "Renton, WA", 
    coordinates: { lat: 47.4829, lng: -122.2171 },
    usgsId: "12119000",
    riskLevel: "moderate", 
    lastFlood: "2022",
    stage: null,
    discharge: null
  }
];

// Interface for river data with optional USGS data
interface RiverData {
  id: number;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  usgsId: string;
  riskLevel: string;
  lastFlood: string;
  stage: number | null;
  discharge: number | null;
  distance?: number;
  usgsDataStatus?: 'loading' | 'success' | 'error';
}

const getRiskLevelClasses = (riskLevel: string) => {
  switch (riskLevel) {
    case "high":
      return "bg-supp-bright-brick text-secondary-white border-supp-bright-brick";
    case "moderate":
      return "bg-supp-bright-gold text-secondary-white border-supp-bright-gold";
    case "low":
      return "bg-supp-bright-green text-secondary-white border-supp-bright-green";
    default:
      return "bg-secondary-gray text-secondary-white border-secondary-gray";
  }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Function to fetch USGS data for a single site
const fetchUSGSDataForSite = async (usgsId: string) => {
  try {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours

    // Fetch stage data (parameter code: 00065)
    const stageResponse = await fetch(
      `https://waterservices.usgs.gov/nwis/iv/?sites=${usgsId}&parameterCd=00065&startDT=${startDate}&endDT=${endDate}&format=json`
    );
    
    // Fetch discharge data (parameter code: 00060)
    const dischargeResponse = await fetch(
      `https://waterservices.usgs.gov/nwis/iv/?sites=${usgsId}&parameterCd=00060&startDT=${startDate}&endDT=${endDate}&format=json`
    );

    let stage = null;
    let discharge = null;

    // Process stage data
    if (stageResponse.ok) {
      const stageData = await stageResponse.json();
      const stageValues = stageData.value?.timeSeries?.[0]?.values?.[0]?.value;
      if (stageValues && stageValues.length > 0) {
        // Get the most recent value
        const latestStage = stageValues[stageValues.length - 1];
        stage = parseFloat(latestStage.value);
      }
    }

    // Process discharge data
    if (dischargeResponse.ok) {
      const dischargeData = await dischargeResponse.json();
      const dischargeValues = dischargeData.value?.timeSeries?.[0]?.values?.[0]?.value;
      if (dischargeValues && dischargeValues.length > 0) {
        // Get the most recent value
        const latestDischarge = dischargeValues[dischargeValues.length - 1];
        discharge = parseFloat(latestDischarge.value);
      }
    }

    return { stage, discharge };
  } catch (error) {
    console.error(`Error fetching USGS data for site ${usgsId}:`, error);
    return { stage: null, discharge: null };
  }
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userCity, setUserCity] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<'asking' | 'success' | 'error' | 'denied'>('asking');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [filteredRivers, setFilteredRivers] = useState<RiverData[]>([]);
  const [searchTerm, setSearchTerm] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  const [usgsDataLoading, setUsgsDataLoading] = useState(false);

  // Initialize rivers with loading status
  useEffect(() => {
    const initialRivers = riversData.map(river => ({
      ...river,
      usgsDataStatus: 'loading' as const
    }));
    setFilteredRivers(initialRivers);
    
    // Fetch USGS data for all rivers
    fetchAllUSGSData(initialRivers);
  }, []);

  // Fetch USGS data for all rivers
  const fetchAllUSGSData = async (rivers: RiverData[]) => {
    setUsgsDataLoading(true);
    
    const updatedRivers = await Promise.all(
      rivers.map(async (river) => {
        const usgsData = await fetchUSGSDataForSite(river.usgsId);
        return {
          ...river,
          stage: usgsData.stage,
          discharge: usgsData.discharge,
          usgsDataStatus: (usgsData.stage !== null || usgsData.discharge !== null) ? 'success' : 'error' as const
        };
      })
    );
    
    setFilteredRivers(updatedRivers as RiverData[]);
    setUsgsDataLoading(false);
  };

  useEffect(() => {
    // If no query provided, show location popup
    if (!query) {
      setShowLocationPopup(true);
    } else {
      // Check if query looks like a ZIP code
      const zipCodePattern = /^\d{5}(-\d{4})?$/;
      const isZipCode = zipCodePattern.test(query.trim());
      
      if (isZipCode) {
        // Handle ZIP code query by geocoding and finding nearby rivers
        handleZipCodeSearch(query);
      } else {
        // Filter rivers based on search query for names and locations
        const filtered = filteredRivers.filter(river => 
          river.name.toLowerCase().includes(query.toLowerCase()) ||
          river.location.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredRivers(filtered);
      }
    }
  }, [query]);

  const handleZipCodeSearch = async (zipCode: string) => {
    setIsSearching(true);
    const locationData = await geocodeLocation(zipCode);
    if (locationData) {
      setUserLocation({
        lat: locationData.lat,
        lng: locationData.lng
      });
      setUserCity(locationData.city);
      updateRiversByProximity({lat: locationData.lat, lng: locationData.lng});
    } else {
      // If ZIP code geocoding fails, show all rivers
      setFilteredRivers(prev => prev.slice(0, 6));
    }
    setIsSearching(false);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.address) {
        const city = data.address.city || 
                    data.address.town || 
                    data.address.village || 
                    data.address.county ||
                    data.address.state;
        return city || 'Unknown Location';
      }
      return 'Unknown Location';
    } catch (error) {
      console.error('Geocoding error:', error);
      return 'Unknown Location';
    }
  };

  const geocodeLocation = async (query: string) => {
    try {
      // Enhanced query formatting for better ZIP code handling
      let searchQuery = query.trim();
      
      // If it looks like a ZIP code (5 digits or 5+4 format), add USA context
      if (/^\d{5}(-\d{4})?$/.test(searchQuery)) {
        searchQuery = `${searchQuery}, USA`;
      }
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1&countrycodes=us`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const city = result.address.city || 
                    result.address.town || 
                    result.address.village || 
                    result.address.county ||
                    result.address.state ||
                    result.display_name.split(',')[0];
        
        return {
          city: city || 'Unknown Location',
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const requestLocation = () => {
    setLocationStatus('asking');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          
          // Get city name from coordinates
          const city = await reverseGeocode(coords.lat, coords.lng);
          setUserCity(city);
          
          setLocationStatus('success');
          setTimeout(() => {
            setShowLocationPopup(false);
            updateRiversByProximity(coords);
          }, 2000);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationStatus(error.code === 1 ? 'denied' : 'error');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationStatus('error');
    }
  };

  const handleManualLocation = async () => {
    if (manualLocation.trim()) {
      setLocationStatus('asking');
      
      const locationData = await geocodeLocation(manualLocation);
      
      if (locationData) {
        setUserLocation({
          lat: locationData.lat,
          lng: locationData.lng
        });
        setUserCity(locationData.city);
        setLocationStatus('success');
        setTimeout(() => {
          setShowLocationPopup(false);
          updateRiversByProximity({lat: locationData.lat, lng: locationData.lng});
        }, 2000);
      } else {
        setLocationStatus('error');
      }
    }
  };

  const updateRiversByProximity = (userCoords: {lat: number, lng: number}) => {
    const riversWithDistance = filteredRivers.map(river => ({
      ...river,
      distance: calculateDistance(
        userCoords.lat, userCoords.lng,
        river.coordinates.lat, river.coordinates.lng
      )
    }));
    
    // Sort by distance and take top 6
    const sortedRivers = riversWithDistance
      .sort((a, b) => a.distance! - b.distance!)
      .slice(0, 6);
    
    setFilteredRivers(sortedRivers);
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      setIsSearching(true);
      
      // Check if search term looks like a ZIP code
      const zipCodePattern = /^\d{5}(-\d{4})?$/;
      const isZipCode = zipCodePattern.test(searchTerm.trim());
      
      if (isZipCode) {
        // Handle ZIP code search by geocoding and finding nearby rivers
        const locationData = await geocodeLocation(searchTerm);
        if (locationData) {
          setUserLocation({
            lat: locationData.lat,
            lng: locationData.lng
          });
          setUserCity(locationData.city);
          updateRiversByProximity({lat: locationData.lat, lng: locationData.lng});
        } else {
          // If ZIP code geocoding fails, show all rivers
          setFilteredRivers(prev => prev.slice(0, 6));
        }
      } else {
        // Handle text search for river names and locations
        const filtered = filteredRivers.filter(river => 
          river.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          river.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredRivers(filtered);
      }
      
      setIsSearching(false);
    }
  };

  const skipLocation = () => {
    setShowLocationPopup(false);
    setFilteredRivers(prev => prev.slice(0, 6)); // Show first 6 rivers
  };

  const formatStageValue = (stage: number | null) => {
    if (stage === null) return '--';
    return `${stage.toFixed(2)} ft`;
  };

  const formatDischargeValue = (discharge: number | null) => {
    if (discharge === null) return '--';
    return discharge >= 1000 ? 
      `${(discharge / 1000).toFixed(1)}k cfs` : 
      `${discharge.toLocaleString()} cfs`;
  };

  return (
    <div className="min-h-screen bg-background-lightpurple">
      {/* Location Popup */}
      {showLocationPopup && (
        <div className="fixed inset-0 bg-primary-purple bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-white rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-secondary-gold">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary-purple flex items-center">
                <Navigation className="h-5 w-5 mr-2" />
                Find Rivers Near You
              </h2>
              <button
                onClick={skipLocation}
                className="text-secondary-gray hover:text-secondary-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {locationStatus === 'asking' && (
              <div className="text-center">
                <MapPin className="h-12 w-12 text-primary-purple mx-auto mb-4" />
                <p className="text-secondary-black mb-6">
                  To show you the most relevant rivers, we&apos;d like to know your approximate location.
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
                <div className="h-12 w-12 bg-supp-bright-green rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="h-6 w-6 text-secondary-white">✓</div>
                </div>
                <p className="text-secondary-black mb-2">Location found!</p>
                <p className="text-sm text-secondary-gray">
                  {userCity || 'Loading location...'}
                </p>
              </div>
            )}

            {locationStatus === 'error' && (
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-supp-bright-brick mx-auto mb-4" />
                <p className="text-secondary-black mb-4">Unable to get your location automatically.</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter city, ZIP code, or address..."
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-gray rounded focus:ring-2 focus:ring-primary-purple focus:border-primary-purple"
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
                <AlertTriangle className="h-12 w-12 text-supp-bright-brick mx-auto mb-4" />
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
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-primary-purple hover:text-supp-bright-brick transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-primary-purple">River Search</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-4 h-5 w-5 text-secondary-gray" />
            <input
              type="text"
              placeholder="Search by city, ZIP code (e.g., 98052), or river name..."
              className="w-full pl-10 pr-4 py-3 text-gray-700 border-1 border-secondary-gray rounded focus:ring-1 focus:ring-primary-purple focus:border-primary-purple"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isSearching && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full mt-3 bg-primary-purple text-white py-3 hover:bg-secondary-gold transition-colors border-2 border-primary-purple hover:border-secondary-gold hover:text-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            ) : (
              'Search Rivers'
            )}
          </button>
        </div>

        {/* Results */}
        <div className="bg-secondary-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-primary-purple">
                {userLocation ? 'USGS Monitoring Sites Near You' : 'USGS Monitoring Sites'}
              </h2>
              <p className="text-sm text-secondary-gray mt-1">
                Real-time data from U.S. Geological Survey gauge stations
                {usgsDataLoading && (
                  <span className="ml-2 text-supp-bright-gold">• Loading current data...</span>
                )}
              </p>
            </div>
            {userCity && (
              <p className="text-sm text-secondary-gray">
                Showing results near: {userCity}
              </p>
            )}
          </div>

          {filteredRivers.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-secondary-gray mx-auto mb-4" />
              <p className="text-secondary-gray">No rivers found matching your search.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRivers.map((river) => (
                <div
                  key={river.id}
                  className="p-6 border-2 bg-supp-bright-cream rounded-lg shadow-md hover:border-secondary-gold cursor-pointer transition-colors"
                  onClick={() => window.location.assign(`/river/${river.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-primary-purple text-lg">{river.name}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRiskLevelClasses(river.riskLevel)}`}>
                      {river.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center text-secondary-gray mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{river.location}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-secondary-gray">Current Stage</p>
                      <div className="flex items-center">
                        <p className="font-semibold text-primary-purple">
                          {formatStageValue(river.stage)}
                        </p>
                        {river.usgsDataStatus === 'loading' && (
                          <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b border-primary-purple"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-secondary-gray">Discharge</p>
                      <div className="flex items-center">
                        <p className="font-semibold text-primary-purple">
                          {formatDischargeValue(river.discharge)}
                        </p>
                        {river.usgsDataStatus === 'loading' && (
                          <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b border-primary-purple"></div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-secondary-gray">
                    <p className="text-xs text-secondary-gray">USGS Site: {river.usgsId}</p>
                    <p className="text-xs text-secondary-gray">Last flood: {river.lastFlood}</p>
                    {userLocation && 'distance' in river && river.distance && (
                      <p className="text-xs text-secondary-gray">
                        {river.distance.toFixed(1)} miles away
                      </p>
                    )}
                    {river.usgsDataStatus === 'error' && (
                      <p className="text-xs text-supp-bright-brick mt-1">
                        Live data temporarily unavailable
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}