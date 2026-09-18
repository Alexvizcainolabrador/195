import React, { useState } from 'react';
import { CountryRecord, CityRecord, PlaceRecord, CATEGORIES } from '../types';
import {
  Heart,
  Star,
  MapPin,
  Search,
  ChevronRight,
  BookOpen,
  Sparkles,
  Coffee,
  Utensils,
  Hotel,
  Eye,
} from 'lucide-react';

interface ScreenGuideProps {
  countries: CountryRecord[];
  cities: CityRecord[];
  places: PlaceRecord[];
  onSelectPlace: (place: PlaceRecord) => void;
  onNavigateToCountry?: (country: CountryRecord) => void;
}

export const ScreenGuide: React.FC<ScreenGuideProps> = ({
  countries,
  cities,
  places,
  onSelectPlace,
}) => {
  const [activeSection, setActiveSection] = useState<
    | 'worthReturning'
    | 'favRestaurants'
    | 'favCafes'
    | 'favHotels'
    | 'favViewpoints'
    | 'favorites'
    | 'all'
  >('worthReturning');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('all');
  const [selectedCityId, setSelectedCityId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Available cities filtered by country selection
  const filteredCities =
    selectedCountryId === 'all'
      ? cities
      : cities.filter((c) => c.countryId === selectedCountryId);

  // Helper check for favorite
  const isFav = (p: PlaceRecord) => Boolean(p.favorite || p.isFavorite);

  // Filter places
  const filteredPlaces = places.filter((p) => {
    // Curated Section filter
    if (activeSection === 'worthReturning' && !p.worthReturning) return false;
    if (activeSection === 'favRestaurants' && !(isFav(p) && p.category === 'Restaurante')) return false;
    if (activeSection === 'favCafes' && !(isFav(p) && p.category === 'Cafetería')) return false;
    if (activeSection === 'favHotels' && !(isFav(p) && p.category === 'Hotel')) return false;
    if (activeSection === 'favViewpoints' && !(isFav(p) && p.category === 'Mirador')) return false;
    if (activeSection === 'favorites' && !isFav(p)) return false;

    // Country filter
    if (selectedCountryId !== 'all' && p.countryId !== selectedCountryId) return false;

    // City filter
    if (selectedCityId !== 'all' && p.cityId !== selectedCityId) return false;

    // Category filter
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchAddress = p.address?.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchAddress && !matchNotes && !matchCat) return false;
    }

    return true;
  });

  const worthReturningCount = places.filter((p) => p.worthReturning).length;
  const favoritesCount = places.filter((p) => isFav(p)).length;

  return (
    <div id="screen-world-guide" className="flex flex-col gap-6 pb-28 text-stone-100 animate-fadeIn max-w-5xl mx-auto w-full">
      {/* Header: Libreta de Direcciones */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#3d3126] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full wax-seal" />
            <span className="font-editorial text-xs uppercase font-bold text-[#e5ba79] tracking-wider">
              Anotaciones de Ruta
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#fbf6ed]">
            Libreta de Rincones
          </h1>
          <p className="font-serif-body text-xs sm:text-sm text-stone-400 italic mt-0.5">
            Direcciones secretas, cafés inolvidables y lugares a los que juraste volver.
          </p>
        </div>

        {/* Buscador de rincón */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[#201a15] border border-[#3e3126] text-xs text-stone-200 placeholder:text-stone-500 font-serif-body italic focus:outline-none focus:border-[#d69542]"
          />
        </div>
      </div>

      {/* Pestañas de Cuaderno */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSection('worthReturning')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-editorial text-xs font-bold whitespace-nowrap transition-all ${
            activeSection === 'worthReturning'
              ? 'bg-gradient-to-r from-[#d69542] to-[#b8762d] text-[#24170c] shadow-md'
              : 'bg-[#201a15] text-stone-300 border border-[#3e3126] hover:bg-[#28211b]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Volvería una y otra vez</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
            {worthReturningCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('favorites')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-editorial text-xs font-bold whitespace-nowrap transition-all ${
            activeSection === 'favorites'
              ? 'bg-gradient-to-r from-[#d69542] to-[#b8762d] text-[#24170c] shadow-md'
              : 'bg-[#201a15] text-stone-300 border border-[#3e3126] hover:bg-[#28211b]'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Rincones Favoritos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
            {favoritesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-editorial text-xs font-bold whitespace-nowrap transition-all ${
            activeSection === 'all'
              ? 'bg-gradient-to-r from-[#d69542] to-[#b8762d] text-[#24170c] shadow-md'
              : 'bg-[#201a15] text-stone-300 border border-[#3e3126] hover:bg-[#28211b]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Todas las Anotaciones ({places.length})</span>
        </button>
      </div>

      {/* Grid de Rincones Anotados */}
      {filteredPlaces.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#1e1915] border border-[#44362b] text-center flex flex-col items-center gap-3">
          <BookOpen className="w-12 h-12 text-[#d69542] opacity-80" />
          <h3 className="font-editorial text-xl font-bold text-[#fbf6ed]">
            No hay rincones en esta selección
          </h3>
          <p className="font-serif-body text-xs sm:text-sm text-stone-400 max-w-sm italic">
            Entra a una de tus ciudades para anotar tus cafés, restaurantes y miradores inolvidables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaces.map((place) => {
            const city = cities.find((c) => c.id === place.cityId);
            const country = countries.find((co) => co.id === place.countryId);

            return (
              <article
                key={place.id}
                onClick={() => onSelectPlace(place)}
                className="group relative rounded-2xl bg-[#221c17] border border-[#3e3126] p-5 flex flex-col justify-between gap-3 shadow-lg hover:border-[#d69542]/60 hover:shadow-xl transition-all cursor-pointer"
              >
                {/* Washi tape decorativo */}
                <div className="w-14 h-4 washi-tape-amber rounded-xs absolute -top-2 left-6 rotate-[-1deg] opacity-75 pointer-events-none" />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="px-2 py-0.5 rounded-sm bg-[#faf5ea] text-[#24170c] font-editorial text-[10px] font-bold uppercase border border-[#d6c7b0]">
                        {place.category}
                      </span>
                      {place.isFavorite && (
                        <span className="px-2 py-0.5 rounded-full bg-[#3c2f21] text-[#e5ba79] font-serif text-[10px] flex items-center gap-1 border border-[#52402e]">
                          <Star className="w-2.5 h-2.5 fill-[#e5ba79]" />
                          Favorito
                        </span>
                      )}
                      {place.worthReturning && (
                        <span className="px-2 py-0.5 rounded-full bg-[#33221b] text-amber-200 font-serif text-[10px] border border-[#503529]">
                          Volvería
                        </span>
                      )}
                    </div>

                    <h3 className="font-editorial text-lg font-bold text-[#fbf6ed] truncate group-hover:text-[#e5ba79] transition-colors">
                      {place.name}
                    </h3>

                    <p className="font-serif-body text-xs text-stone-400 italic flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#d69542] shrink-0" />
                      <span className="truncate">
                        {city?.name || 'Ciudad'}, {country?.name || 'Mundo'}
                      </span>
                    </p>
                  </div>

                  {place.photos && place.photos[0] && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#44362b] shadow-xs">
                      <img
                        src={place.photos[0]}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>

                {place.notes && (
                  <p className="font-handwriting text-base text-amber-200/90 line-clamp-2 pl-2 border-l-2 border-[#d69542]/50 italic">
                    "{place.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#342820] text-xs">
                  <span className="font-serif-body text-xs text-stone-500 italic">
                    {place.address || 'Ubicación guardada'}
                  </span>
                  <span className="font-editorial text-[#e5ba79] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Abrir rincón
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
