"use client";
import React from "react";

export default function WhatThisMeansPage() {
  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white border-2 border-purple-200 shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-4 text-purple-900">What Does This Dashboard Mean?</h1>
        <p className="mb-4 text-purple-800">
          This dashboard helps you understand flood risk for rivers in your region. We use observed data and climate projections to show both historical flood frequency and future risk under different scenarios.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2 text-purple-900">Flood Categories</h2>
        <ul className="mb-4 list-disc pl-6 text-purple-800">
          <li><b>Minor Flood:</b> Minimal or no property damage, but possible public threat.</li>
          <li><b>Moderate Flood:</b> Some inundation of structures and roads near streams. Some evacuations may be required.</li>
          <li><b>Major Flood:</b> Extensive inundation of structures and roads. Significant evacuations and property damage.</li>
        </ul>
        <h2 className="text-xl font-semibold mt-6 mb-2 text-purple-900">How to Use</h2>
        <p className="mb-4 text-purple-800">
          Use the search bar to find your river or location. Explore the map for a regional overview. Click on a river for detailed flood history and projections. Download data for your own analysis.
        </p>
        <div className="mt-8 text-sm text-purple-600 border-t-2 border-purple-200 pt-4">
          <b>Note:</b> All data is open and sourced from NOAA, USGS, and climate model projections. For more details, see our methodology or contact us.
        </div>
      </div>
    </div>
  );
} 