import { useEffect, useRef } from "react";
import L from "leaflet";

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
}

interface MapComponentProps {
  points: MapMarkerPoint[];
  highlightedSystemId: string | null;
  onMapClick: (lat: number, lon: number) => void;
  onMarkerClick: (systemId: string) => void;
}

export default function MapComponent({
  points,
  highlightedSystemId,
  onMapClick,
  onMarkerClick,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

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

      // Define color and styling
      let colorClass = "bg-blue-600";
      if (p.type === "RT90") {
        colorClass = "bg-amber-600";
      } else if (p.type === "WGS84") {
        colorClass = "bg-emerald-600";
      }

      let customIcon;
      if (isHighlighted) {
        customIcon = L.divIcon({
          html: `
            <div class="relative flex flex-col items-center justify-center -translate-y-4">
              <div class="absolute -top-11 bg-slate-900/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded shadow-md border border-slate-700 whitespace-nowrap z-[1200] flex items-center gap-1">
                <span class="w-2 h-2 rounded-full overflow-hidden ${p.type === "WGS84" ? "bg-emerald-400" : p.type === "RT90" ? "bg-amber-400" : "bg-blue-400"}"></span>
                <span>${p.systemName}</span>
              </div>
              <span class="absolute inline-flex h-10 w-10 rounded-full opacity-60 animate-ping ${
                p.type === "WGS84" ? "bg-emerald-400" : p.type === "RT90" ? "bg-amber-400" : "bg-blue-400"
              }"></span>
              <span class="relative inline-flex rounded-full h-6.5 w-6.5 ${colorClass} border-2 border-white shadow-lg flex items-center justify-center">
                <span class="h-2 w-2 rounded-full bg-white"></span>
              </span>
            </div>
          `,
          className: "custom-pin",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      } else {
        customIcon = L.divIcon({
          html: `
            <div class="relative flex flex-col items-center justify-center group cursor-pointer">
              <!-- Inline mini hover tooltip -->
              <div class="absolute -top-7 scale-0 group-hover:scale-100 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded shadow-xs border border-slate-700 whitespace-nowrap z-[1100] transition-transform duration-100 flex items-center gap-1">
                <span>${p.systemName}</span>
              </div>
              <span class="relative inline-flex rounded-full h-4 w-4 ${colorClass} bg-opacity-90 border-2 border-white shadow-xs flex items-center justify-center transition-transform hover:scale-130 duration-100">
                <span class="h-1 w-1 rounded-full bg-white/70"></span>
              </span>
            </div>
          `,
          className: "custom-pin-small",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
      }

      const marker = L.marker([p.lat, p.lon], { icon: customIcon })
        .addTo(map)
        .on("click", () => {
          onMarkerClick(p.systemId);
        });

      // Bind simple popup
      marker.bindPopup(`
        <div class="text-xs font-sans p-1">
          <div class="font-bold text-slate-900">${p.systemName}</div>
          <div class="text-slate-500 text-[10px] uppercase font-mono tracking-wider mt-0.5">${p.epsg}</div>
          <div class="w-full h-px bg-slate-100 my-1.5"></div>
          <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div><span class="text-slate-400">Lat:</span> ${p.lat.toFixed(5)}°</div>
            <div><span class="text-slate-400">Lon:</span> ${p.lon.toFixed(5)}°</div>
          </div>
          <div class="text-[9px] ${p.isInSweden ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"} font-semibold rounded px-1.5 py-0.5 mt-1.5 text-center">
            ${p.isInSweden ? "Träffar Sverige 🇸🇪" : "Utanför Sverige 🌊"}
          </div>
        </div>
      `, { closeButton: false });

      markersRef.current[p.systemId] = marker;
    });

    // Auto-zoom map bounds to fit points if we have active points in Sweden
    if (pointsToFit.length > 0) {
      const latLgList = pointsToFit.map((p) => L.latLng(p.lat, p.lon));
      const bounds = L.latLngBounds(latLgList);
      
      // Pad bounds slightly
      map.fitBounds(bounds.pad(0.12), { animate: true, duration: 0.8, maxZoom: 14 });
    }
  }, [points]);

  // Handle programmatic highlighting / open popup when highlighted ID changes
  useEffect(() => {
    const marker = highlightedSystemId ? markersRef.current[highlightedSystemId] : null;
    const map = mapInstanceRef.current;
    if (marker && map) {
      marker.openPopup();
      // Smooth travel to marker but don't disrupt zoom too much
      const latlng = marker.getLatLng();
      map.panTo(latlng, { animate: true, duration: 0.5 });
    }
  }, [highlightedSystemId]);

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
        zoomLevel = 11;
        break;
      case "GBG":
        targetCoords = [57.7089, 11.9746];
        zoomLevel = 11;
        break;
      case "MALMO":
        targetCoords = [55.605, 13.0038];
        zoomLevel = 11;
        break;
      case "UMEA":
        targetCoords = [63.8258, 20.263];
        zoomLevel = 11;
        break;
    }

    mapInstanceRef.current.setView(targetCoords, zoomLevel, { animate: true });
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200/60 shadow-xs flex flex-col" id="map-parent">
      {/* Top Map Shortcuts Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5 max-w-[calc(100%-60px)]">
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-slate-100 flex items-center gap-1.5 text-xs font-sans">
          <span className="px-1.5 font-semibold text-slate-500">Genvägar:</span>
          <button
            onClick={() => zoomToArea("SVERIGE")}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition text-slate-700 font-medium cursor-pointer"
            id="map-btn-sverige"
          >
            Sverige
          </button>
          <button
            onClick={() => zoomToArea("STHLM")}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition text-slate-700 font-medium cursor-pointer"
            id="map-btn-sthlm"
          >
            Sthlm
          </button>
          <button
            onClick={() => zoomToArea("GBG")}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition text-slate-700 font-medium cursor-pointer"
            id="map-btn-gbg"
          >
            Gbg
          </button>
          <button
            onClick={() => zoomToArea("MALMO")}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition text-slate-700 font-medium cursor-pointer"
            id="map-btn-malmo"
          >
            Malmö
          </button>
          <button
            onClick={() => zoomToArea("UMEA")}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition text-slate-700 font-medium cursor-pointer"
            id="map-btn-umea"
          >
            Umeå
          </button>
        </div>
      </div>

      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full bg-slate-50" id="leaflet-map" />

      {/* Map helper notice */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-slate-300 shadow-sm border border-slate-800 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Klicka på kartan för att hitta nät som används där</span>
      </div>
    </div>
  );
}
