import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import { X } from "lucide-react";
import { COORDINATE_SYSTEMS, CoordinateSystem } from "../utils/coordinateConversion";
import { MUNICIPALITIES } from "../utils/municipalitiesData";

// @ts-ignore
import swedishMunicipalitiesRaw from "./assets/swedish_municipalities.geojson?raw";

export interface MapMarkerPoint {
  systemId: string;
  systemName: string;
  epsg: string;
  type: "SWEREF" | "RT90" | "WGS84";
  lat: number;
  lon: number;
  isInSweden: boolean;
  n: number;
  e: number;
  projectedN?: number;
  projectedE?: number;
}

interface MapComponentProps {
  points: MapMarkerPoint[];
  highlightedSystemId: string | null;
  onMapClick: (lat: number, lon: number) => void;
  onMarkerClick: (systemId: string) => void;
  onMunicipalityClick?: (name: string) => void;
  selectedMunicipalityName?: string | null;
}

export interface SwerefZone {
  id: string;
  name: string;
  minLon: number;
  maxLon: number;
  color: string;
  centralMeridian: number;
}

export const SWEREF_ZONES: SwerefZone[] = [
  { id: "sweref99_1200", name: "SWEREF 99 12 00", minLon: 10.0, maxLon: 12.75, color: "#e11d48", centralMeridian: 12.0 },
  { id: "sweref99_1330", name: "SWEREF 99 13 30", minLon: 12.75, maxLon: 13.875, color: "#ea580c", centralMeridian: 13.5 },
  { id: "sweref99_1415", name: "SWEREF 99 14 15", minLon: 13.875, maxLon: 14.625, color: "#ca8a04", centralMeridian: 14.25 },
  { id: "sweref99_1500", name: "SWEREF 99 15 00", minLon: 14.625, maxLon: 15.375, color: "#16a34a", centralMeridian: 15.0 },
  { id: "sweref99_1545", name: "SWEREF 99 15 45", minLon: 15.375, maxLon: 16.125, color: "#0d9488", centralMeridian: 15.75 },
  { id: "sweref99_1630", name: "SWEREF 99 16 30", minLon: 16.125, maxLon: 16.875, color: "#0284c7", centralMeridian: 16.5 },
  { id: "sweref99_1715", name: "SWEREF 99 17 15", minLon: 16.875, maxLon: 17.625, color: "#2563eb", centralMeridian: 17.25 },
  { id: "sweref99_1800", name: "SWEREF 99 18 00", minLon: 17.625, maxLon: 18.375, color: "#4f46e5", centralMeridian: 18.0 },
  { id: "sweref99_1845", name: "SWEREF 99 18 45", minLon: 18.375, maxLon: 19.5, color: "#7c3aed", centralMeridian: 18.75 },
  { id: "sweref99_2015", name: "SWEREF 99 20 15", minLon: 19.5, maxLon: 21.0, color: "#db2777", centralMeridian: 20.25 },
  { id: "sweref99_2145", name: "SWEREF 99 21 45", minLon: 21.0, maxLon: 22.5, color: "#a21caf", centralMeridian: 21.75 },
  { id: "sweref99_2315", name: "SWEREF 99 23 15", minLon: 22.5, maxLon: 25.0, color: "#4b5563", centralMeridian: 23.25 }
];

export const getSystemColor = (systemId: string): string => {
  switch (systemId) {
    case "sweref99_1200": return "#e11d48";
    case "sweref99_1330": return "#ea580c";
    case "sweref99_1415": return "#ca8a04";
    case "sweref99_1500": return "#16a34a";
    case "sweref99_1545": return "#0d9488";
    case "sweref99_1630": return "#0284c7";
    case "sweref99_1715": return "#2563eb";
    case "sweref99_1800": return "#4f46e5";
    case "sweref99_1845": return "#7c3aed";
    case "sweref99_2015": return "#db2777";
    case "sweref99_2145": return "#a21caf";
    case "sweref99_2315": return "#4b5563";
    case "sweref99tm": return "#1d4ed8"; // rich royal blue
    case "wgs84": return "#059669";      // deeper emerald
    default:
      if (systemId.startsWith("rt90")) return "#b45309"; // warm amber for historical grids
      return "#64748b";
  }
};

export const getFeatureMuniName = (feature: any): string => {
  if (!feature || !feature.properties) return "";
  return feature.properties.kom_namn || 
         feature.properties.KOM_NAMN || 
         feature.properties.knnamn || 
         feature.properties.name || 
         feature.properties.kommunnamn || 
         feature.properties.KOMMUNNAMN || 
         feature.properties.municipality || 
         "";
};

export const findLocalMunicipality = (geojsonName: string) => {
  if (!geojsonName) return null;
  const cleanGeoName = geojsonName.toLowerCase().trim().replace(/\s+kommun$/, "");
  return MUNICIPALITIES.find((m) => {
    const cleanLocalName = m.name.toLowerCase().trim().replace(/\s+kommun$/, "");
    return cleanLocalName === cleanGeoName || cleanLocalName.startsWith(cleanGeoName) || cleanGeoName.startsWith(cleanLocalName);
  });
};

export default function MapComponent({
  points,
  highlightedSystemId,
  onMapClick,
  onMarkerClick,
  onMunicipalityClick,
  selectedMunicipalityName,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const zoneLayersRef = useRef<L.Layer[]>([]);
  const muniLayersRef = useRef<L.Layer[]>([]);

  const [showZones, setShowZones] = useState(true);
  const [showMunicipalities, setShowMunicipalities] = useState(true);
  const [showInfoBox, setShowInfoBox] = useState(true);

  const muniGeoJson = useMemo(() => {
    try {
      if (!swedishMunicipalitiesRaw) return null;
      return JSON.parse(swedishMunicipalitiesRaw);
    } catch (err) {
      console.error("Failed to parse local Sweden municipalities GeoJSON", err);
      return null;
    }
  }, []);
  const geoJsonGroupRef = useRef<L.GeoJSON | null>(null);

  // Auto-show info box when a projection point is highlighted
  useEffect(() => {
    if (highlightedSystemId) {
      setShowInfoBox(true);
    }
  }, [highlightedSystemId]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Sweden bounds center roughly at 62° N, 15° E
    const map = L.map(mapContainerRef.current, {
      center: [62.0, 15.0],
      zoom: 5,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    // Reposition zoom control nicely
    L.control.zoom({ position: "topright" }).addTo(map);

    // Swedish Lantmäteriet WMS - topowebbkartan_nedtonad background
    L.tileLayer.wms("https://minkarta.lantmateriet.se/map/topowebb/", {
      layers: "topowebbkartan_nedtonad",
      version: "1.1.1",
      transparent: false,
      format: "image/png",
      attribution: "&copy; Lantmäteriet"
    }).addTo(map);

    // Register click event on map
    map.on("click", (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync / render SWEREF zone stripes (we now skip drawing projection boundaries and meridian lines)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing zone layers if any
    zoneLayersRef.current.forEach((layer) => layer.remove());
    zoneLayersRef.current = [];
  }, [highlightedSystemId]);

  // Sync / render markers based on points list
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    Object.keys(markersRef.current).forEach((key) => {
      const marker = markersRef.current[key];
      if (marker) {
        marker.remove();
      }
    });
    markersRef.current = {};

    // Filter points that are valid coordinates
    const validPoints = points.filter(
      (p) => !isNaN(p.lat) && !isNaN(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180
    );

    let swedenPoints = validPoints.filter((p) => p.isInSweden);
    // If no points land in Sweden, check any valid points
    const pointsToFit = swedenPoints.length > 0 ? swedenPoints : validPoints;

    // Create markers for all systems (with conditional opacity and styling)
    validPoints.forEach((p) => {
      const isHighlighted = p.systemId === highlightedSystemId;
      const markerColor = getSystemColor(p.systemId);

      const hasHighlight = highlightedSystemId !== null;
      
      let sizeClass = "h-3.5 w-3.5";
      let pingEffect = "";
      let opacityStyle = "opacity: 0.95;";
      let zIndexStyle = "z-index: 1000;";

      if (hasHighlight) {
        if (isHighlighted) {
          sizeClass = "h-5 w-5 scale-110";
          pingEffect = `
            <span class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60" style="background-color: ${markerColor}"></span>
          `;
          opacityStyle = "opacity: 1.0; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));";
          zIndexStyle = "z-index: 1500; font-weight: 800;";
        } else {
          sizeClass = "h-2.5 w-2.5 opacity-60";
          opacityStyle = "opacity: 0.28;"; // Make points not matching marked system much weaker
          zIndexStyle = "z-index: 500;";
        }
      } else {
        // Normal state when no projection is explicitly highlighted
        sizeClass = "h-3.5 w-3.5";
        opacityStyle = "opacity: 0.85;";
        zIndexStyle = "z-index: 1000;";
      }

      const customIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center justify-center group cursor-pointer" style="${opacityStyle} ${zIndexStyle}">
            <!-- Inline mini hover tooltip -->
            <div class="absolute bottom-6 scale-0 group-hover:scale-100 bg-white/95 backdrop-blur-[2px] text-[10px] font-bold px-2 py-1 rounded shadow-md border whitespace-nowrap z-[2000] transition-all duration-100 flex items-center gap-1.5"
                 style="border-color: ${markerColor}40; color: ${markerColor}; ${isHighlighted ? 'border-width: 2px;' : ''}">
              <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${markerColor}"></span>
              <span>${p.systemName} ${isHighlighted ? '⭐ (Markerad)' : ''} <span class="opacity-75 font-mono text-[8px]">(${p.epsg})</span></span>
            </div>
            
            <!-- Pulse ring effect for highlighted system marker -->
            ${pingEffect}

            <span class="relative inline-flex rounded-full ${sizeClass} border-2 border-white shadow-sm flex items-center justify-center transition-transform hover:scale-125 duration-100" style="background-color: ${markerColor}">
              <span class="h-1 w-1 rounded-full bg-white/80"></span>
            </span>
          </div>
        `,
        className: "custom-pin-small",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([p.lat, p.lon], { icon: customIcon })
        .addTo(map)
        .on("click", () => {
          onMarkerClick(p.systemId);
        });

      markersRef.current[p.systemId] = marker;
    });

    // Auto-zoom map bounds to fit points if we have active points in Sweden,
    // but only if we are not currently focusing on a highlighted system or a specific municipality.
    // This prevents conflicting zoom-out sequences.
    if (pointsToFit.length > 0 && !highlightedSystemId && !selectedMunicipalityName) {
      const latLgList = pointsToFit.map((p) => L.latLng(p.lat, p.lon));
      const bounds = L.latLngBounds(latLgList);
      
      const currentZoom = map.getZoom() || 5;
      const targetBoundsZoom = Math.min(map.getBoundsZoom(bounds.pad(0.12)), 14);
      // Strictly prevent automatic zooming out
      const finalZoom = targetBoundsZoom > currentZoom ? targetBoundsZoom : currentZoom;
      map.setView(bounds.getCenter(), finalZoom, { animate: true, duration: 0.8 });
    }
  }, [points, highlightedSystemId]);

  // Handle programmatic highlighting / pan to coordinate when highlighted ID changes
  useEffect(() => {
    const point = points.find((p) => p.systemId === highlightedSystemId);
    const map = mapInstanceRef.current;
    if (point && map) {
      const latlng = L.latLng(point.lat, point.lon);
      map.panTo(latlng, { animate: true, duration: 0.5 });
    }
  }, [highlightedSystemId, points]);

  // Sync / render Swedish Municipalities as elegant interactive polygons or backup colored circle dots!
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing municipal layers
    muniLayersRef.current.forEach((layer) => layer.remove());
    muniLayersRef.current = [];
    geoJsonGroupRef.current = null;

    if (!showMunicipalities) return;

    const layers: L.Layer[] = [];

    if (muniGeoJson) {
      // Create GeoJSON Layer with beautiful fills and hovers
      const geoLayer = L.geoJSON(muniGeoJson, {
        style: (feature) => {
          const muniName = getFeatureMuniName(feature);
          const localMuni = findLocalMunicipality(muniName);
          const isSelectedMuni = localMuni && localMuni.name === selectedMunicipalityName;
          const systemColor = localMuni ? getSystemColor(localMuni.projectionId) : "#64748b";

          const hasHighlight = highlightedSystemId !== null;
          const matchesHighlightedSystem = localMuni && localMuni.projectionId === highlightedSystemId;

          let fillOpacity = 0.18;
          let strokeOpacity = 0.60;
          let strokeWidth = 0.8;
          let strokeColor = "#ffffff";

          if (isSelectedMuni) {
            fillOpacity = 0.45;
            strokeOpacity = 1.0;
            strokeWidth = 3.5;
            strokeColor = "#0f172a"; // extra strong dark border for selected
          } else if (hasHighlight) {
            if (matchesHighlightedSystem) {
              fillOpacity = 0.30;
              strokeOpacity = 0.80;
              strokeWidth = 1.4;
              strokeColor = "#ffffff";
            } else {
              fillOpacity = 0.05;
              strokeOpacity = 0.25;
              strokeWidth = 0.5;
              strokeColor = "#ffffff";
            }
          } else {
            fillOpacity = 0.18;
            strokeOpacity = 0.60;
            strokeWidth = 0.8;
            strokeColor = "#ffffff";
          }

          return {
            color: strokeColor,
            weight: strokeWidth,
            fillColor: systemColor,
            fillOpacity: fillOpacity,
            opacity: strokeOpacity,
          };
        },
        onEachFeature: (feature, layer) => {
          const muniName = getFeatureMuniName(feature);
          const localMuni = findLocalMunicipality(muniName);

          if (localMuni) {
            // Bind Swedish tooltip
            layer.bindTooltip(`
              <div class="font-sans text-slate-850 text-[11px] leading-tight flex flex-col gap-0.5">
                <div>Kommun: <span class="font-bold text-slate-950">${localMuni.name}</span></div>
                <div>Län: <span class="font-bold text-slate-950">${localMuni.county}</span></div>
                <div>Lokal projektion: <span class="font-bold text-slate-950">${localMuni.projection}</span></div>
              </div>
            `, { sticky: true, className: "minimalist-tooltip" });

            layer.on({
              mouseover: (e) => {
                const ly = e.target;
                const isSelected = localMuni.name === selectedMunicipalityName;
                if (!isSelected) {
                  ly.setStyle({
                    fillOpacity: 0.40,
                    opacity: 0.9,
                    weight: 2.0,
                    color: "#1e293b"
                  });
                }
              },
              mouseout: (e) => {
                const ly = e.target;
                const isSelected = localMuni.name === selectedMunicipalityName;
                const matchesHighlightedSystem = localMuni && localMuni.projectionId === highlightedSystemId;
                const hasHighlight = highlightedSystemId !== null;

                if (!isSelected) {
                  if (hasHighlight) {
                    if (matchesHighlightedSystem) {
                      ly.setStyle({
                        fillOpacity: 0.30,
                        opacity: 0.80,
                        weight: 1.4,
                        color: "#ffffff"
                      });
                    } else {
                      ly.setStyle({
                        fillOpacity: 0.05,
                        opacity: 0.25,
                        weight: 0.5,
                        color: "#ffffff"
                      });
                    }
                  } else {
                    ly.setStyle({
                      fillOpacity: 0.18,
                      opacity: 0.60,
                      weight: 0.8,
                      color: "#ffffff"
                    });
                  }
                }
              },
              click: (e) => {
                if (onMunicipalityClick) {
                  onMunicipalityClick(localMuni.name);
                }
                L.DomEvent.stopPropagation(e);
              }
            });
          }
        },
      });

      geoLayer.addTo(map);
      layers.push(geoLayer);
      geoJsonGroupRef.current = geoLayer;

    } else {
      // Fallback: draw beautiful circle markers for each municipality while GeoJSON is loading or unavailable
      MUNICIPALITIES.forEach((m) => {
        const isSelected = m.name === selectedMunicipalityName;
        const systemColor = getSystemColor(m.projectionId);

        const marker = L.circleMarker([m.lat, m.lon], {
          radius: isSelected ? 8 : 4.5,
          fillColor: systemColor,
          color: "#ffffff",
          weight: isSelected ? 3.0 : 1.0,
          fillOpacity: isSelected ? 0.95 : 0.70,
          opacity: 0.9,
          pane: "markerPane"
        });

        marker.bindTooltip(`
          <div class="font-sans text-slate-850 text-[11px] leading-tight flex flex-col gap-0.5">
            <div>Kommun: <span class="font-bold text-slate-950">${m.name}</span></div>
            <div>Län: <span class="font-bold text-slate-950">${m.county}</span></div>
            <div>Lokal projektion: <span class="font-bold text-slate-950">${m.projection}</span></div>
          </div>
        `, { sticky: true, className: "minimalist-tooltip" });

        marker.on("click", (e) => {
          if (onMunicipalityClick) {
            onMunicipalityClick(m.name);
          }
          L.DomEvent.stopPropagation(e);
        });

        marker.addTo(map);
        layers.push(marker);
      });
    }

    muniLayersRef.current = layers;

    return () => {
      layers.forEach((layer) => layer.remove());
    };
  }, [showMunicipalities, selectedMunicipalityName, muniGeoJson, onMunicipalityClick, highlightedSystemId]);

  // Proactively fly to and auto-bounds highlight the selected municipality polygon
  useEffect(() => {
    const map = mapInstanceRef.current;
    const geoJsonGroup = geoJsonGroupRef.current;
    if (!map || !geoJsonGroup || !selectedMunicipalityName) return;

    geoJsonGroup.eachLayer((layer: any) => {
      if (layer.feature) {
        const muniName = getFeatureMuniName(layer.feature);
        const localMuni = findLocalMunicipality(muniName);
        if (localMuni && localMuni.name === selectedMunicipalityName) {
          if (typeof layer.getBounds === "function") {
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
              const currentZoom = map.getZoom();
              const targetBoundsZoom = Math.min(map.getBoundsZoom(bounds), 10);
              // Do not zoom out if currently zoomed in deeper
              const finalZoom = currentZoom > targetBoundsZoom ? currentZoom : targetBoundsZoom;
              map.setView(bounds.getCenter(), finalZoom, { animate: true, duration: 0.8 });
            }
          }
        }
      }
    });
  }, [selectedMunicipalityName, muniGeoJson]);

  // Preset quick navigation to Sweden regions
  const zoomToArea = (area: "SVERIGE" | "STHLM" | "GBG" | "MALMO" | "UMEA") => {
    if (!mapInstanceRef.current) return;

    let targetCoords: [number, number] = [62.0, 15.0];
    let zoomLevel = 5;

    switch (area) {
      case "SVERIGE":
        targetCoords = [62.0, 15.0];
        zoomLevel = 5;
        break;
      case "STHLM":
        targetCoords = [59.3293, 18.0686];
        zoomLevel = 10;
        break;
      case "GBG":
        targetCoords = [57.7089, 11.9746];
        zoomLevel = 10;
        break;
      case "MALMO":
        targetCoords = [55.605, 13.0038];
        zoomLevel = 10;
        break;
      case "UMEA":
        targetCoords = [63.8258, 20.263];
        zoomLevel = 10;
        break;
    }

    mapInstanceRef.current.setView(targetCoords, zoomLevel, { animate: true });
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200/60 shadow-xs flex flex-col" id="map-parent">
      {/* Top Map Shortcuts Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5 max-w-[calc(100%-60px)]">
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-slate-100 flex items-center gap-1.5 text-xs font-sans hover:border-slate-200 transition-all duration-150">
          {/* Municipalities toggler button */}
          <button
            onClick={() => setShowMunicipalities(!showMunicipalities)}
            className={`px-2 py-1 rounded-lg transition font-semibold text-[11px] flex items-center gap-1.5 active:scale-95 duration-100 cursor-pointer ${
              showMunicipalities
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
                : "hover:bg-slate-100 text-slate-600 border border-transparent"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showMunicipalities ? "bg-emerald-600 animate-pulse" : "bg-slate-400"}`}></span>
            Visa kommuner
          </button>
        </div>
      </div>

      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full bg-slate-50" id="leaflet-map" />

      {/* Map helper notice */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-slate-300 shadow-sm border border-slate-800 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
        <span>Tips: Klicka på kommunerna eller kartan för att se koordinater</span>
      </div>
    </div>
  );
}
