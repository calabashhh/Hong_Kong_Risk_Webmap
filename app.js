// =======================================
// 1. Map + Basemap
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

let currentView = "risk"; // initial view

// --- Legend control (simple version) ---
const legendControl = L.control({ position: "bottomleft" });

legendControl.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "legend");
  this.update();
  return this._div;
};

legendControl.update = function (html) {
  if (this._div) {
    this._div.innerHTML = html || "";
  }
};

legendControl.addTo(map);


// =======================================
// 2. Helpers
// =======================================

function fmt(value, decimals) {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  return Number(value).toFixed(decimals);
}

function getRiskInfo(riskClass) {
  switch (riskClass) {
    case 0:
      return { color: "#969696", label: "No Recorded Crashes" };
    case 1:
      return { color: "#357538", label: "Very Low Risk" };
    case 2:
      return { color: "#66bb6a", label: "Low Risk" };
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

// Generic classifier helper
function classifyColor(value, breaks, colors) {
  if (value === null || value === undefined || isNaN(value)) {
    return "#555555"; // fallback for missing data
  }
  for (let i = 0; i < breaks.length - 1; i++) {
    if (value >= breaks[i] && value < breaks[i + 1]) {
      return colors[i];
    }
  }
  return colors[colors.length - 1];
}

// =======================================
// 3. Style per view
// =======================================

function styleForView(view, feature) {
  const p = feature.properties || {};
  let color = "#ffffff";

  switch (view) {
    case "risk": {
      const info = getRiskInfo(p.risk_class);
      color = info.color;
      break;
    }

    case "severity": {
      const breaks = [0, 0.07, 0.27, 0.76, 2.17, 3.94];
      const colors = ["#fff7bc", "#fec44f", "#fe9929", "#b34d1b", "#b01f0c"];
      color = classifyColor(p.sev_norm, breaks, colors);
      break;
    }

    case "rain": {
      const breaks = [0, 0.075692, 0.22581, 0.4, 0.75, 1.0];
      const colors = ["#deebf7", "#9ecae1", "#6baed6", "#3182bd", "#315bbd"];
      color = classifyColor(p.vis_wea_refined_pct_rain, breaks, colors);
      break;
    }

    case "dark": {
      const breaks = [0, 0.1333, 0.3684, 0.5556, 0.8, 1.0];
      const colors = ["#fde0dd", "#fbb6ce", "#f768a1", "#c51b8a", "#7a0177"];
      color = classifyColor(
        p.vis_wea_refined_pct_dark_or_twilight,
        breaks,
        colors
      );
      break;
    }

    case "lighting": {
      const breaks = [0.00008, 0.35266, 0.474, 0.56335, 0.69617, 1.0];
      const colors = ["#2d004b", "#542788", "#8073ac", "#f1a340", "#fee0b6"];
      color = classifyColor(
        p["Lighting Level_roads_lit_summary_lit_ratio"],
        breaks,
        colors
      );
      break;
    }

    case "crossings": {
      const v = p.crossing_density;
      if (v === 0) {
        color = "#734e2e"; // None
      } else if (v > 0 && v < 3) {
        color = "#d9b365"; // Sparse
      } else if (v >= 3 && v < 5) {
        color = "#f6e8c3"; // Moderate
      } else if (v >= 5 && v < 10) {
        color = "#c7eae5"; // Dense
      } else if (v >= 10) {
        color = "#5ab4ac"; // Very Dense
      } else {
        color = "#734e2e";
      }
      break;
    }

    case "slope": {
      const breaks = [0, 3, 6, 10, 15, 19, 20];
      const colors = [
        "#2c7bb6",
        "#abd9e9",
        "#ffffbf",
        "#fdae61",
        "#f46d43",
        "#d73027"
      ];
      color = classifyColor(p["Road Slope_slp_mean_clean"], breaks, colors);
      break;
    }

    default:
      color = "#ffffff";
  }

  return {
    color,
    weight: 2,
    opacity: 0.9,
    lineCap: "round",
    lineJoin: "round"
  };
}

// =======================================
// 4. Popup (same for all views)
// =======================================

function crashPopup(feature) {
  const p = feature.properties || {};
  const riskInfo = getRiskInfo(p.risk_class);

  const segId = p.OBJECTID ?? "";
  const streetEn = p.STREET_ENAME ?? "N/A";
  const streetZh = p.STREET_CNAME ?? "";
  const lengthM = fmt(p.length_m, 1);

  const crashDensity = fmt(p.crash_density, 2);
  const crashCount = p["Crash Density_crash_crash_count"] ?? "N/A";

  const sevIndex = fmt(p.sev_norm, 2);
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
// 5. Legend rendering
// =======================================

function renderLegend(title, subtitle, items) {
  const html = `
    <div class="legend-title">${title}</div>
    ${subtitle ? `<div class="legend-subtitle">${subtitle}</div>` : ""}
    ${items
      .map(
        (item) => `
        <div class="legend-row">
          <span class="legend-swatch" style="background:${item.color};"></span>
          <span class="legend-label">${item.label}</span>
        </div>
      `
      )
      .join("")}
  `;
  legendControl.update(html);
}

function updateLegend(view) {
  switch (view) {
    case "risk":
      renderLegend("Crash Risk", "Composite risk (2014–2019)", [
        { color: "#969696", label: "0 – No Recorded Crashes" },
        { color: "#357538", label: "1 – Very Low Risk" },
        { color: "#66bb6a", label: "2 – Low Risk" },
        { color: "#d4b800", label: "3 – Moderate Risk" },
        { color: "#ff9800", label: "4 – High Risk" },
        { color: "#e53935", label: "5 – Very High Risk" }
      ]);
      break;

    case "severity":
      renderLegend("Severity Weighted", "Weighted severity index per segment", [
        { color: "#fff7bc", label: "0.00–0.07 Very Low" },
        { color: "#fec44f", label: "0.07–0.27 Low" },
        { color: "#fe9929", label: "0.27–0.76 Moderate" },
        { color: "#b34d1b", label: "0.76–2.17 High" },
        { color: "#b01f0c", label: "2.17–3.94 Very High" }
      ]);
      break;

    case "rain":
      renderLegend("Rain Risk", "Share of crashes in rain", [
        { color: "#deebf7", label: "0–8% Very Low" },
        { color: "#9ecae1", label: "8–23% Low" },
        { color: "#6baed6", label: "23–40% Moderate" },
        { color: "#3182bd", label: "40–75% High" },
        { color: "#315bbd", label: "75–100% Very High" }
      ]);
      break;

    case "dark":
      renderLegend("Darkness Risk", "Share of crashes in dark/twilight", [
        { color: "#fde0dd", label: "0–13% Very Low" },
        { color: "#fbb6ce", label: "13–37% Low" },
        { color: "#f768a1", label: "37–56% Moderate" },
        { color: "#c51b8a", label: "56–80% High" },
        { color: "#7a0177", label: "80–100% Very High" }
      ]);
      break;

    case "lighting":
      renderLegend("Lighting Level", "Share of road length that is lit", [
        { color: "#2d004b", label: "0–35% Very Low" },
        { color: "#542788", label: "35–47% Low" },
        { color: "#8073ac", label: "47–56% Moderate" },
        { color: "#f1a340", label: "56–70% High" },
        { color: "#fee0b6", label: "70–100% Very High" }
      ]);
      break;

    case "crossings":
      renderLegend(
        "Pedestrian Crossing Density",
        "Crossings per 100m of road",
        [
          { color: "#734e2e", label: "0   None" },
          { color: "#d9b365", label: "0–3 Sparse" },
          { color: "#f6e8c3", label: "3–5 Moderate" },
          { color: "#c7eae5", label: "5–10 Dense" },
          { color: "#5ab4ac", label: "10–100 Very Dense" }
        ]
      );
      break;

    case "slope":
      renderLegend("Road Elevation Variability", "Mean slope (%)", [
        { color: "#2c7bb6", label: "0–3% Very Low" },
        { color: "#abd9e9", label: "3–6% Low" },
        { color: "#ffffbf", label: "6–10% Moderate" },
        { color: "#fdae61", label: "10–15% High" },
        { color: "#f46d43", label: "15–19% Very High" },
        { color: "#d73027", label: "19–20% Extreme" }
      ]);
      break;

    default:
      legendControl.update("");
  }
}

// =======================================
// 6. Create layer + view switcher
// =======================================

// hk_risk_crash comes from hk_risk_crash.js
console.log("typeof hk_risk_crash =", typeof hk_risk_crash);

// 1) Visible layer (pretty, but not interactive)
const crashLayer = L.geoJSON(hk_risk_crash, {
  style: (feature) => styleForView(currentView, feature),
  interactive: false      // <-- important: hit layer will handle events
}).addTo(map);

// 2) Invisible hit layer (fat, transparent, handles hover + popup)
const hitLayer = L.geoJSON(hk_risk_crash, {
  style: () => ({
    color: "#ffffff",
    weight: 20,           // big hit area
    opacity: 0,           // fully invisible
  }),
  onEachFeature: function (feature, layer) {
    layer.bindPopup(crashPopup(feature), {
      autoPan: false // <-- stop the map from shifting itself
    });
    let hoverTimer;

    layer.on("mouseover", function (e) {
  hoverTimer = setTimeout(() => {
    const padding = 40; // pixels from edge to keep popup inside

    // Convert mouse latlng to pixel coords in the map container
    let pt = map.latLngToContainerPoint(e.latlng);
    const size = map.getSize();

    // Clamp the point so it stays within [padding, width-padding] etc.
    pt.x = Math.min(Math.max(pt.x, padding), size.x - padding);
    pt.y = Math.min(Math.max(pt.y, padding), size.y - padding);

    // Convert back to latlng and open popup there
    const adjustedLatLng = map.containerPointToLatLng(pt);
    this.openPopup(adjustedLatLng);
  }, 50);
});


    layer.on("mouseout", function () {
      clearTimeout(hoverTimer);
      this.closePopup();
    });
  }
}).addTo(map);


// Fit map to data bounds
const bounds = crashLayer.getBounds();
if (bounds && bounds.isValid && bounds.isValid()) {
  map.fitBounds(bounds);
}

// --- View switcher control ---

const viewOptions = [
  { id: "risk", label: "Crash Risk" },
  { id: "severity", label: "Severity" },
  { id: "rain", label: "Rain Risk" },
  { id: "dark", label: "Darkness Risk" },
  { id: "lighting", label: "Lighting" },
  { id: "crossings", label: "Crossings" },
  { id: "slope", label: "Slope" }
];

const ViewControl = L.Control.extend({
  onAdd: function () {
    const div = L.DomUtil.create("div", "view-control");
    div.innerHTML = viewOptions
      .map(
        (v) => `<button data-view="${v.id}">${v.label}</button>`
      )
      .join("");
    L.DomEvent.disableClickPropagation(div);

    div.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        const viewId = e.target.dataset.view;
        setView(viewId);
      }
    });

    return div;
  }
});

map.addControl(new ViewControl({ position: "topright" }));

function setView(viewId) {
  currentView = viewId;
  crashLayer.setStyle((feature) => styleForView(viewId, feature));
  updateLegend(viewId);

  // update active button
  document
    .querySelectorAll(".view-control button")
    .forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });
}

// initialize default view
setView("risk");

console.log("Crash risk layer loaded:", crashLayer);
