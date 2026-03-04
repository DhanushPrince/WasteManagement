export const ZONE_COLORS = {
  NORTH: "#EF5350", SOUTH: "#AB47BC", EAST: "#42A5F5",
  WEST: "#26A69A", CENTRAL: "#FF7043", INDUSTRIAL: "#607D8B"
};

export const ZONE_VEHICLE = {
  NORTH: "COMPACTOR", SOUTH: "COMPACTOR", EAST: "E-RICKSHAW",
  WEST: "PICKUP", CENTRAL: "COMPACTOR x2", INDUSTRIAL: "COMPACTOR + PICKUP"
};

export const ZONE_EMOJI = {
  NORTH: "🔴", SOUTH: "🟣", EAST: "🔵", WEST: "🟢", CENTRAL: "🟠", INDUSTRIAL: "⚫"
};

export const ALL_ZONES = ["ALL","NORTH","SOUTH","EAST","WEST","CENTRAL","INDUSTRIAL"];

export function assignZone(lat, lng) {
  if (lat >= 11.060) return "NORTH";
  if (lng >= 77.050) return "EAST";
  if (lng <= 76.940) return "WEST";
  if (lat <= 10.980) return "SOUTH";
  if (lat <= 11.020 && lng >= 76.94) return "CENTRAL";
  return "INDUSTRIAL";
}
