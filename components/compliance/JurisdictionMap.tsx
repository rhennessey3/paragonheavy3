"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Id } from "@/convex/_generated/dataModel";

export interface JurisdictionData {
  _id: Id<"jurisdictions">;
  name: string;
  abbreviation?: string;
  fipsCode?: string;
  type?: string;
  policyCount: number;
}

interface JurisdictionMapProps {
  jurisdictions: JurisdictionData[];
  selectedJurisdiction: JurisdictionData | null;
  onJurisdictionSelect: (jurisdiction: JurisdictionData | null) => void;
}

// US States GeoJSON URL (public dataset)
const US_STATES_GEOJSON_URL = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

// US Counties GeoJSON URL (public dataset)
const US_COUNTIES_GEOJSON_URL = "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json";

// State FIPS codes for filtering counties
const STATE_FIPS: Record<string, string> = {
  "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06",
  "CO": "08", "CT": "09", "DE": "10", "DC": "11", "FL": "12",
  "GA": "13", "HI": "15", "ID": "16", "IL": "17", "IN": "18",
  "IA": "19", "KS": "20", "KY": "21", "LA": "22", "ME": "23",
  "MD": "24", "MA": "25", "MI": "26", "MN": "27", "MS": "28",
  "MO": "29", "MT": "30", "NE": "31", "NV": "32", "NH": "33",
  "NJ": "34", "NM": "35", "NY": "36", "NC": "37", "ND": "38",
  "OH": "39", "OK": "40", "OR": "41", "PA": "42", "RI": "44",
  "SC": "45", "SD": "46", "TN": "47", "TX": "48", "UT": "49",
  "VT": "50", "VA": "51", "WA": "53", "WV": "54", "WI": "55",
  "WY": "56",
};

// State center coordinates for flying to states [lng, lat, zoom]
const STATE_CENTERS: Record<string, [number, number, number]> = {
  AL: [-86.9023, 32.3182, 6], AK: [-153.4937, 64.2008, 4], AZ: [-111.0937, 34.0489, 6],
  AR: [-92.3731, 34.9697, 6], CA: [-119.4179, 36.7783, 5.5], CO: [-105.3111, 39.0598, 6],
  CT: [-72.7554, 41.6032, 8], DE: [-75.5277, 38.9108, 8], DC: [-77.0369, 38.9072, 11],
  FL: [-81.5158, 27.6648, 6], GA: [-83.6431, 32.1656, 6], HI: [-155.5828, 19.8968, 6],
  ID: [-114.7420, 44.0682, 5.5], IL: [-89.3985, 40.6331, 6], IN: [-86.1349, 40.2672, 6.5],
  IA: [-93.0977, 41.8780, 6], KS: [-98.4842, 39.0119, 6], KY: [-84.2700, 37.8393, 6.5],
  LA: [-91.9623, 30.9843, 6.5], ME: [-69.4455, 45.2538, 6], MD: [-76.6413, 39.0458, 7],
  MA: [-71.3824, 42.4072, 7.5], MI: [-85.6024, 44.3148, 5.5], MN: [-94.6859, 46.7296, 5.5],
  MS: [-89.3985, 32.3547, 6], MO: [-91.8318, 37.9643, 6], MT: [-110.3626, 46.8797, 5.5],
  NE: [-99.9018, 41.4925, 6], NV: [-116.4194, 38.8026, 5.5], NH: [-71.5724, 43.1939, 7],
  NJ: [-74.4057, 40.0583, 7], NM: [-105.8701, 34.5199, 6], NY: [-75.4999, 43.2994, 6],
  NC: [-79.0193, 35.7596, 6], ND: [-101.0020, 47.5515, 6], OH: [-82.9071, 40.4173, 6.5],
  OK: [-97.5164, 35.0078, 6], OR: [-120.5542, 43.8041, 6], PA: [-77.1945, 41.2033, 6.5],
  RI: [-71.4774, 41.5801, 9], SC: [-81.1637, 33.8361, 6.5], SD: [-99.9018, 43.9695, 6],
  TN: [-86.5804, 35.5175, 6.5], TX: [-99.9018, 31.9686, 5], UT: [-111.0937, 39.3210, 6],
  VT: [-72.5778, 44.5588, 7], VA: [-78.6569, 37.4316, 6.5], WA: [-120.7401, 47.7511, 6],
  WV: [-80.4549, 38.5976, 7], WI: [-89.6165, 43.7844, 6], WY: [-107.2903, 43.0760, 6],
};

// State name to abbreviation mapping
const STATE_NAME_TO_ABBR: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
  "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "District of Columbia": "DC",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
  "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
  "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
  "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR",
  "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA",
  "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
};

export function JurisdictionMap({
  jurisdictions,
  selectedJurisdiction,
  onJurisdictionSelect,
}: JurisdictionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const getJurisdictionByAbbr = useCallback((abbr: string) => {
    return jurisdictions.find(j => j.abbreviation === abbr);
  }, [jurisdictions]);

  const getColorForPolicyCount = useCallback((count: number) => {
    if (count === 0) return "#e5e7eb"; // gray-200
    if (count <= 2) return "#bfdbfe"; // blue-200
    if (count <= 5) return "#60a5fa"; // blue-400
    if (count <= 10) return "#3b82f6"; // blue-500
    return "#1d4ed8"; // blue-700
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98.5795, 39.8283],
      zoom: 3.5,
      minZoom: 3,
      maxZoom: 8,
      projection: "mercator",
      maxBounds: [
        [-130, 24], // Southwest: west of California, south of Texas
        [-65, 50],  // Northeast: east of Maine, north of US-Canada border
      ],
      scrollZoom: false,
      boxZoom: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      dragPan: false,
      dragRotate: false,
      keyboard: false,
    });

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.current.on("load", async () => {
      if (!map.current) return;

      // Fetch US states GeoJSON
      const response = await fetch(US_STATES_GEOJSON_URL);
      const geojsonData = await response.json();

      // Add US states source using GeoJSON
      map.current.addSource("states", {
        type: "geojson",
        data: geojsonData,
      });

      // Add fill layer for states
      map.current.addLayer({
        id: "states-fill",
        type: "fill",
        source: "states",
        paint: {
          "fill-color": "#e5e7eb",
          "fill-opacity": 0.8,
        },
      });

      // Add border layer
      map.current.addLayer({
        id: "states-border",
        type: "line",
        source: "states",
        paint: {
          "line-color": "#9ca3af",
          "line-width": 1,
        },
      });

      // Add hover state fill highlight layer
      map.current.addLayer({
        id: "states-hover-fill",
        type: "fill",
        source: "states",
        filter: ["==", ["get", "name"], ""],
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.2,
        },
      });

      // Add hover state border highlight layer
      map.current.addLayer({
        id: "states-hover",
        type: "line",
        source: "states",
        filter: ["==", ["get", "name"], ""],
        paint: {
          "line-color": "#2563eb",
          "line-width": 2.5,
        },
      });

      // Add selected state fill highlight layer
      map.current.addLayer({
        id: "states-selected-fill",
        type: "fill",
        source: "states",
        filter: ["==", ["get", "name"], ""],
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.4,
        },
      });

      // Add selected state border highlight layer
      map.current.addLayer({
        id: "states-selected",
        type: "line",
        source: "states",
        filter: ["==", ["get", "name"], ""],
        paint: {
          "line-color": "#1d4ed8",
          "line-width": 3,
        },
      });

      // Fetch US counties GeoJSON
      const countiesResponse = await fetch(US_COUNTIES_GEOJSON_URL);
      const countiesData = await countiesResponse.json();

      // Add US counties source
      map.current.addSource("counties", {
        type: "geojson",
        data: countiesData,
      });

      // Add invisible county fill layer for hit detection
      map.current.addLayer({
        id: "counties-fill",
        type: "fill",
        source: "counties",
        filter: ["==", ["id"], "__none__"],
        paint: {
          "fill-color": "transparent",
          "fill-opacity": 0,
        },
      });

      // Add county borders layer (initially hidden, shown when zoomed in)
      map.current.addLayer({
        id: "counties-border",
        type: "line",
        source: "counties",
        filter: ["==", ["id"], "__none__"],
        paint: {
          "line-color": "#6b7280",
          "line-width": 1,
        },
      });

      // Add county fill layer for hover effect
      map.current.addLayer({
        id: "counties-hover-fill",
        type: "fill",
        source: "counties",
        filter: ["==", ["id"], "__none__"],
        paint: {
          "fill-color": "#93c5fd",
          "fill-opacity": 0.3,
        },
      });

      // Add county hover border
      map.current.addLayer({
        id: "counties-hover-border",
        type: "line",
        source: "counties",
        filter: ["==", ["id"], "__none__"],
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
        },
      });

      setMapLoaded(true);
    });

    return () => {
      if (popup.current) {
        popup.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, [mapboxToken]);

  // Update state colors based on rule counts
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const colorExpression: mapboxgl.Expression = [
      "match",
      ["get", "name"],
    ];

    jurisdictions.forEach((j) => {
      if (j.name) {
        colorExpression.push(j.name, getColorForPolicyCount(j.policyCount));
      }
    });

    colorExpression.push("#e5e7eb"); // default color

    map.current.setPaintProperty("states-fill", "fill-color", colorExpression);
  }, [jurisdictions, mapLoaded, getColorForPolicyCount]);

  // Update selected state highlight and show county boundaries
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const selectedName = selectedJurisdiction?.name || "";
    const selectedAbbr = selectedJurisdiction?.abbreviation || "";
    const stateFips = selectedAbbr ? STATE_FIPS[selectedAbbr] : "";

    const filter: mapboxgl.FilterSpecification = [
      "==",
      ["get", "name"],
      selectedName,
    ];

    map.current.setFilter("states-selected-fill", filter);
    map.current.setFilter("states-selected", filter);

    // Show county boundaries for the selected state
    if (stateFips) {
      // Filter counties to only show those in the selected state
      // County FIPS codes start with the state FIPS (e.g., "42001" for PA county)
      // The GeoJSON has id at the feature level (not property), so use ["id"]
      const countyFilter: mapboxgl.FilterSpecification = [
        "==",
        ["slice", ["to-string", ["id"]], 0, 2],
        stateFips,
      ];
      map.current.setFilter("counties-fill", countyFilter);
      map.current.setFilter("counties-border", countyFilter);
    } else {
      // Hide county boundaries when no state is selected
      map.current.setFilter("counties-fill", ["==", ["id"], "__none__"]);
      map.current.setFilter("counties-border", ["==", ["id"], "__none__"]);
    }
  }, [selectedJurisdiction, mapLoaded]);

  // Add click and hover handlers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!map.current) return;

      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ["states-fill"],
      });

      if (features.length > 0) {
        const feature = features[0];
        const stateName = feature.properties?.name as string;
        
        if (stateName) {
          const abbr = STATE_NAME_TO_ABBR[stateName];
          const jurisdiction = jurisdictions.find(j => j.name === stateName);
          
          if (jurisdiction) {
            onJurisdictionSelect(jurisdiction);
            
            // Fly to the selected state
            if (abbr) {
              const stateCenter = STATE_CENTERS[abbr];
              if (stateCenter) {
                map.current.flyTo({
                  center: [stateCenter[0], stateCenter[1]],
                  zoom: stateCenter[2],
                  duration: 1000,
                });
              }
            }
          }
        }
      }
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!map.current || !popup.current) return;

      // Check for county features first (when zoomed into a state)
      const countyFeatures = map.current.queryRenderedFeatures(e.point, {
        layers: ["counties-fill"],
      });

      if (countyFeatures.length > 0 && selectedJurisdiction) {
        map.current.getCanvas().style.cursor = "pointer";
        const countyFeature = countyFeatures[0];
        const countyId = countyFeature.id as string;
        const countyName = countyFeature.properties?.NAME as string;

        // Set county hover highlight using feature id
        map.current.setFilter("counties-hover-fill", ["==", ["id"], countyId]);
        map.current.setFilter("counties-hover-border", ["==", ["id"], countyId]);

        popup.current
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="px-2 py-1">
              <div class="font-semibold">${countyName || "County"}</div>
              <div class="text-sm text-gray-600">${selectedJurisdiction.name}</div>
            </div>
          `)
          .addTo(map.current);
        return;
      }

      // Clear county hover when not over a county
      map.current.setFilter("counties-hover-fill", ["==", ["id"], "__none__"]);
      map.current.setFilter("counties-hover-border", ["==", ["id"], "__none__"]);

      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ["states-fill"],
      });

      if (features.length > 0) {
        map.current.getCanvas().style.cursor = "pointer";

        const feature = features[0];
        const stateName = feature.properties?.name as string;
        
        if (stateName) {
          const jurisdiction = jurisdictions.find(j => j.name === stateName);
          
          // Set hover highlight for the state
          const hoverFilter: mapboxgl.FilterSpecification = [
            "==",
            ["get", "name"],
            stateName,
          ];
          map.current.setFilter("states-hover-fill", hoverFilter);
          map.current.setFilter("states-hover", hoverFilter);
          
          if (jurisdiction) {
            popup.current
              .setLngLat(e.lngLat)
              .setHTML(`
                <div class="px-2 py-1">
                  <div class="font-semibold">${jurisdiction.name}</div>
                  <div class="text-sm text-gray-600">
                    ${jurisdiction.policyCount} ${jurisdiction.policyCount === 1 ? "policy" : "policies"}
                  </div>
                </div>
              `)
              .addTo(map.current);
          } else {
            popup.current
              .setLngLat(e.lngLat)
              .setHTML(`
                <div class="px-2 py-1">
                  <div class="font-semibold">${stateName}</div>
                  <div class="text-sm text-gray-600">0 policies</div>
                </div>
              `)
              .addTo(map.current);
          }
        }
      } else {
        map.current.getCanvas().style.cursor = "";
        const clearFilter: mapboxgl.FilterSpecification = ["==", ["get", "name"], ""];
        map.current.setFilter("states-hover-fill", clearFilter);
        map.current.setFilter("states-hover", clearFilter);
        popup.current.remove();
      }
    };

    const handleMouseLeave = () => {
      if (!map.current || !popup.current) return;
      map.current.getCanvas().style.cursor = "";
      const clearFilter: mapboxgl.FilterSpecification = ["==", ["get", "name"], ""];
      map.current.setFilter("states-hover-fill", clearFilter);
      map.current.setFilter("states-hover", clearFilter);
      map.current.setFilter("counties-hover-fill", ["==", ["id"], "__none__"]);
      map.current.setFilter("counties-hover-border", ["==", ["id"], "__none__"]);
      popup.current.remove();
    };

    map.current.on("click", "states-fill", handleClick);
    map.current.on("mousemove", handleMouseMove);
    map.current.on("mouseleave", "states-fill", handleMouseLeave);

    return () => {
      if (map.current) {
        map.current.off("click", "states-fill", handleClick);
        map.current.off("mousemove", handleMouseMove);
        map.current.off("mouseleave", "states-fill", handleMouseLeave);
      }
    };
  }, [mapLoaded, jurisdictions, onJurisdictionSelect, selectedJurisdiction]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Mapbox token not configured</p>
          <p className="text-sm text-gray-500">
            Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables
          </p>
        </div>
      </div>
    );
  }

  const handleResetView = useCallback(() => {
    if (!map.current) return;
    onJurisdictionSelect(null);
    map.current.flyTo({
      center: [-98.5795, 39.8283],
      zoom: 3.5,
      duration: 1000,
    });
  }, [onJurisdictionSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Back to full map button - only show when zoomed in */}
      {selectedJurisdiction && (
        <button
          onClick={handleResetView}
          className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Full Map
        </button>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-lg shadow-lg">
        <div className="text-xs font-medium text-gray-700 mb-2">Policies by State</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#e5e7eb" }} />
            <span className="text-xs text-gray-600">0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#bfdbfe" }} />
            <span className="text-xs text-gray-600">1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#60a5fa" }} />
            <span className="text-xs text-gray-600">3-5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <span className="text-xs text-gray-600">6-10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#1d4ed8" }} />
            <span className="text-xs text-gray-600">10+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
