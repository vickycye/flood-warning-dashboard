import requests
from pyproj import Transformer

# Fetch data
url = "https://mapservices.weather.noaa.gov/eventdriven/rest/services/water/riv_gauges/MapServer/15/query?f=json&cacheHint=true&maxRecordCountFactor=4&resultOffset=0&resultRecordCount=8000&where=status%20%3D%20%27minor%27%20OR%20status%20%3D%20%27moderate%27%20OR%20status%20%3D%20%27major%27&orderByFields=objectid%20ASC&outFields=objectid%2Cstatus&outSR=102100&spatialRel=esriSpatialRelIntersects"
resp = requests.get(url)
data = resp.json()

# Set up transformer
transformer = Transformer.from_crs("EPSG:3857", "EPSG:4326", always_xy=True)

# Convert each site
at_risk_sites = []
for feature in data["features"]:
    status = feature["attributes"]["status"]
    objectid = feature["attributes"]["objectid"]
    x, y = feature["geometry"]["x"], feature["geometry"]["y"]
    lon, lat = transformer.transform(x, y)
    at_risk_sites.append({
        "id": objectid,
        "status": status,
        "latitude": lat,
        "longitude": lon,
    })

# Print results
for site in at_risk_sites[:5]:  # show first 5
    print(site)