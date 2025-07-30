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
    <div className="min-h-screen bg-purple-50">
      <div className="bg-white border-b-2 border-purple-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => window.location.assign("/")}
              className="text-purple-600 hover:text-purple-800 flex items-center"
            >
              ← Back to Search
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setExpertMode(!expertMode)}
                className={`flex items-center px-3 py-1 text-sm border-2 ${
                  expertMode ? "bg-purple-100 text-purple-800 border-purple-300" : "bg-gray-100 text-gray-600 border-gray-300"
                }`}
              >
                {expertMode ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                {expertMode ? "Expert View" : "Simple View"}
              </button>
            </div>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-900">{riverData.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-purple-700">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {riverData.location}
                </span>
                {expertMode && (
                  <span className="text-sm">USGS ID: {riverData.usgsId}</span>
                )}
              </div>
            </div>
            <div className="bg-purple-100 border-2 border-purple-200 p-3 w-32 h-24">
              <div className="text-xs text-purple-600 mb-1">Mini Map</div>
              <div className="bg-purple-200 w-full h-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border-b-2 border-purple-200">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-purple-500 hover:text-purple-700"
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
            <div className="bg-white border-2 border-purple-200 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-purple-900">Historical Flood Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-purple-50 border-2 border-purple-200">
                  <div className="text-2xl font-bold text-purple-900">{riverData.floodHistory.totalEvents}</div>
                  <div className="text-sm text-purple-700">Total Floods Since 1990</div>
                </div>
                <div className="text-center p-4 bg-red-50 border-2 border-red-200">
                  <div className="text-2xl font-bold text-red-600">{riverData.floodHistory.majorEvents}</div>
                  <div className="text-sm text-red-700">Major Floods</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 border-2 border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{riverData.floodHistory.moderateEvents}</div>
                  <div className="text-sm text-yellow-700">Moderate Floods</div>
                </div>
                <div className="text-center p-4 bg-green-50 border-2 border-green-200">
                  <div className="text-2xl font-bold text-green-600">{riverData.floodHistory.minorEvents}</div>
                  <div className="text-sm text-green-700">Minor Floods</div>
                </div>
              </div>
              <div className="bg-purple-100 border-2 border-purple-200 p-4 h-48 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-purple-400 mr-2" />
                <span className="text-purple-600">Interactive flood frequency chart would appear here</span>
              </div>
            </div>
            <div className="bg-white border-2 border-purple-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-purple-900">Recent Major Flood Events</h3>
              <div className="space-y-3">
                {riverData.floodHistory.recentYears.map((year) => (
                  <div key={year} className="flex items-center justify-between p-3 bg-purple-50 border-2 border-purple-200">
                    <span className="font-medium text-purple-900">{year} Flood Event</span>
                    <span className="text-sm text-purple-700">Peak: 15.2 ft • Duration: 3 days</span>
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