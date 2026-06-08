/**
 * Utility functions for coordinate conversions in Sweden.
 * Covers SWEREF 99 TM, SWEREF 99 local projections, and RT90 projections.
 * Relies on the standard Gauss-Kruger Transverse Mercator formulation (by Arnold Andreasson / Lantmäteriet)
 * and 3D Helmert transformasi (for RT90/Bessel ellipsoid).
 */

export interface CoordinateSystem {
  id: string;
  name: string;
  epsg: string;
  type: "SWEREF" | "RT90" | "WGS84";
  meridian?: number; // central meridian lambda_0 in degrees
  scale?: number;    // false scale factor k_0
  falseNorthing?: number; // N_0
  falseEasting?: number;  // E_0
  ellipsoid: "GRS80" | "Bessel1841" | "WGS84_GEO";
  description: string;
}

// Coordinate Ellipsoids
export const ELLIPSOIDS = {
  GRS80: {
    a: 6378137.0,                 // semi-major axis
    f: 1.0 / 298.257222101,       // flattening
  },
  Bessel1841: {
    a: 6377397.155,
    f: 1.0 / 299.1528128,
  }
};

// Available coordinate systems
export const COORDINATE_SYSTEMS: CoordinateSystem[] = [
  // WGS84 (Geodetic)
  {
    id: "wgs84",
    name: "WGS 84 / GPS",
    epsg: "EPSG:4326",
    type: "WGS84",
    ellipsoid: "WGS84_GEO",
    description: "Standard globalt koordinatsystem i decimalgrader (används av GPS, Google Maps)."
  },
  // SWEREF 99 TM (National Swedish)
  {
    id: "sweref99tm",
    name: "SWEREF 99 TM",
    epsg: "EPSG:3006",
    type: "SWEREF",
    meridian: 15.0,
    scale: 0.9996,
    falseNorthing: 0.0,
    falseEasting: 500000.0,
    ellipsoid: "GRS80",
    description: "Sveriges nationella kartprojektion. Används för småskalig kartering."
  },
  // SWEREF 99 Local Projections (Western to Eastern)
  {
    id: "sweref99_1200",
    name: "SWEREF 99 12 00",
    epsg: "EPSG:3007",
    type: "SWEREF",
    meridian: 12.0,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för västligaste Sverige (Strömstad, Tanum)."
  },
  {
    id: "sweref99_1330",
    name: "SWEREF 99 13 30",
    epsg: "EPSG:3008",
    type: "SWEREF",
    meridian: 13.5,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för västra Sverige (Göteborg, Karlstad, Trollhättan)."
  },
  {
    id: "sweref99_1415",
    name: "SWEREF 99 14 15",
    epsg: "EPSG:3012",
    type: "SWEREF",
    meridian: 14.25,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Mellankommunalt system i Skaraborg/Vänerregionen."
  },
  {
    id: "sweref99_1500",
    name: "SWEREF 99 15 00",
    epsg: "EPSG:3009",
    type: "SWEREF",
    meridian: 15.0,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för mellersta Sverige (Örebro, Borås, Halmstad)."
  },
  {
    id: "sweref99_1545",
    name: "SWEREF 99 15 45",
    epsg: "EPSG:3013",
    type: "SWEREF",
    meridian: 15.75,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för delar av Jönköpings och Kronobergs län."
  },
  {
    id: "sweref99_1630",
    name: "SWEREF 99 16 30",
    epsg: "EPSG:3010",
    type: "SWEREF",
    meridian: 16.5,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för delar av Östergötland och Sörmland (Linköping, Norrköping)."
  },
  {
    id: "sweref99_1715",
    name: "SWEREF 99 17 15",
    epsg: "EPSG:3014",
    type: "SWEREF",
    meridian: 17.25,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för östra Mellansverige."
  },
  {
    id: "sweref99_1800",
    name: "SWEREF 99 18 00",
    epsg: "EPSG:3011",
    type: "SWEREF",
    meridian: 18.0,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för östra Sverige (Stockholms län, Uppsala, Gotland)."
  },
  {
    id: "sweref99_1845",
    name: "SWEREF 99 18 45",
    epsg: "EPSG:3015",
    type: "SWEREF",
    meridian: 18.75,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för norra Upplandskusten och delar av Hälsingland."
  },
  {
    id: "sweref99_2015",
    name: "SWEREF 99 20 15",
    epsg: "EPSG:3016",
    type: "SWEREF",
    meridian: 20.25,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för Västerbotten (Umeå, Skellefteå)."
  },
  {
    id: "sweref99_2145",
    name: "SWEREF 99 21 45",
    epsg: "EPSG:3017",
    type: "SWEREF",
    meridian: 21.75,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för Norrbottenskusten (Luleå, Piteå)."
  },
  {
    id: "sweref99_2315",
    name: "SWEREF 99 23 15",
    epsg: "EPSG:3018",
    type: "SWEREF",
    meridian: 23.25,
    scale: 1.0,
    falseNorthing: 0.0,
    falseEasting: 150000.0,
    ellipsoid: "GRS80",
    description: "Lokalt system för östligaste Norrbotten (Haparanda, Kalix)."
  },
  // RT90 Projections (Bessel 1841 - historical mapping grid)
  {
    id: "rt90_75gon_v",
    name: "RT90 7.5 gon V",
    epsg: "EPSG:3019",
    type: "RT90",
    meridian: 11.1873194444,
    scale: 1.00000561024,
    falseNorthing: 0.0,
    falseEasting: 1500000.0,
    ellipsoid: "Bessel1841",
    description: "Äldre svenskt system för västligaste Sverige."
  },
  {
    id: "rt90_50gon_v",
    name: "RT90 5.0 gon V",
    epsg: "EPSG:3020",
    type: "RT90",
    meridian: 13.4972777778,
    scale: 1.00000561024,
    falseNorthing: 0.0,
    falseEasting: 1500000.0,
    ellipsoid: "Bessel1841",
    description: "Äldre regionalt system för västra Sverige."
  },
  {
    id: "rt90_25gon_v",
    name: "RT90 2.5 gon V",
    epsg: "EPSG:3021",
    type: "RT90",
    meridian: 15.8082777778,
    scale: 1.00000561024,
    falseNorthing: 0.0,
    falseEasting: 1500000.0,
    ellipsoid: "Bessel1841",
    description: "Det gamla nationella standardsystemet (Rikets nät, RT90). Används fortfarande i stor utsträckning."
  },
  {
    id: "rt90_00gon",
    name: "RT90 0.0 gon",
    epsg: "EPSG:3022",
    type: "RT90",
    meridian: 18.1201388889,
    scale: 1.00000561024,
    falseNorthing: 0.0,
    falseEasting: 1500000.0,
    ellipsoid: "Bessel1841",
    description: "Äldre regionalt system för östra Mellansverige."
  },
  {
    id: "rt90_25gon_o",
    name: "RT90 2.5 gon O",
    epsg: "EPSG:3023",
    type: "RT90",
    meridian: 20.4326111111,
    scale: 1.00000561024,
    falseNorthing: 0.0,
    falseEasting: 1500000.0,
    ellipsoid: "Bessel1841",
    description: "Äldre svenskt regionalt system för Västerbotten."
  },
  {
    id: "rt90_50gon_o",
    name: "RT90 5.0 gon O",
    epsg: "EPSG:3024",
    type: "RT90",
    meridian: 22.7454444444,
    scale: 1.00000561024,
    falseNorthing: 0.0,
    falseEasting: 1500000.0,
    ellipsoid: "Bessel1841",
    description: "Äldre svenskt regionalt system för Norrbotten."
  }
];

/**
 * ----------------- GEODETIC MATH SECTION -----------------
 */

/**
 * Converts geodetic latitude/longitude on the given ellipsoid to Cartesian X, Y, Z.
 */
export function geodeticToCartesian(lat: number, lon: number, h: number, a: number, f: number) {
  const lat_rad = (lat * Math.PI) / 180.0;
  const lon_rad = (lon * Math.PI) / 180.0;
  const e2 = f * (2.0 - f);
  
  const N = a / Math.sqrt(1.0 - e2 * Math.sin(lat_rad) * Math.sin(lat_rad));
  const X = (N + h) * Math.cos(lat_rad) * Math.cos(lon_rad);
  const Y = (N + h) * Math.cos(lat_rad) * Math.sin(lon_rad);
  const Z = (N * (1.0 - e2) + h) * Math.sin(lat_rad);
  
  return { x: X, y: Y, z: Z };
}

/**
 * Converts Cartesian X, Y, Z on the given ellipsoid to geodetic lat, lon, h.
 * Implements Bowring's vector iteration which is extremely precise.
 */
export function cartesianToGeodetic(X: number, Y: number, Z: number, a: number, f: number) {
  const e2 = f * (2.0 - f);
  const b = a * (1.0 - f);
  const ePrime2 = (a * a - b * b) / (b * b);
  
  const p = Math.sqrt(X * X + Y * Y);
  if (p < 1e-9) {
    // Pole exception
    const lat = Z > 0 ? 90.0 : -90.0;
    return { lat, lon: 0.0, h: Math.abs(Z) - b };
  }
  
  const theta = Math.atan2(Z * a, p * b);
  
  const lat = Math.atan2(
    Z + ePrime2 * b * Math.sin(theta) * Math.sin(theta) * Math.sin(theta),
    p - e2 * a * Math.cos(theta) * Math.cos(theta) * Math.cos(theta)
  );
  
  const lon = Math.atan2(Y, X);
  
  const N = a / Math.sqrt(1.0 - e2 * Math.sin(lat) * Math.sin(lat));
  const h = p / Math.cos(lat) - N;
  
  return {
    lat: (lat * 180.0) / Math.PI,
    lon: (lon * 180.0) / Math.PI,
    h: h
  };
}

/**
 * Transforms RT90 Geodetic (Bessel 1841 ellipsoid) to WGS84 Geodetic (GRS80/WGS84 ellipsoid).
 * Uses standard 7-parameter Helmert transformation.
 */
export function transformBesselToGRS80(lat: number, lon: number): { lat: number; lon: number } {
  const bessel = ELLIPSOIDS.Bessel1841;
  const cartBessel = geodeticToCartesian(lat, lon, 0.0, bessel.a, bessel.f);
  
  // Standard Lantmäteriet Helmert parameters for Bessel -> GRS80 (WGS84)
  const dx = 414.105;
  const dy = 150.282;
  const dz = 354.857;
  const rx = -0.01043 * (Math.PI / (180.0 * 3600.0));
  const ry = 1.01320 * (Math.PI / (180.0 * 3600.0));
  const rz = -2.17417 * (Math.PI / (180.0 * 3600.0));
  const ds = 8.44195 * 1e-6; // ppm
  
  // Apply transformation matrix (Coordinate Frame Rotation convention)
  const X_wgs = dx + (1.0 + ds) * (cartBessel.x + rz * cartBessel.y - ry * cartBessel.z);
  const Y_wgs = dy + (1.0 + ds) * (-rz * cartBessel.x + cartBessel.y + rx * cartBessel.z);
  const Z_wgs = dz + (1.0 + ds) * (ry * cartBessel.x - rx * cartBessel.y + cartBessel.z);
  
  const grs80 = ELLIPSOIDS.GRS80;
  const wgsGeodetic = cartesianToGeodetic(X_wgs, Y_wgs, Z_wgs, grs80.a, grs80.f);
  
  return { lat: wgsGeodetic.lat, lon: wgsGeodetic.lon };
}

/**
 * Transforms WGS84 Geodetic (GRS80/WGS84 ellipsoid) to RT90 Geodetic (Bessel 1841 ellipsoid).
 * Uses the inverse standard 7-parameter Helmert transformation.
 */
export function transformGRS80ToBessel(lat: number, lon: number): { lat: number; lon: number } {
  const grs80 = ELLIPSOIDS.GRS80;
  const cartWgs = geodeticToCartesian(lat, lon, 0.0, grs80.a, grs80.f);
  
  // Parameters
  const dx = 414.105;
  const dy = 150.282;
  const dz = 354.857;
  const rx = -0.01043 * (Math.PI / (180.0 * 3600.0));
  const ry = 1.01320 * (Math.PI / (180.0 * 3600.0));
  const rz = -2.17417 * (Math.PI / (180.0 * 3600.0));
  const ds = 8.44195 * 1e-6;
  
  // Inverse transformation (un-translate, un-scale, un-rotate via transposed matrix)
  const x_s = (cartWgs.x - dx) / (1.0 + ds);
  const y_s = (cartWgs.y - dy) / (1.0 + ds);
  const z_s = (cartWgs.z - dz) / (1.0 + ds);
  
  const X_b = x_s - rz * y_s + ry * z_s;
  const Y_b = rz * x_s + y_s - rx * z_s;
  const Z_b = -ry * x_s + rx * y_s + z_s;
  
  const bessel = ELLIPSOIDS.Bessel1841;
  const besselGeodetic = cartesianToGeodetic(X_b, Y_b, Z_b, bessel.a, bessel.f);
  
  return { lat: besselGeodetic.lat, lon: besselGeodetic.lon };
}

/**
 * Converts Geodetic (lat, lon) on GRS 80 (for SWEREF) or Bessel 1841 (for RT90) to grid coordinates.
 * Implements Krüger's Gauss-Kruger series formulation (millimeter-level precision in Sweden).
 */
export function geodeticToGrid(
  lat: number,
  lon: number,
  sys: CoordinateSystem
): { n: number; e: number } {
  if (sys.type === "WGS84") {
    // WGS84 doesn't have a grid projection itself — represent coordinates as latitude/longitude
    return { n: lat, e: lon };
  }
  
  const meridian = sys.meridian!;
  const scale = sys.scale!;
  const falseNorthing = sys.falseNorthing!;
  const falseEasting = sys.falseEasting!;
  
  // Determine relevant Ellipsoid
  const ellipsoidType = sys.ellipsoid;
  const ell = ELLIPSOIDS[ellipsoidType as keyof typeof ELLIPSOIDS];
  const a = ell.a;
  const f = ell.f;
  
  const lat_rad = (lat * Math.PI) / 180.0;
  const lon_rad = (lon * Math.PI) / 180.0;
  const lambda_0 = (meridian * Math.PI) / 180.0;
  
  const e2 = f * (2.0 - f);
  const n = f / (2.0 - f);
  const n2 = n * n;
  const n3 = n * n2;
  const n4 = n * n3;
  
  // Krüger's beta coefficients for latitude -> conformal mapping
  const beta1 = (1.0 / 2.0) * n - (2.0 / 3.0) * n2 + (5.0 / 16.0) * n3 + (41.0 / 180.0) * n4;
  const beta2 = (13.0 / 48.0) * n2 - (3.0 / 5.0) * n3 + (557.0 / 1440.0) * n4;
  const beta3 = (61.0 / 240.0) * n3 - (103.0 / 140.0) * n4;
  const beta4 = (49561.0 / 161280.0) * n4;
  
  const A_konst = (a / (1.0 + n)) * (1.0 + n2 / 4.0 + n4 / 64.0);
  
  const d_lambda = lon_rad - lambda_0;
  
  // Conformal latitude phi_star
  const e = Math.sqrt(e2);
  const sin_lat = Math.sin(lat_rad);
  const term1 = Math.log(Math.tan(Math.PI / 4.0 + lat_rad / 2.0));
  const term2 = e * Math.log(Math.tan(Math.PI / 4.0 + Math.asin(e * sin_lat) / 2.0));
  const psi = term1 - term2;
  
  const phi_star = Math.atan(Math.sinh(psi));
  
  // Conformal cylindrical values (xi_prime, eta_prime)
  const xi_prime = Math.atan(Math.tan(phi_star) / Math.cos(d_lambda));
  const eta_prime = Math.atanh(Math.cos(phi_star) * Math.sin(d_lambda));
  
  // Map series Expansion terms
  let xi = xi_prime;
  let eta = eta_prime;
  
  const betas = [beta1, beta2, beta3, beta4];
  for (let j = 1; j <= 4; j++) {
    const b = betas[j - 1];
    xi += b * Math.sin(2.0 * j * xi_prime) * Math.cosh(2.0 * j * eta_prime);
    eta += b * Math.cos(2.0 * j * xi_prime) * Math.sinh(2.0 * j * eta_prime);
  }
  
  const N = falseNorthing + scale * A_konst * xi;
  const E = falseEasting + scale * A_konst * eta;
  
  // Return formatted answers (rounded to nearest 3 decimals i.e. millimeter precicion)
  return {
    n: parseFloat(N.toFixed(3)),
    e: parseFloat(E.toFixed(3))
  };
}

/**
 * Converts Grid coordinates (N, E) on a Swedish grid (SWEREF/RT90) back to geodetic (lat, lon) degrees.
 */
export function gridToGeodetic(
  N: number,
  E: number,
  sys: CoordinateSystem
): { lat: number; lon: number } {
  if (sys.type === "WGS84") {
    // Coordinates are already degrees
    return { lat: N, lon: E };
  }
  
  const meridian = sys.meridian!;
  const scale = sys.scale!;
  const falseNorthing = sys.falseNorthing!;
  const falseEasting = sys.falseEasting!;
  
  const ellipsoidType = sys.ellipsoid;
  const ell = ELLIPSOIDS[ellipsoidType as keyof typeof ELLIPSOIDS];
  const a = ell.a;
  const f = ell.f;
  
  const e2 = f * (2.0 - f);
  const n = f / (2.0 - f);
  const n2 = n * n;
  const n3 = n * n2;
  const n4 = n * n3;
  
  // Krüger's delta coefficients for rectification
  const delta1 = (1.0 / 2.0) * n - (2.0 / 3.0) * n2 + (37.0 / 96.0) * n3 - (1.0 / 360.0) * n4;
  const delta2 = (1.0 / 48.0) * n2 + (1.0 / 15.0) * n3 - (437.0 / 1440.0) * n4;
  const delta3 = (17.0 / 480.0) * n3 - (37.0 / 840.0) * n4;
  const delta4 = (4397.0 / 161280.0) * n4;
  
  const A_konst = (a / (1.0 + n)) * (1.0 + n2 / 4.0 + n4 / 64.0);
  
  const xi = (N - falseNorthing) / (scale * A_konst);
  const eta = (E - falseEasting) / (scale * A_konst);
  
  let xi_prime = xi;
  let eta_prime = eta;
  
  const deltas = [delta1, delta2, delta3, delta4];
  for (let j = 1; j <= 4; j++) {
    const d = deltas[j - 1];
    xi_prime -= d * Math.sin(2.0 * j * xi) * Math.cosh(2.0 * j * eta);
    eta_prime -= d * Math.cos(2.0 * j * xi) * Math.sinh(2.0 * j * eta);
  }
  
  const phi_star = Math.asin(Math.sin(xi_prime) / Math.cosh(eta_prime));
  const d_lambda = Math.atan(Math.sinh(eta_prime) / Math.cos(xi_prime));
  
  const lambda_0 = (meridian * Math.PI) / 180.0;
  const lon_rad = lambda_0 + d_lambda;
  
  // Solve geodetic latitude from conformal latitude using isometric iterations (highly convergent)
  const e = Math.sqrt(e2);
  const s_star = Math.tan(Math.PI / 4.0 + phi_star / 2.0);
  let s = s_star;
  
  for (let i = 0; i < 6; i++) {
    const sin_phi = (s * s - 1.0) / (s * s + 1.0);
    const term = Math.pow((1.0 + e * sin_phi) / (1.0 - e * sin_phi), e / 2.0);
    s = s_star * term;
  }
  
  const lat_rad = 2.0 * Math.atan(s) - Math.PI / 2.0;
  
  return {
    lat: (lat_rad * 180.0) / Math.PI,
    lon: (lon_rad * 180.0) / Math.PI
  };
}

/**
 * Universal Coordinate Converter: Converts any coordinates from any system to any other system.
 */
export function convertCoordinatesBySystem(
  x: number, // Latitude, or N
  y: number, // Longitude, or E
  fromSys: CoordinateSystem,
  toSys: CoordinateSystem
): { n: number; e: number; success: boolean; error?: string } {
  try {
    if (isNaN(x) || isNaN(y)) {
      return { n: 0, e: 0, success: false, error: "Ogiltiga siffervärden." };
    }
    
    // Step 1: Convert original input to WGS84 Geodetic Decimal Degrees (lat, lon)
    let wgs84: { lat: number; lon: number };
    
    if (fromSys.type === "WGS84") {
      wgs84 = { lat: x, lon: y };
    } else if (fromSys.type === "SWEREF") {
      // SWEREF99 grids are direct Gauss-Kruger projections of the GRS80 ellipsoid.
      // They are identical to WGS84 for practically all mapping purposes
      wgs84 = gridToGeodetic(x, y, fromSys);
    } else if (fromSys.type === "RT90") {
      // 1. Grid coordinates -> RT90 coordinates on the Bessel ellipsoid
      const besselGeodetic = gridToGeodetic(x, y, fromSys);
      // 2. Bessel geodetic -> GRS80 (WGS84) geodetic via 7-parameter Helmert
      wgs84 = transformBesselToGRS80(besselGeodetic.lat, besselGeodetic.lon);
    } else {
      return { n: 0, e: 0, success: false, error: "Okänt ursprungssystem." };
    }
    
    // Quick sanity check for Sweden's coordinates:
    // Sweden is between latitudes 55° N and 70° N, and longitudes 10° E and 25° E.
    // Allow broad bounds so it converts global values too, but check bounds for safety.
    if (Math.abs(wgs84.lat) > 90 || Math.abs(wgs84.lon) > 180) {
      return { n: 0, e: 0, success: false, error: "Koordinaterna är utanför giltiga gränser för jorden." };
    }
    
    // Step 2: Convert WGS84 Geodetic to target system coordinates
    let result: { n: number; e: number };
    
    if (toSys.type === "WGS84") {
      result = { n: wgs84.lat, e: wgs84.lon };
    } else if (toSys.type === "SWEREF") {
      result = geodeticToGrid(wgs84.lat, wgs84.lon, toSys);
    } else if (toSys.type === "RT90") {
      // 1. WGS84 geodetic -> Bessel ellipsoid geodetic via inverse Helmert
      const besselGeodetic = transformGRS80ToBessel(wgs84.lat, wgs84.lon);
      // 2. Bessel geodetic -> Grid coordinates on Bessel ellipsoid
      result = geodeticToGrid(besselGeodetic.lat, besselGeodetic.lon, toSys);
    } else {
      return { n: 0, e: 0, success: false, error: "Okänt målsystem." };
    }
    
    return { ...result, success: true };
  } catch (err: any) {
    return { n: 0, e: 0, success: false, error: err.message || "Ett konverteringsfel inträffade." };
  }
}

/**
 * ----------------- GEOMETRIC FORMAT PARSING/FORMATTING -----------------
 */

/**
 * Formats a decimal degrees coordinate to Degrees, Minutes, Seconds (DMS) string.
 */
export function degToDMS(deg: number, isLat: boolean): string {
  const d = Math.floor(Math.abs(deg));
  const minFloat = (Math.abs(deg) - d) * 60;
  const m = Math.floor(minFloat);
  const s = parseFloat(((minFloat - m) * 60).toFixed(2));
  
  const direction = isLat 
    ? (deg >= 0 ? "N" : "S") 
    : (deg >= 0 ? "Ö" : "V"); // Swedish terminology
    
  return `${d}° ${m}' ${s.toFixed(2)}" ${direction}`;
}

/**
 * Formats a decimal degrees coordinate to Degrees, Decimal Minutes (DM) string.
 */
export function degToDM(deg: number, isLat: boolean): string {
  const d = Math.floor(Math.abs(deg));
  const min = parseFloat(((Math.abs(deg) - d) * 60).toFixed(4));
  
  const direction = isLat 
    ? (deg >= 0 ? "N" : "S") 
    : (deg >= 0 ? "Ö" : "V"); // Swedish terminology
    
  return `${d}° ${min.toFixed(4)}' ${direction}`;
}

/**
 * Parses a DMS (e.g. 59° 19' 45" N) or DM (e.g. 59° 19.75' N) or DD (e.g. 59.329) string to decimal degrees.
 * Extremely robust regex parser.
 */
export function parseWGS84String(str: string, isLat: boolean): number | null {
  const cleanStr = str.trim().toUpperCase().replace(/\s+/g, " ");
  if (!cleanStr) return null;
  
  // 1. Check for standard decimal degrees with or without cardinal direction, e.g. "59.3293 N", "18.06 Ö", "-12.35"
  const decMatches = cleanStr.match(/^([+-]?\d+(?:\.\d+)?)\s*°?\s*([NÖESVWM])?$/);
  if (decMatches) {
    let val = parseFloat(decMatches[1]);
    const dir = decMatches[2];
    if (dir === "S" || dir === "V" || dir === "W") {
      val = -Math.abs(val);
    }
    return val;
  }
  
  // 2. Check for Degrees, Minutes, Seconds (DMS), e.g. "59° 19' 45.48\" N"
  // Regex matches: Degrees, Minutes, optionally seconds, and cardinal directions
  const dmsMatches = cleanStr.match(/^(\d+)\s*[°º]?\s*(\d+)\s*['´’]?\s*(\d+(?:\.\d+)?)\s*["”¨´']{0,2}\s*([NÖESVWM])?$/);
  if (dmsMatches) {
    const d = parseInt(dmsMatches[1]);
    const m = parseInt(dmsMatches[2]);
    const s = parseFloat(dmsMatches[3]);
    const dir = dmsMatches[4];
    
    let decimal = d + m / 60.0 + s / 3600.0;
    if (dir === "S" || dir === "V" || dir === "W") {
      decimal = -decimal;
    }
    return decimal;
  }
  
  // 3. Check for Degrees, Decimal Minutes (DM), e.g. "59° 19.758' N"
  const dmMatches = cleanStr.match(/^(\d+)\s*[°º]?\s*(\d+(?:\.\d+)?)\s*['´’]?\s*([NÖESVWM])?$/);
  if (dmMatches) {
    const d = parseInt(dmMatches[1]);
    const m = parseFloat(dmMatches[2]);
    const dir = dmMatches[3];
    
    let decimal = d + m / 60.0;
    if (dir === "S" || dir === "V" || dir === "W") {
      decimal = -decimal;
    }
    return decimal;
  }
  
  // 4. Try parsing as a vanilla float
  const parsed = parseFloat(cleanStr);
  if (!isNaN(parsed)) {
    return parsed;
  }
  
  return null;
}
