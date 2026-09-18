import * as topojson from 'topojson-client';
import * as d3Geo from 'd3-geo';
import worldAtlasData from 'world-atlas/countries-50m.json';
import { COUNTRIES_195 } from '../data/countriesData';
import { WorldCountryInfo } from '../types';

export interface ExtendedCountryFeature {
  type: 'Feature';
  id?: string | number;
  properties: {
    name: string;
    code: string;
    flag: string;
    lat: number;
    lng: number;
    continent: string;
    info: WorldCountryInfo;
  };
  geometry: any;
  bounds: [[number, number], [number, number]]; // [[west, south], [east, north]]
}

// Special alias mapping between countriesData and world-atlas 50m names
const NAME_ALIASES: Record<string, string> = {
  US: 'United States of America',
  CZ: 'Czechia',
  BA: 'Bosnia and Herz.',
  MK: 'Macedonia',
  DO: 'Dominican Rep.',
  CD: 'Dem. Rep. Congo',
  CG: 'Congo',
  CI: "Côte d'Ivoire",
  GQ: 'Eq. Guinea',
  SS: 'S. Sudan',
  CF: 'Central African Rep.',
  SZ: 'eSwatini',
  ST: 'São Tomé and Principe',
  SB: 'Solomon Is.',
  MH: 'Marshall Is.',
  AG: 'Antigua and Barb.',
  KN: 'St. Kitts and Nevis',
  VC: 'St. Vin. and Gren.',
  VA: 'Vatican',
  LA: 'Laos',
  TL: 'Timor-Leste',
  FM: 'Micronesia',
  MM: 'Myanmar',
  KR: 'South Korea',
  KP: 'North Korea',
  RU: 'Russia',
  TZ: 'Tanzania',
  VN: 'Vietnam',
  BO: 'Bolivia',
  VE: 'Venezuela',
  BN: 'Brunei',
  IR: 'Iran',
  SY: 'Syria',
  PS: 'Palestine',
};

// Autonomous territories and dependencies mapped to sovereign nation
const TERRITORY_TO_SOVEREIGN: Record<string, string> = {
  'greenland': 'DK',
  'faeroe is.': 'DK',
  'puerto rico': 'US',
  'guam': 'US',
  'u.s. virgin is.': 'US',
  'american samoa': 'US',
  'n. mariana is.': 'US',
  'french guiana': 'FR',
  'new caledonia': 'FR',
  'fr. polynesia': 'FR',
  'guadeloupe': 'FR',
  'martinique': 'FR',
  'reunion': 'FR',
  'mayotte': 'FR',
  'st-martin': 'FR',
  'st-barthélemy': 'FR',
  'st. pierre and miquelon': 'FR',
  'wallis and futuna is.': 'FR',
  'fr. s. antarctic lands': 'FR',
  'falkland is.': 'GB',
  'bermuda': 'GB',
  'cayman is.': 'GB',
  'turks and caicos is.': 'GB',
  'british virgin is.': 'GB',
  'gibraltar': 'GB',
  'isle of man': 'GB',
  'jersey': 'GB',
  'guernsey': 'GB',
  'anguilla': 'GB',
  'montserrat': 'GB',
  'saint helena': 'GB',
  'pitcairn is.': 'GB',
  'br. indian ocean ter.': 'GB',
  'curaçao': 'NL',
  'curacao': 'NL',
  'aruba': 'NL',
  'sint maarten': 'NL',
  'cook is.': 'NZ',
  'niue': 'NZ',
  'tokelau': 'NZ',
  'åland': 'FI',
  'aland': 'FI',
  'w. sahara': 'MA',
  'somaliland': 'SO',
  'kosovo': 'RS',
};

// Extract countries feature collection from TopoJSON
const rawTopo = worldAtlasData as any;
const rawCountriesGeo = topojson.feature(
  rawTopo,
  rawTopo.objects.countries
) as any;

// Create lookup map by natural name lower-cased
const rawFeaturesByName = new Map<string, any>();
(rawCountriesGeo.features || []).forEach((f: any) => {
  if (f.properties && f.properties.name) {
    rawFeaturesByName.set(f.properties.name.toLowerCase(), f);
  }
});

// Build processed features list where each feature has full country info and precomputed bounds
export const COUNTRY_FEATURES: ExtendedCountryFeature[] = [];
export const CODE_TO_FEATURE = new Map<string, ExtendedCountryFeature>();
export const CODE_TO_CENTER = new Map<string, [number, number]>(); // [lng, lat]
export const EXTRA_TERRITORY_FEATURES: Array<{ feature: any; sovereignCode: string }> = [];
export const BASE_WORLD_LAND_FEATURES: any[] = [];

COUNTRIES_195.forEach((info) => {
  const code = info.code.toUpperCase();
  const alias = NAME_ALIASES[code];
  const targetName = (alias || info.nameEn).toLowerCase();

  let feature = rawFeaturesByName.get(targetName);

  // Fallback match: check name or nameEn directly
  if (!feature) {
    feature = rawFeaturesByName.get(info.name.toLowerCase());
  }

  // Micro-islands fallback: generate a small polygon circle if not in 50m set
  if (!feature) {
    const d = 0.35; // degrees approx
    const lng = info.lng;
    const lat = info.lat;
    feature = {
      type: 'Feature',
      id: `custom-${code}`,
      properties: { name: info.nameEn },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [lng - d, lat - d],
            [lng + d, lat - d],
            [lng + d, lat + d],
            [lng - d, lat + d],
            [lng - d, lat - d],
          ],
        ],
      },
    };
  }

  let bounds: [[number, number], [number, number]];
  try {
    bounds = d3Geo.geoBounds(feature);
  } catch {
    bounds = [
      [info.lng - 1, info.lat - 1],
      [info.lng + 1, info.lat + 1],
    ];
  }

  const extFeature: ExtendedCountryFeature = {
    type: 'Feature',
    id: feature.id || `feat-${code}`,
    geometry: feature.geometry,
    properties: {
      name: info.name,
      code: info.code,
      flag: info.flag,
      lat: info.lat,
      lng: info.lng,
      continent: info.continent,
      info,
    },
    bounds,
  };

  COUNTRY_FEATURES.push(extFeature);
  CODE_TO_FEATURE.set(code, extFeature);
  CODE_TO_CENTER.set(code, [info.lng, info.lat]);
});

// Map non-sovereign / overseas territory polygons (Greenland, French Guiana, Puerto Rico, etc.)
// so they illuminate when their sovereign nation is visited
(rawCountriesGeo.features || []).forEach((f: any) => {
  const name = (f.properties?.name || '').toLowerCase();
  const sovCode = TERRITORY_TO_SOVEREIGN[name];
  if (sovCode && CODE_TO_FEATURE.has(sovCode)) {
    EXTRA_TERRITORY_FEATURES.push({ feature: f, sovereignCode: sovCode });
  } else if (!rawFeaturesByName.has(name) || name === 'antarctica') {
    BASE_WORLD_LAND_FEATURES.push(f);
  }
});

// Fast lookup of country by geographic coordinates [lng, lat]
// Uses real polygon containment (d3Geo.geoContains) with geometry bounds optimization
export function findCountryAtCoords(
  lng: number,
  lat: number,
  visitedCodes?: Set<string>
): ExtendedCountryFeature | null {
  const point: [number, number] = [lng, lat];

  // 1. Primary check: Exact GeoJSON polygon containment
  // Prioritize visited countries for instant responsiveness
  const candidateFeatures = visitedCodes
    ? [
        ...COUNTRY_FEATURES.filter((f) => visitedCodes.has(f.properties.code.toUpperCase())),
        ...COUNTRY_FEATURES.filter((f) => !visitedCodes.has(f.properties.code.toUpperCase())),
      ]
    : COUNTRY_FEATURES;

  for (const feat of candidateFeatures) {
    const [[w, s], [e, n]] = feat.bounds;
    // Bounding box filter
    const inLng = w <= e ? lng >= w - 0.2 && lng <= e + 0.2 : lng >= w - 0.2 || lng <= e + 0.2;
    const inLat = lat >= s - 0.2 && lat <= n + 0.2;

    if (inLng && inLat) {
      try {
        if (d3Geo.geoContains(feat as any, point)) {
          return feat;
        }
      } catch {
        // Continue if complex polygon error
      }
    }
  }

  // 2. Check overseas territories (e.g. Greenland -> Denmark, Puerto Rico -> USA)
  for (const item of EXTRA_TERRITORY_FEATURES) {
    try {
      if (d3Geo.geoContains(item.feature, point)) {
        const sovFeature = CODE_TO_FEATURE.get(item.sovereignCode);
        if (sovFeature) return sovFeature;
      }
    } catch {
      // Continue
    }
  }

  // 3. Proximity Fallback for Micro-states and coastal margins:
  // Micro-nations (Vatican, Monaco, Singapore, Malta, San Marino, Andorra, Liechtenstein)
  // have very tiny polygon areas where a tap can fall slightly adjacent.
  let closest: ExtendedCountryFeature | null = null;
  let minDist = 0.85; // ~90 km tight threshold; clicks in open ocean return null

  for (const feat of COUNTRY_FEATURES) {
    const dLng = Math.abs(feat.properties.lng - lng);
    const dLat = Math.abs(feat.properties.lat - lat);
    const dist = Math.hypot(dLng, dLat);
    if (dist < minDist) {
      minDist = dist;
      closest = feat;
    }
  }

  return closest;
}

// Precomputed graticule (lat/long grid lines)
export const WORLD_GRATICULE = d3Geo.geoGraticule10();

// Precomputed sphere object for d3-geo
export const SPHERE_OBJECT = { type: 'Sphere' };
