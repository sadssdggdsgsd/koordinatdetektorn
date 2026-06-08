import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { X } from "lucide-react";
import { COORDINATE_SYSTEMS, CoordinateSystem } from "../utils/coordinateConversion";

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

export default function MapComponent({
  points,
  highlightedSystemId,
  onMapClick,
  onMarkerClick,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const zoneLayersRef = useRef<L.Layer[]>([]);

  const [showZones, setShowZones] = useState(true);
  const [showInfoBox, setShowInfoBox] = useState(true);

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

    // Clean, high-contrast, beautiful cartography tiles (OSM Voyager)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
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

  // Sync / render SWEREF zone stripes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing zone layers
    zoneLayersRef.current.forEach((layer) => layer.remove());
    zoneLayersRef.current = [];

    if (!showZones) return;

    const layers: L.Layer[] = [];

    SWEREF_ZONES.forEach((zone) => {
      // Create rectangle boundaries from latitude 55.0 to 69.5
      const bounds: L.LatLngBoundsExpression = [
        [55.0, zone.minLon],
        [69.5, zone.maxLon]
      ];

      const isSelected = zone.id === highlightedSystemId;

      const rect = L.rectangle(bounds, {
        color: zone.color,
        weight: isSelected ? 1.5 : 1,
        fillColor: zone.color,
        fillOpacity: isSelected ? 0.06 : 0.03,
        opacity: isSelected ? 0.45 : 0.15,
        dashArray: isSelected ? "4, 4" : "2, 5", // slightly more visible dashes for active zone, very fine dotted for inactive
        interactive: true
      });

      rect.bindTooltip(`
        <div class="font-sans p-1 text-slate-900">
          <div class="font-bold text-xs" style="color: ${zone.color}">${zone.name}</div>
          <div class="text-[9px] text-slate-500 font-mono mt-0.5">Centralmeridian: ${zone.centralMeridian}° Ö</div>
          <div class="text-[9px] text-slate-400 font-mono">Längdgrader: ${zone.minLon}° - ${zone.maxLon}° Ö</div>
          <div class="text-[9px] text-blue-600 font-bold mt-1">Klicka för att välja projiceringssystem</div>
        </div>
      `, { sticky: true, opacity: 0.98 });

      rect.on("click", (e) => {
        onMarkerClick(zone.id);
        L.DomEvent.stopPropagation(e);
      });

      rect.addTo(map);
      layers.push(rect);

      // Central meridian line
      const lineCoords: L.LatLngExpression[] = [
        [55.0, zone.centralMeridian],
        [69.0, zone.centralMeridian]
      ];
      const meridianLine = L.polyline(lineCoords, {
        color: zone.color,
        weight: isSelected ? 1.8 : 1.2,
        opacity: isSelected ? 0.5 : 0.35,
        dashArray: isSelected ? "8, 4" : "6, 8", // toned down dashes for active/selected meridian
        interactive: false
      });
      meridianLine.addTo(map);
      layers.push(meridianLine);
    });

    zoneLayersRef.current = layers;

    return () => {
      layers.forEach((layer) => layer.remove());
    };
  }, [showZones, highlightedSystemId]);

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

    // Create markers
    validPoints.forEach((p) => {
      const isHighlighted = p.systemId === highlightedSystemId;
      if (isHighlighted) {
        // Skip drawing the marker for the selected/highlighted projection
        return;
      }
      const markerColor = getSystemColor(p.systemId);

      const customIcon = L.divIcon({
        html: `
          <div class="relative flex flex-col items-center justify-center group cursor-pointer">
            <!-- Inline mini hover tooltip -->
            <div class="absolute bottom-5 scale-0 group-hover:scale-100 bg-white/90 backdrop-blur-[2px] text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs border whitespace-nowrap z-[1100] transition-all duration-100 flex items-center gap-1"
                 style="border-color: ${markerColor}30; color: ${markerColor};">
              <span>${p.systemName} <span class="opacity-75 font-mono text-[8px]">(${p.epsg})</span></span>
            </div>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-opacity-90 border-2 border-white shadow-xs flex items-center justify-center transition-transform hover:scale-120 duration-100" style="background-color: ${markerColor}">
              <span class="h-1 w-1 rounded-full bg-white/70"></span>
            </span>
          </div>
        `,
        className: "custom-pin-small",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([p.lat, p.lon], { icon: customIcon })
        .addTo(map)
        .on("click", () => {
          onMarkerClick(p.systemId);
        });

      markersRef.current[p.systemId] = marker;
    });

    // Auto-zoom map bounds to fit points if we have active points in Sweden
    if (pointsToFit.length > 0) {
      const latLgList = pointsToFit.map((p) => L.latLng(p.lat, p.lon));
      const bounds = L.latLngBounds(latLgList);
      
      // Pad bounds slightly
      map.fitBounds(bounds.pad(0.12), { animate: true, duration: 0.8, maxZoom: 14 });
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

  const highlightedPoint = points.find((p) => p.systemId === highlightedSystemId);
  const highlightedSystemDetails = COORDINATE_SYSTEMS.find((s) => s.id === highlightedSystemId);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200/60 shadow-xs flex flex-col" id="map-parent">
      {/* Top Map Shortcuts Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5 max-w-[calc(100%-60px)]">
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-slate-100 flex items-center gap-1.5 text-xs font-sans hover:border-slate-200 transition-all duration-150">
          {/* SWEREF local zones toggler button */}
          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-2 py-1 rounded-lg transition font-semibold text-[11px] flex items-center gap-1.5 active:scale-95 duration-100 cursor-pointer ${
              showZones
                ? "bg-indigo-50 text-indigo-600 border border-indigo-200/50"
                : "hover:bg-slate-100 text-slate-600 border border-transparent"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showZones ? "bg-indigo-600 animate-pulse" : "bg-slate-400"}`}></span>
            Visa SWEREF-zoner
          </button>

          {/* Info card toggler button */}
          {highlightedPoint && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <button
                onClick={() => setShowInfoBox(!showInfoBox)}
                className={`px-2 py-1 rounded-lg transition font-semibold text-[11px] flex items-center gap-1.5 active:scale-95 duration-100 cursor-pointer ${
                  showInfoBox
                    ? "bg-blue-50 text-blue-600 border border-blue-200/50"
                    : "hover:bg-slate-100 text-slate-600 border border-transparent"
                }`}
                id="map-btn-toggle-infobox"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showInfoBox ? "bg-blue-600 animate-pulse" : "bg-slate-400"}`}></span>
                {showInfoBox ? "Dölj inforuta" : "Visa inforuta"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full bg-slate-50" id="leaflet-map" />

      {/* Map helper notice */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-slate-300 shadow-sm border border-slate-800 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
        <span>Tips: Klicka på zonerna eller kartan för att se koordinater</span>
      </div>

      {/* Floating Detailed Point Information card */}
      {showInfoBox && highlightedPoint && (
        <div 
          className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-200 w-80 flex flex-col gap-2.5 animate-fade-in"
          id="highlighted-point-infobox"
        >
          <div className="flex items-start justify-between border-b border-slate-100 pb-2">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block border border-white shadow-xs" 
                  style={{ backgroundColor: getSystemColor(highlightedPoint.systemId) }} 
                />
                {highlightedPoint.systemName}
              </div>
              <div className="text-[9px] text-slate-400 font-mono font-semibold uppercase tracking-wider mt-0.5">
                {highlightedPoint.epsg}
              </div>
            </div>
            <button
              onClick={() => setShowInfoBox(false)}
              className="text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Dölj"
              id="close-infobox-btn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2 text-[11px] font-sans text-slate-600">
            <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200/40 font-mono">
              <div>
                <span className="text-[9px] text-slate-400 font-sans block font-semibold">N (Northing)</span>
                <span className="text-xs font-bold text-slate-900">
                  {highlightedPoint.type === "WGS84" 
                    ? `${highlightedPoint.lat.toFixed(6)}°` 
                    : `${Math.round(highlightedPoint.n).toLocaleString("sv-SE")} m`}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-sans block font-semibold">E (Easting)</span>
                <span className="text-xs font-bold text-slate-900">
                  {highlightedPoint.type === "WGS84" 
                    ? `${highlightedPoint.lon.toFixed(6)}°` 
                    : `${Math.round(highlightedPoint.e).toLocaleString("sv-SE")} m`}
                </span>
              </div>
            </div>

            {highlightedPoint.type !== "WGS84" && (
              <div className="text-[10px] text-slate-500 font-sans leading-relaxed border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-450 uppercase text-[8px] tracking-wide block mb-1">Motsvarande WGS 84 (GPS)</span>
                <span className="font-mono text-slate-850 font-semibold">
                  Lat: {highlightedPoint.lat.toFixed(6)}° N<br />
                  Lon: {highlightedPoint.lon.toFixed(6)}° E
                </span>
              </div>
            )}

            {/* Projection Parameters */}
            {highlightedSystemDetails && (
              <div className="text-[10px] space-y-1">
                <span className="font-bold text-slate-450 uppercase text-[8px] tracking-wide block mb-1">Projektionsparametrar (Konform)</span>
                {highlightedSystemDetails.meridian !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Centralmeridian:</span>
                    <span className="font-mono text-slate-700 font-semibold">{highlightedSystemDetails.meridian}° Ö</span>
                  </div>
                )}
                {highlightedSystemDetails.scale !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Skalreduktion k₀:</span>
                    <span className="font-mono text-slate-700 font-semibold">{highlightedSystemDetails.scale}</span>
                  </div>
                )}
                {highlightedSystemDetails.falseNorthing !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">False Northing N₀:</span>
                    <span className="font-mono text-slate-700 font-semibold">{highlightedSystemDetails.falseNorthing.toLocaleString("sv-SE")} m</span>
                  </div>
                )}
                {highlightedSystemDetails.falseEasting !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">False Easting E₀:</span>
                    <span className="font-mono text-slate-700 font-semibold">{highlightedSystemDetails.falseEasting.toLocaleString("sv-SE")} m</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-150 pt-1 mt-1">
                  <span className="text-slate-400">Referensellipsoid:</span>
                  <span className="font-mono text-slate-705 uppercase font-semibold">{highlightedSystemDetails.ellipsoid}</span>
                </div>
                
                <p className="text-[9px] text-slate-400 mt-2 leading-relaxed bg-slate-50/50 p-1.5 rounded border border-slate-100 font-medium">
                  {highlightedSystemDetails.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
