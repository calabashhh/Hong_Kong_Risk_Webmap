// =======================================
// 1. Initialize the Map + Basemap
// =======================================

const map = L.map("map", {
  center: [22.32, 114.17], // Hong Kong approx
  zoom: 12,
  minZoom: 10,
  maxZoom: 18
});

// CartoDB Dark Matter basemap
L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, &copy; CARTO'
  }
).addTo(map);


// =======================================
// 2. Helpers for crash risk
// =======================================

// Map risk_class -> color + label
function getRiskInfo(riskClass) {
  switch (riskClass) {
    case 0:
      return { color: "#969696", label: "No Recorded Crashes" };
    case 1:
      return { color: "#66bb6a", label: "Very Low Risk" };
    case 2:
      return { color: "#b0e57c", label: "Low Risk" };
    case 3:
      return { color: "#d4b800", label: "Moderate Risk" };
    case 4:
      return { color: "#ff9800", label: "High Risk" };
    case 5:
      return { color: "#e53935", label: "Very High Risk" };
    default:
      return { color: "#000000", label: "Unknown" };
  }
}

// Line style for crash layer
function crashRiskStyle(feature) {
  const riskClass = feature.properties.risk_class;
  const riskInfo = getRiskInfo(riskClass);

  return {
    color: riskInfo.color,
    weight: 2,
    opacity: 0.9
  };
}

// Safe number formatter
function fmt(value, decimals) {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  return Number(value).toFixed(decimals);
}


// =======================================
// 3. Popup: QGIS-style HTML, updated fields
// =======================================

function crashPopup(feature) {
  const p = feature.properties || {};
  const riskInfo = getRiskInfo(p.risk_class);

  const segId = p.OBJECTID ?? "";
  const streetEn = p.STREET_ENAME ?? "N/A";
  const streetZh = p.STREET_CNAME ?? "";
  const lengthM = fmt(p.length_m, 1);

  const crashDensity = fmt(p.crash_density, 2); // updated field name
  const crashCount = p["Crash Density_crash_crash_count"] ?? "N/A";

  const sevIndex = fmt(p.sev_norm, 2);          // updated field name
  const rainPct = fmt((p.vis_wea_refined_pct_rain ?? 0) * 100, 1);
  const darkPct = fmt(
    (p.vis_wea_refined_pct_dark_or_twilight ?? 0) * 100,
    1
  );

  const lightingRatio = fmt(
    (p["Lighting Level_roads_lit_summary_lit_ratio"] ?? 0) * 100,
    1
  );
  const crossingDensity = fmt(p.crossing_density, 2);
  const slopeMean = fmt(p["Road Slope_slp_mean_clean"], 2);

  return `
  <div style="
    background: rgba(240,240,240,0.90);
    padding: 12px 16px;
    border-radius: 8px;
    width: 260px;
    font-family: 'Segoe UI', sans-serif;
    font-size: 11.5px;
    line-height: 1.35;
    border-left: 6px solid ${riskInfo.color};
  ">

    <h3 style="margin:0; padding:0; font-size:15px;">
      🚕 Road Segment ${segId}
    </h3>

    <b>Street:</b> ${streetEn}<br>
    <span style="color:#555; font-size:10.5px;">
      ${streetZh}
    </span><br>
    <b>Segment Length:</b> ${lengthM} m

    <hr style="margin:6px 0; border:0; border-top:1px solid #ccc;">

    <h4 style="margin:0 0 2px 0; font-size:12.5px;">
      Crash-Based Risk Indicators
    </h4>
    <small style="color:#666;">(Historical crash data, 2014–2019)</small><br>

    <b>Risk Level:</b>
    <span style="font-weight:bold; color:${riskInfo.color};">
      ${riskInfo.label}
    </span><br>

    <b>Crash Density:</b> ${crashDensity} crashes/km<br>
    <b>Crash Count:</b> ${crashCount}<br>
    <b>Severity Index:</b> ${sevIndex}<br>
    <b>Rain-Related Crashes:</b> ${rainPct}%<br>
    <b>Dark/Twilight Crashes:</b> ${darkPct}%

    <hr style="margin:6px 0; border:0; border-top:1px solid #ccc;">

    <h4 style="margin:0 0 2px 0; font-size:12.5px;">
      Road Environment Context
    </h4>
    <small style="color:#666;">(Road characteristics, not crash-derived)</small><br>

    <b>Lighting Ratio:</b> ${lightingRatio}% lit<br>
    <b>Ped Crossing Density:</b> ${crossingDensity} crossings/100m<br>
    <b>Road Elevation Variability (mean):</b> ${slopeMean}%
  </div>
  `;
}


// =======================================
// 4. Create crash layer & add to map
// =======================================

// hk_risk_crash comes from hk_risk_crash.js
console.log("typeof hk_risk_crash =", typeof hk_risk_crash);

const crashLayer = L.geoJSON(hk_risk_crash, {
  style: crashRiskStyle,
  onEachFeature: function (feature, layer) {
    layer.bindPopup(crashPopup(feature));
  }
});

crashLayer.addTo(map);

// Zoom map to layer extent
const bounds = crashLayer.getBounds();
if (bounds && bounds.isValid && bounds.isValid()) {
  map.fitBounds(bounds);
}

console.log("Crash risk layer loaded:", crashLayer);
