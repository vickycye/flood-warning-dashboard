"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";

export default function SearchResultsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Placeholder for search results
  return (
    <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center">
      <div className="bg-white border-2 border-purple-200 shadow-sm p-8 max-w-xl w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-purple-900">Search for a River or Location</h1>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
          <input
            type="text"
            placeholder="Search by city, ZIP code, or river name..."
            className="w-full pl-10 pr-4 py-3 border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-purple-600">(Search results will appear here.)</div>
      </div>
    </div>
  );
} 