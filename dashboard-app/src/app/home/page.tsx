"use client";
import React, { useState } from "react";
import { Search, Map, TrendingUp, AlertTriangle } from "lucide-react";

const featuredRivers = [
  { id: 1, name: "Snohomish River near Monroe, WA", location: "Monroe, WA", riskLevel: "moderate", lastFlood: "2022" },
  { id: 2, name: "Nooksack River at Ferndale, WA", location: "Ferndale, WA", riskLevel: "high", lastFlood: "2023" },
  { id: 3, name: "Skagit River near Mount Vernon, WA", location: "Mount Vernon, WA", riskLevel: "low", lastFlood: "2019" }
];

const getRiskLevelClasses = (riskLevel: string) => {
  switch (riskLevel) { // colors need to be changed
    case "high":
      return "bg-red-100 text-red-800 border-red-300";
    case "moderate":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "low":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export default function LandingPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-background-lightpurple">
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-supp-muted-brick mb-6" />
        <h1 className="text-4xl font-bold text-primary-purple mb-4">
          Is your river at risk of flooding?
        </h1>
        <p className="text-xl text-secondary-black mb-8">
          Explore flood history and future risk for rivers in the Pacific Northwest.
        </p>
        
        <h1 className="text-5xl font-bold text-supp-bright-brick mb-8">
          THIS WEBSITE IS STILL UNDER DEVELOPMENT. INFORMATION MAY BE INACCURATE. 
        </h1>

        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-4 h-5 w-5 text-secondary-gray" />
            <input
              type="text"
              placeholder="Search by city, ZIP code (e.g., 98052), or river name..."
              className="w-full pl-10 pr-4 py-3 text-gray-700 border-1 border-secondary-gray focus:ring-1 focus:ring-primary-purple focus:border-primary-purple"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && window.location.assign(`/search?query=${searchTerm}`)}
            />
          </div>
          <button
            onClick={() => window.location.assign(`/search?query=${searchTerm}`)}
            className="w-full mt-3 bg-primary-purple text-white py-3 hover:bg-secondary-gold transition-colors border-2 border-primary-purple hover:border-secondary-gold hover:text-black"
          >
            Find My Flood Risk
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <button
            onClick={() => window.location.assign("/map")}
            className="p-6 border-2 border-white bg-secondary-white hover:border-2 hover:border-secondary-gold transition-colors shadow-sm"
          >
            <Map className="h-8 w-8 text-primary-purple mx-auto mb-3" />
            <h3 className="font-semibold text-primary-purple">Explore Regional Map</h3>
            <p className="text-gray-500 text-sm mt-2">View all monitored rivers on an interactive map</p>
          </button>
          <button className="p-6 border-2 border-white bg-secondary-white hover:border-2 hover:border-secondary-gold transition-colors shadow-sm">
            <TrendingUp className="h-8 w-8 text-supp-bright-brick mx-auto mb-3" />
            <h3 className="font-semibold text-primary-purple">High Risk Areas</h3>
            <p className="text-gray-500 text-sm mt-2">See rivers with elevated flood risk</p>
          </button>
        </div>
        <div className="bg-secondary-white shadow-sm p-10">
          <h2 className="text-2xl font-semibold text-primary-purple mb-6">Nearby Rivers - Long Term Future Risk</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredRivers.map((river) => (
              <div
                key={river.id}
                className="p-4 border-2 bg-supp-bright-cream shadow-md hover:border-secondary-gold cursor-pointer transition-color"
                onClick={() => window.location.assign(`/river/${river.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-primary-purple">{river.name}</h3>
                  <span className={`px-2 py-1 text-xs border ${getRiskLevelClasses(river.riskLevel)}`}>
                    {river.riskLevel}
                  </span>
                </div>
                <p className="text-primary-purple text-sm">{river.location}</p>
                <p className="text-gray-500 text-xs mt-1">Last flood: {river.lastFlood}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Full-width research section */}
      <div className="w-full bg-background-cream py-18">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-semibold text-primary-purple mb-4">Latest Research</h3>
          <p className="text-lg text-secondary-black leading-relaxed">
            New climate projections show increasing flood frequency across Pacific Northwest rivers.
            <span className="text-supp-bright-blue underline cursor-pointer hover:text-supp-muted-blue transition-colors"> Read more about our methodology.</span>
          </p>
        </div>
      </div>
    </div>
  );
} 