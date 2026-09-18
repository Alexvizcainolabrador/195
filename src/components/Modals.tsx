import React, { useState } from 'react';
import {
  CountryRecord,
  CityRecord,
  PlaceRecord,
  Category,
  CATEGORIES,
} from '../types';
import { COUNTRIES_195, COUNTRY_SUGGESTED_PHOTOS } from '../data/countriesData';
import {
  X,
  Upload,
  Heart,
  Star,
  Calendar,
  MapPin,
  Sparkles,
} from 'lucide-react';

// Helper to compress uploaded image into a lightweight Base64 Data URL (Max 1200px, 80% JPEG)
export async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    };
    reader.onerror = (error) => reject(error);
  });
}

// ----------------------------------------------------
// Modal 1: Añadir / Editar País
// ----------------------------------------------------
interface CountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (country: CountryRecord) => Promise<void>;
  existingCountry?: CountryRecord | null;
  initialCode?: string;
  userId: string;
}

export const CountryModal: React.FC<CountryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCountry,
  initialCode,
  userId,
}) => {
  if (!isOpen) return null;

  const defaultCountry =
    COUNTRIES_195.find(
      (c) =>
        c.code.toUpperCase() ===
        (existingCountry?.code || initialCode || 'ES').toUpperCase()
    ) || COUNTRIES_195[0];

  const [selectedCode, setSelectedCode] = useState<string>(
    existingCountry?.code || defaultCountry.code
  );
  const [name, setName] = useState<string>(
    existingCountry?.name || defaultCountry.name
  );
  const [coverPhoto, setCoverPhoto] = useState<string>(
    existingCountry?.coverPhoto ||
      COUNTRY_SUGGESTED_PHOTOS[selectedCode] ||
      COUNTRY_SUGGESTED_PHOTOS.default
  );
  const [firstVisitDate, setFirstVisitDate] = useState<string>(
    existingCountry?.firstVisitDate || new Date().toISOString().split('T')[0]
  );
  const [visitCount, setVisitCount] = useState<number>(
    existingCountry?.visitCount || 1
  );
  const [photoTab, setPhotoTab] = useState<'preset' | 'upload' | 'url'>('preset');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCountryChange = (code: string) => {
    setSelectedCode(code);
    const found = COUNTRIES_195.find((c) => c.code === code);
    if (found) {
      setName(found.name);
      if (photoTab === 'preset') {
        setCoverPhoto(
          COUNTRY_SUGGESTED_PHOTOS[code] || COUNTRY_SUGGESTED_PHOTOS.default
        );
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageFile(file);
      setCoverPhoto(base64);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const countryData: CountryRecord = {
        id:
          existingCountry?.id ||
          `country-${selectedCode.toLowerCase()}-${userId.slice(0, 6)}`,
        userId,
        code: selectedCode,
        name: name.trim() || defaultCountry.name,
        coverPhoto: coverPhoto || COUNTRY_SUGGESTED_PHOTOS.default,
        firstVisitDate,
        visitCount: Math.max(1, Number(visitCount) || 1),
      };
      await onSave(countryData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="country-modal-card"
        className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl text-white rounded-3xl shadow-2xl overflow-hidden border border-white/15 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">
              {existingCountry ? 'Editar Territorio' : 'Iluminar Territorio en tu Planeta'}
            </h3>
            <p className="text-xs text-slate-400">
              Elige tu foto representativa y datos de tu primer viaje
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
          {/* Country Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              País
            </label>
            <select
              id="select-country-code"
              value={selectedCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              disabled={!!existingCountry}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-white/10 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {COUNTRIES_195.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.flag} {c.name} ({c.continent})
                </option>
              ))}
            </select>
          </div>

          {/* Photo Preview & Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Foto Representativa</span>
              <span className="text-[10px] text-amber-400 font-normal">
                Portada personal para este territorio
              </span>
            </label>

            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-inner">
              <img
                src={coverPhoto}
                alt="Vista previa"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 text-white text-xs font-bold drop-shadow-md flex items-center gap-1.5">
                <span className="text-base">{COUNTRIES_195.find((c) => c.code === selectedCode)?.flag}</span>
                <span>{name}</span>
              </div>
            </div>

            {/* Photo Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setPhotoTab('preset')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  photoTab === 'preset'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sugerida
              </button>
              <button
                type="button"
                onClick={() => setPhotoTab('upload')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  photoTab === 'upload'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Subir Foto
              </button>
              <button
                type="button"
                onClick={() => setPhotoTab('url')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  photoTab === 'url'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                URL Web
              </button>
            </div>

            {photoTab === 'preset' && (
              <button
                type="button"
                onClick={() =>
                  setCoverPhoto(
                    COUNTRY_SUGGESTED_PHOTOS[selectedCode] || COUNTRY_SUGGESTED_PHOTOS.default
                  )
                }
                className="text-xs text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-amber-500/30 transition-colors font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Usar imagen curada de {name}
              </button>
            )}

            {photoTab === 'upload' && (
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-amber-400 hover:bg-amber-500/10 transition-colors text-xs text-slate-300">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Selecciona una foto de tu viaje desde tu dispositivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {photoTab === 'url' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrl) setCoverPhoto(customUrl);
                  }}
                  className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-700 border border-white/10"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>

          {/* First Visit & Visit Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Primera Visita
              </label>
              <input
                id="country-first-visit-date"
                type="date"
                required
                value={firstVisitDate}
                onChange={(e) => setFirstVisitDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Nº de Visitas
              </label>
              <input
                id="country-visit-count"
                type="number"
                min="1"
                max="1000"
                value={visitCount}
                onChange={(e) => setVisitCount(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="submit-save-country-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Guardando...'
                : existingCountry
                ? 'Guardar Cambios'
                : 'Iluminar Territorio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Modal 2: Añadir / Editar Ciudad
// ----------------------------------------------------
interface CityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (city: CityRecord) => Promise<void>;
  countryId: string;
  countryName: string;
  existingCity?: CityRecord | null;
  userId: string;
}

export const CityModal: React.FC<CityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  countryId,
  countryName,
  existingCity,
  userId,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState<string>(existingCity?.name || '');
  const [coverPhoto, setCoverPhoto] = useState<string>(
    existingCity?.coverPhoto ||
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80'
  );
  const [visitDate, setVisitDate] = useState<string>(
    existingCity?.visitDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(existingCity?.notes || '');
  const [photoTab, setPhotoTab] = useState<'upload' | 'url'>('upload');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageFile(file);
      setCoverPhoto(base64);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const cityData: CityRecord = {
        id:
          existingCity?.id ||
          `city-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        countryId,
        name: name.trim(),
        coverPhoto,
        visitDate,
        notes: notes.trim(),
        photos: existingCity?.photos || [coverPhoto],
      };
      await onSave(cityData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="city-modal-card"
        className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl text-white rounded-3xl shadow-2xl overflow-hidden border border-white/15 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">
              {existingCity ? 'Editar Ciudad' : `Añadir Ciudad en ${countryName}`}
            </h3>
            <p className="text-xs text-slate-400">
              Guarda tus fotos, fecha y recuerdos de esta visita
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Nombre de la Ciudad
            </label>
            <input
              id="city-name-input"
              type="text"
              required
              placeholder="Ej. Kioto, Sevilla, Florencia..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-white/10 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 placeholder-slate-500"
            />
          </div>

          {/* Photo Preview & Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Foto Principal de la Ciudad
            </label>

            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-inner">
              <img
                src={coverPhoto}
                alt="Vista previa ciudad"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex rounded-xl bg-slate-950 p-1 border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setPhotoTab('upload')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  photoTab === 'upload'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Subir desde Dispositivo
              </button>
              <button
                type="button"
                onClick={() => setPhotoTab('url')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  photoTab === 'url'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                URL Web
              </button>
            </div>

            {photoTab === 'upload' ? (
              <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-amber-400 hover:bg-amber-500/10 transition-colors text-xs text-slate-300">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Selecciona la mejor foto de tu estancia en {name || 'la ciudad'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customUrl) setCoverPhoto(customUrl);
                  }}
                  className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-700 border border-white/10"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>

          {/* Fecha de visita */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Fecha de Visita
            </label>
            <input
              id="city-visit-date"
              type="date"
              required
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-2xl border border-white/10 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Notas Personales */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Notas & Recuerdos Personales
            </label>
            <textarea
              id="city-notes-input"
              rows={3}
              placeholder="¿Qué hizo especial esta ciudad? El café donde llovía, la plaza al anochecer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-sm rounded-2xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="submit-save-city-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : existingCity ? 'Guardar Cambios' : 'Guardar Ciudad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Modal 3: Añadir / Editar Lugar
// ----------------------------------------------------
interface PlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (place: PlaceRecord) => Promise<void>;
  cityId: string;
  countryId: string;
  cityName: string;
  existingPlace?: PlaceRecord | null;
  userId: string;
}

export const PlaceModal: React.FC<PlaceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cityId,
  countryId,
  cityName,
  existingPlace,
  userId,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState<string>(existingPlace?.name || '');
  const [category, setCategory] = useState<Category>(
    existingPlace?.category || 'Restaurante'
  );
  const [address, setAddress] = useState<string>(existingPlace?.address || '');
  const [notes, setNotes] = useState<string>(existingPlace?.notes || '');
  const [worthReturning, setWorthReturning] = useState<boolean>(
    existingPlace?.worthReturning ?? true
  );
  const [isFavorite, setIsFavorite] = useState<boolean>(
    existingPlace?.favorite ?? existingPlace?.isFavorite ?? false
  );
  const [photos, setPhotos] = useState<string[]>(
    existingPlace?.photos || [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    ]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageFile(file);
      setPhotos([base64, ...photos.slice(0, 4)]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const placeData: PlaceRecord = {
        id:
          existingPlace?.id ||
          `place-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        cityId,
        countryId,
        name: name.trim(),
        category,
        address: address.trim(),
        photos,
        notes: notes.trim(),
        worthReturning,
        favorite: isFavorite,
        isFavorite,
      };
      await onSave(placeData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="place-modal-card"
        className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl text-white rounded-3xl shadow-2xl overflow-hidden border border-white/15 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">
              {existingPlace ? 'Editar Lugar' : `Añadir Lugar en ${cityName}`}
            </h3>
            <p className="text-xs text-slate-400">
              Guarda tus rincones favoritos, restaurantes o vistas inolvidables
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Nombre del Lugar
            </label>
            <input
              id="place-name-input"
              type="text"
              required
              placeholder="Ej. Osteria Francescana, Mirador de San Nicolás..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-white/10 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 placeholder-slate-500"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Categoría
            </label>
            <select
              id="place-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-white/10 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Dirección o Zona
            </label>
            <input
              id="place-address-input"
              type="text"
              placeholder="Ej. Barrio de Gràcia, Calle Mayor 4..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-white/10 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 placeholder-slate-500"
            />
          </div>

          {/* Photos */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Foto del Lugar
            </label>

            {photos[0] && (
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-inner">
                <img
                  src={photos[0]}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-amber-400 hover:bg-amber-500/10 transition-colors text-xs text-slate-300">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Subir foto desde tu móvil u ordenador</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Nota Personal
            </label>
            <textarea
              id="place-notes-input"
              rows={3}
              placeholder="Qué pedir, en qué mesa sentarse, a qué hora ir..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-sm rounded-2xl border border-white/10 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Booleans: worthReturning & favorite */}
          <div className="flex flex-col gap-2.5 pt-1">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 cursor-pointer hover:border-rose-500/40 transition-colors">
              <input
                id="place-worth-returning-checkbox"
                type="checkbox"
                checked={worthReturning}
                onChange={(e) => setWorthReturning(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  ¿Merece la pena volver?
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Aparecerá en tu sección destacada de destinos para repetir
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 cursor-pointer hover:border-amber-500/40 transition-colors">
              <input
                id="place-is-favorite-checkbox"
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  Lugar Favorito
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Marcado con estrella de oro en tu guía
                </span>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="submit-save-place-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : existingPlace ? 'Guardar Cambios' : 'Guardar Lugar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
