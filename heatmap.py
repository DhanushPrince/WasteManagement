import sqlite3
import folium
from folium.plugins import HeatMap

# ==========================================================
# DATABASE
# ==========================================================
DB_PATH = "waste.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Fetch coordinates from updated table
cursor.execute("""
SELECT lat, lng, estimated_weight_kg
FROM waste_tickets
""")

rows = cursor.fetchall()
conn.close()

# ==========================================================
# PREPARE HEATMAP DATA
# ==========================================================
# format: [lat, lng, intensity]
heat_data = [
    [row[0], row[1], row[2]] for row in rows
]

# ==========================================================
# CREATE COIMBATORE MAP
# ==========================================================
coimbatore_center = [11.0168, 76.9558]

m = folium.Map(
    location=coimbatore_center,
    zoom_start=11,
    tiles="OpenStreetMap"
)

# ==========================================================
# ADD HEATMAP LAYER
# ==========================================================
HeatMap(
    heat_data,
    radius=18,
    blur=25,
    max_zoom=13
).add_to(m)

# ==========================================================
# SAVE MAP
# ==========================================================
output_file = "coimbatore_heatmap.html"
m.save(output_file)

print(f"✅ Heatmap generated → {output_file}")