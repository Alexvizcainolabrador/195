import React, { useState, useMemo } from 'react';
import {
  MomentRecord,
  CityRecord,
  CountryRecord,
  MomentMediaType,
  getMomentMediaType,
  getMomentMediaUrl,
  getMomentPhrase,
  getMomentAuthor,
} from '../types';
import {
  Sparkles,
  Plus,
  Camera,
  Video,
  Mic,
  FileText,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Play,
  Volume2,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react';

interface ScreenMomentsProps {
  moments: MomentRecord[];
  cities: CityRecord[];
  countries: CountryRecord[];
  onRelive: (initialMomentId?: string) => void;
  onOpenAddMoment: () => void;
  onEditMoment: (moment: MomentRecord) => void;
  onDeleteMoment: (momentId: string) => void;
}

export const ScreenMoments: React.FC<ScreenMomentsProps> = ({
  moments,
  cities,
  countries,
  onRelive,
  onOpenAddMoment,
  onEditMoment,
  onDeleteMoment,
}) => {
  const [filterType, setFilterType] = useState<MomentMediaType | 'all'>('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'chronological' | 'reverse'>('chronological');

  // Sorted & Filtered Moments
  const filteredMoments = useMemo(() => {
    let list = [...moments];

    if (filterType !== 'all') {
      list = list.filter((m) => getMomentMediaType(m) === filterType);
    }

    if (selectedCityFilter !== 'all') {
      list = list.filter((m) => m.cityId === selectedCityFilter);
    }

    list.sort((a, b) => {
      const dateCmp = (a.date || '').localeCompare(b.date || '');
      if (dateCmp !== 0) {
        return sortOrder === 'chronological' ? dateCmp : -dateCmp;
      }
      const timeCmp = (a.time || '').localeCompare(b.time || '');
      return sortOrder === 'chronological' ? timeCmp : -timeCmp;
    });

    return list;
  }, [moments, filterType, selectedCityFilter, sortOrder]);

  const formatDisplayDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const date = new Date(y, m - 1, d);
      const formatted = date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return timeStr ? `${formatted} · ${timeStr}` : formatted;
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="screen-moments" className="flex flex-col gap-8 pb-28 text-stone-100 animate-fadeIn max-w-5xl mx-auto w-full">
      {/* Header: Colección de Momentos */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-[#362b22] pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full wax-seal" />
            <span className="font-editorial text-xs uppercase font-bold text-[#e5ba79] tracking-wider">
              Concepto · Momentos
            </span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#fbf6ed]">
            Colección de Recuerdos
          </h1>
          <p className="font-serif-body text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed italic">
            Fotos, vídeos cortos, notas de voz y reflexiones guardadas en el tiempo. Cada momento atesora fecha, hora, ciudad y autor.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {moments.length > 0 && (
            <button
              type="button"
              onClick={() => onRelive()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#e3a857] via-[#f1c27d] to-[#d69542] text-[#24170c] font-editorial font-bold text-xs shadow-lg shadow-amber-950/40 hover:scale-105 active:scale-95 transition-all border border-[#ffdfa9]"
              title="Abrir la Mesa de Recuerdos físicos"
            >
              <Sparkles className="w-4 h-4 fill-[#24170c] text-[#24170c]" />
              <span>Mesa de Recuerdos</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddMoment}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2a221c] hover:bg-[#382d24] text-stone-200 font-editorial font-bold text-xs border border-[#4a3b2f] transition-all"
          >
            <Plus className="w-4 h-4 text-[#e5ba79]" />
            <span>Nuevo Momento</span>
          </button>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#1b1511] border border-[#382c22]">
        {/* Media type buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-editorial font-bold transition-all ${
              filterType === 'all'
                ? 'bg-[#e5ba79] text-[#24170c]'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            Todos ({moments.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('photo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-editorial font-bold transition-all ${
              filterType === 'photo'
                ? 'bg-[#e5ba79] text-[#24170c]'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Fotos</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-editorial font-bold transition-all ${
              filterType === 'video'
                ? 'bg-[#e5ba79] text-[#24170c]'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Vídeos</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('audio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-editorial font-bold transition-all ${
              filterType === 'audio'
                ? 'bg-[#e5ba79] text-[#24170c]'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Audios</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('note')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-editorial font-bold transition-all ${
              filterType === 'note'
                ? 'bg-[#e5ba79] text-[#24170c]'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notas</span>
          </button>
        </div>

        {/* City Filter & Order */}
        <div className="flex items-center gap-2">
          {cities.length > 0 && (
            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#241c16] border border-[#3e3025] text-xs text-stone-300 focus:outline-none focus:border-[#d69542]"
            >
              <option value="all">Todas las ciudades</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'chronological' ? 'reverse' : 'chronological'))}
            className="px-3 py-1.5 rounded-lg bg-[#241c16] hover:bg-[#2e231c] border border-[#3e3025] text-xs text-stone-300 font-editorial"
          >
            {sortOrder === 'chronological' ? 'Cronológico (Antiguo → Reciente)' : 'Reciente → Antiguo'}
          </button>
        </div>
      </section>

      {/* Grid of Moments */}
      {filteredMoments.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#1a1410] border border-[#3b2d22] text-center flex flex-col items-center gap-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#2a2018] text-[#e5ba79] flex items-center justify-center border border-[#4a392b]">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-editorial text-xl font-bold text-[#fbf6ed]">
            No hay momentos guardados aquí
          </h3>
          <p className="font-serif-body text-xs sm:text-sm text-stone-400 italic max-w-md">
            Guarda una fotografía, una nota manuscrita, el murmullo de una plaza o un vídeo para no olvidarlo nunca.
          </p>
          <button
            type="button"
            onClick={onOpenAddMoment}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#d69542] to-[#b8762d] text-[#24170c] font-editorial font-bold text-xs shadow-md mt-2"
          >
            Crear primer Momento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMoments.map((m) => {
            const mType = getMomentMediaType(m);
            const mUrl = getMomentMediaUrl(m);
            const mPhrase = getMomentPhrase(m);
            const mNote = m.note || mPhrase;
            const mAuthor = getMomentAuthor(m);

            const cityObj = cities.find((c) => c.id === m.cityId);
            const countryObj = countries.find((c) => c.id === (cityObj?.countryId || m.countryId));
            const cityName = m.cityName || cityObj?.name || 'Ciudad';
            const countryName = m.countryName || countryObj?.name || 'País';

            return (
              <article
                key={m.id}
                id={`moment-card-${m.id}`}
                className="group relative rounded-3xl bg-[#1a1410] border border-[#3b2d22] hover:border-[#e5ba79]/50 shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
              >
                {/* Visual Media Header */}
                <div
                  className="relative aspect-4/3 w-full bg-black/60 overflow-hidden cursor-pointer"
                  onClick={() => onRelive(m.id)}
                >
                  {/* Photo */}
                  {mType === 'photo' && mUrl && (
                    <img
                      src={mUrl}
                      alt={mPhrase || 'Momento'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* Video */}
                  {mType === 'video' && mUrl && (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <video src={mUrl} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#d69542]/80 text-[#24170c] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio */}
                  {mType === 'audio' && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#251c16] to-[#16100c] text-center">
                      <div className="w-14 h-14 rounded-full bg-[#d69542]/20 border border-[#e5ba79]/40 flex items-center justify-center text-[#e5ba79] group-hover:scale-110 transition-transform">
                        <Mic className="w-6 h-6" />
                      </div>
                      <span className="font-editorial text-xs font-bold text-[#e5ba79] mt-3">
                        Grabación de Audio
                      </span>
                      <span className="text-[11px] text-stone-400 font-serif-body italic mt-1">
                        Pulsa para escuchar en Stories
                      </span>
                    </div>
                  )}

                  {/* Note */}
                  {mType === 'note' && (
                    <div className="w-full h-full p-6 bg-[#251d17] flex flex-col justify-center border-b border-[#3b2d22] relative">
                      <div className="w-16 h-4 washi-tape-amber rounded-xs absolute top-2 left-1/2 -translate-x-1/2 rotate-[-2deg]" />
                      <blockquote className="font-handwriting text-xl sm:text-2xl text-amber-100 line-clamp-4 italic leading-relaxed text-center">
                        "{mNote || 'Nota guardada en el camino'}"
                      </blockquote>
                    </div>
                  )}

                  {/* Media Type Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-editorial font-bold text-[#e5ba79] border border-white/10 flex items-center gap-1.5">
                    {mType === 'photo' && <Camera className="w-3 h-3" />}
                    {mType === 'video' && <Video className="w-3 h-3" />}
                    {mType === 'audio' && <Mic className="w-3 h-3" />}
                    {mType === 'note' && <FileText className="w-3 h-3" />}
                    <span className="capitalize">{mType}</span>
                  </div>

                  {/* Hover "Revivir" trigger overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3.5 py-1.5 rounded-full bg-[#e5ba79] text-[#24170c] text-xs font-editorial font-bold flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>Revivir</span>
                    </span>
                  </div>
                </div>

                {/* Card Content & Mandatory Metadata: Fecha, Hora, Ciudad, Autor */}
                <div className="p-5 flex flex-col justify-between flex-1 gap-3">
                  {/* Phrase / Note if not purely note */}
                  {mType !== 'note' && mPhrase && (
                    <p className="font-serif-body text-xs sm:text-sm text-stone-200 italic line-clamp-2">
                      "{mPhrase}"
                    </p>
                  )}

                  {/* Metadata block */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#31251c] text-xs">
                    {/* Ciudad y País */}
                    <div className="flex items-center gap-1.5 text-[#f1c27d] font-editorial font-bold truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#d69542] shrink-0" />
                      <span className="truncate">
                        {cityName}, {countryName}
                      </span>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="flex items-center justify-between text-stone-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#d69542]" />
                        <span>{formatDisplayDate(m.date, m.time)}</span>
                      </div>

                      {/* Autor */}
                      <div className="flex items-center gap-1 font-serif-body italic text-stone-300">
                        <UserIcon className="w-3 h-3 text-[#e5ba79]" />
                        <span>{mAuthor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action row (Edit / Delete) */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#2a2017]">
                    <button
                      type="button"
                      onClick={() => onEditMoment(m)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-[#e5ba79] hover:bg-white/5 transition-colors"
                      title="Editar este momento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('¿Eliminar este recuerdo de forma permanente?')) {
                          onDeleteMoment(m.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                      title="Eliminar este momento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
