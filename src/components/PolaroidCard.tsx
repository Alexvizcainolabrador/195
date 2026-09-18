import React, { useState } from 'react';
import {
  SnapshotRecord,
  getMomentMediaType,
  getMomentMediaUrl,
  getMomentPhrase,
  getMomentPlace,
  getMomentPeople,
} from '../types';
import { Volume2, Users, MapPin, Calendar, Play, Pause, Sparkles, Mic, Video } from 'lucide-react';

interface PolaroidCardProps {
  snapshot: SnapshotRecord;
  cityName: string;
  countryName?: string;
  index?: number;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Deterministic tilt between -2.0 and +2.0 degrees based on seed string.
 * This guarantees consistent physical placement across re-renders while giving
 * an organic scattered Polaroid box feel.
 */
export function getPolaroidRotation(seed: string | number, index: number = 0): number {
  const str = `${seed}-${index}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  // Produce a float from -2.0 to +2.0
  const normalized = ((Math.abs(hash) % 401) / 100) - 2.0;
  return Number(normalized.toFixed(1));
}

export const PolaroidCard: React.FC<PolaroidCardProps> = ({
  snapshot,
  cityName,
  countryName,
  index = 0,
  onClick,
  className = '',
  size = 'md',
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const rotation = getPolaroidRotation(snapshot.id, index);

  const mediaType = getMomentMediaType(snapshot);
  const mediaUrl = getMomentMediaUrl(snapshot);
  const phrase = getMomentPhrase(snapshot);
  const place = getMomentPlace(snapshot);
  const people = getMomentPeople(snapshot);

  // Format date nicely (e.g., "14 oct 2024" or "14/10/2024")
  const formatPolaroidDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (y && m && d) {
        return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleAudioQuickPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audioUrl = snapshot.audioUrl || (mediaType === 'audio' ? mediaUrl : null);
    if (!audioUrl) return;

    // Quick toggle sound preview
    const audioEl = document.getElementById(`audio-preview-${snapshot.id}`) as HTMLAudioElement;
    if (audioEl) {
      if (isPlayingAudio) {
        audioEl.pause();
        setIsPlayingAudio(false);
      } else {
        audioEl.currentTime = 0;
        audioEl.play().then(() => setIsPlayingAudio(true)).catch(() => setIsPlayingAudio(false));
      }
    }
  };

  const hasAudio = !!(snapshot.audioUrl || (mediaType === 'audio' && mediaUrl));

  return (
    <div
      id={`polaroid-${snapshot.id}`}
      onClick={onClick}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
      className={`group relative select-none cursor-pointer transition-all duration-300 ease-out
        hover:scale-[1.03] hover:-translate-y-2 hover:rotate-0 hover:z-30
        active:scale-[0.98] active:translate-y-0
        ${className}
      `}
    >
      {/* Hidden audio element for preview */}
      {hasAudio && (
        <audio
          id={`audio-preview-${snapshot.id}`}
          src={snapshot.audioUrl || mediaUrl}
          onEnded={() => setIsPlayingAudio(false)}
          className="hidden"
        />
      )}

      {/* Physical Polaroid Body */}
      <div
        className="relative polaroid-paper rounded-xs sm:rounded-sm border border-stone-200/80
          shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35),0_12px_28px_-6px_rgba(0,0,0,0.45),0_1px_3px_rgba(0,0,0,0.2)]
          group-hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.55),0_24px_54px_-8px_rgba(0,0,0,0.45),0_4px_10px_rgba(0,0,0,0.2)]
          p-3 sm:p-4 pb-6 sm:pb-8 flex flex-col transition-shadow duration-300"
      >
        {/* Subtle decorative washi tape at top */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-amber-100/70 backdrop-blur-xs border border-amber-200/50 shadow-xs rotate-[-1deg] opacity-75 pointer-events-none group-hover:opacity-90 transition-opacity" />

        {/* Media Frame: Photo, Audio capsule, or Video */}
        <div className="relative aspect-square w-full overflow-hidden bg-stone-900 border border-black/15 shadow-inner flex items-center justify-center">
          {mediaType === 'photo' && mediaUrl ? (
            <img
              src={mediaUrl}
              alt={phrase || cityName}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : mediaType === 'video' && mediaUrl ? (
            <div className="w-full h-full relative bg-stone-950 flex items-center justify-center">
              <video src={mediaUrl} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 ml-0.5 fill-slate-950" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 flex flex-col items-center justify-center p-4 text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Mic className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-amber-300 font-bold uppercase tracking-wider">
                Momento Sonoro
              </span>
            </div>
          )}

          {/* Quick Audio Stamp on photo (if audio exists) */}
          {hasAudio && (
            <button
              type="button"
              onClick={handleAudioQuickPlay}
              title={isPlayingAudio ? 'Pausar audio' : 'Escuchar audio grabado'}
              className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-full bg-stone-900/80 hover:bg-stone-950 text-amber-300 backdrop-blur-md border border-amber-400/40 text-[10px] font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="font-mono">Pausar</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  <span>{snapshot.audioDuration ? `${snapshot.audioDuration}s` : 'Voz'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Zona Inferior: Frase, Ciudad, Fecha & Personas */}
        <div className="pt-3 sm:pt-4 flex flex-col justify-between gap-1.5 text-stone-900 min-h-[85px] sm:min-h-[96px]">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="font-handwriting text-xl sm:text-2xl font-bold leading-none text-stone-950 tracking-wide truncate max-w-[85%]">
              {phrase || snapshot.title || 'Momento inolvidable'}
            </h4>

            {hasAudio && (
              <span className="shrink-0 text-[11px] font-bold text-amber-800/90 flex items-center gap-0.5 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-600/30">
                <Volume2 className="w-3 h-3 text-amber-700" />
                <span className="hidden sm:inline">Audio</span>
              </span>
            )}
          </div>

          {place && (
            <span className="text-[11px] text-stone-600 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-stone-500" />
              <span>{place}</span>
            </span>
          )}

          {/* Chin Footer: Ciudad, Fecha & Personas */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-stone-600">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <span className="font-bold text-stone-900 flex items-center gap-0.5 truncate">
                {cityName}
              </span>
              <span className="text-stone-300">•</span>
              <span className="font-mono text-[10px] sm:text-[11px] text-stone-500 shrink-0">
                {formatPolaroidDate(snapshot.date)}
              </span>
            </div>

            {people.length > 0 ? (
              <div
                className="flex items-center gap-1 shrink-0 font-handwriting text-sm sm:text-base font-bold text-stone-800"
                title={`Con: ${people.join(', ')}`}
              >
                <Users className="w-3 h-3 text-stone-500" />
                <span className="truncate max-w-[100px] sm:max-w-[120px]">
                  {people.join(', ')}
                </span>
              </div>
            ) : (
              <span className="font-handwriting text-stone-400 text-xs sm:text-sm">
                en solitario
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
