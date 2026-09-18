import React, { useState } from 'react';
import { CountryRecord, CityRecord, PlaceRecord, MomentRecord } from '../types';
import { WorldGlobe } from './WorldGlobe';
import {
  Sparkles,
  Plus,
  Compass,
  MapPin,
  Layers,
  RotateCw,
  Search,
  BookOpen,
} from 'lucide-react';

interface ScreenWorldProps {
  visitedCountries: CountryRecord[];
  cities: CityRecord[];
  places: PlaceRecord[];
  snapshots?: MomentRecord[];
  onSelectCountry: (country: CountryRecord) => void;
  onOpenAddCountry: (code?: string) => void;
  onOpenAddMoment?: (cityId?: string) => void;
  onSeedDemo: () => Promise<void>;
  onReliveGlobal?: () => void;
  onReliveCountry?: (country: CountryRecord) => void;
  onSelectSnapshot?: (snapshot: MomentRecord) => void;
}

export const ScreenWorld: React.FC<ScreenWorldProps> = ({
  visitedCountries,
  cities,
  places,
  snapshots = [],
  onSelectCountry,
  onOpenAddCountry,
  onOpenAddMoment,
  onSeedDemo,
  onReliveGlobal,
  onReliveCountry,
}) => {
  const [isSeeding, setIsSeeding] = useState(false);

  // When a country code is tapped on the 3D globe:
  const handleSelectByCode = (code: string) => {
    const existing = visitedCountries.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (existing) {
      onSelectCountry(existing);
    } else {
      onOpenAddCountry(code);
    }
  };

  const handleRunDemo = async () => {
    setIsSeeding(true);
    try {
      await onSeedDemo();
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div
      id="screen-atlas-world"
      className="relative w-full h-[calc(100vh-4.5rem)] min-h-[600px] flex flex-col justify-between overflow-hidden bg-[#03060c] text-stone-100 select-none"
    >
      {/* 1. Deep Space Interstellar Canvas Background with Twinkling Stars */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Ambient Cosmic Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full bg-radial from-amber-500/10 via-sky-500/5 to-transparent blur-3xl opacity-60" />
        
        {/* Distant starlight specks */}
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage: `radial-gradient(1px 1px at 20px 30px, #fef3c7, rgba(0,0,0,0)),
                              radial-gradient(1.2px 1.2px at 90px 140px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 240px 80px, #fed7aa, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 320px 220px, #bae6fd, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 450px 120px, #fde68a, rgba(0,0,0,0)),
                              radial-gradient(1.2px 1.2px at 580px 290px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 720px 180px, #fef3c7, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 850px 320px, #bae6fd, rgba(0,0,0,0))`,
            backgroundSize: '900px 400px',
          }}
        />
      </div>

      {/* 2. Floating Top Header: Brand, User Mantra & Celestial Status */}
      <header className="relative z-10 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 pointer-events-none">
        {/* Brand & Core Philosophy */}
        <div className="pointer-events-auto flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-md shadow-amber-400" />
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#fbf6ed] drop-shadow-md">
              Momentos
            </h1>
            <span className="text-stone-500 text-xs">•</span>
            <span className="font-editorial text-xs text-amber-200/80 tracking-wider uppercase">
              Atlas Personal
            </span>
          </div>

          <p className="font-serif-body text-xs sm:text-sm text-stone-300/80 italic drop-shadow max-w-sm">
            «Marca dónde fuiste. Guarda lo que viviste.»
          </p>
        </div>

        {/* Top Right Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {/* Illuminated Count Pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#120e0a]/80 border border-amber-900/40 backdrop-blur-md shadow-md text-xs font-editorial">
            <span className="text-amber-400">🌍</span>
            <span className="text-stone-200 font-bold">
              {visitedCountries.length} {visitedCountries.length === 1 ? 'tierra iluminada' : 'tierras iluminadas'}
            </span>
            <span className="text-stone-500">•</span>
            <span className="text-amber-300 font-bold">{snapshots.length} momentos</span>
          </div>

          {/* Mesa de Recuerdos Button */}
          {snapshots.length > 0 && onReliveGlobal && (
            <button
              id="btn-world-relive-memories"
              type="button"
              onClick={onReliveGlobal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-[#24170c] font-editorial font-bold text-xs shadow-lg shadow-amber-950/60 border border-[#fde68a] transition-all hover:scale-105 active:scale-95"
              title="Abrir la mesa con todos tus recuerdos físicos esparcidos"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#24170c]" />
              <span className="tracking-wide">Mesa de Recuerdos</span>
            </button>
          )}

          {/* Quick Add Country button */}
          <button
            id="btn-illuminate-country-top"
            type="button"
            onClick={() => onOpenAddCountry()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1c1510]/85 hover:bg-[#2a2018] text-stone-200 font-editorial font-bold text-xs border border-amber-900/50 backdrop-blur-md transition-all shadow-md hover:border-amber-700/60"
            title="Buscar e iluminar un nuevo país en el globo"
          >
            <Plus className="w-3.5 h-3.5 text-[#e5ba79]" />
            <span>+ Iluminar País</span>
          </button>
        </div>
      </header>

      {/* 3. The 3D Interactive World Globe (The Heart of the Product) */}
      <main className="relative z-0 flex-1 flex items-center justify-center p-2">
        <div className="w-full h-full max-w-[680px] max-h-[680px] aspect-square relative flex items-center justify-center">
          <WorldGlobe
            visitedCountries={visitedCountries}
            onSelectCountry={handleSelectByCode}
            onOpenAddCountry={onOpenAddCountry}
          />
        </div>
      </main>

      {/* 4. Floating Bottom HUD: Ambient Guide & Fast Capture Button (< 10 seconds) */}
      <footer className="relative z-10 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-none">
        {/* Left: Atmospheric Guide */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#120e0a]/80 border border-amber-900/30 backdrop-blur-md text-[11px] sm:text-xs font-serif-body italic text-stone-300/80 shadow-md">
          <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Gira tu mundo libremente · Toca un país iluminado para explorar sus recuerdos</span>
        </div>

        {/* Center: Fast Capture Button (< 10s requirement) */}
        {onOpenAddMoment && (
          <div className="pointer-events-auto">
            <button
              id="btn-fast-moment-capture"
              type="button"
              onClick={() => onOpenAddMoment()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] hover:from-[#f59e0b] hover:to-[#fde68a] text-[#24170c] font-editorial font-bold text-xs sm:text-sm shadow-xl shadow-amber-950/80 hover:scale-105 active:scale-95 border border-[#fffbeb] transition-all group"
            >
              <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
              <span>Guardar Momento</span>
              <span className="text-[10px] uppercase tracking-wider font-mono opacity-70 bg-black/20 px-1.5 py-0.5 rounded-full">
                &lt;10s
              </span>
            </button>
          </div>
        )}

        {/* Right: Demo Seeder button if empty or testing */}
        {visitedCountries.length === 0 && (
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={handleRunDemo}
              disabled={isSeeding}
              className="px-3 py-1.5 rounded-full bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 text-xs font-editorial border border-amber-800/40 transition-all backdrop-blur-md"
            >
              {isSeeding ? 'Iluminando mundo...' : 'Cargar viaje de muestra (Marruecos, Japón, España)'}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
