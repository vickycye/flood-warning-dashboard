"use client";
import React, { useState } from "react";
import { MapPin, Eye, EyeOff, Calendar, TrendingUp, Info, Download, BarChart3 } from "lucide-react";

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

const TABS = [
  { id: "history", label: "Flood History", icon: Calendar },
  { id: "projections", label: "Future Risk", icon: TrendingUp },
  { id: "learn", label: "Learn More", icon: Info },
  { id: "data", label: "Download Data", icon: Download }
];

export default function RiverDashboardPage() {
  const [activeTab, setActiveTab] = useState("history");
  const [expertMode, setExpertMode] = useState(false);

  return (
    <div className="min-h-screen bg-background-lightpurple">
      <div className="bg-secondary-white border-b-2 border-secondary-gold shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => window.location.assign("/")}
              className="text-primary-purple hover:text-supp-bright-brick flex items-center transition-colors"
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
              <h1 className="text-3xl font-bold text-primary-purple">{riverData.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-secondary-black">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-supp-bright-brick" />
                  {riverData.location}
                </span>
                {expertMode && (
                  <span className="text-sm text-secondary-gray">USGS ID: {riverData.usgsId}</span>
                )}
              </div>
            </div>
            <div className="bg-supp-bright-cream border-2 border-secondary-gold p-3 w-32 h-24 rounded">
              <div className="text-xs text-primary-purple mb-1">Mini Map</div>
              <div className="bg-background-lightpurple w-full h-full flex items-center justify-center rounded">
                <MapPin className="h-6 w-6 text-primary-purple" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-secondary-white border-b-2 border-secondary-gold">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {TABS.map((tab) => (
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "history" && (
          <div className="space-y-8">
            <div className="bg-secondary-white border-2 border-secondary-gold shadow-sm p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-primary-purple">Historical Flood Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-background-lightpurple border-2 border-secondary-gold rounded">
                  <div className="text-2xl font-bold text-primary-purple">{riverData.floodHistory.totalEvents}</div>
                  <div className="text-sm text-secondary-black">Total Floods Since 1990</div>
                </div>
                <div className="text-center p-4 bg-supp-bright-brick bg-opacity-10 border-2 border-supp-bright-brick rounded">
                  <div className="text-2xl font-bold text-supp-bright-brick">{riverData.floodHistory.majorEvents}</div>
                  <div className="text-sm text-supp-bright-brick">Major Floods</div>
                </div>
                <div className="text-center p-4 bg-supp-bright-gold bg-opacity-10 border-2 border-supp-bright-gold rounded">
                  <div className="text-2xl font-bold text-supp-bright-gold">{riverData.floodHistory.moderateEvents}</div>
                  <div className="text-sm text-supp-bright-gold">Moderate Floods</div>
                </div>
                <div className="text-center p-4 bg-supp-bright-green bg-opacity-10 border-2 border-supp-bright-green rounded">
                  <div className="text-2xl font-bold text-supp-bright-green">{riverData.floodHistory.minorEvents}</div>
                  <div className="text-sm text-supp-bright-green">Minor Floods</div>
                </div>
              </div>
              <div className="bg-supp-bright-cream border-2 border-secondary-gold p-4 h-48 flex items-center justify-center rounded">
                <BarChart3 className="h-8 w-8 text-primary-purple mr-2" />
                <span className="text-primary-purple">Interactive flood frequency chart would appear here</span>
              </div>
            </div>
            <div className="bg-secondary-white border-2 border-secondary-gold shadow-sm p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-primary-purple">Recent Major Flood Events</h3>
              <div className="space-y-3">
                {riverData.floodHistory.recentYears.map((year) => (
                  <div key={year} className="flex items-center justify-between p-3 bg-background-lightpurple border-2 border-secondary-gold rounded hover:bg-supp-bright-cream transition-colors">
                    <span className="font-medium text-primary-purple">{year} Flood Event</span>
                    <span className="text-sm text-secondary-black">Peak: 15.2 ft • Duration: 3 days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Add projections, learn, and data tabs here as needed */}
      </div>
    </div>
  );
} 