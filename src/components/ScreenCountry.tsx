import React, { useState } from 'react';
import { CountryRecord, CityRecord, PlaceRecord, MomentRecord } from '../types';
import { COUNTRIES_195 } from '../data/countriesData';
import { CountryAtlasView } from './CountryAtlasView';
import { PolaroidCard } from './PolaroidCard';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  MapPin,
  BookOpen,
  Compass,
  Layers,
} from 'lucide-react';

interface ScreenCountryProps {
  country: CountryRecord;
  cities: CityRecord[];
  places: PlaceRecord[];
  snapshots?: MomentRecord[];
  onBack: () => void;
  onSelectCity: (city: CityRecord) => void;
  onOpenAddCity: () => void;
  onOpenAddMoment?: (cityId?: string) => void;
  onEditCountry: (country: CountryRecord) => void;
  onDeleteCountry: (countryId: string) => Promise<void>;
  onReliveCountry: (country: CountryRecord) => void;
  onSelectSnapshot?: (snapshot: MomentRecord) => void;
}

export const ScreenCountry: React.FC<ScreenCountryProps> = ({
  country,
  cities,
  places,
  snapshots = [],
  onBack,
  onSelectCity,
  onOpenAddCity,
  onOpenAddMoment,
  onEditCountry,
  onDeleteCountry,
  onReliveCountry,
  onSelectSnapshot,
}) => {
  const [viewMode, setViewMode] = useState<'atlas' | 'memories'>('atlas');

  const countryCities = cities.filter((c) => c.countryId === country.id);
  const countryMoments = snapshots.filter((s) => s.countryId === country.id);
  const info = COUNTRIES_195.find((c) => c.code.toUpperCase() === country.code.toUpperCase());

  const handleDelete = async () => {
    if (
      window.confirm(
        `¿Eliminar el capítulo de ${country.name}? También se eliminarán sus recuerdos y ciudades.`
      )
    ) {
      await onDeleteCountry(country.id);
      onBack();
    }
  };

  return (
    <div id="screen-country-detail" className="flex flex-col gap-6 pb-28 text-stone-100 animate-fadeIn">
      {/* Top Header Controls: Breadcrumb & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          id="btn-back-to-world"
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1e1711]/90 hover:bg-[#2b2118] border border-amber-900/40 font-editorial text-xs sm:text-sm text-stone-300 hover:text-white transition-all shadow-md backdrop-blur-md group"
        >
          <ArrowLeft className="w-4 h-4 text-[#e5ba79] group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al Atlas 3D</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Toggle between Atlas Map (puntos luminosos) and Memories Showcase */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-[#1b1510] border border-amber-900/40 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('atlas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-editorial transition-all ${
                viewMode === 'atlas'
                  ? 'bg-amber-500/20 text-[#fef3c7] font-bold border border-amber-400/50 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#e5ba79]" />
              <span>Mapa Personal</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('memories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-editorial transition-all ${
                viewMode === 'memories'
                  ? 'bg-amber-500/20 text-[#fef3c7] font-bold border border-amber-400/50 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e5ba79]" />
              <span>Recuerdos ({countryMoments.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onEditCountry(country)}
            className="p-2 text-stone-400 hover:text-white bg-[#1e1711] hover:bg-[#2b2118] border border-amber-900/40 rounded-full transition-all shadow-xs"
            title="Editar notas del país"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-full transition-all shadow-xs"
            title="Eliminar este país del atlas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main View: MAPA PERSONAL DEL PAÍS CON PUNTOS LUMINOSOS */}
      {viewMode === 'atlas' ? (
        <div className="flex flex-col gap-6">
          <CountryAtlasView
            country={country}
            cities={cities}
            moments={snapshots}
            places={places}
            onSelectCity={onSelectCity}
            onOpenAddCity={onOpenAddCity}
            onOpenAddMoment={(cityId) => {
              if (onOpenAddMoment) onOpenAddMoment(cityId);
            }}
            onBackToGlobe={onBack}
            onReliveCountry={onReliveCountry}
          />

          {/* Quick Glimpse of Moments (Compact horizontal strip below map) */}
          {countryMoments.length > 0 && (
            <section className="flex flex-col gap-3 p-5 rounded-2xl bg-[#14100c]/80 border border-amber-950/40 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <h3 className="font-editorial text-sm font-bold text-[#fbf6ed]">
                    Momentos atesorados en {country.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('memories')}
                  className="text-xs font-editorial text-[#e5ba79] hover:underline"
                >
                  Ver todos ({countryMoments.length}) →
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {countryMoments.slice(0, 6).map((moment) => {
                  const city = cities.find((c) => c.id === moment.cityId);
                  return (
                    <button
                      key={moment.id}
                      type="button"
                      onClick={() => onSelectSnapshot && onSelectSnapshot(moment)}
                      className="flex-shrink-0 w-48 text-left group transition-transform hover:scale-102"
                    >
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#241c15] border border-amber-900/30 group-hover:border-amber-500/60 shadow-md">
                        {moment.mediaUrl ? (
                          <img
                            src={moment.mediaUrl}
                            alt={moment.phrase || 'Momento'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3 text-stone-400 font-serif-body italic text-xs text-center">
                            "{moment.note?.slice(0, 60)}..."
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-sm bg-black/75 text-[10px] font-editorial text-amber-200">
                          {city?.name || country.name}
                        </span>
                      </div>
                      <p className="font-editorial text-xs text-stone-200 mt-1.5 truncate group-hover:text-amber-200">
                        {moment.phrase || moment.note || 'Momento sin título'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* Memories Grid View */
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-amber-950/40 pb-3">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-[#fbf6ed] flex items-center gap-2">
                <span>Recuerdos de {country.name}</span>
              </h2>
              <p className="font-serif-body text-xs sm:text-sm text-stone-400 italic">
                {countryMoments.length} {countryMoments.length === 1 ? 'recuerdo guardado' : 'recuerdos guardados'}
              </p>
            </div>

            {onOpenAddMoment && (
              <button
                type="button"
                onClick={() => onOpenAddMoment()}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#d97706] to-[#b45309] text-[#24170c] font-editorial font-bold text-xs shadow-md border border-[#fde68a] hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Momento</span>
              </button>
            )}
          </div>

          {countryMoments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {countryMoments.map((snap, index) => {
                const city = cities.find((c) => c.id === snap.cityId);
                return (
                  <div key={snap.id} className="transform transition-transform hover:scale-[1.02]">
                    <PolaroidCard
                      snapshot={snap}
                      cityName={city?.name || country.name}
                      index={index}
                      onClick={() => onSelectSnapshot && onSelectSnapshot(snap)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-[#14100c] border border-amber-950/40 text-center flex flex-col items-center gap-3">
              <BookOpen className="w-8 h-8 text-[#e5ba79]" />
              <h3 className="font-editorial text-lg font-bold text-[#fbf6ed]">
                Aún no has guardado recuerdos en {country.name}
              </h3>
              <p className="font-serif-body text-xs text-stone-400 italic max-w-sm">
                Pulsa en "Mapa Personal" para ver tus ciudades iluminadas o guarda tu primer momento.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
