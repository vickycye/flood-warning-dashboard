"use client";
import React, { useState, useEffect } from "react";
import { MapPin, Navigation, X, CheckCircle, AlertCircle, Info } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });

interface FloodEvent {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}

export default function MapViewPage() {
  const [showLocationPopup, setShowLocationPopup] = useState(true);
  const [locationStatus, setLocationStatus] = useState<'asking' | 'success' | 'error' | 'denied'>('asking');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [userCity, setUserCity] = useState<string>('');
  const [manualLocation, setManualLocation] = useState('');
  const [floodEvents, setFloodEvents] = useState<FloodEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Sample flood data - in production, this would come from USGS/NOAA APIs
  const sampleFloodData: FloodEvent[] = [
    {
      id: '1',
      name: 'Snohomish River Flood',
      location: 'Monroe, WA',
      latitude: 47.8554,
      longitude: -121.9709,
      date: '2023-12-15',
      severity: 'major',
      description: 'Major flooding due to heavy rainfall and snowmelt. River levels exceeded flood stage by 3.2 feet.'
    },
    {
      id: '2',
      name: 'Nooksack River Flood',
      location: 'Ferndale, WA',
      latitude: 48.8465,
      longitude: -122.5910,
      date: '2023-11-28',
      severity: 'moderate',
      description: 'Moderate flooding affecting agricultural areas. River levels 2.1 feet above flood stage.'
    },
    {
      id: '3',
      name: 'Skagit River Flood',
      location: 'Mount Vernon, WA',
      latitude: 48.4212,
      longitude: -122.3340,
      date: '2023-10-12',
      severity: 'minor',
      description: 'Minor flooding in low-lying areas. River levels 1.5 feet above flood stage.'
    },
    {
      id: '4',
      name: 'Puyallup River Flood',
      location: 'Puyallup, WA',
      latitude: 47.1854,
      longitude: -122.2929,
      date: '2023-09-20',
      severity: 'major',
      description: 'Major flooding affecting residential areas. Evacuations ordered for low-lying neighborhoods.'
    },
    {
      id: '5',
      name: 'Cedar River Flood',
      location: 'Renton, WA',
      latitude: 47.4829,
      longitude: -122.2171,
      date: '2023-08-15',
      severity: 'moderate',
      description: 'Moderate flooding impacting industrial areas. River levels 2.8 feet above flood stage.'
    }
  ];

  useEffect(() => {
    // Show popup when page loads (its realistically not a pop-up, just a cover LOL)
    setShowLocationPopup(true);
    setFloodEvents(sampleFloodData);
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => { // data is NOT stored
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const city = result.address.city || 
                    result.address.town || 
                    result.address.village || 
                    result.address.county ||
                    result.address.state ||
                    result.display_name.split(',')[0]; // Fallback to first part of display name
        
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
          setTimeout(() => setShowLocationPopup(false), 2000);
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
        setTimeout(() => setShowLocationPopup(false), 2000);
      } else {
        setLocationStatus('error');
      }
    }
  };

  const skipLocation = () => {
    setShowLocationPopup(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
        return '#c75b12'; // supp-bright-brick
      case 'moderate':
        return '#ebb700'; // supp-bright-gold
      case 'minor':
        return '#5b8f22'; // supp-bright-green
      default:
        return '#c75b12';
    }
  };

  const getSeveritySize = (severity: string) => {
    switch (severity) {
      case 'major':
        return 12;
      case 'moderate':
        return 8;
      case 'minor':
        return 6;
      default:
        return 8;
    }
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
                Find Your Location
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
                  <div className="space-y-2 text-gray-400">
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
                <CheckCircle className="h-12 w-12 text-supp-bright-green mx-auto mb-4" />
                <p className="text-secondary-black mb-2">Location found!</p>
                <p className="text-sm text-secondary-gray">
                  {userCity || 'Loading location...'}
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

      {/* Map Container - Only shows when location is set */}
      {!showLocationPopup && (
        <div className="p-8">
          <div className="bg-secondary-white rounded-lg shadow-lg overflow-hidden">
            {/* Map Header */}
            <div className="bg-primary-purple text-secondary-white p-4">
              <h1 className="text-2xl font-bold">Interactive River Map</h1>
              {userCity && (
                <p className="text-secondary-gold mt-1">Showing data for: {userCity}</p>
              )}
            </div>
            
            {/* Map Content */}
            <div className="h-[80vh] w-full relative">
              <MapContainer
                center={userLocation || [47.6062, -122.3321]} // Default to Seattle
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
                    radius={8}
                    fillColor="#39275b"
                    color="#39275b"
                    weight={2}
                    opacity={1}
                    fillOpacity={0.8}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong>Your Location</strong><br />
                        {userCity}
                      </div>
                    </Popup>
                  </CircleMarker>
                )}

                {/* Flood Event Markers */}
                {floodEvents.map((event) => (
                  <CircleMarker
                    key={event.id}
                    center={[event.latitude, event.longitude]}
                    radius={getSeveritySize(event.severity)}
                    fillColor={getSeverityColor(event.severity)}
                    color={getSeverityColor(event.severity)}
                    weight={2}
                    opacity={1}
                    fillOpacity={0.8}
                  >
                    <Popup>
                      <div className="text-center min-w-[200px]">
                        <strong className="text-lg">{event.name}</strong><br />
                        <span className="text-sm text-gray-600">{event.location}</span><br />
                        <span className="text-sm text-gray-500">{event.date}</span><br />
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${
                          event.severity === 'major' ? 'bg-red-100 text-red-800' :
                          event.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {event.severity.toUpperCase()} FLOOD
                        </span><br />
                        <p className="text-sm mt-2">{event.description}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Map Legend */}
          <div className="absolute top-20 right-8 bg-white bg-opacity-95 rounded-lg p-4 shadow-lg border border-secondary-gold">
            <h3 className="font-semibold text-primary-purple mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Flood Events
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                <span>Major Flood</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span>Moderate Flood</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
                <span>Minor Flood</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                <span>Your Location</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 