import React, { useState, useMemo } from 'react';
import * as d3Geo from 'd3-geo';
import { CountryRecord } from '../types';
import {
  COUNTRY_FEATURES,
  WORLD_GRATICULE,
  SPHERE_OBJECT,
  ExtendedCountryFeature,
} from '../lib/geoData';
import { searchCountries } from '../data/countriesData';
import { Search, Globe, CheckCircle2, ChevronRight, Sparkles, X, Plus } from 'lucide-react';

interface WorldMapProps {
  visitedCountries: CountryRecord[];
  onSelectCountry: (countryCodeOrId: string) => void;
  onOpenAddCountry?: (code?: string) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  visitedCountries,
  onSelectCountry,
  onOpenAddCountry,
}) => {
  const [search, setSearch] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('Todos');
  const [selectedFeature, setSelectedFeature] = useState<ExtendedCountryFeature | null>(null);

  // Fast map of visited countries
  const visitedMap = useMemo(() => {
    const map = new Map<string, CountryRecord>();
    visitedCountries.forEach((c) => map.set(c.code.toUpperCase(), c));
    return map;
  }, [visitedCountries]);

  const continents = ['Todos', 'Europa', 'América', 'Asia', 'África', 'Oceanía'];

  // Setup D3 projection and precompute SVG paths for 100% of country features
  const { pathGenerator, countryPaths, graticulePath } = useMemo(() => {
    // Equirectangular projection sized to 960x480
    const projection = d3Geo.geoEquirectangular().fitSize([960, 480], SPHERE_OBJECT as any);
    const pathGen = d3Geo.geoPath(projection);

    const paths = new Map<string, string>();
    COUNTRY_FEATURES.forEach((feat) => {
      try {
        const d = pathGen(feat as any);
        if (d) {
          paths.set(feat.properties.code.toUpperCase(), d);
        }
      } catch (e) {
        console.error('Error generating path for', feat.properties.code, e);
      }
    });

    const grat = pathGen(WORLD_GRATICULE) || '';
    return { pathGenerator: pathGen, countryPaths: paths, graticulePath: grat };
  }, []);

  const filteredCountries = useMemo(() => {
    return searchCountries(search).filter((c) => {
      if (selectedContinent === 'Todos') return true;
      return c.continent === selectedContinent;
    });
  }, [search, selectedContinent]);

  // Sort visited first, then alphabetically
  const sortedCountries = useMemo(() => {
    return [...filteredCountries].sort((a, b) => {
      const aVisited = visitedMap.has(a.code.toUpperCase());
      const bVisited = visitedMap.has(b.code.toUpperCase());
      if (aVisited && !bVisited) return -1;
      if (!aVisited && bVisited) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredCountries, visitedMap]);

  // Handle click on country polygon
  const handleFeatureClick = (feat: ExtendedCountryFeature) => {
    setSelectedFeature(feat);
  };

  const selectedRecord = selectedFeature
    ? visitedMap.get(selectedFeature.properties.code.toUpperCase())
    : null;

  return (
    <div id="world-map-view" className="w-full flex flex-col gap-5 text-white">
      {/* Visual Canvas/SVG Planar Silhouettes Overview */}
      <div className="relative w-full rounded-3xl bg-slate-950/80 border border-white/10 p-4 sm:p-5 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Siluetas Geográficas del Planeta</span>
          </span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/80" />
              Iluminados ({visitedCountries.length})
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
              Por descubrir ({195 - visitedCountries.length})
            </span>
          </div>
        </div>

        {/* SVG Planar Map with REAL Geographic Polygons */}
        <div className="relative w-full aspect-[2/1] rounded-2xl bg-[#060c18] border border-white/10 overflow-hidden shadow-inner group">
          <svg
            viewBox="0 0 960 480"
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Graticule grid lines */}
            <path
              d={graticulePath}
              fill="none"
              stroke="rgba(148, 163, 184, 0.08)"
              strokeWidth="0.6"
            />

            {/* PASS 1: Unvisited Countries (Gris oscuro, baja opacidad) */}
            <g id="unvisited-silhouettes">
              {COUNTRY_FEATURES.map((feat) => {
                const code = feat.properties.code.toUpperCase();
                if (visitedMap.has(code)) return null;

                const pathD = countryPaths.get(code);
                if (!pathD) return null;

                const isSelected = selectedFeature?.properties.code.toUpperCase() === code;

                return (
                  <path
                    key={`map-unvisited-${code}`}
                    d={pathD}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'fill-cyan-500/50 stroke-cyan-300 stroke-[1.5]'
                        : 'fill-[#141d2f] hover:fill-[#1f2c44] stroke-[#0b1220] hover:stroke-slate-500/40 stroke-[0.6]'
                    }`}
                    onClick={() => handleFeatureClick(feat)}
                  >
                    <title>{`${feat.properties.flag} ${feat.properties.name} (Por descubrir)`}</title>
                  </path>
                );
              })}
            </g>

            {/* PASS 2: Visited Countries (Silueta completa iluminada + borde brillante) */}
            <g id="visited-silhouettes">
              {COUNTRY_FEATURES.map((feat) => {
                const code = feat.properties.code.toUpperCase();
                if (!visitedMap.has(code)) return null;

                const pathD = countryPaths.get(code);
                if (!pathD) return null;

                const isSelected = selectedFeature?.properties.code.toUpperCase() === code;

                return (
                  <path
                    key={`map-visited-${code}`}
                    d={pathD}
                    className={`cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'fill-amber-400 stroke-white stroke-[2] filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                        : 'fill-amber-500/80 hover:fill-amber-400 stroke-amber-200 stroke-[1.2] filter drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]'
                    }`}
                    onClick={() => handleFeatureClick(feat)}
                  >
                    <title>{`★ ${feat.properties.flag} ${feat.properties.name} (Visitado)`}</title>
                  </path>
                );
              })}
            </g>
          </svg>

          {/* Docked Card overlay on Map when a country is selected */}
          {selectedFeature && (
            <div className="absolute bottom-2 left-2 right-2 p-3 sm:p-3.5 rounded-2xl backdrop-blur-2xl bg-slate-950/90 border border-white/20 shadow-2xl flex items-center justify-between gap-3 animate-slideUp">
              <div className="flex items-center gap-3 min-w-0">
                {selectedRecord?.coverPhoto ? (
                  <img
                    src={selectedRecord.coverPhoto}
                    alt={selectedFeature.properties.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-xl shrink-0 border border-white/10">
                    {selectedFeature.properties.flag}
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {selectedFeature.properties.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        selectedRecord
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {selectedRecord ? 'Visitado' : 'Por explorar'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 truncate block">
                    {selectedRecord
                      ? `${selectedRecord.firstVisitDate} · ${selectedRecord.visitCount || 1} visita(s)`
                      : 'Pulsa para añadir y activar su silueta'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {selectedRecord ? (
                  <button
                    type="button"
                    onClick={() => onSelectCountry(selectedRecord.code)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors shadow-md"
                  >
                    <span>Ver país</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAddCountry) {
                        onOpenAddCountry(selectedFeature.properties.code);
                      } else {
                        onSelectCountry(selectedFeature.properties.code);
                      }
                    }}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors border border-white/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedFeature(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar in Dark Glassmorphism */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-country-input"
            type="text"
            placeholder="Buscar entre los 195 países por nombre o continente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl backdrop-blur-xl bg-slate-900/60 border border-white/10 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-lg"
          />
        </div>

        {/* Continent Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {continents.map((cont) => (
            <button
              key={cont}
              id={`filter-continent-${cont.toLowerCase()}`}
              type="button"
              onClick={() => setSelectedContinent(cont)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedContinent === cont
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-white/10'
              }`}
            >
              {cont}
            </button>
          ))}
        </div>
      </div>

      {/* Countries Grid with Silhouettes indication */}
      <div
        id="countries-list-grid"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar"
      >
        {sortedCountries.map((c) => {
          const visited = visitedMap.get(c.code.toUpperCase());
          return (
            <button
              key={c.code}
              id={`country-item-${c.code}`}
              type="button"
              onClick={() => onSelectCountry(c.code)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all group backdrop-blur-xl ${
                visited
                  ? 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-950/40 hover:border-amber-500/60 shadow-lg shadow-amber-950/10'
                  : 'bg-slate-900/50 border-white/10 hover:bg-slate-800/60 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0 drop-shadow-md">{c.flag}</span>
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                    {visited && (
                      <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        Iluminado
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 truncate block mt-0.5">
                    {c.continent} {visited ? `· ${visited.visitCount || 1} visita(s)` : '· Silueta apagada'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-300 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
