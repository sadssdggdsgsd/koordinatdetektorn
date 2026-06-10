import { useState, useMemo } from "react";
import { 
  Compass, 
  Search,
  Check,
  X,
  MapPin,
  Map,
  Globe,
  Building2,
  Navigation,
  Info
} from "lucide-react";
import { 
  COORDINATE_SYSTEMS, 
  CoordinateSystem, 
  convertCoordinatesBySystem, 
  geodeticToGrid,
  degToDMS,
  degToDM
} from "./utils/coordinateConversion";
import MapComponent, { MapMarkerPoint, getSystemColor } from "./components/MapComponent";
import { MUNICIPALITIES, Municipality } from "./utils/municipalitiesData";

interface MapClickAnalysis {
  lat: number;
  lon: number;
  closestLocalSweref: CoordinateSystem;
  closestLocalSwerefCoords: { n: number; e: number };
  closestRt90: CoordinateSystem;
  closestRt90Coords: { n: number; e: number };
  nationalTmCoords: { n: number; e: number };
}

export default function App() {
  // Start with default coordinates in SWEREF 99 17 15
  const [inputVal1, setInputVal1] = useState<string>("6920594.283"); // Northing / Latitud
  const [inputVal2, setInputVal2] = useState<string>("152152.249");  // Easting / Longitud

  const [highlightedSystemId, setHighlightedSystemId] = useState<string | null>("sweref99_1715");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [muniSearchQuery, setMuniSearchQuery] = useState<string>("");
  const [sidebarTab, setSidebarTab] = useState<"systems" | "municipalities">("systems");
  const [selectedMunicipalityName, setSelectedMunicipalityName] = useState<string | null>(null);
  const [onlySweden, setOnlySweden] = useState<boolean>(true);
  const [mapClickAnalysis, setMapClickAnalysis] = useState<MapClickAnalysis | null>(null);

  // Parse numerical inputs safely
  const parsedCoords = useMemo(() => {
    const raw1 = parseFloat(inputVal1.replace(/[\s\xa0]/g, "").replace(",", "."));
    const raw2 = parseFloat(inputVal2.replace(/[\s\xa0]/g, "").replace(",", "."));
    return {
      n: isNaN(raw1) ? null : raw1,
      e: isNaN(raw2) ? null : raw2,
    };
  }, [inputVal1, inputVal2]);

  // Sweden bounding box diagnostic
  const isPointInSweden = (lat: number, lon: number): boolean => {
    return lat >= 54.5 && lat <= 70.0 && lon >= 10.0 && lon <= 24.5;
  };

  // Convert inputs across all systems
  const computedPoints = useMemo<MapMarkerPoint[]>(() => {
    const { n, e } = parsedCoords;
    if (n === null || e === null) return [];

    const wgs84System = COORDINATE_SYSTEMS.find((s) => s.id === "wgs84")!;

    // Find active grid system (excluding WGS84 itself) to decode grid coords to geodetic WGS84
    let activeGridSys = COORDINATE_SYSTEMS.find((s) => s.id === highlightedSystemId && s.type !== "WGS84");
    if (!activeGridSys) {
      // Default to sweref99tm if the highlighted system is WGS84 or empty
      activeGridSys = COORDINATE_SYSTEMS.find((s) => s.id === "sweref99tm") || COORDINATE_SYSTEMS.find((s) => s.type === "SWEREF");
    }

    return COORDINATE_SYSTEMS.map((sys) => {
      if (sys.type === "WGS84") {
        const isInputGeodetic = Math.abs(n) <= 90 && Math.abs(e) <= 180;
        let lat = NaN;
        let lon = NaN;
        
        if (isInputGeodetic) {
          lat = n;
          lon = e;
        } else if (activeGridSys) {
          // Calculate geodetic lat/lon on WGS84 by decoding the grid coordinates with the selected active system
          const result = convertCoordinatesBySystem(n, e, activeGridSys, wgs84System);
          if (result.success) {
            lat = result.n;
            lon = result.e;
          }
        }

        const valid = !isNaN(lat) && !isNaN(lon);
        return {
          systemId: sys.id,
          systemName: sys.name,
          epsg: sys.epsg,
          type: sys.type,
          lat: lat,
          lon: lon,
          isInSweden: valid ? isPointInSweden(lat, lon) : false,
          n: n,
          e: e,
        };
      }

      const result = convertCoordinatesBySystem(n, e, sys, wgs84System);
      const lat = result.success ? result.n : NaN;
      const lon = result.success ? result.e : NaN;
      const valid = !isNaN(lat) && !isNaN(lon);

      return {
        systemId: sys.id,
        systemName: sys.name,
        epsg: sys.epsg,
        type: sys.type,
        lat: lat,
        lon: lon,
        isInSweden: valid ? isPointInSweden(lat, lon) : false,
        n: n,
        e: e,
      };
    }).filter((p) => !isNaN(p.lat) && !isNaN(p.lon));
  }, [parsedCoords, highlightedSystemId]);

  const wgsPoint = useMemo(() => {
    return computedPoints.find((p) => p.systemId === "wgs84");
  }, [computedPoints]);

  // Active position analysis: finds the closest Swedish municipality and its official projection recomendation
  const activeLocationAnalysis = useMemo(() => {
    // Get geodetic Lat/Lon of input coordinates (using the computed WGS84 point)
    const wgsPoint = computedPoints.find((p) => p.systemId === "wgs84");
    if (!wgsPoint || isNaN(wgsPoint.lat) || isNaN(wgsPoint.lon)) return null;

    const lat = wgsPoint.lat;
    const lon = wgsPoint.lon;

    // Search for closest municipality
    let closestMuni = MUNICIPALITIES[0];
    let minDist = Infinity;

    MUNICIPALITIES.forEach((m) => {
      const dy = m.lat - lat;
      const dx = (m.lon - lon) * Math.cos((lat * Math.PI) / 180.0);
      const dist = dy * dy + dx * dx;
      if (dist < minDist) {
        minDist = dist;
         closestMuni = m;
      }
    });

    let recommendationId = closestMuni.projectionId;
    let recommendationName = closestMuni.projection;
    let displayName = closestMuni.name;

    // Kiruna / large municipalities handle: "Vissa kommuner (Kiruna?) är så stora att de har flera, kör det gamla systemet där"
    if (closestMuni.name.startsWith("Kiruna")) {
      // Automatic older stripe system logic based purely on longitude ranges
      if (lon < 19.5) {
        displayName = "Kiruna Väst (Zon 1)";
        recommendationName = "SWEREF 99 18 45";
        recommendationId = "sweref99_1845";
      } else if (lon >= 19.5 && lon < 21.0) {
        displayName = "Kiruna Central/Väst (Zon 2)";
        recommendationName = "SWEREF 99 20 15";
        recommendationId = "sweref99_2015";
      } else if (lon >= 21.0 && lon < 22.5) {
        displayName = "Kiruna Mellan/Öst (Zon 3)";
        recommendationName = "SWEREF 99 21 45";
        recommendationId = "sweref99_2145";
      } else {
        displayName = "Kiruna Öst (Zon 4)";
        recommendationName = "SWEREF 99 23 15";
        recommendationId = "sweref99_2315";
      }
    }

    const distKm = Math.sqrt(minDist) * 111.12;

    return {
      closestMuni,
      displayName,
      recommendationId,
      recommendationName,
      distKm: distKm
    };
  }, [computedPoints]);

  const handleSelectMunicipality = (muniName: string) => {
    const m = MUNICIPALITIES.find((item) => item.name === muniName);
    if (!m) return;

    setSelectedMunicipalityName(m.name);

    // Get recommended projection system
    const systemId = m.projectionId;
    const system = COORDINATE_SYSTEMS.find((sys) => sys.id === systemId);

    if (system) {
      // Calculate coordinates of the municipality center in its recommended local system
      const gridCoords = geodeticToGrid(m.lat, m.lon, system);
      setInputVal1(Math.round(gridCoords.n).toString());
      setInputVal2(Math.round(gridCoords.e).toString());
      setHighlightedSystemId(systemId);
    }
  };

  // Map Click handler (finds target systems based on clicked position)
  const handleMapClick = (lat: number, lon: number) => {
    const localSwerefProjections = COORDINATE_SYSTEMS.filter(
      (sys) => sys.type === "SWEREF" && sys.id !== "sweref99tm"
    );
    const closestLocalSweref = localSwerefProjections.reduce((prev, curr) => {
      const prevDiff = Math.abs((prev.meridian || 15.0) - lon);
      const currDiff = Math.abs((curr.meridian || 15.0) - lon);
      return currDiff < prevDiff ? curr : prev;
    });

    const rt90Projections = COORDINATE_SYSTEMS.filter((sys) => sys.type === "RT90");
    const closestRt90 = rt90Projections.reduce((prev, curr) => {
      const prevDiff = Math.abs((prev.meridian || 15.0) - lon);
      const currDiff = Math.abs((curr.meridian || 15.0) - lon);
      return currDiff < prevDiff ? curr : prev;
    });

    const localCoords = geodeticToGrid(lat, lon, closestLocalSweref);
    const rtCoords = geodeticToGrid(lat, lon, closestRt90);
    const nationalCoords = geodeticToGrid(lat, lon, COORDINATE_SYSTEMS.find((s) => s.id === "sweref99tm")!);

    // Also find and select nearest municipality to the clicked point
    let closestMuni = MUNICIPALITIES[0];
    let minDist = Infinity;
    MUNICIPALITIES.forEach((m) => {
      const dy = m.lat - lat;
      const dx = (m.lon - lon) * Math.cos((lat * Math.PI) / 180.0);
      const dist = dy * dy + dx * dx;
      if (dist < minDist) {
        minDist = dist;
        closestMuni = m;
      }
    });

    let recSystemId = closestMuni.projectionId;
    if (closestMuni.name.startsWith("Kiruna")) {
      if (lon < 19.5) {
        recSystemId = "sweref99_1845";
      } else if (lon >= 19.5 && lon < 21.0) {
        recSystemId = "sweref99_2015";
      } else if (lon >= 21.0 && lon < 22.5) {
        recSystemId = "sweref99_2145";
      } else {
        recSystemId = "sweref99_2315";
      }
    }

    const sys = COORDINATE_SYSTEMS.find((s) => s.id === recSystemId);
    if (sys) {
      const gridCoords = geodeticToGrid(lat, lon, sys);
      setInputVal1(gridCoords.n.toString());
      setInputVal2(gridCoords.e.toString());
      setHighlightedSystemId(recSystemId);
      setSelectedMunicipalityName(closestMuni.name);
    }

    setMapClickAnalysis({
      lat,
      lon,
      closestLocalSweref,
      closestLocalSwerefCoords: localCoords,
      closestRt90,
      closestRt90Coords: rtCoords,
      nationalTmCoords: nationalCoords,
    });
  };

  const handleLoadTestCoordinates = (n: number, e: number, systemId: string) => {
    setInputVal1(Math.round(n).toString());
    setInputVal2(Math.round(e).toString());
    setHighlightedSystemId(systemId);
  };

  const applyPreset = (preset: "STHLM_LOCAL" | "STHLM_TM" | "STHLM_RT90" | "GPS") => {
    if (preset === "STHLM_LOCAL") {
      setInputVal1("6580512");
      setInputVal2("149202");
      setHighlightedSystemId("sweref99_1800");
    } else if (preset === "STHLM_TM") {
      setInputVal1("6579233");
      setInputVal2("674122");
      setHighlightedSystemId("sweref99tm");
    } else if (preset === "STHLM_RT90") {
      setInputVal1("6580392");
      setInputVal2("1628345");
      setHighlightedSystemId("rt90_25gon_v");
    } else if (preset === "GPS") {
      setInputVal1("59.3293");
      setInputVal2("18.0686");
      setHighlightedSystemId("wgs84");
    }
  };

  const filteredPoints = useMemo(() => {
    return computedPoints.filter((pt) => {
      const matchesSearch =
        pt.systemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.epsg.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (onlySweden && !pt.isInSweden) return false;

      return true;
    });
  }, [computedPoints, searchQuery, onlySweden]);

  const filteredMunicipalities = useMemo(() => {
    return MUNICIPALITIES.filter((m) => {
      return (
        m.name.toLowerCase().includes(muniSearchQuery.toLowerCase()) ||
        m.county.toLowerCase().includes(muniSearchQuery.toLowerCase()) ||
        m.projection.toLowerCase().includes(muniSearchQuery.toLowerCase())
      );
    });
  }, [muniSearchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col" id="detector-root">
      
      {/* 1. COMPACT, SPACIOUS HEADER */}
      <header className="bg-white border-b border-slate-100 py-3.5 px-6 flex items-center justify-between flex-wrap gap-4" id="detector-header">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5.5 h-5.5 text-blue-600 shrink-0" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900" id="header-title">
              Svenska Koordinatdetektorn
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Identifiera, konvertera och verifiera svenska kartprojektioner</p>
          </div>
        </div>
      </header>

      {/* 2. MINIMAL INPUT CONSOLE */}
      <section className="bg-white border-b border-slate-100 px-6 py-4" id="coordinates-input-bar">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box 1 */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Y: Nord (N) / Latitud (breddgrad)</span>
              <div className="relative">
                <input
                  type="text"
                  value={inputVal1}
                  onChange={(e) => setInputVal1(e.target.value)}
                  placeholder="N eller Lat (t.ex. 6580512)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition"
                  id="input-coord1"
                />
                {inputVal1 && (
                  <button
                    onClick={() => setInputVal1("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 animate-fade-in"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Box 2 */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">X: Öst (E) / Longitud (längdgrad)</span>
              <div className="relative">
                <input
                  type="text"
                  value={inputVal2}
                  onChange={(e) => setInputVal2(e.target.value)}
                  placeholder="E eller Lon (t.ex. 149202)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition"
                  id="input-coord2"
                />
                {inputVal2 && (
                  <button
                    onClick={() => setInputVal2("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 animate-fade-in"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Real-time geodetic coordinate representation for marked / active projection */}
          {wgsPoint && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-600 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold uppercase text-[9.5px] text-slate-400 tracking-wide select-none shrink-0">
                <Globe className="w-4 h-4 text-blue-600 animate-spin-slow" style={{ animationDuration: '10s' }} />
                <span>Geodetisk Position (WGS84):</span>
              </div>
              <div className="flex flex-wrap items-center gap-3.5 text-[11px]">
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200/50 shadow-3xs">
                  Latitud (breddgrad): <span className="font-bold text-slate-900">{wgsPoint.lat.toFixed(6)}° N</span>
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200/50 shadow-3xs">
                  Longitud (längdgrad): <span className="font-bold text-slate-900">{wgsPoint.lon.toFixed(6)}° Ö</span>
                </span>
                <span className="text-slate-400 font-medium font-sans">
                  ({degToDMS(wgsPoint.lat, true)}, {degToDMS(wgsPoint.lon, false)})
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. CORE TWO-COLUMN SPLIT */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="detector-workspace">
        
        {/* LEFT COLUMN: Deep Clean List (Spans 3 columns for a broader map presence) */}
        <section className="lg:col-span-3 flex flex-col gap-3 min-w-0" id="predictions-sidebar">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex flex-col gap-3.5 flex-1 min-h-0">
            
            {/* Active Position / Municipality detector banner */}
            {activeLocationAnalysis && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-250/30 flex flex-col gap-1.5 text-xs text-slate-600 shadow-3xs" id="active-location-banner">
                <div className="flex items-center justify-between border-b border-slate-150/50 pb-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-blue-500 animate-pulse" />
                    Detekterad kommunzon
                  </span>
                  <span className="text-[9px] font-bold text-slate-450 font-mono">
                    ca {activeLocationAnalysis.distKm.toFixed(1)} km bort
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2.5 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-slate-800 text-[11.5px] truncate">
                      {activeLocationAnalysis.displayName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      Officiellt nät: <span className="font-extrabold text-blue-600">{activeLocationAnalysis.recommendationName}</span>
                    </div>
                  </div>
                  {highlightedSystemId !== activeLocationAnalysis.recommendationId && (
                    <button
                      onClick={() => {
                        setHighlightedSystemId(activeLocationAnalysis.recommendationId);
                        setSelectedMunicipalityName(activeLocationAnalysis.closestMuni.name);
                      }}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-750 text-white rounded text-[9.5px] font-extrabold uppercase shrink-0 transition active:scale-95 duration-100 cursor-pointer"
                      title="Aktivera denna projektion i listan"
                    >
                      Aktivera
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sidebar Tab Swallower */}
            <div className="flex border border-slate-150/40 p-0.5 bg-slate-100/70 rounded-lg">
              <button
                onClick={() => setSidebarTab("systems")}
                className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-extrabold transition cursor-pointer ${
                  sidebarTab === "systems"
                    ? "bg-white text-blue-600 shadow-3xs border border-slate-200/25"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Projektioner (EPSG)
              </button>
              <button
                onClick={() => setSidebarTab("municipalities")}
                className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-extrabold transition cursor-pointer ${
                  sidebarTab === "municipalities"
                    ? "bg-white text-blue-600 shadow-3xs border border-slate-200/25"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Kommuner (290)
              </button>
            </div>

            {/* Render systems projection tab */}
            {sidebarTab === "systems" ? (
              <>
                {/* Search and Minimal Filter Checkbox */}
                <div className="flex flex-col gap-2.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Sök på system eller EPSG (t.ex. 3006)..."
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 pl-8 pr-3 focus:outline-none focus:border-blue-500"
                      id="sidebar-search-field"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-600 font-medium hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={onlySweden}
                      onChange={(e) => setOnlySweden(e.target.checked)}
                      className="rounded border-slate-200 text-blue-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                    />
                    <span>Visa endast träffar som landar i Sverige 🇸🇪</span>
                  </label>
                </div>

                {/* Flat high-density scrollable system rows */}
                <div className="flex-1 overflow-y-auto max-h-[560px] lg:max-h-[640px] pr-1 flex flex-col gap-1.5 animate-fade-in" id="predictions-list">
                  {filteredPoints.length > 0 ? (
                    filteredPoints.map((pt) => {
                      const isHighlighted = pt.systemId === highlightedSystemId;
                      const color = getSystemColor(pt.systemId);
                      
                      return (
                        <div
                          key={pt.systemId}
                          onClick={() => setHighlightedSystemId(pt.systemId)}
                          className={`p-2.5 rounded-lg border text-left transition duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                            isHighlighted
                              ? "bg-slate-100/90 border-slate-300"
                              : "bg-slate-50/40 border-slate-200/50 hover:bg-slate-100/70"
                          }`}
                          style={isHighlighted ? { borderColor: color, boxShadow: `0 0 0 1px ${color}` } : {}}
                          id={`system-row-${pt.systemId}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-white shadow-xs inline-block"
                              style={{ backgroundColor: color }}
                              title="Zonfärg på kartan"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {pt.systemName}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono font-semibold">
                                {pt.epsg}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isHighlighted && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-[11px] text-slate-400 bg-slate-50/50 rounded-lg border border-slate-100">
                      Inga nät matchar din sökning. Fyll i koordinater eller ändra filter.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Municipalities search searchfield */}
                <div className="flex flex-col gap-2.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 text-slate-400 w-3.5 h-3.5 animate-fade-in" />
                    <input
                      type="text"
                      value={muniSearchQuery}
                      onChange={(e) => setMuniSearchQuery(e.target.value)}
                      placeholder="Sök kommun, län eller nät (t.ex. Ale)..."
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg py-1.5 pl-8 pr-3 focus:outline-none focus:border-blue-500 animate-fade-in"
                      id="muni-search-field"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal px-0.5">
                    Visar {filteredMunicipalities.length} av 290 kommuner. Klicka på en kommun för att ladda centerkoordinater och zooma in kartan.
                  </p>
                </div>

                {/* HIGH-DENSITY MUNICIPALITY SCROLLER */}
                <div className="flex-1 overflow-y-auto max-h-[560px] lg:max-h-[640px] pr-1 flex flex-col gap-1.5 animate-fade-in" id="municipalities-list">
                  {filteredMunicipalities.length > 0 ? (
                    filteredMunicipalities.map((muni) => {
                      const isHighlighted = muni.name === selectedMunicipalityName;
                      const color = getSystemColor(muni.projectionId);

                      return (
                        <div
                          key={muni.name}
                          onClick={() => handleSelectMunicipality(muni.name)}
                          className={`p-2.5 rounded-lg border text-left transition duration-155 cursor-pointer flex flex-col gap-1.5 ${
                            isHighlighted
                              ? "bg-slate-50/80"
                              : "bg-slate-50/40 border-slate-200/50 hover:bg-slate-100/70"
                          }`}
                          style={isHighlighted ? { borderColor: color, boxShadow: `0 0 0 1px ${color}` } : {}}
                          id={`muni-row-${muni.name}`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span 
                                  className="w-2 h-2 rounded-full shrink-0 border border-white inline-block"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-xs font-extrabold text-slate-800">
                                  {muni.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {muni.county}
                              </div>
                              <div className="text-[10px] text-blue-600 font-bold mt-1 font-sans">
                                {muni.projection}
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center">
                              {isHighlighted && <Check className="w-3.5 h-3.5 text-blue-600" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-[11px] text-slate-400 bg-slate-50/50 rounded-lg border border-slate-100 animate-fade-in">
                      Inga kommuner matchar din sökning.
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </section>

        {/* RIGHT COLUMN: Interactive map (Spans 9 columns of widescreen space for maximum presence) */}
        <section className="lg:col-span-9 flex flex-col gap-3 min-w-0" id="map-and-analysis-area">
          <div className="h-[500px] lg:h-[800px] w-full" id="map-holder">
            <MapComponent
              points={computedPoints}
              highlightedSystemId={highlightedSystemId}
              onMapClick={handleMapClick}
              onMarkerClick={(id) => setHighlightedSystemId(id)}
              onMunicipalityClick={handleSelectMunicipality}
              selectedMunicipalityName={selectedMunicipalityName}
            />
          </div>

          {/* Clean, one-liner click analysis block */}
          {mapClickAnalysis ? (
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs flex flex-col gap-2.5 animate-fade-in" id="click-analysis-report">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-emerald-500" />
                  Klickanalys: {mapClickAnalysis.lat.toFixed(4)}°, {mapClickAnalysis.lon.toFixed(4)}°
                </span>
                <button
                  onClick={() => setMapClickAnalysis(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  Dölj
                </button>
              </div>

              {/* Minimal horizontal row elements for recommended systems */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" id="klick-choices">
                {/* 1. Lokalt */}
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/50 flex flex-col justify-between gap-1.5">
                  <div>
                    <div className="text-[10px] font-bold text-slate-700 truncate">
                      {mapClickAnalysis.closestLocalSweref.name}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                      N: {Math.round(mapClickAnalysis.closestLocalSwerefCoords.n).toLocaleString("sv-SE")}
                      <br />
                      E: {Math.round(mapClickAnalysis.closestLocalSwerefCoords.e).toLocaleString("sv-SE")}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleLoadTestCoordinates(
                        mapClickAnalysis.closestLocalSwerefCoords.n,
                        mapClickAnalysis.closestLocalSwerefCoords.e,
                        mapClickAnalysis.closestLocalSweref.id
                      )
                    }
                    className="w-full text-center py-1 rounded bg-blue-600 hover:bg-blue-700 transition text-[9px] font-bold text-white cursor-pointer"
                  >
                    Använd lokalt
                  </button>
                </div>

                {/* 2. Nationellt */}
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/50 flex flex-col justify-between gap-1.5">
                  <div>
                    <div className="text-[10px] font-bold text-slate-700 truncate">SWEREF 99 TM</div>
                    <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                      N: {Math.round(mapClickAnalysis.nationalTmCoords.n).toLocaleString("sv-SE")}
                      <br />
                      E: {Math.round(mapClickAnalysis.nationalTmCoords.e).toLocaleString("sv-SE")}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleLoadTestCoordinates(
                        mapClickAnalysis.nationalTmCoords.n,
                        mapClickAnalysis.nationalTmCoords.e,
                        "sweref99tm"
                      )
                    }
                    className="w-full text-center py-1 rounded bg-blue-600 hover:bg-blue-700 transition text-[9px] font-bold text-white cursor-pointer"
                  >
                    Använd TM
                  </button>
                </div>

                {/* 3. RT90 */}
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/50 flex flex-col justify-between gap-1.5">
                  <div>
                    <div className="text-[10px] font-bold text-slate-700 truncate">
                      {mapClickAnalysis.closestRt90.name}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                      N: {Math.round(mapClickAnalysis.closestRt90Coords.n).toLocaleString("sv-SE")}
                      <br />
                      E: {Math.round(mapClickAnalysis.closestRt90Coords.e).toLocaleString("sv-SE")}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleLoadTestCoordinates(
                        mapClickAnalysis.closestRt90Coords.n,
                        mapClickAnalysis.closestRt90Coords.e,
                        mapClickAnalysis.closestRt90.id
                      )
                    }
                    className="w-full text-center py-1 rounded bg-blue-600 hover:bg-blue-700 transition text-[9px] font-bold text-white cursor-pointer"
                  >
                    Använd RT90
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
