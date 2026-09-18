export type Category =
  | 'Restaurante'
  | 'Cafetería'
  | 'Hotel'
  | 'Playa'
  | 'Mirador'
  | 'Museo'
  | 'Bar'
  | 'Otro';

export const CATEGORIES: Category[] = [
  'Restaurante',
  'Cafetería',
  'Hotel',
  'Playa',
  'Mirador',
  'Museo',
  'Bar',
  'Otro',
];

export interface CountryRecord {
  id: string;
  userId: string;
  code: string; // ISO 2 or 3 code e.g. "ES", "JP"
  name: string;
  coverPhoto: string;
  firstVisitDate: string;
  visitCount: number;
  visitedYear?: number;
  citiesCount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CityRecord {
  id: string;
  countryId: string;
  userId: string;
  name: string;
  coverPhoto: string;
  visitDate: string;
  notes?: string;
  photos?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaceRecord {
  id: string;
  cityId: string;
  countryId: string;
  userId: string;
  name: string;
  category: Category;
  address: string;
  photos: string[];
  notes: string;
  worthReturning: boolean;
  favorite?: boolean;
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type MomentMediaType = 'photo' | 'video' | 'audio' | 'note';

export interface MomentRecord {
  id: string;
  userId: string;
  countryId: string;
  cityId: string;
  countryName?: string;
  cityName?: string;
  date: string; // ISO date string e.g. "2024-05-14"
  time?: string; // Time string e.g. "18:35"
  author?: string; // Traveler / Author of the moment e.g. "Alejandro Labrador"
  mediaType: MomentMediaType;
  mediaUrl?: string; // Photo URL, Audio URL, or Video URL (optional for pure note)
  audioDuration?: number; // In seconds, if audio
  videoDuration?: number; // In seconds, if video
  note?: string; // Note content, thoughts or journal reflection
  phrase?: string; // Frase o título breve
  people?: string[]; // Personas opcionales
  place?: string; // Un rincón o lugar opcional
  createdAt?: string;
  updatedAt?: string;

  // Compatibility fields for existing data
  title?: string;
  photoUrl?: string;
  audioUrl?: string;
}

// Backward-compatibility alias
export type SnapshotRecord = MomentRecord;

// Helper extractors to normalize any Moment or legacy Snapshot
export function getMomentMediaType(moment: Partial<MomentRecord>): MomentMediaType {
  if (moment.mediaType) return moment.mediaType;
  if (moment.audioUrl && !moment.photoUrl) return 'audio';
  if (moment.mediaUrl && (moment.mediaUrl.endsWith('.mp4') || moment.mediaUrl.endsWith('.webm'))) return 'video';
  if (moment.note && !moment.photoUrl && !moment.mediaUrl && !moment.audioUrl) return 'note';
  return 'photo';
}

export function getMomentMediaUrl(moment: Partial<MomentRecord>): string {
  if (moment.mediaUrl) return moment.mediaUrl;
  if (moment.photoUrl) return moment.photoUrl;
  if (moment.audioUrl) return moment.audioUrl;
  return '';
}

export function getMomentPhrase(moment: Partial<MomentRecord>): string {
  if (moment.phrase) return moment.phrase;
  if (moment.note) return moment.note;
  if (moment.title) return moment.title;
  return '';
}

export function getMomentAuthor(moment: Partial<MomentRecord>): string {
  if (moment.author && moment.author.trim()) return moment.author;
  return 'Tú';
}

export function getMomentPlace(moment: Partial<MomentRecord>): string {
  return moment.place || '';
}

export function getMomentPeople(moment: Partial<MomentRecord>): string[] {
  return Array.isArray(moment.people) ? moment.people : [];
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: string;
}

export interface WorldCountryInfo {
  code: string;
  name: string;
  nameEn: string;
  continent: string;
  flag: string;
  lat: number;
  lng: number;
}
