// Comprehensive dictionary of known city geographic coordinates [lng, lat]
// Used to render visited cities as radiant luminous points of light on the Country map and 3D globe

export interface CityGeoLocation {
  name: string;
  countryCode: string;
  lng: number;
  lat: number;
}

export const KNOWN_CITY_COORDINATES: Record<string, [number, number]> = {
  // 🇲🇦 Marruecos (Prompt primary example)
  'marrakech': [-7.9811, 31.6295],
  'marrakesh': [-7.9811, 31.6295],
  'fez': [-5.0003, 34.0181],
  'fes': [-5.0003, 34.0181],
  'casablanca': [-7.5898, 33.5731],
  'rabat': [-6.8498, 34.0209],
  'tánger': [-5.8340, 35.7595],
  'tanger': [-5.8340, 35.7595],
  'tangier': [-5.8340, 35.7595],
  'chefchaouen': [-5.2684, 35.1688],
  'chaouen': [-5.2684, 35.1688],
  'essaouira': [-9.7595, 31.5085],
  'agadir': [-9.6000, 30.4278],
  'meknes': [-5.5472, 33.8938],
  'ouarzazate': [-6.9094, 30.9189],

  // 🇪🇸 España
  'barcelona': [2.1734, 41.3851],
  'madrid': [-3.7038, 40.4168],
  'sevilla': [-5.9845, 37.3891],
  'seville': [-5.9845, 37.3891],
  'granada': [-3.5986, 37.1773],
  'valencia': [-0.3763, 39.4699],
  'bilbao': [-2.9350, 43.2630],
  'san sebastián': [-1.9812, 43.3183],
  'donostia': [-1.9812, 43.3183],
  'palma': [2.6502, 39.5696],
  'palma de mallorca': [2.6502, 39.5696],
  'ibiza': [1.4324, 38.9067],
  'málaga': [-4.4214, 36.7213],
  'malaga': [-4.4214, 36.7213],
  'toledo': [-4.0273, 39.8628],
  'santiago de compostela': [-8.5448, 42.8782],
  'córdoba': [-4.7794, 37.8882],
  'cordoba': [-4.7794, 37.8882],
  'zaragoza': [-0.8891, 41.6488],
  'alicante': [-0.4907, 38.3452],

  // 🇯🇵 Japón
  'tokyo': [139.6917, 35.6895],
  'tokio': [139.6917, 35.6895],
  'kyoto': [135.7681, 35.0116],
  'kioto': [135.7681, 35.0116],
  'osaka': [135.5023, 34.6937],
  'nara': [135.8048, 34.6851],
  'hiroshima': [132.4553, 34.3853],
  'sapporo': [141.3545, 43.0618],
  'fukuoka': [130.4017, 33.5904],
  'kobe': [135.1955, 34.6901],
  'yokohama': [139.6380, 35.4437],
  'nagoya': [136.9066, 35.1815],
  'kanazawa': [136.6562, 36.5613],
  'takayama': [137.2524, 36.1461],

  // 🇫🇷 Francia
  'paris': [2.3522, 48.8566],
  'parís': [2.3522, 48.8566],
  'niza': [7.2620, 43.7102],
  'nice': [7.2620, 43.7102],
  'lyon': [4.8357, 45.7640],
  'marseille': [5.3698, 43.2965],
  'marsella': [5.3698, 43.2965],
  'bordeaux': [-0.5792, 44.8378],
  'burdeos': [-0.5792, 44.8378],
  'strasbourg': [7.7521, 48.5734],
  'estrasburgo': [7.7521, 48.5734],

  // 🇮🇹 Italia
  'roma': [12.4964, 41.9028],
  'rome': [12.4964, 41.9028],
  'florencia': [11.2558, 43.7696],
  'florence': [11.2558, 43.7696],
  'firenze': [11.2558, 43.7696],
  'venecia': [12.3155, 45.4408],
  'venice': [12.3155, 45.4408],
  'milán': [9.1900, 45.4642],
  'milan': [9.1900, 45.4642],
  'nápoles': [14.2681, 40.8518],
  'naples': [14.2681, 40.8518],
  'napoli': [14.2681, 40.8518],

  // 🇵🇹 Portugal
  'lisboa': [-9.1393, 38.7223],
  'lisbon': [-9.1393, 38.7223],
  'porto': [-8.6291, 41.1579],
  'oporto': [-8.6291, 41.1579],
  'faro': [-7.9304, 37.0194],
  'sintra': [-9.3817, 38.8029],
  'coimbra': [-8.4195, 40.2033],

  // 🇬🇧 Reino Unido
  'londres': [-0.1278, 51.5074],
  'london': [-0.1278, 51.5074],
  'edimburgo': [-3.1883, 55.9533],
  'edinburgh': [-3.1883, 55.9533],

  // 🇺🇸 Estados Unidos
  'nueva york': [-74.0060, 40.7128],
  'new york': [-74.0060, 40.7128],
  'san francisco': [-122.4194, 37.7749],
  'los angeles': [-118.2437, 34.0522],
  'los ángeles': [-118.2437, 34.0522],
  'chicago': [-87.6298, 41.8781],
  'miami': [-80.1918, 25.7617],

  // 🇦🇷 Argentina
  'buenos aires': [-58.3816, -34.6037],
  'bariloche': [-71.3082, -41.1335],
  'mendoza': [-68.8458, -32.8895],

  // 🇲🇽 México
  'ciudad de méxico': [-99.1332, 19.4326],
  'cdmx': [-99.1332, 19.4326],
  'cancún': [-86.8515, 21.1619],
  'cancun': [-86.8515, 21.1619],
  'oaxaca': [-96.7266, 17.0732],
  'guadalajara': [-103.3496, 20.6597],
};

// Normalize city names (lowercase, trim, strip accents for matching)
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Resolves geographic coordinates [lng, lat] for any city.
 * If known, returns exact coordinates.
 * Otherwise, uses a deterministic dispersion around country center coordinates
 * so that points always stay within the country bounds and render reliably.
 */
export function getCityCoordinates(
  cityName: string,
  countryLng: number = 0,
  countryLat: number = 0
): [number, number] {
  const norm = normalizeName(cityName);

  // 1. Direct lookup
  for (const [key, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (normalizeName(key) === norm) {
      return coords;
    }
  }

  // 2. Partial match
  for (const [key, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    const keyNorm = normalizeName(key);
    if (norm.includes(keyNorm) || keyNorm.includes(norm)) {
      return coords;
    }
  }

  // 3. Deterministic organic offset around country center
  let hash = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash = (hash << 5) - hash + cityName.charCodeAt(i);
    hash |= 0;
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const radius = 0.4 + (Math.abs(hash >> 3) % 10) * 0.08; // 0.4 to 1.2 degrees

  const lng = countryLng + Math.cos(angle) * radius;
  const lat = countryLat + Math.sin(angle) * (radius * 0.75);

  return [lng, lat];
}
