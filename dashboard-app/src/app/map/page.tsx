"use client";
import React from "react";
import { MapPin } from "lucide-react";

export default function MapViewPage() {
  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center">
      <div className="bg-white border-2 border-purple-200 shadow-sm p-8 max-w-2xl w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-purple-900">Interactive River Map</h1>
        <div className="bg-purple-100 border-2 border-purple-200 h-64 flex items-center justify-center mb-4">
          <MapPin className="h-12 w-12 text-purple-600" />
        </div>
        <p className="text-purple-800 mb-2">Map showing river sites across the region. Color-coded markers by flood risk level or most recent flood event.</p>
        <p className="text-purple-600 text-sm">(NOAA and USGS data may be slow to load.)</p>
      </div>
    </div>
  );
} 