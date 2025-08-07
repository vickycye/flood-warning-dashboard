import csv
import json

input_csv = "flood_levels_all_sites_valid.csv"
output_json = "flood_thresholds.json"

flood_sites = []

with open(input_csv, newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        site = {
            "id": int(row["site_code"]),
            "usgsId": int(row["usgsId"]),
            "name": row["siteName"],
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "floodThresholds": {
                "minor": float(row["minor_stage"]),
                "moderate": float(row["mod_stage"]),
                "major": float(row["major_stage"]),
                "action": float(row["action_stage"])
            }
        }
        flood_sites.append(site)

with open(output_json, "w") as f:
    json.dump(flood_sites, f, indent=2)

print(f"Converted {len(flood_sites)} flood sites to JSON.")