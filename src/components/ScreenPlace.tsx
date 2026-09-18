import React, { useState } from 'react';
import { CountryRecord, CityRecord, PlaceRecord } from '../types';
import {
  ArrowLeft,
  MapPin,
  Heart,
  Star,
  Camera,
  Edit2,
  Trash2,
  Navigation,
} from 'lucide-react';

interface ScreenPlaceProps {
  country?: CountryRecord;
  city?: CityRecord;
  place: PlaceRecord;
  onBack: () => void;
  onEditPlace: (place: PlaceRecord) => void;
  onDeletePlace: (placeId: string) => Promise<void>;
  onToggleWorthReturning: (place: PlaceRecord) => Promise<void>;
  onToggleFavorite: (place: PlaceRecord) => Promise<void>;
}

export const ScreenPlace: React.FC<ScreenPlaceProps> = ({
  country,
  city,
  place,
  onBack,
  onEditPlace,
  onDeletePlace,
  onToggleWorthReturning,
  onToggleFavorite,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleDelete = async () => {
    if (window.confirm(`¿Eliminar el lugar "${place.name}"?`)) {
      await onDeletePlace(place.id);
      onBack();
    }
  };

  const photos =
    place.photos && place.photos.length > 0
      ? place.photos
      : ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div id="screen-place-detail" className="flex flex-col gap-6 pb-28 text-white animate-fadeIn">
      {/* Top Bar Navigation in Frosted Glass */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-city"
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl bg-slate-900/70 border border-white/10 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Volver a {city ? city.name : 'Ciudad'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditPlace(place)}
            className="p-2 text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-white/10 rounded-xl transition-all shadow-sm"
            title="Editar lugar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/20 rounded-xl transition-all shadow-sm"
            title="Eliminar lugar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Photo Carousel / Cover */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-white/15">
        <img
          src={photos[0]}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050814] via-[#050814]/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 text-white border border-white/20">
              {place.category}
            </span>
            {(place.favorite || place.isFavorite) && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-amber-500/90 text-slate-950 border border-amber-300 flex items-center gap-1 shadow-lg">
                <Star className="w-3.5 h-3.5 fill-slate-950" />
                Favorito
              </span>
            )}
            {place.worthReturning && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-rose-500/90 text-white border border-rose-300 flex items-center gap-1 shadow-lg">
                <Heart className="w-3.5 h-3.5 fill-current" />
                Para Volver
              </span>
            )}
          </div>
        </div>

        {/* Bottom Title */}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-medium mb-1">
            <span>{city?.name}</span>
            <span>·</span>
            <span>{country?.name}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-md">
            {place.name}
          </h1>
          {place.address && (
            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              {place.address}
            </p>
          )}
        </div>
      </div>

      {/* Dual Star Features:
          1. ❤️ Merece la pena volver (worthReturning)
          2. ⭐ Lugar Favorito (favorite)
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Feature 1: Merece la Pena Volver */}
        <div className="p-4 sm:p-5 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-white/10 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                place.worthReturning
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-500/10'
                  : 'bg-slate-800 text-slate-400 border border-white/5'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  place.worthReturning ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                ¿Merece la pena volver?
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {place.worthReturning
                  ? 'Marcado para repetir siempre'
                  : 'Marca si repetirías la visita'}
              </p>
            </div>
          </div>

          <button
            id="btn-toggle-worth-returning"
            type="button"
            onClick={() => onToggleWorthReturning(place)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 ${
              place.worthReturning
                ? 'bg-rose-500 text-white shadow-rose-500/25 hover:bg-rose-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
            }`}
          >
            {place.worthReturning ? '❤️ Sí, volvería' : 'Marcar para volver'}
          </button>
        </div>

        {/* Feature 2: Lugar Favorito */}
        <div className="p-4 sm:p-5 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-white/10 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                place.favorite || place.isFavorite
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800 text-slate-400 border border-white/5'
              }`}
            >
              <Star
                className={`w-5 h-5 ${
                  place.favorite || place.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Lugar Favorito
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {place.favorite || place.isFavorite
                  ? 'Rincón destacado en tu guía'
                  : 'Añade a tu selección dorada'}
              </p>
            </div>
          </div>

          <button
            id="btn-toggle-favorite"
            type="button"
            onClick={() => onToggleFavorite(place)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 ${
              place.favorite || place.isFavorite
                ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/25 hover:bg-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
            }`}
          >
            {place.favorite || place.isFavorite ? '⭐ Es Favorito' : 'Marcar Favorito'}
          </button>
        </div>
      </div>

      {/* Nota Personal */}
      <div className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-amber-500/20 shadow-xl flex flex-col gap-2">
        <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">
          Nota & Recuerdo Personal
        </span>
        <p className="text-sm text-slate-200 leading-relaxed italic whitespace-pre-line">
          {place.notes
            ? `"${place.notes}"`
            : 'Sin nota registrada para este lugar. Puedes pulsar editar para añadir qué plato pediste o qué sensación tuviste.'}
        </p>
      </div>

      {/* Galería de Fotos del Lugar */}
      {photos.length > 1 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <span>Fotos del Lugar ({photos.length})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPhoto(url)}
                className="aspect-square rounded-2xl overflow-hidden border border-white/10 group focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-md"
              >
                <img
                  src={url}
                  alt={`Lugar foto ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal Zoom Foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <img
              src={selectedPhoto}
              alt="Foto del lugar ampliada"
              className="max-h-[85vh] w-auto rounded-3xl object-contain shadow-2xl border border-white/20"
            />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="mt-3 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md hover:bg-white/30"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
