"use client";
import React, { useState } from "react";
import { Search, Map, TrendingUp, AlertTriangle } from "lucide-react";

const featuredRivers = [
  { id: 1, name: "Snohomish River", location: "Monroe, WA", riskLevel: "moderate", lastFlood: "2022" },
  { id: 2, name: "Nooksack River", location: "Ferndale, WA", riskLevel: "high", lastFlood: "2023" },
  { id: 3, name: "Skagit River", location: "Mount Vernon, WA", riskLevel: "low", lastFlood: "2019" }
];

const getRiskLevelClasses = (riskLevel: string) => {
  switch (riskLevel) {
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-purple-600 mb-6" />
        <h1 className="text-4xl font-bold text-purple-900 mb-4">
          Is your river at risk of flooding?
        </h1>
        <p className="text-xl text-purple-700 mb-8">
          Explore flood history and future risk for rivers in the Pacific Northwest
        </p>
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
            <input
              type="text"
              placeholder="Search by city, ZIP code, or river name..."
              className="w-full pl-10 pr-4 py-3 text-gray-700 border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && window.location.assign(`/search?query=${searchTerm}`)}
            />
          </div>
          <button
            onClick={() => window.location.assign(`/search?query=${searchTerm}`)}
            className="w-full mt-3 bg-purple-600 text-white py-3 hover:bg-purple-700 transition-colors border-2 border-purple-600"
          >
            Find My Flood Risk
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <button
            onClick={() => window.location.assign("/map")}
            className="p-6 bg-white border-2 border-purple-200 hover:border-purple-300 transition-colors shadow-sm"
          >
            <Map className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-purple-900">Explore Regional Map</h3>
            <p className="text-purple-700 text-sm mt-2">View all monitored rivers on an interactive map</p>
          </button>
          <button className="p-6 bg-white border-2 border-yellow-200 hover:border-yellow-300 transition-colors shadow-sm">
            <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-semibold text-purple-900">High Risk Areas</h3>
            <p className="text-purple-700 text-sm mt-2">See rivers with elevated flood risk</p>
          </button>
        </div>
        <div className="bg-white border-2 border-purple-200 shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-purple-900 mb-6">Featured Rivers</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredRivers.map((river) => (
              <div
                key={river.id}
                className="p-4 border-2 border-purple-200 hover:border-purple-300 cursor-pointer transition-colors bg-white"
                onClick={() => window.location.assign(`/river/${river.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-purple-900">{river.name}</h3>
                  <span className={`px-2 py-1 text-xs border ${getRiskLevelClasses(river.riskLevel)}`}>
                    {river.riskLevel}
                  </span>
                </div>
                <p className="text-purple-800 text-sm">{river.location}</p>
                <p className="text-purple-700 text-xs mt-1">Last flood: {river.lastFlood}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 bg-purple-100 border-2 border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">Latest Research</h3>
          <p className="text-purple-800">
            New climate projections show increasing flood frequency across Pacific Northwest rivers.
            <span className="underline cursor-pointer"> Read more about our methodology.</span>
          </p>
        </div>
      </div>
    </div>
  );
} 