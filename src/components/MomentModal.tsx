import React, { useState, useRef, useEffect } from 'react';
import {
  MomentRecord,
  MomentMediaType,
  CityRecord,
  CountryRecord,
  getMomentMediaType,
  getMomentMediaUrl,
  getMomentPhrase,
  getMomentAuthor,
} from '../types';
import { compressImageFile } from './Modals';
import {
  X,
  Camera,
  Mic,
  Video,
  FileText,
  Play,
  Pause,
  Upload,
  Calendar,
  Clock,
  User as UserIcon,
  MapPin,
  Sparkles,
  Square,
  Volume2,
  Check,
  Loader2,
} from 'lucide-react';

interface MomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (moment: MomentRecord) => Promise<void>;
  city?: CityRecord | null;
  country?: CountryRecord | null;
  allCities?: CityRecord[];
  allCountries?: CountryRecord[];
  existingMoment?: MomentRecord | null;
  userId: string;
  defaultAuthorName?: string;
  onAddNewCityCountry?: (cityName: string, countryName: string) => Promise<{ cityId: string; countryId: string }>;
}

// Nostalgic travel presets for instant memories
const PHOTO_PRESETS = [
  {
    name: 'Atardecer en la costa',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Callejón tradicional de noche',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Taberna íntima y cálida',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Mirador de montaña en calma',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  },
];

const VIDEO_PRESETS = [
  {
    name: 'Olas de mar en la orilla',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4',
    duration: 12,
  },
  {
    name: 'Brisa entre las copas de los árboles',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
    duration: 10,
  },
  {
    name: 'Luces nocturnas de la ciudad',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
    duration: 14,
  },
];

const ATMOSPHERE_PRESETS = [
  {
    name: 'Brisa de mar & olas',
    url: 'https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3',
    duration: 18,
    icon: '🌊',
  },
  {
    name: 'Murmullo cálido de taberna',
    url: 'https://assets.mixkit.co/active_storage/sfx/386/386-preview.mp3',
    duration: 14,
    icon: '☕',
  },
  {
    name: 'Campana de templo & serenidad',
    url: 'https://assets.mixkit.co/active_storage/sfx/1247/1247-preview.mp3',
    duration: 22,
    icon: '🔔',
  },
  {
    name: 'Lluvia suave en adoquines',
    url: 'https://assets.mixkit.co/active_storage/sfx/1248/1248-preview.mp3',
    duration: 20,
    icon: '🌧️',
  },
];

export const MomentModal: React.FC<MomentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  city,
  country,
  allCities = [],
  allCountries = [],
  existingMoment,
  userId,
  defaultAuthorName = 'Alejandro Labrador',
  onAddNewCityCountry,
}) => {
  if (!isOpen) return null;

  // Selected Media Type: photo | video | audio | note
  const initialMediaType: MomentMediaType = existingMoment
    ? getMomentMediaType(existingMoment)
    : 'photo';
  const [mediaType, setMediaType] = useState<MomentMediaType>(initialMediaType);

  // Media URL & duration
  const [mediaUrl, setMediaUrl] = useState<string>(
    existingMoment ? getMomentMediaUrl(existingMoment) : PHOTO_PRESETS[0].url
  );
  const [audioDuration, setAudioDuration] = useState<number>(existingMoment?.audioDuration || 0);
  const [videoDuration, setVideoDuration] = useState<number>(existingMoment?.videoDuration || 0);

  // Sub-tabs for Photo, Video, Audio
  const [photoSubTab, setPhotoSubTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [videoSubTab, setVideoSubTab] = useState<'upload' | 'presets' | 'url'>('presets');
  const [audioSubTab, setAudioSubTab] = useState<'record' | 'presets' | 'upload' | 'url'>('record');
  const [customInputUrl, setCustomInputUrl] = useState<string>('');

  // 1. Contenido textual: Frase / Nota del Momento
  const [note, setNote] = useState<string>(
    existingMoment ? (existingMoment.note || getMomentPhrase(existingMoment)) : ''
  );
  const [phrase, setPhrase] = useState<string>(
    existingMoment ? getMomentPhrase(existingMoment) : ''
  );

  // 2. Automáticos: Fecha y Hora
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().slice(0, 5); // HH:mm

  const [date, setDate] = useState<string>(existingMoment?.date || defaultDate);
  const [time, setTime] = useState<string>(existingMoment?.time || defaultTime);

  // 3. Automáticos: Autor
  const [author, setAuthor] = useState<string>(
    existingMoment ? getMomentAuthor(existingMoment) : defaultAuthorName
  );

  // 4. Automáticos: Ciudad y País
  const [selectedCityId, setSelectedCityId] = useState<string>(
    city?.id || existingMoment?.cityId || (allCities.length > 0 ? allCities[0].id : '')
  );
  const [selectedCountryId, setSelectedCountryId] = useState<string>(
    country?.id || existingMoment?.countryId || (allCountries.length > 0 ? allCountries[0].id : '')
  );

  // New place input inline if no city exists
  const [newCityName, setNewCityName] = useState<string>('');
  const [newCountryName, setNewCountryName] = useState<string>('');

  // Audio recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (audioPreviewRef.current) audioPreviewRef.current.pause();
    };
  }, []);

  const handleSelectMediaType = (type: MomentMediaType) => {
    setMediaType(type);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setAudioPreviewPlaying(false);
    }
    if (type === 'photo' && (!mediaUrl || mediaUrl.includes('.mp4') || mediaUrl.includes('.mp3'))) {
      setMediaUrl(PHOTO_PRESETS[0].url);
    } else if (type === 'video' && (!mediaUrl || !mediaUrl.includes('.mp4'))) {
      setMediaUrl(VIDEO_PRESETS[0].url);
      setVideoDuration(VIDEO_PRESETS[0].duration);
    } else if (type === 'audio' && (!mediaUrl || !mediaUrl.includes('.mp3') && !mediaUrl.startsWith('data:audio'))) {
      setMediaUrl(ATMOSPHERE_PRESETS[0].url);
      setAudioDuration(ATMOSPHERE_PRESETS[0].duration);
    }
  };

  // Audio Recording handler
  const handleStartRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setMediaUrl(base64);
          setAudioDuration(recordingSeconds || 5);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('No se pudo acceder al micrófono para grabar la nota de audio.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const toggleAudioPreview = (url: string) => {
    if (audioPreviewPlaying) {
      if (audioPreviewRef.current) audioPreviewRef.current.pause();
      setAudioPreviewPlaying(false);
    } else {
      if (audioPreviewRef.current) audioPreviewRef.current.pause();
      const audio = new Audio(url);
      audioPreviewRef.current = audio;
      audio.onended = () => setAudioPreviewPlaying(false);
      audio.play().catch(() => {});
      setAudioPreviewPlaying(true);
    }
  };

  // Handle Photo file upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setMediaUrl(compressed);
    } catch (err) {
      console.error(err);
      alert('Error al procesar la fotografía.');
    }
  };

  // Handle Video file upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert('El vídeo no debe superar los 25MB para garantizar fluidez.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setVideoDuration(15);
    };
    reader.readAsDataURL(file);
  };

  // Handle Audio file upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(reader.result as string);
      setAudioDuration(15);
    };
    reader.readAsDataURL(file);
  };

  // Resolved Location Names
  const resolvedCity = allCities.find((c) => c.id === selectedCityId) || city;
  const resolvedCountry = allCountries.find((c) => c.id === (resolvedCity?.countryId || selectedCountryId)) || country;

  const currentCityName = resolvedCity?.name || newCityName || 'Lugar del viaje';
  const currentCountryName = resolvedCountry?.name || newCountryName || 'Mundo';

  // AI Suggestion state & handler (Gemini Server-Side)
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiSuggest = async () => {
    if (!mediaUrl || isAiGenerating) return;
    setIsAiGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/gemini/suggest-moment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl,
          currentPhrase: phrase,
          cityName: currentCityName,
          countryName: currentCountryName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.phrase && typeof data.phrase === 'string') {
        setPhrase(data.phrase);
      }
      if (data.note && typeof data.note === 'string') {
        setNote(data.note);
      }
    } catch (err) {
      console.warn('Silent Gemini suggestion error:', err);
      setAiError('No se pudo generar la sugerencia. Puedes escribirla tú mismo.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate main content
    if (mediaType === 'note' && !note.trim() && !phrase.trim()) {
      alert('Por favor escribe la nota o recuerdo del momento.');
      return;
    }
    if ((mediaType === 'photo' || mediaType === 'video' || mediaType === 'audio') && !mediaUrl) {
      alert(`Por favor añade o selecciona el contenido de ${mediaType}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCityId = selectedCityId || city?.id || '';
      let finalCountryId = selectedCountryId || country?.id || '';

      // If user typed a new city/country inline
      if ((!finalCityId || !finalCountryId) && onAddNewCityCountry && newCityName.trim()) {
        const created = await onAddNewCityCountry(newCityName.trim(), newCountryName.trim() || 'Destino');
        finalCityId = created.cityId;
        finalCountryId = created.countryId;
      }

      const momentData: MomentRecord = {
        id: existingMoment ? existingMoment.id : `moment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        countryId: finalCountryId || 'unknown-country',
        cityId: finalCityId || 'unknown-city',
        countryName: currentCountryName,
        cityName: currentCityName,
        date: date || defaultDate,
        time: time || defaultTime,
        author: author.trim() || defaultAuthorName,
        mediaType,
        mediaUrl: mediaType === 'note' ? '' : mediaUrl,
        audioDuration: mediaType === 'audio' ? audioDuration : undefined,
        videoDuration: mediaType === 'video' ? videoDuration : undefined,
        note: note.trim() || phrase.trim(),
        phrase: phrase.trim() || note.trim().slice(0, 50),
        title: phrase.trim().slice(0, 45) || note.trim().slice(0, 45) || `Momento en ${currentCityName}`,
        photoUrl: mediaType === 'photo' ? mediaUrl : '',
        audioUrl: mediaType === 'audio' ? mediaUrl : '',
      };

      await onSave(momentData);
      onClose();
    } catch (err) {
      console.error('Error saving moment:', err);
      alert('Error al guardar el momento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="moment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="moment-modal-container"
        className="relative w-full max-w-2xl bg-[#171310] border border-[#3e3126] rounded-3xl shadow-2xl overflow-hidden my-auto text-stone-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#362b22] bg-[#201a15]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#c8883b] to-[#965c20] text-[#fff8ed] flex items-center justify-center shadow-md border border-[#e5ba79]/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-[#fbf6ed]">
                {existingMoment ? 'Editar Momento' : 'Nuevo Momento'}
              </h2>
              <p className="font-serif-body text-xs text-amber-200/80 italic">
                {currentCityName}, {currentCountryName} · Recuerdos para el futuro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-100 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
          {/* 1. SELECCIÓN DE CONTENIDO: Foto | Vídeo corto | Audio | Nota */}
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-editorial font-bold text-[#e5ba79] tracking-wider">
              ¿Qué contiene este Momento?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Foto */}
              <button
                type="button"
                onClick={() => handleSelectMediaType('photo')}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-xs font-bold font-editorial ${
                  mediaType === 'photo'
                    ? 'bg-[#3b2b1d] border-[#d69542] text-[#fbf6ed] shadow-md'
                    : 'bg-[#211a15] border-[#3a2e24] text-stone-400 hover:bg-[#28201a] hover:text-stone-200'
                }`}
              >
                <Camera className={`w-5 h-5 ${mediaType === 'photo' ? 'text-[#e5ba79]' : ''}`} />
                <span>Foto</span>
              </button>

              {/* Vídeo corto */}
              <button
                type="button"
                onClick={() => handleSelectMediaType('video')}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-xs font-bold font-editorial ${
                  mediaType === 'video'
                    ? 'bg-[#3b2b1d] border-[#d69542] text-[#fbf6ed] shadow-md'
                    : 'bg-[#211a15] border-[#3a2e24] text-stone-400 hover:bg-[#28201a] hover:text-stone-200'
                }`}
              >
                <Video className={`w-5 h-5 ${mediaType === 'video' ? 'text-[#e5ba79]' : ''}`} />
                <span>Vídeo corto</span>
              </button>

              {/* Audio */}
              <button
                type="button"
                onClick={() => handleSelectMediaType('audio')}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-xs font-bold font-editorial ${
                  mediaType === 'audio'
                    ? 'bg-[#3b2b1d] border-[#d69542] text-[#fbf6ed] shadow-md'
                    : 'bg-[#211a15] border-[#3a2e24] text-stone-400 hover:bg-[#28201a] hover:text-stone-200'
                }`}
              >
                <Mic className={`w-5 h-5 ${mediaType === 'audio' ? 'text-[#e5ba79]' : ''}`} />
                <span>Audio</span>
              </button>

              {/* Nota */}
              <button
                type="button"
                onClick={() => handleSelectMediaType('note')}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-xs font-bold font-editorial ${
                  mediaType === 'note'
                    ? 'bg-[#3b2b1d] border-[#d69542] text-[#fbf6ed] shadow-md'
                    : 'bg-[#211a15] border-[#3a2e24] text-stone-400 hover:bg-[#28201a] hover:text-stone-200'
                }`}
              >
                <FileText className={`w-5 h-5 ${mediaType === 'note' ? 'text-[#e5ba79]' : ''}`} />
                <span>Nota</span>
              </button>
            </div>
          </div>

          {/* 2. AREA DE MEDIO SEGÚN EL TIPO */}
          <div className="p-4 rounded-2xl bg-[#1e1813] border border-[#3e3126]">
            {/* TIPO: FOTO */}
            {mediaType === 'photo' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-[#362b22] pb-3">
                  <button
                    type="button"
                    onClick={() => setPhotoSubTab('upload')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      photoSubTab === 'upload'
                        ? 'bg-[#e5ba79] text-[#24170c]'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Subir foto / Cámara
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoSubTab('presets')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      photoSubTab === 'presets'
                        ? 'bg-[#e5ba79] text-[#24170c]'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Postales de ejemplo
                  </button>
                </div>

                {photoSubTab === 'upload' && (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#544133] rounded-2xl cursor-pointer hover:border-[#d69542] transition-colors bg-[#241c16]">
                    <Upload className="w-8 h-8 text-[#e5ba79] mb-2" />
                    <span className="font-editorial text-sm font-bold text-[#fbf6ed]">
                      Elige una fotografía de tu viaje
                    </span>
                    <span className="text-xs text-stone-400 mt-1">
                      JPG, PNG, WebP · Directo de tu cámara o carrete
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {photoSubTab === 'presets' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PHOTO_PRESETS.map((pst, idx) => (
                      <div
                        key={idx}
                        onClick={() => setMediaUrl(pst.url)}
                        className={`group relative rounded-xl overflow-hidden aspect-4/3 cursor-pointer border-2 transition-all ${
                          mediaUrl === pst.url ? 'border-[#e5ba79] scale-105 shadow-md' : 'border-[#44362b] opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={pst.url} alt={pst.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/75 text-[10px] text-stone-200 text-center truncate">
                          {pst.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previsualización Foto */}
                {mediaUrl && (
                  <div className="relative rounded-xl overflow-hidden max-h-48 flex items-center justify-center bg-black/40 border border-[#44362b]">
                    <img src={mediaUrl} alt="Vista previa" className="max-h-48 object-cover w-full" />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] text-[#e5ba79] font-bold">
                      Fotografía lista
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TIPO: VÍDEO CORTO */}
            {mediaType === 'video' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-[#362b22] pb-3">
                  <button
                    type="button"
                    onClick={() => setVideoSubTab('presets')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      videoSubTab === 'presets'
                        ? 'bg-[#e5ba79] text-[#24170c]'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Vídeos de muestra
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSubTab('upload')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      videoSubTab === 'upload'
                        ? 'bg-[#e5ba79] text-[#24170c]'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Subir mi vídeo
                  </button>
                </div>

                {videoSubTab === 'upload' && (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#544133] rounded-2xl cursor-pointer hover:border-[#d69542] transition-colors bg-[#241c16]">
                    <Upload className="w-8 h-8 text-[#e5ba79] mb-2" />
                    <span className="font-editorial text-sm font-bold text-[#fbf6ed]">
                      Elige un vídeo corto
                    </span>
                    <span className="text-xs text-stone-400 mt-1">
                      MP4, WebM (máx. 25MB)
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {videoSubTab === 'presets' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {VIDEO_PRESETS.map((v, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMediaUrl(v.url);
                          setVideoDuration(v.duration);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          mediaUrl === v.url
                            ? 'bg-[#3b2b1d] border-[#e5ba79] text-[#fbf6ed]'
                            : 'bg-[#241c16] border-[#44362b] text-stone-300 hover:bg-[#2b221b]'
                        }`}
                      >
                        <span className="text-xs font-bold font-editorial">{v.name}</span>
                        <span className="text-[10px] text-stone-400">{v.duration}s de atmósfera</span>
                      </button>
                    ))}
                  </div>
                )}

                {mediaUrl && (
                  <div className="relative rounded-xl overflow-hidden max-h-48 bg-black/60 border border-[#44362b] flex items-center justify-center">
                    <video src={mediaUrl} className="max-h-48 w-full object-cover" controls autoPlay loop muted />
                  </div>
                )}
              </div>
            )}

            {/* TIPO: AUDIO */}
            {mediaType === 'audio' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-[#362b22] pb-3">
                  <button
                    type="button"
                    onClick={() => setAudioSubTab('record')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      audioSubTab === 'record'
                        ? 'bg-[#e5ba79] text-[#24170c]'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Grabar con micrófono
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioSubTab('presets')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      audioSubTab === 'presets'
                        ? 'bg-[#e5ba79] text-[#24170c]'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Sonidos del viaje
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioSubTab('upload')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      audioSubTab === 'upload'
                        ? 'bg-[#e5ba79] text-[#24170c]'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Subir audio
                  </button>
                </div>

                {audioSubTab === 'record' && (
                  <div className="flex flex-col items-center justify-center p-6 bg-[#241c16] rounded-2xl border border-[#44362b] gap-3">
                    {isRecording ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-rose-600/30 border border-rose-500 flex items-center justify-center animate-pulse text-rose-300">
                          <Mic className="w-8 h-8" />
                        </div>
                        <span className="font-editorial text-lg font-bold text-rose-300">
                          Grabando: {recordingSeconds}s
                        </span>
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Finalizar grabación</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <button
                          type="button"
                          onClick={handleStartRecording}
                          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#b8762d] to-[#f1c27d] text-[#24170c] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                        >
                          <Mic className="w-6 h-6" />
                        </button>
                        <span className="font-editorial text-xs font-bold text-[#fbf6ed]">
                          Pulsa para grabar tu voz o el sonido ambiente
                        </span>
                        <span className="text-[11px] text-stone-400 italic">
                          El murmullo de una plaza, la lluvia, una risa o tu pensamiento
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {audioSubTab === 'presets' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ATMOSPHERE_PRESETS.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setMediaUrl(item.url);
                          setAudioDuration(item.duration);
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          mediaUrl === item.url
                            ? 'bg-[#3b2b1d] border-[#e5ba79] text-[#fbf6ed]'
                            : 'bg-[#241c16] border-[#44362b] text-stone-300 hover:bg-[#2b221b]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl">{item.icon}</span>
                          <div className="truncate">
                            <span className="text-xs font-bold block truncate font-editorial">{item.name}</span>
                            <span className="text-[10px] text-stone-400">{item.duration}s</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAudioPreview(item.url);
                          }}
                          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 ml-2 shrink-0"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {audioSubTab === 'upload' && (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#544133] rounded-2xl cursor-pointer hover:border-[#d69542] transition-colors bg-[#241c16]">
                    <Upload className="w-8 h-8 text-[#e5ba79] mb-2" />
                    <span className="font-editorial text-sm font-bold text-[#fbf6ed]">
                      Elige un archivo de audio (MP3, WAV, M4A)
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {mediaUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#2b221b] border border-[#524030]">
                    <div className="flex items-center gap-2 text-xs text-[#e5ba79] font-bold">
                      <Volume2 className="w-4 h-4" />
                      <span>Audio preparado ({audioDuration || 10}s)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAudioPreview(mediaUrl)}
                      className="px-3 py-1 rounded-full bg-[#e5ba79] text-[#24170c] text-xs font-bold flex items-center gap-1"
                    >
                      {audioPreviewPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{audioPreviewPlaying ? 'Pausar' : 'Escuchar'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TIPO: NOTA ÍNTIMA */}
            {mediaType === 'note' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-editorial font-bold text-[#e5ba79]">
                  <span>Página de Cuaderno de Viaje</span>
                  <span className="text-stone-400 font-normal italic">
                    La nota será el protagonista visual del momento
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Escribe lo que sentiste, una conversación, un aroma o ese pensamiento que no quieres olvidar nunca..."
                  className="w-full p-4 rounded-xl bg-[#261e18] border border-[#503d2e] text-amber-100 placeholder:text-stone-500 text-sm font-serif-body italic leading-relaxed focus:outline-none focus:border-[#d69542]"
                />
              </div>
            )}
          </div>

          {/* SECCIÓN TEXTUAL PARA FOTOS: Frase con botón Sugerir con IA + Descripción / Nota */}
          {mediaType === 'photo' && (
            <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-[#1c1611] border border-[#3e3126]">
              {/* Frase corta con botón Sugerir con IA */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label
                    htmlFor="input-moment-phrase"
                    className="text-xs uppercase font-editorial font-bold text-[#e5ba79] tracking-wider flex items-center gap-1.5"
                  >
                    <span>Frase del instante</span>
                    <span className="text-[10px] text-stone-400 font-mono font-normal">
                      ({phrase.length}/60)
                    </span>
                  </label>

                  {/* Botón Sugerir con IA */}
                  <button
                    id="btn-ai-suggest-phrase"
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={isAiGenerating || !mediaUrl}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-editorial font-bold transition-all border ${
                      isAiGenerating
                        ? 'bg-amber-950/60 border-amber-800 text-amber-300 cursor-wait'
                        : 'bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-[#24170c] border-[#fde68a] shadow-sm hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none'
                    }`}
                    title="Sugerir frase y nota evocadora con IA a partir de esta foto"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#24170c]" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 fill-[#24170c]" />
                        <span>Sugerir con IA</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  id="input-moment-phrase"
                  type="text"
                  maxLength={60}
                  value={phrase}
                  onChange={(e) => {
                    setPhrase(e.target.value);
                    if (aiError) setAiError(null);
                  }}
                  placeholder="«La luz dorada de la tarde sobre los tejados...»"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#14100c] border border-[#3e3126] text-sm text-stone-100 placeholder:text-stone-500 font-serif-body italic focus:outline-none focus:border-[#d69542]"
                />

                {aiError && (
                  <p className="text-xs font-serif-body text-amber-300/90 italic animate-fadeIn">
                    {aiError}
                  </p>
                )}
              </div>

              {/* Descripción breve / nota íntima (editable en todo momento) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="input-moment-note"
                  className="text-xs uppercase font-editorial font-bold text-[#e5ba79] tracking-wider flex items-center justify-between"
                >
                  <span>Descripción íntima o recuerdo</span>
                  <span className="text-[11px] text-stone-400 font-normal italic">1-2 frases</span>
                </label>
                <textarea
                  id="input-moment-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe lo que sentías, la atmósfera, la compañía o los sonidos de ese momento..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#14100c] border border-[#3e3126] text-sm text-amber-100 placeholder:text-stone-500 font-serif-body italic leading-relaxed focus:outline-none focus:border-[#d69542]"
                />
              </div>
            </div>
          )}

          {/* Si es vídeo o audio, se puede añadir una nota/frase acompañante */}
          {mediaType !== 'note' && mediaType !== 'photo' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase font-editorial font-bold text-[#e5ba79] tracking-wider flex items-center justify-between">
                <span>Nota o pensamiento sobre este instante</span>
                <span className="text-[11px] text-stone-500 font-normal italic">Opcional</span>
              </label>
              <input
                type="text"
                value={phrase}
                onChange={(e) => {
                  setPhrase(e.target.value);
                  setNote(e.target.value);
                }}
                placeholder="«El viento frío de las 6 de la mañana esperando el tren...»"
                className="w-full px-4 py-3 rounded-xl bg-[#1e1813] border border-[#3e3126] text-sm text-stone-100 placeholder:text-stone-500 font-serif-body italic focus:outline-none focus:border-[#d69542]"
              />
            </div>
          )}

          {/* 3. CAMPOS GUARDADOS AUTOMÁTICAMENTE: FECHA, HORA, CIUDAD, PAÍS, AUTOR */}
          <div className="p-4 rounded-2xl bg-[#211a14] border border-[#48372a] flex flex-col gap-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full wax-seal" />
              <span className="font-editorial text-xs uppercase font-bold text-[#e5ba79] tracking-wider">
                Datos guardados automáticamente
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Fecha */}
              <div className="flex flex-col gap-1">
                <label className="text-stone-400 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#e5ba79]" />
                  <span>Fecha</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18130f] border border-[#3e3126] text-stone-200 focus:outline-none focus:border-[#d69542]"
                />
              </div>

              {/* Hora */}
              <div className="flex flex-col gap-1">
                <label className="text-stone-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#e5ba79]" />
                  <span>Hora</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18130f] border border-[#3e3126] text-stone-200 focus:outline-none focus:border-[#d69542]"
                />
              </div>

              {/* Ciudad & País */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-stone-400 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#e5ba79]" />
                  <span>Lugar (Ciudad y País)</span>
                </label>

                {allCities.length > 0 && !city ? (
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#18130f] border border-[#3e3126] text-stone-200 focus:outline-none focus:border-[#d69542]"
                  >
                    {allCities.map((c) => {
                      const co = allCountries.find((item) => item.id === c.countryId);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name}, {co?.name || 'Mundo'}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="px-3 py-2 rounded-lg bg-[#18130f] border border-[#3e3126] text-stone-200 font-serif-body italic">
                    {currentCityName}, {currentCountryName}
                  </div>
                )}
              </div>

              {/* Autor */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-stone-400 font-medium flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#e5ba79]" />
                  <span>Autor</span>
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-3 py-2 rounded-lg bg-[#18130f] border border-[#3e3126] text-stone-200 focus:outline-none focus:border-[#d69542]"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#362b22]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-stone-300 font-editorial text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#d69542] via-[#f1c27d] to-[#b8762d] text-[#24170c] font-editorial text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Momento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
