import { NextResponse } from "next/server";

// Web Mercator to WGS84 conversion
function webMercatorToLatLng(x: number, y: number): { lat: number; lng: number } {
  const R = 6378137.0;
  const lng = (x / R) * (180 / Math.PI);
  const lat = (Math.atan(Math.exp(y / R)) - Math.PI / 4) * 2 * (180 / Math.PI);
  return { lat, lng };
}

export async function GET() {
  try {
    const url =
      "https://mapservices.weather.noaa.gov/eventdriven/rest/services/water/riv_gauges/MapServer/15/query?f=json&cacheHint=true&maxRecordCountFactor=4&resultOffset=0&resultRecordCount=8000&where=status%20%3D%20%27minor%27%20OR%20status%20%3D%20%27moderate%27%20OR%20status%20%3D%20%27major%27&orderByFields=objectid%20ASC&outFields=objectid%2Cstatus&outSR=102100&spatialRel=esriSpatialRelIntersects";

    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream NOAA API failed." }, { status: res.status });
    }

    const data = await res.json();

    // 🔍 Debug what you actually got
    if (!data || !Array.isArray(data.features)) {
      console.error("Invalid NOAA API response:", data);
      return NextResponse.json({ error: "Invalid data from NOAA API" }, { status: 500 });
    }

    // ✅ Safe to map now
    const sites = data.features.map((feature: any) => {
      const { lat, lng } = webMercatorToLatLng(feature.geometry.x, feature.geometry.y);
      return {
        id: feature.attributes?.objectid,
        status: feature.attributes?.status,
        latitude: lat,
        longitude: lng,
      };
    });

    return NextResponse.json(sites);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}