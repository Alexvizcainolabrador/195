import React, { useState, useRef } from 'react';
import {
  CountryRecord,
  CityRecord,
  PlaceRecord,
  MomentRecord,
  SnapshotRecord,
  getMomentMediaType,
  getMomentMediaUrl,
  getMomentPhrase,
  getMomentPlace,
  getMomentPeople,
} from '../types';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Sparkles,
  Volume2,
  Users,
  Camera,
  Video,
  Mic,
  Play,
  Pause,
  Edit2,
  BookmarkCheck,
  Star,
  ChevronRight,
  Maximize2,
  Film,
  Disc,
} from 'lucide-react';

interface ScreenCityProps {
  country: CountryRecord;
  city: CityRecord;
  snapshots: SnapshotRecord[];
  places: PlaceRecord[];
  onBack: () => void;
  onSelectSnapshot: (moment: MomentRecord) => void;
  onOpenAddSnapshot: () => void;
  onSelectPlace: (place: PlaceRecord) => void;
  onOpenAddPlace: () => void;
  onUpdateCity: (city: CityRecord) => Promise<void>;
  onDeleteCity: (cityId: string) => Promise<void>;
  onReliveCity?: (city: CityRecord, startAtMomentId?: string) => void;
  onDeleteMoment?: (momentId: string) => Promise<void>;
  onEditMoment?: (moment: MomentRecord) => void;
}

export const ScreenCity: React.FC<ScreenCityProps> = ({
  country,
  city,
  snapshots,
  places,
  onBack,
  onSelectSnapshot,
  onOpenAddSnapshot,
  onSelectPlace,
  onOpenAddPlace,
  onDeleteCity,
  onReliveCity,
  onDeleteMoment,
  onEditMoment,
}) => {
  const [activeTab, setActiveTab] = useState<'moments' | 'places' | 'trips'>('moments');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Filter & sort moments chronologically (oldest to newest for journey)
  const cityMoments = [...snapshots.filter((s) => s.cityId === city.id)].sort(
    (a, b) => (a.date || '').localeCompare(b.date || '')
  );

  const cityPlaces = places.filter((p) => p.cityId === city.id);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (y && m && d) {
        return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleToggleAudio = (momentId: string, audioUrl: string) => {
    if (playingAudioId === momentId) {
      if (activeAudioRef.current) activeAudioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (activeAudioRef.current) activeAudioRef.current.pause();
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.play().catch(() => {});
      setPlayingAudioId(momentId);
    }
  };

  const handleDeleteCity = async () => {
    if (
      window.confirm(
        `¿Eliminar el capítulo de ${city.name}? Se borrarán también sus recuerdos y rincones guardados.`
      )
    ) {
      await onDeleteCity(city.id);
      onBack();
    }
  };

  return (
    <div id="screen-city-detail" className="flex flex-col gap-8 pb-28 text-stone-100 animate-fadeIn max-w-4xl mx-auto w-full">
      {/* Top Navigation Bar: Breadcrumbs estilo Cuaderno */}
      <div className="flex items-center justify-between gap-3">
        <button
          id="btn-back-to-country"
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#27201b] border border-[#3e3126] font-editorial text-xs sm:text-sm text-stone-300 hover:text-white hover:bg-[#342b23] transition-all shadow-xs group"
        >
          <ArrowLeft className="w-4 h-4 text-[#e5ba79] group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al cuaderno de {country.name}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteCity}
            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition-all shadow-xs"
            title="Eliminar este destino"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Portada de la Ciudad: Postal de Álbum */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-[#3d3025] bg-[#1a1511]">
        {/* Decorative washi tape */}
        <div className="w-24 h-5 washi-tape-amber rounded-xs absolute -top-2.5 left-1/2 -translate-x-1/2 rotate-1 z-20 opacity-85" />

        <div className="relative h-48 sm:h-64 w-full overflow-hidden">
          <img
            src={city.coverPhoto}
            alt={city.name}
            className="w-full h-full object-cover filter brightness-90 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16120e] via-[#16120e]/40 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative z-10 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-3 py-0.5 rounded-sm text-xs font-editorial font-bold uppercase bg-[#faf5ea] text-[#24170c] border border-[#d6c7b0] shadow-sm rotate-[-1deg]">
                  {country.name}
                </span>
                <span className="font-handwriting text-base text-amber-200/90 ml-1">
                  {cityMoments.length} {cityMoments.length === 1 ? 'recuerdo atesorado' : 'recuerdos atesorados'}
                </span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#fbf6ed] drop-shadow-sm">
                {city.name}
              </h1>

              <p className="font-serif-body text-xs sm:text-sm text-stone-300 max-w-xl italic mt-0.5 leading-relaxed">
                {city.notes || 'Páginas abiertas para guardar los instantes, las voces y la atmósfera de este rincón del mundo.'}
              </p>
            </div>

            {/* Acción Principal: Mesa de Recuerdos de la ciudad */}
            {cityMoments.length > 0 && onReliveCity && (
              <button
                id="btn-relive-city-hero"
                type="button"
                onClick={() => onReliveCity(city)}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#e3a857] via-[#f1c27d] to-[#d69542] text-[#24170c] font-editorial font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/50 hover:scale-105 active:scale-95 transition-all border border-[#ffdfa9] shrink-0"
                title={`Abrir la Mesa de Recuerdos físicos de ${city.name}`}
              >
                <Sparkles className="w-4 h-4 fill-[#24170c]" />
                <span>Mesa de Recuerdos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selector de Sección: 1. Momentos Guardados · 2. Lugares Guardados · 3. Viajes Realizados */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#362b22]/70 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-[#201a15] border border-[#3e3126]">
          <button
            id="tab-moments-list"
            type="button"
            onClick={() => setActiveTab('moments')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-editorial font-bold transition-all ${
              activeTab === 'moments'
                ? 'bg-gradient-to-r from-[#d97706] to-[#b45309] text-[#fff8ed] shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Momentos Guardados</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'moments'
                  ? 'bg-black/30 text-amber-100'
                  : 'bg-white/10 text-stone-300'
              }`}
            >
              {cityMoments.length}
            </span>
          </button>

          <button
            id="tab-city-places"
            type="button"
            onClick={() => setActiveTab('places')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-editorial font-bold transition-all ${
              activeTab === 'places'
                ? 'bg-gradient-to-r from-[#d97706] to-[#b45309] text-[#fff8ed] shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Lugares Guardados</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'places'
                  ? 'bg-black/30 text-amber-100'
                  : 'bg-white/10 text-stone-300'
              }`}
            >
              {cityPlaces.length}
            </span>
          </button>

          <button
            id="tab-city-trips"
            type="button"
            onClick={() => setActiveTab('trips')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-editorial font-bold transition-all ${
              activeTab === 'trips'
                ? 'bg-gradient-to-r from-[#d97706] to-[#b45309] text-[#fff8ed] shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Viajes Realizados</span>
          </button>
        </div>

        {activeTab === 'moments' ? (
          <button
            id="btn-add-moment-trigger"
            type="button"
            onClick={onOpenAddSnapshot}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#d69542] to-[#b8762d] text-[#24170c] font-editorial font-bold text-xs sm:text-sm shadow-md hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Guardar Momento</span>
          </button>
        ) : activeTab === 'places' ? (
          <button
            id="btn-add-place-trigger"
            type="button"
            onClick={onOpenAddPlace}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#27201b] hover:bg-[#342b23] text-[#e5ba79] font-editorial text-xs font-bold border border-[#44362b] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Anotar Rincón</span>
          </button>
        ) : null}
      </div>

      {/* =========================================================================
          VISTA 1: MOMENTOS GUARDADOS (Fotos, vídeos cortos, audios, notas)
         ========================================================================= */}
      {activeTab === 'moments' && (
        <div className="flex flex-col gap-6">
          {cityMoments.length === 0 ? (
            /* Empty State */
            <div className="p-10 sm:p-14 rounded-3xl bg-[#1e1915] border border-[#44362b] text-center flex flex-col items-center gap-4 shadow-xl relative overflow-hidden">
              <div className="w-20 h-5 washi-tape-amber rounded-xs absolute -top-2.5 left-1/2 -translate-x-1/2 rotate-1" />

              <div className="w-14 h-14 rounded-2xl bg-[#342920] text-[#e5ba79] border border-[#524030] flex items-center justify-center shadow-inner">
                <Camera className="w-7 h-7" />
              </div>

              <div className="max-w-md">
                <h3 className="font-editorial text-2xl font-bold text-[#fbf6ed] tracking-tight">
                  Pega tu primer recuerdo en {city.name}
                </h3>
                <p className="font-serif-body text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed italic">
                  Una fotografía que te conmueva, el sonido del mercado o de la lluvia, o un vídeo corto, acompañado de una frase escrita a mano.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenAddSnapshot}
                className="mt-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#d69542] to-[#b8762d] text-[#24170c] font-editorial font-bold text-xs sm:text-sm shadow-md hover:scale-105 transition-all"
              >
                + Pegar primer recuerdo
              </button>
            </div>
          ) : (
            /* Galería de Recuerdos tipo Álbum de Recortes */
            <div className="flex flex-col gap-8">
              {cityMoments.map((moment, index) => {
                const mediaType = getMomentMediaType(moment);
                const mediaUrl = getMomentMediaUrl(moment);
                const phrase = getMomentPhrase(moment);
                const place = getMomentPlace(moment);
                const people = getMomentPeople(moment);
                const isAudioPlaying = playingAudioId === moment.id;

                return (
                  <article
                    key={moment.id}
                    id={`moment-item-${moment.id}`}
                    className="group relative rounded-3xl bg-[#221c17] border border-[#44362b] shadow-xl p-5 sm:p-7 flex flex-col gap-5 hover:border-[#d69542]/50 hover:shadow-2xl transition-all"
                  >
                    {/* Washi Tape Strip on Top */}
                    <div className="w-20 h-5 washi-tape-amber rounded-xs absolute -top-2.5 left-10 rotate-[-1.5deg] z-20 opacity-85 shadow-sm" />

                    {/* Header: Sello de fecha postal y orden */}
                    <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                      <div className="flex items-center gap-2.5">
                        {/* Postmark Date Ring */}
                        <div className="px-3 py-1 rounded-sm bg-[#faf5ea] text-[#24170c] border border-[#d6c7b0] shadow-xs flex items-center gap-1.5 rotate-[-0.5deg]">
                          <Calendar className="w-3.5 h-3.5 text-[#915822]" />
                          <span className="font-editorial font-bold text-xs">
                            {formatDate(moment.date)}
                          </span>
                        </div>

                        <span className="font-handwriting text-base text-amber-200/90">
                          Recuerdo #{index + 1}
                        </span>
                      </div>

                      {/* Revivir directo desde este recuerdo */}
                      {onReliveCity && (
                        <button
                          type="button"
                          onClick={() => onReliveCity(city, moment.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#2f251e] hover:bg-[#3d3127] text-[#e5ba79] font-editorial text-xs font-bold border border-[#4d3c30] transition-colors"
                          title="Revivir la historia a pantalla completa desde este momento"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Revivir desde aquí</span>
                        </button>
                      )}
                    </div>

                    {/* =====================================================
                        MEDIO DEL MOMENTO:
                        Foto montada, Cassette Analógico o Película Super 8
                       ===================================================== */}
                    {mediaType === 'photo' && mediaUrl && (
                      <div
                        className="relative w-full rounded-2xl overflow-hidden p-2 sm:p-3 bg-[#fbf8f2] shadow-inner cursor-pointer group/photo"
                        onClick={() => onSelectSnapshot(moment)}
                      >
                        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#16120e]">
                          <img
                            src={mediaUrl}
                            alt={phrase || 'Recuerdo'}
                            className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-700 filter brightness-95 contrast-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-end p-4">
                            <span className="font-editorial text-xs text-[#fbf6ed] flex items-center gap-1.5 font-bold">
                              <Maximize2 className="w-3.5 h-3.5" /> Abrir en detalle
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {mediaType === 'audio' && mediaUrl && (
                      /* Cassette Tape / Grabación Analógica Vintage */
                      <div className="p-5 sm:p-6 rounded-2xl bg-[#1a1410] border-2 border-[#544131] flex flex-col gap-4 shadow-xl relative overflow-hidden">
                        {/* Decorative tape screw dots */}
                        <div className="flex items-center justify-between text-stone-500 text-[10px] font-mono">
                          <span>● CARRETE A</span>
                          <span className="font-handwriting text-amber-200 text-sm">Grabación de campo</span>
                          <span>● CARRETE B</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d69542] to-[#8f5a20] text-[#24170c] flex items-center justify-center shadow-md shrink-0">
                              {isAudioPlaying ? (
                                <Disc className="w-6 h-6 animate-spin text-[#24170c]" />
                              ) : (
                                <Volume2 className="w-6 h-6 text-[#24170c]" />
                              )}
                            </div>
                            <div>
                              <span className="font-editorial text-base font-bold text-[#fbf6ed] block">
                                Sonido ambiental de {city.name}
                              </span>
                              <span className="font-serif-body text-xs text-amber-200/80 italic">
                                {moment.audioDuration ? `${moment.audioDuration} segundos atesorados` : 'Atmósfera sonora'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleAudio(moment.id, mediaUrl)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#e3a857] to-[#d69542] text-[#24170c] font-editorial font-bold text-xs sm:text-sm shadow-md hover:scale-105 transition-all self-start sm:self-auto"
                          >
                            {isAudioPlaying ? (
                              <>
                                <Pause className="w-4 h-4 fill-current" />
                                <span>Pausar</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-current" />
                                <span>Escuchar</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Visualizador de ondas de sonido estilo analógico */}
                        <div className="flex items-center justify-between gap-1 h-9 px-3 bg-[#130f0c] rounded-xl border border-[#3e3025]">
                          {Array.from({ length: 32 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-full bg-[#d69542] transition-all ${
                                isAudioPlaying ? 'animate-pulse' : 'opacity-35'
                              }`}
                              style={{
                                height: isAudioPlaying
                                  ? `${Math.max(25, Math.sin(i * 0.45) * 80 + 20)}%`
                                  : `${Math.max(15, (i % 5) * 16)}%`,
                                animationDuration: `${0.35 + (i % 4) * 0.15}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {mediaType === 'video' && mediaUrl && (
                      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black border-2 border-[#544131] shadow-xl">
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover filter contrast-105"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-sm bg-[#faf5ea] text-[#24170c] border border-[#d6c7b0] flex items-center gap-1.5 text-xs font-editorial font-bold shadow-sm">
                          <Film className="w-3.5 h-3.5 text-[#915822]" />
                          <span>Película breve</span>
                        </div>
                      </div>
                    )}

                    {mediaType === 'note' && (
                      <div className="w-full p-6 sm:p-8 rounded-2xl bg-[#1d1712] border-2 border-[#4d3a2b] relative overflow-hidden shadow-inner">
                        <div className="w-16 h-4 washi-tape-amber rounded-xs absolute top-2 left-8 rotate-[-1deg] opacity-80" />
                        <blockquote className="font-handwriting text-2xl sm:text-3xl text-amber-100 leading-snug tracking-wide pt-3">
                          "{moment.note || phrase || 'Nota guardada en este rincón'}"
                        </blockquote>
                      </div>
                    )}

                    {/* FRASE DEL RECUERDO: Tipografía manuscrita y literaria */}
                    {mediaType !== 'note' && phrase && (
                      <div className="pl-4 border-l-2 border-[#d69542]/80 my-1">
                        <blockquote className="font-handwriting text-2xl sm:text-3xl text-[#fff8ed] leading-snug tracking-wide">
                          "{phrase}"
                        </blockquote>
                      </div>
                    )}

                    {/* METADATOS NOSTÁLGICOS: RINCÓN, AUTOR Y COMPAÑEROS */}
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-[#362b22] text-xs">
                      <div className="flex items-center gap-3 flex-wrap text-stone-300 font-serif-body italic">
                        {place && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#e5ba79] shrink-0" />
                            <span>{place}</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5 text-stone-300">
                          <span className="text-[#e5ba79] font-bold font-editorial not-italic">Autor:</span>
                          <span>{moment.author || 'Tú'}</span>
                        </span>

                        {moment.time && (
                          <span className="text-stone-400">
                            a las {moment.time}
                          </span>
                        )}
                      </div>

                      {people.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap ml-auto">
                          <Users className="w-3.5 h-3.5 text-[#e5ba79] shrink-0" />
                          <span className="font-handwriting text-base text-amber-200">
                            En compañía de:
                          </span>
                          {people.map((p, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-sm bg-[#faf5ea] text-[#24170c] font-editorial text-xs font-bold border border-[#d6c7b0] shadow-2xs"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer de la tarjeta: Controles discretos */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#362b22]/50 text-xs">
                      {onEditMoment && (
                        <button
                          type="button"
                          onClick={() => onEditMoment(moment)}
                          className="px-2.5 py-1 rounded-lg text-stone-400 hover:text-[#e5ba79] hover:bg-[#2c231c] transition-colors flex items-center gap-1 font-editorial"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      )}

                      {onDeleteMoment && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm('¿Desprender este recuerdo del álbum?')) {
                              await onDeleteMoment(moment.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors flex items-center gap-1 font-editorial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VISTA 2: RINCONES DEL CUADERNO (Lugares Anotados)
         ========================================================================= */}
      {activeTab === 'places' && (
        <div className="flex flex-col gap-4">
          <p className="font-serif-body text-xs sm:text-sm text-stone-300 italic">
            Anotaciones sobre cafés, miradores y rincones especiales que merecen ser recordados en {city.name}.
          </p>

          {cityPlaces.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#1e1915] border border-[#44362b] text-center flex flex-col items-center gap-3">
              <MapPin className="w-10 h-10 text-[#d69542]" />
              <h3 className="font-editorial text-xl font-bold text-[#fbf6ed]">
                Aún no has anotado rincones en {city.name}
              </h3>
              <p className="font-serif-body text-xs sm:text-sm text-stone-400 max-w-sm italic">
                Guarda ese restaurante inolvidable, una librería escondida o un mirador al atardecer.
              </p>
              <button
                type="button"
                onClick={onOpenAddPlace}
                className="mt-1 px-4 py-2 rounded-full bg-[#2c231c] hover:bg-[#382d24] text-[#e5ba79] font-editorial text-xs font-bold border border-[#4d3d2f] transition-all"
              >
                + Anotar primer rincón
              </button>
            </div>
          ) : (
            <div id="city-places-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cityPlaces.map((place) => (
                <div
                  key={place.id}
                  id={`place-card-${place.id}`}
                  onClick={() => onSelectPlace(place)}
                  className="group p-5 rounded-2xl bg-[#221c17] border border-[#44362b] shadow-lg hover:border-[#d69542]/60 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-xs px-2.5 py-0.5 rounded-sm bg-[#faf5ea] text-[#24170c] font-editorial font-bold border border-[#d6c7b0]">
                          {place.category}
                        </span>
                        {place.isFavorite && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#3e3022] text-[#e5ba79] font-serif border border-[#594432] flex items-center gap-1">
                            <Star className="w-3 h-3 fill-[#e5ba79] text-[#e5ba79]" />
                            Favorito
                          </span>
                        )}
                      </div>
                      <h3 className="font-editorial text-lg font-bold text-[#fbf6ed] truncate group-hover:text-[#e5ba79] transition-colors">
                        {place.name}
                      </h3>
                      {place.address && (
                        <p className="font-serif-body text-xs text-stone-400 truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#d69542] shrink-0" />
                          {place.address}
                        </p>
                      )}
                    </div>

                    {place.photos && place.photos[0] && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#44362b] shadow-sm">
                        <img
                          src={place.photos[0]}
                          alt={place.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                  </div>

                  {place.notes && (
                    <p className="font-handwriting text-base text-amber-200/90 line-clamp-2 pl-2 border-l border-[#d69542]/60">
                      "{place.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#362b22] text-xs">
                    <span className="font-editorial text-[#e5ba79] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Abrir rincón
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VISTA 3: VIAJES REALIZADOS (Cuaderno de bitácora, estancias y fechas)
         ========================================================================= */}
      {activeTab === 'trips' && (
        <div id="city-trips-view" className="flex flex-col gap-6 animate-fadeIn">
          {/* Ficha de la Estancia Principal */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#1e1813] border border-[#3e3126] shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#362b22] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#342920] border border-amber-800/40 text-amber-300 flex items-center justify-center text-lg shadow-inner">
                  🧭
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[#fbf6ed]">
                    Viaje a {city.name}
                  </h3>
                  <p className="font-serif-body text-xs text-stone-400 italic">
                    {country.name} · {formatDate(city.visitDate) || 'Fecha no especificada'}
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs font-editorial">
                1 estancia registrada
              </div>
            </div>

            {/* Reflexión del viaje */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-editorial text-[#e5ba79] uppercase tracking-wider">
                Impresiones de la estancia:
              </span>
              <p className="font-handwriting text-lg text-amber-200/90 leading-relaxed pl-3 border-l-2 border-[#d97706]/60">
                "{city.notes || 'El bullicio infinito de la ciudad, sus olores y sus noches estrelladas guardadas en la memoria.'}"
              </p>
            </div>

            {/* Resumen numérico íntimo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#14100c] border border-[#2e231a] flex flex-col">
                <span className="text-2xl font-editorial font-bold text-amber-400">
                  {cityMoments.length}
                </span>
                <span className="text-xs font-serif-body text-stone-400 italic">
                  Momentos vividos
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#14100c] border border-[#2e231a] flex flex-col">
                <span className="text-2xl font-editorial font-bold text-amber-400">
                  {cityPlaces.length}
                </span>
                <span className="text-xs font-serif-body text-stone-400 italic">
                  Rincones descubiertos
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#14100c] border border-[#2e231a] flex flex-col col-span-2 sm:col-span-1">
                <span className="text-sm font-editorial font-bold text-amber-200 truncate">
                  {city.visitDate ? formatDate(city.visitDate) : 'Primer viaje'}
                </span>
                <span className="text-xs font-serif-body text-stone-400 italic">
                  Fecha de llegada
                </span>
              </div>
            </div>
          </div>

          {/* Cronología de Momentos del Viaje */}
          {cityMoments.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#16120e] border border-[#30251c] flex flex-col gap-4">
              <h4 className="font-editorial text-sm font-bold text-[#fbf6ed] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Línea temporal de momentos en {city.name}</span>
              </h4>

              <div className="flex flex-col gap-3">
                {cityMoments.map((m, idx) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectSnapshot(m)}
                    className="p-3 rounded-xl bg-[#201914] hover:bg-[#282019] border border-[#3c2f24] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-amber-400/80 bg-amber-950/50 px-2 py-0.5 rounded-sm shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-editorial text-xs sm:text-sm text-stone-200 truncate">
                          {m.phrase || m.note || 'Momento guardado'}
                        </p>
                        <p className="text-[11px] font-serif-body text-stone-400 italic">
                          {formatDate(m.date)} {m.time ? `· ${m.time}` : ''}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-editorial text-[#e5ba79] shrink-0">
                      Ver →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
