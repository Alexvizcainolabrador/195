import React, { useState, useRef, useEffect } from 'react';
import {
  CountryRecord,
  CityRecord,
  SnapshotRecord,
  MomentRecord,
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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Users,
  Edit3,
  Trash2,
  Sparkles,
  Maximize2,
  X,
  Share2,
  Mic,
  Disc,
} from 'lucide-react';

interface ScreenSnapshotDetailProps {
  country: CountryRecord;
  city: CityRecord;
  snapshot: SnapshotRecord;
  allCitySnapshots?: SnapshotRecord[];
  onBack: () => void;
  onSelectSnapshot?: (snapshot: SnapshotRecord) => void;
  onEditSnapshot: (snapshot: SnapshotRecord) => void;
  onDeleteSnapshot: (snapshotId: string) => Promise<void>;
  onReliveAtMoment?: (moment: MomentRecord) => void;
}

export const ScreenSnapshotDetail: React.FC<ScreenSnapshotDetailProps> = ({
  country,
  city,
  snapshot,
  allCitySnapshots = [],
  onBack,
  onSelectSnapshot,
  onEditSnapshot,
  onDeleteSnapshot,
  onReliveAtMoment,
}) => {
  const mediaType = getMomentMediaType(snapshot);
  const mediaUrl = getMomentMediaUrl(snapshot);
  const phrase = getMomentPhrase(snapshot);
  const place = getMomentPlace(snapshot);
  const people = getMomentPeople(snapshot);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(snapshot.audioDuration || 15);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatFullDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (y && m && d) {
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    setIsPlaying(false);
    setAudioProgress(0);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [snapshot.id]);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || snapshot.audioDuration || 15;
    setCurrentTime(cur);
    if (dur > 0) {
      setDuration(dur);
      setAudioProgress((cur / dur) * 100);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.min(Math.max(clickX / width, 0), 1);
    const dur = audioRef.current.duration || duration;
    audioRef.current.currentTime = percent * dur;
    setAudioProgress(percent * 100);
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleDelete = async () => {
    if (window.confirm('¿Desprender este recuerdo del álbum? Esta acción no se puede deshacer.')) {
      await onDeleteSnapshot(snapshot.id);
      onBack();
    }
  };

  const handleShare = () => {
    const textToCopy = phrase
      ? `"${phrase}" — ${place ? place + ', ' : ''}${city.name} (${snapshot.date})`
      : `Recuerdo en ${city.name} (${snapshot.date})`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div id="screen-snapshot-detail" className="flex flex-col gap-6 pb-28 text-stone-100 animate-fadeIn max-w-4xl mx-auto w-full">
      {/* Elemento de audio oculto */}
      {mediaType === 'audio' && mediaUrl && (
        <audio
          ref={audioRef}
          src={mediaUrl}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Top Header Bar estilo Diario */}
      <div className="flex items-center justify-between gap-3">
        <button
          id="btn-back-to-city-timeline"
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#27201b] border border-[#3e3126] font-editorial text-xs sm:text-sm text-stone-300 hover:text-white hover:bg-[#342b23] transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#e5ba79]" />
          <span>Volver al cuaderno de {city.name}</span>
        </button>

        <div className="flex items-center gap-2">
          {onReliveAtMoment && (
            <button
              type="button"
              onClick={() => onReliveAtMoment(snapshot)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#d69542] to-[#b8762d] text-[#24170c] font-editorial text-xs font-bold shadow-md hover:scale-105 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Revivir aquí</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-stone-300 hover:text-[#e5ba79] bg-[#27201b] border border-[#3e3126] rounded-xl hover:bg-[#342b23] transition-colors shadow-xs"
            title="Copiar texto del recuerdo"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            id="btn-edit-snapshot-detail"
            type="button"
            onClick={() => onEditSnapshot(snapshot)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-editorial font-bold text-[#e5ba79] bg-[#33261c] hover:bg-[#423326] border border-[#523e2e] rounded-xl transition-all shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition-all shadow-xs"
            title="Eliminar este recuerdo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {copiedToast && (
        <div className="self-center px-4 py-1.5 rounded-full bg-[#d69542] text-[#24170c] font-editorial text-xs font-bold shadow-lg animate-bounce">
          ✓ Cita del recuerdo copiada
        </div>
      )}

      {/* =========================================================================
          TARJETA POSTAL FÍSICA: Foto Revelada / Casete + Reverso de la Postal
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: La Fotografía Revelada, Cinta o Rollo de Película */}
        <div className="lg:col-span-7 flex flex-col items-center w-full">
          <div className="relative w-full rounded-3xl overflow-hidden bg-[#fdfaf4] p-3 sm:p-4 shadow-2xl border border-[#dfd6c7]">
            {/* Washi tape on top */}
            <div className="w-24 h-5 washi-tape-amber rounded-xs absolute -top-2.5 left-1/2 -translate-x-1/2 rotate-[-1deg] z-20 opacity-85" />

            {/* 1. PHOTO */}
            {mediaType === 'photo' && mediaUrl && (
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#16120e] group shadow-inner">
                <img
                  src={mediaUrl}
                  alt={phrase || 'Momento'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95 contrast-105"
                />
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all opacity-80 hover:opacity-100 shadow-md"
                  title="Ampliar fotografía a pantalla completa"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 2. AUDIO CASSETTE */}
            {mediaType === 'audio' && mediaUrl && (
              <div className="p-8 sm:p-10 rounded-2xl flex flex-col items-center justify-center bg-[#1e1814] gap-6 border-2 border-[#544131]">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#d69542] to-[#8f5a20] text-[#24170c] flex items-center justify-center shadow-lg">
                  {isPlaying ? (
                    <Disc className="w-10 h-10 animate-spin text-[#24170c]" />
                  ) : (
                    <Mic className="w-10 h-10 text-[#24170c]" />
                  )}
                </div>

                <div className="text-center">
                  <span className="font-editorial text-sm uppercase font-bold tracking-widest text-[#e5ba79]">
                    Grabación Sonora de {city.name}
                  </span>
                  <span className="font-serif-body text-xs text-stone-400 block mt-1 italic">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Scrubber & Controls */}
                <div className="w-full flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-[#e3a857] to-[#d69542] text-[#24170c] flex items-center justify-center shrink-0 shadow-md hover:scale-105 transition-all"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  <div
                    onClick={handleSeek}
                    className="flex-1 h-3 rounded-full bg-[#140f0c] border border-[#3e3025] cursor-pointer relative overflow-hidden"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-[#d69542] to-[#ffd89b] rounded-full"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="p-2.5 rounded-xl bg-[#2a211a] text-stone-400 hover:text-white"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* 3. VIDEO CORTO */}
            {mediaType === 'video' && mediaUrl && (
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black border-2 border-[#544131]">
                <video
                  src={mediaUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Reverso de la Postal (Nota manuscrita, sello, personas) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="p-6 sm:p-7 rounded-3xl bg-[#241d18] border border-[#44362b] shadow-xl flex flex-col gap-4 relative">
            {/* Header de la postal: Sello postal */}
            <div className="flex items-start justify-between border-b border-[#362b22] pb-4">
              <div>
                <span className="font-editorial text-xs font-bold uppercase tracking-wider text-[#e5ba79] block">
                  {country.name} · {city.name}
                </span>
                <span className="font-serif-body text-xs text-stone-400 italic">
                  {formatFullDate(snapshot.date)}
                </span>
              </div>

              {/* Sello postal auténtico */}
              <div className="px-3 py-1 rounded-sm bg-[#faf5ea] text-[#24170c] border border-[#d6c7b0] shadow-xs text-right rotate-2">
                <span className="font-editorial font-bold text-xs block leading-tight">POSTE</span>
                <span className="font-mono text-[10px] text-stone-600 block">{country.code}</span>
              </div>
            </div>

            {/* FRASE DEL RECUERDO: Protagonista absoluta */}
            {phrase ? (
              <div className="my-2">
                <span className="font-handwriting text-base text-amber-200/90 block mb-1">
                  Anotado en el momento:
                </span>
                <blockquote className="font-handwriting text-2xl sm:text-3xl text-[#fff8ed] leading-snug tracking-wide pl-3 border-l-2 border-[#d69542]/80">
                  "{phrase}"
                </blockquote>
              </div>
            ) : (
              <p className="font-serif-body text-xs text-stone-500 italic">
                (Este momento fue atesorado sin palabras)
              </p>
            )}

            {/* LUGAR DENTRO DE LA CIUDAD */}
            {place && (
              <div className="flex items-center gap-2 pt-2 border-t border-[#362b22] text-sm text-stone-200 font-serif-body italic">
                <MapPin className="w-4 h-4 text-[#e5ba79] shrink-0" />
                <span className="font-semibold text-[#fbf6ed]">{place}</span>
              </div>
            )}

            {/* PERSONAS CON LAS QUE VIVISTE EL MOMENTO */}
            {people.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#362b22]">
                <span className="font-handwriting text-base text-amber-200/90 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#e5ba79]" />
                  <span>Compañeros de camino:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {people.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-sm bg-[#faf5ea] text-[#24170c] font-editorial text-xs font-bold border border-[#d6c7b0] shadow-xs"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox para fotos */}
      {isLightboxOpen && mediaType === 'photo' && mediaUrl && (
        <div
          id="photo-lightbox-backdrop"
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn cursor-pointer"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={mediaUrl}
            alt={phrase || 'Momento'}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
