import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MomentRecord,
  CountryRecord,
  CityRecord,
  PlaceRecord,
  getMomentMediaType,
  getMomentMediaUrl,
  getMomentPhrase,
  getMomentAuthor,
  getMomentPlace,
} from '../types';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MapPin,
  Calendar,
  Clock,
  User as UserIcon,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronDown,
  Compass,
  Star,
  Film,
  Camera,
  Music,
  FileText,
  Tag,
  ZoomIn,
  ZoomOut,
  Move,
  RefreshCw,
} from 'lucide-react';

export type TableItemType = 'photo' | 'video' | 'audio' | 'place' | 'note';

export interface TableItem {
  uid: string;
  type: TableItemType;
  title: string;
  subtitle?: string;
  location?: string;
  date?: string;
  time?: string;
  author?: string;
  mediaUrl?: string;
  audioDuration?: number;
  videoDuration?: number;
  note?: string;
  worthReturning?: boolean;
  isFavorite?: boolean;
  category?: string;
  address?: string;
  photos?: string[];
  rawMoment?: MomentRecord;
  rawPlace?: PlaceRecord;
  // Spatial placement on the physical memory table
  x: number;
  y: number;
  rotation: number;
  washiColor: 'amber' | 'slate' | 'rose' | 'kraft';
  washiRotation: number;
  pinType: 'tape' | 'clip' | 'stamp' | 'string';
  zIndex: number;
}

interface MemoryTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  country?: CountryRecord | null;
  city?: CityRecord | null;
  snapshots: MomentRecord[];
  places?: PlaceRecord[];
  cities: CityRecord[];
  countries?: CountryRecord[];
  initialMomentId?: string | null;
}

// Procedural soft physical click sounds via Web Audio API (purely synthesized, no external files)
function playTactileSound(type: 'pickup' | 'drop' | 'tap') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'pickup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'drop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Ignore audio context autoplay restrictions gracefully
  }
}

export const MemoryTableModal: React.FC<MemoryTableModalProps> = ({
  isOpen,
  onClose,
  country,
  city,
  snapshots,
  places = [],
  cities,
  countries = [],
  initialMomentId,
}) => {
  // Filter items by scope (country or city)
  const scopedMoments = useMemo(() => {
    let filtered = [...snapshots];
    if (city) {
      filtered = filtered.filter((s) => s.cityId === city.id);
    } else if (country) {
      filtered = filtered.filter((s) => s.countryId === country.id);
    }
    return filtered;
  }, [snapshots, country, city]);

  const scopedPlaces = useMemo(() => {
    let filtered = [...places];
    if (city) {
      filtered = filtered.filter((p) => p.cityId === city.id);
    } else if (country) {
      filtered = filtered.filter((p) => p.countryId === country.id);
    }
    return filtered;
  }, [places, country, city]);

  // Generate physical table objects scattered across the 2D surface
  const [scatterSeed, setScatterSeed] = useState(0);

  const tableItems = useMemo<TableItem[]>(() => {
    const rawList: {
      uid: string;
      type: TableItemType;
      title: string;
      subtitle?: string;
      location?: string;
      date?: string;
      time?: string;
      author?: string;
      mediaUrl?: string;
      audioDuration?: number;
      videoDuration?: number;
      note?: string;
      worthReturning?: boolean;
      isFavorite?: boolean;
      category?: string;
      address?: string;
      photos?: string[];
      rawMoment?: MomentRecord;
      rawPlace?: PlaceRecord;
    }[] = [];

    // 1. Convert moments into physical keepsakes
    scopedMoments.forEach((m) => {
      const mediaType = getMomentMediaType(m);
      const mediaUrl = getMomentMediaUrl(m);
      const phrase = getMomentPhrase(m);
      const author = getMomentAuthor(m);
      const locPlace = getMomentPlace(m);

      const cityName =
        m.cityName || cities.find((c) => c.id === m.cityId)?.name || 'Viaje';
      const countryName =
        m.countryName ||
        countries.find((c) => c.id === m.countryId)?.name ||
        '';

      if (mediaType === 'photo') {
        rawList.push({
          uid: `moment-${m.id}`,
          type: 'photo',
          title: phrase || 'Fotografía de viaje',
          location: locPlace ? `${locPlace}, ${cityName}` : cityName,
          date: m.date,
          time: m.time,
          author: author || 'Tú',
          mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
          note: m.note,
          rawMoment: m,
        });
      } else if (mediaType === 'video') {
        rawList.push({
          uid: `moment-${m.id}`,
          type: 'video',
          title: phrase || 'Cinta de celuloide',
          location: locPlace ? `${locPlace}, ${cityName}` : cityName,
          date: m.date,
          time: m.time,
          author: author || 'Tú',
          mediaUrl: mediaUrl,
          videoDuration: m.videoDuration || 15,
          note: m.note,
          rawMoment: m,
        });
      } else if (mediaType === 'audio') {
        rawList.push({
          uid: `moment-${m.id}`,
          type: 'audio',
          title: phrase || 'Cinta sonora de viaje',
          location: locPlace ? `${locPlace}, ${cityName}` : cityName,
          date: m.date,
          time: m.time,
          author: author || 'Tú',
          mediaUrl: mediaUrl,
          audioDuration: m.audioDuration || 45,
          note: m.note,
          rawMoment: m,
        });
      } else {
        // note
        rawList.push({
          uid: `moment-${m.id}`,
          type: 'note',
          title: phrase || 'Fragmento manuscrito',
          location: locPlace ? `${locPlace}, ${cityName}` : cityName,
          date: m.date,
          time: m.time,
          author: author || 'Tú',
          note: m.note || phrase,
          rawMoment: m,
        });
      }
    });

    // 2. Convert places into physical travel tickets / baggage tags
    scopedPlaces.forEach((p) => {
      const cityName = cities.find((c) => c.id === p.cityId)?.name || 'Ciudad';
      rawList.push({
        uid: `place-${p.id}`,
        type: 'place',
        title: p.name,
        subtitle: p.category,
        location: `${p.name} • ${cityName}`,
        category: p.category,
        address: p.address,
        worthReturning: p.worthReturning,
        isFavorite: p.favorite || p.isFavorite,
        photos: p.photos,
        note: p.notes,
        rawPlace: p,
      });
    });

    // Spatial arrangement across an organic 2D physical tabletop (free distribution, NO grids)
    const count = rawList.length;
    const items: TableItem[] = [];

    // Base canvas dimensions
    const tableWidth = Math.max(2200, Math.sqrt(count) * 480);
    const tableHeight = Math.max(1600, Math.sqrt(count) * 420);
    const centerX = tableWidth / 2;
    const centerY = tableHeight / 2;

    const washiColors: ('amber' | 'slate' | 'rose' | 'kraft')[] = ['amber', 'slate', 'rose', 'kraft'];
    const pinTypes: ('tape' | 'clip' | 'stamp' | 'string')[] = ['tape', 'clip', 'stamp', 'string'];

    rawList.forEach((item, index) => {
      // Golden ratio spiral distribution with organic radial jitter
      const phi = (1 + Math.sqrt(5)) / 2;
      const angle = index * 2.39996 + (scatterSeed * 0.7); // golden angle jitter
      const distRatio = Math.sqrt((index + 0.8) / (count + 1));
      const radius = distRatio * Math.min(tableWidth, tableHeight) * 0.44;

      // Deterministic random pseudo-hash for realistic placement
      const hash = Math.sin(index * 997 + scatterSeed * 133) * 10000;
      const jitterX = ((hash % 140) - 70);
      const jitterY = (((hash * 3.1) % 140) - 70);
      const rotation = ((hash % 18) - 9); // Between -9 deg and +9 deg
      const washiRot = ((hash * 7) % 12) - 6;

      const posX = centerX + Math.cos(angle) * radius + jitterX;
      const posY = centerY + Math.sin(angle) * radius + jitterY;

      items.push({
        ...item,
        x: Math.round(posX),
        y: Math.round(posY),
        rotation: Math.round(rotation * 10) / 10,
        washiColor: washiColors[Math.abs(Math.floor(hash)) % washiColors.length],
        washiRotation: Math.round(washiRot * 10) / 10,
        pinType: item.type === 'place' ? 'string' : pinTypes[Math.abs(Math.floor(hash * 2)) % pinTypes.length],
        zIndex: index + 1,
      });
    });

    return items;
  }, [scopedMoments, scopedPlaces, cities, countries, scatterSeed]);

  // Selected (Elevated) object on the table
  const [selectedItem, setSelectedItem] = useState<TableItem | null>(null);

  // When initialMomentId is provided, pre-select that item
  useEffect(() => {
    if (initialMomentId && tableItems.length > 0) {
      const match = tableItems.find((i) => i.uid === `moment-${initialMomentId}`);
      if (match) {
        setSelectedItem(match);
      }
    }
  }, [initialMomentId, tableItems]);

  // Table Camera Controls: Pan & Zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(0.85);

  // Initialize camera centered on the tabletop
  useEffect(() => {
    if (isOpen) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const defaultTableWidth = 2400;
      const defaultTableHeight = 1800;

      // Center of canvas mapped to viewport center
      const initialPanX = viewportWidth / 2 - (defaultTableWidth / 2) * 0.85;
      const initialPanY = viewportHeight / 2 - (defaultTableHeight / 2) * 0.85;
      setPan({ x: Math.round(initialPanX), y: Math.round(initialPanY) });
      setZoom(0.85);
    }
  }, [isOpen]);

  // Dragging the Table (Arrastrar para explorar)
  const isDraggingTableRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });
  const hasMovedSignificantlyRef = useRef(false);

  // Pinch-to-zoom tracking
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialZoomOnPinchRef = useRef<number>(1);

  // Elevated item swipe-down gesture tracking (Swipe down para cerrar)
  const [elevatedDragY, setElevatedDragY] = useState(0);
  const elevatedDragStartRef = useRef<number | null>(null);
  const isElevatedDraggingRef = useRef(false);

  // Flip photo state for inspecting the back
  const [isPhotoFlipped, setIsPhotoFlipped] = useState(false);

  // Active audio player state for cassette
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioIntervalRef = useRef<any>(null);

  // Active video player state for film slide
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  // Reset states when elevated item changes
  useEffect(() => {
    setIsPhotoFlipped(false);
    setIsAudioPlaying(false);
    setAudioProgress(0);
    setElevatedDragY(0);
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
  }, [selectedItem]);

  // Cassette audio playback timer simulation
  useEffect(() => {
    if (isAudioPlaying) {
      audioIntervalRef.current = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsAudioPlaying(false);
            return 0;
          }
          return prev + 1.8;
        });
      }, 300);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isAudioPlaying]);

  // Esc key listener to close elevated object or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (selectedItem) {
          playTactileSound('drop');
          setSelectedItem(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedItem, onClose]);

  // Desktop Mouse Wheel to Zoom (Pinch / Zoom)
  const handleWheel = (e: React.WheelEvent) => {
    // If an item is elevated, don't zoom the background abruptly
    if (selectedItem) return;

    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((currentZoom) => {
      const nextZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.45), 1.6);
      return Math.round(nextZoom * 100) / 100;
    });
  };

  // Table Pointer / Touch Handlers for Dragging and Pinching
  const handleTablePointerDown = (e: React.PointerEvent) => {
    if (selectedItem) return; // Ignore table drag if an item is elevated

    isDraggingTableRef.current = true;
    hasMovedSignificantlyRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleTablePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingTableRef.current || selectedItem) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasMovedSignificantlyRef.current = true;
    }

    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleTablePointerUp = () => {
    isDraggingTableRef.current = false;
  };

  // Mobile Pinch Gestures via Touch Events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialTouchDistanceRef.current = distance;
      initialZoomOnPinchRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistanceRef.current !== null && !selectedItem) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = currentDistance / initialTouchDistanceRef.current;
      const nextZoom = Math.min(Math.max(initialZoomOnPinchRef.current * ratio, 0.45), 1.6);
      setZoom(Math.round(nextZoom * 100) / 100);
    }
  };

  const handleTouchEnd = () => {
    initialTouchDistanceRef.current = null;
  };

  // Handle clicking an item on the table (Tap para abrir)
  const handleItemClick = (item: TableItem) => {
    if (hasMovedSignificantlyRef.current) return;
    playTactileSound('pickup');
    setSelectedItem(item);
  };

  // Swipe-down to close handlers on the elevated card
  const handleElevatedPointerDown = (e: React.PointerEvent) => {
    isElevatedDraggingRef.current = true;
    elevatedDragStartRef.current = e.clientY;
  };

  const handleElevatedPointerMove = (e: React.PointerEvent) => {
    if (!isElevatedDraggingRef.current || elevatedDragStartRef.current === null) return;
    const dy = e.clientY - elevatedDragStartRef.current;
    if (dy > 0) {
      setElevatedDragY(dy);
    }
  };

  const handleElevatedPointerUp = () => {
    if (!isElevatedDraggingRef.current) return;
    isElevatedDraggingRef.current = false;
    elevatedDragStartRef.current = null;

    if (elevatedDragY > 110) {
      // Swiped down successfully -> drop onto the table!
      playTactileSound('drop');
      setSelectedItem(null);
    }
    setElevatedDragY(0);
  };

  // Filter types on table: "Todos", "Fotos", "Vídeos", "Audios", "Lugares"
  const [filterType, setFilterType] = useState<TableItemType | 'all'>('all');

  const filteredItems = useMemo(() => {
    if (filterType === 'all') return tableItems;
    return tableItems.filter((i) => i.type === filterType);
  }, [tableItems, filterType]);

  // Center Table Camera
  const handleCenterTable = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const defaultTableWidth = 2400;
    const defaultTableHeight = 1800;

    setPan({
      x: Math.round(viewportWidth / 2 - (defaultTableWidth / 2) * 0.85),
      y: Math.round(viewportHeight / 2 - (defaultTableHeight / 2) * 0.85),
    });
    setZoom(0.85);
    playTactileSound('tap');
  };

  // Rescatter memories on the table (like opening the box anew)
  const handleRescatter = () => {
    playTactileSound('pickup');
    setScatterSeed((prev) => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div
      id="memory-table-modal"
      className="fixed inset-0 z-50 overflow-hidden select-none memory-table-surface text-stone-100 flex flex-col font-sans"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. ATMOSPHERIC TOP HEADER: Sensación de abrir una caja de recuerdos físicos */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-gradient-to-b from-[#080604]/90 via-[#0d0a08]/75 to-transparent backdrop-blur-md border-b border-[#362b22]/40 transition-all">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#241a12] border border-[#d69542]/40 flex items-center justify-center shadow-lg shadow-amber-950/40 text-[#e5ba79]">
            <Compass className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-[#fff8ed] leading-none">
                Mesa de Recuerdos
              </h1>
              <span className="text-[10px] uppercase font-editorial font-bold px-2 py-0.5 rounded-full bg-[#342417] text-[#e5ba79] border border-[#523b26]">
                {city ? city.name : country ? country.name : 'Todos los viajes'}
              </span>
            </div>
            <p className="font-serif-body text-[11px] text-stone-400 italic leading-tight pt-0.5">
              {tableItems.length} objetos esparcidos sobre la mesa • Arrastra para explorar
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Re-esparcir recuerdos (agitar la caja) */}
          <button
            type="button"
            onClick={handleRescatter}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#201812]/80 hover:bg-[#2e231b] border border-[#443324] text-xs font-editorial font-bold text-amber-200/90 transition-all shadow-sm hover:scale-105 active:scale-95"
            title="Esparcir los recuerdos de nuevo sobre la mesa"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Esparcir</span>
          </button>

          {/* Botón Salir / Cerrar Mesa */}
          <button
            id="btn-close-memory-table"
            type="button"
            onClick={() => {
              playTactileSound('drop');
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#271b12] hover:bg-[#382619] border border-[#583d28] text-xs font-editorial font-bold text-stone-200 hover:text-white transition-all shadow-md shadow-black/40 hover:scale-105 active:scale-95"
          >
            <X className="w-4 h-4 text-[#e5ba79]" />
            <span className="hidden sm:inline">Guardar caja</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-BAR: FILTRO RÁPIDO DE OBJETOS FÍSICOS (Sin cuadrícula, solo destaca objetos) */}
      <div className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-2 bg-[#120d09]/40 backdrop-blur-xs border-b border-[#2d221a]/30 text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="font-editorial text-stone-400 text-[11px] hidden sm:inline mr-1">
            Filtrar:
          </span>
          {[
            { key: 'all', label: 'Todos los recuerdos', icon: Sparkles },
            { key: 'photo', label: 'Fotos', icon: Camera },
            { key: 'video', label: 'Vídeos', icon: Film },
            { key: 'audio', label: 'Cintas de audio', icon: Music },
            { key: 'place', label: 'Lugares', icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = filterType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  playTactileSound('tap');
                  setFilterType(tab.key as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-editorial font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#d69542] text-[#1c1208] shadow-md shadow-amber-950/40 border border-[#fce4be]'
                    : 'bg-[#1e1711]/70 text-stone-300 hover:text-stone-100 hover:bg-[#2a2018] border border-[#3d2e22]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Floating Desktop Zoom & Reset Controls */}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setZoom((z) => Math.max(0.45, Math.round((z - 0.15) * 100) / 100));
              playTactileSound('tap');
            }}
            className="p-1.5 rounded-lg bg-[#221912] hover:bg-[#31241a] border border-[#443324] text-stone-300 hover:text-white transition-all"
            title="Alejar mesa (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-stone-400 w-9 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => {
              setZoom((z) => Math.min(1.6, Math.round((z + 0.15) * 100) / 100));
              playTactileSound('tap');
            }}
            className="p-1.5 rounded-lg bg-[#221912] hover:bg-[#31241a] border border-[#443324] text-stone-300 hover:text-white transition-all"
            title="Acercar mesa (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCenterTable}
            className="p-1.5 rounded-lg bg-[#221912] hover:bg-[#31241a] border border-[#443324] text-stone-300 hover:text-white transition-all hidden sm:flex"
            title="Centrar mesa"
          >
            <Move className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. VIRTUAL 2D MEMORY TABLE CANVAS (Espacio libre, arrastrar y soltar objetos) */}
      <div
        className="flex-1 relative cursor-grab active:cursor-grabbing overflow-hidden"
        onPointerDown={handleTablePointerDown}
        onPointerMove={handleTablePointerMove}
        onPointerUp={handleTablePointerUp}
      >
        {/* Ambient Warm Vignette & Desk Lamp Pools */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(214,149,66,0.06)_0%,transparent_65%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,transparent_40%,rgba(6,4,3,0.7)_100%)]" />

        {/* Floating Table Plane */}
        <div
          className="absolute origin-top-left transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            width: '2600px',
            height: '2000px',
          }}
        >
          {/* Subtle wooden joints or desk markings */}
          <div className="absolute top-[300px] left-0 right-0 h-px bg-white/[0.015] pointer-events-none" />
          <div className="absolute top-[900px] left-0 right-0 h-px bg-white/[0.015] pointer-events-none" />
          <div className="absolute top-[1500px] left-0 right-0 h-px bg-white/[0.015] pointer-events-none" />

          {/* Render all scattered physical objects */}
          {filteredItems.map((item) => {
            const isCurrentlySelected = selectedItem?.uid === item.uid;

            return (
              <div
                key={item.uid}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(item);
                }}
                className={`absolute cursor-pointer transition-all duration-300 group ${
                  isCurrentlySelected ? 'opacity-20 scale-95 pointer-events-none' : 'hover:scale-[1.03]'
                }`}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  transform: `rotate(${item.rotation}deg)`,
                  zIndex: item.zIndex,
                }}
              >
                {/* 1. OBJETO FÍSICO: FOTOGRAFÍA POLAROID CLÁSICA */}
                {item.type === 'photo' && (
                  <div className="w-[190px] p-3 pt-3 pb-5 rounded-sm polaroid-paper memory-object-shadow transition-shadow group-hover:shadow-2xl relative border border-[#dfd6c7]/80">
                    {/* Washi tape pinning the photo to the table */}
                    <div
                      className="w-12 h-4 washi-tape-amber rounded-2xs absolute -top-2 left-1/2 -translate-x-1/2 shadow-xs pointer-events-none z-10 opacity-90"
                      style={{ transform: `rotate(${item.washiRotation}deg)` }}
                    />

                    {/* Image */}
                    <div className="w-full aspect-[4/3] rounded-2xs overflow-hidden bg-stone-900 relative shadow-inner">
                      <img
                        src={item.mediaUrl}
                        alt={item.title}
                        className="w-full h-full object-cover filter contrast-[1.04] brightness-95 group-hover:brightness-100 transition-all"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Handwritten caption */}
                    <div className="pt-2 px-0.5 text-center">
                      <p className="font-handwriting text-lg text-[#2b1f14] leading-tight line-clamp-1">
                        "{item.title}"
                      </p>
                      <p className="font-editorial text-[10px] text-stone-500 italic mt-0.5">
                        {item.location || item.date}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. OBJETO FÍSICO: DIAPOSITIVA DE CINE / VÍDEO CORTO (35mm Kodachrome slide) */}
                {item.type === 'video' && (
                  <div className="w-[195px] p-3 pb-4 rounded-sm bg-[#faf5ea] memory-object-shadow transition-shadow group-hover:shadow-2xl relative border-2 border-[#d9cdb8]">
                    {/* Slide Top Label */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-stone-600 border-b border-stone-300 pb-1 mb-1.5 px-0.5">
                      <span className="font-bold tracking-widest text-[#943f1f]">35mm FILM</span>
                      <span>EXP. {item.videoDuration}s</span>
                    </div>

                    {/* Celluloid Frame with Sprocket holes simulation */}
                    <div className="w-full aspect-[4/3] rounded-xs bg-black relative overflow-hidden shadow-inner flex items-center justify-center group-hover:border-amber-400/40 border border-stone-800">
                      {item.mediaUrl ? (
                        <video
                          src={item.mediaUrl}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#1f1610] to-[#38271a] flex items-center justify-center">
                          <Film className="w-8 h-8 text-amber-300/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/25 group-hover:bg-transparent transition-all flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xs border border-amber-300/50 flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-amber-300 text-amber-300 translate-x-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Slide Bottom Caption */}
                    <div className="pt-2 px-0.5 text-center">
                      <p className="font-editorial font-bold text-xs text-[#22160d] truncate">
                        {item.title}
                      </p>
                      <p className="font-serif-body text-[10px] text-stone-500 italic">
                        {item.location}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. OBJETO FÍSICO: CASSETTE DE AUDIO COMPACTO REALISTA */}
                {item.type === 'audio' && (
                  <div className="w-[220px] h-[138px] rounded-lg bg-gradient-to-b from-[#211b16] via-[#1a1410] to-[#120e0a] p-2.5 memory-object-shadow transition-shadow group-hover:shadow-2xl relative border border-[#4e3a2b]">
                    {/* Screw heads in 4 corners */}
                    <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#524132] border border-[#261d15]" />
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#524132] border border-[#261d15]" />
                    <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#524132] border border-[#261d15]" />
                    <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#524132] border border-[#261d15]" />

                    {/* Paper Label */}
                    <div className="w-full h-full rounded-md bg-[#faf5e9] p-2 border border-[#d6c7b0] shadow-inner flex flex-col justify-between relative overflow-hidden">
                      {/* Top Label Bar */}
                      <div className="flex items-center justify-between border-b border-[#e5d8c3] pb-0.5">
                        <span className="font-editorial text-[10px] font-bold text-[#b44820] tracking-wider">
                          SONIDO ESTÉREO
                        </span>
                        <span className="font-mono text-[9px] text-stone-500 font-bold">
                          {item.audioDuration}s
                        </span>
                      </div>

                      {/* Handwritten title on cassette */}
                      <p className="font-handwriting text-base text-[#24170c] font-bold truncate leading-none py-1">
                        {item.title}
                      </p>

                      {/* Transparent Central Tape Window with Two Reels */}
                      <div className="w-full h-8 rounded-sm bg-[#16120e] border border-[#4e3928] flex items-center justify-around px-3 shadow-inner my-auto">
                        {/* Reel 1 */}
                        <div className="w-5 h-5 rounded-full bg-[#faf5e9] border-2 border-stone-400 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-700" />
                        </div>
                        {/* Magnetic tape window line */}
                        <div className="flex-1 h-2 bg-[#2d1d12] mx-2 rounded-xs flex items-center justify-center">
                          <div className="w-full h-0.5 bg-[#4a2e1d]" />
                        </div>
                        {/* Reel 2 */}
                        <div className="w-5 h-5 rounded-full bg-[#faf5e9] border-2 border-stone-400 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-stone-700" />
                        </div>
                      </div>

                      {/* Bottom author & date */}
                      <div className="flex items-center justify-between text-[9px] font-serif-body text-stone-500 italic pt-0.5">
                        <span>{item.location}</span>
                        <span>{item.author}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. OBJETO FÍSICO: BILLETE DE VIAJE / ETIQUETA DE EQUIPAJE (LUGAR) */}
                {item.type === 'place' && (
                  <div className="w-[200px] p-3.5 rounded-sm kraft-tag-paper memory-object-shadow transition-shadow group-hover:shadow-2xl relative border border-[#c4ae8a] text-[#2b1c10]">
                    {/* Brass eyelet & Twine hole at top center */}
                    <div className="w-3.5 h-3.5 rounded-full bg-[#d4af37] border-2 border-[#8b6f20] mx-auto -mt-1 shadow-inner relative flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0d0a08]" />
                    </div>

                    {/* Rubber Stamp: "MERECE VOLVER" */}
                    {item.worthReturning && (
                      <div className="absolute top-3 right-2 px-1.5 py-0.5 rounded-xs border-2 border-[#a83226]/80 text-[#a83226] font-editorial text-[9px] font-bold rotate-[-12deg] tracking-widest uppercase opacity-85">
                        ★ Volvería
                      </div>
                    )}

                    {/* Category Stamp */}
                    <div className="mt-1 text-[9px] font-mono uppercase tracking-widest text-[#7a583a] border-b border-[#c8b393] pb-1">
                      ETIQUETA DE LUGAR
                    </div>

                    {/* Place Name */}
                    <p className="font-editorial text-base font-bold text-[#1f140c] leading-tight pt-1">
                      {item.title}
                    </p>

                    {/* Mini photo pinned with clip if available */}
                    {item.photos && item.photos.length > 0 && (
                      <div className="w-full aspect-[16/9] rounded-2xs overflow-hidden my-2 bg-stone-800 border border-[#bfa581] shadow-xs">
                        <img
                          src={item.photos[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Notes Excerpt or Address */}
                    <p className="font-serif-body text-[10px] text-stone-700 italic line-clamp-2 mt-1">
                      "{item.note || item.address || 'Rincón especial del viaje'}"
                    </p>
                  </div>
                )}

                {/* 5. OBJETO FÍSICO: NOTA O TELEGRAMA MANUSCRITO */}
                {item.type === 'note' && (
                  <div className="w-[185px] p-4 rounded-sm postcard-cream memory-object-shadow transition-shadow group-hover:shadow-2xl relative border border-[#d8cab3] text-[#2c1d12]">
                    <div
                      className="w-12 h-3.5 washi-tape-slate rounded-2xs absolute -top-1.5 left-4 shadow-xs pointer-events-none"
                      style={{ transform: `rotate(${item.washiRotation}deg)` }}
                    />
                    <div className="w-full text-center border-b border-[#ded2bd] pb-1 mb-2">
                      <span className="font-editorial text-[9px] font-bold tracking-widest text-stone-500 uppercase">
                        MEMORIA ESCRITA
                      </span>
                    </div>
                    <blockquote className="font-handwriting text-lg text-[#26170c] leading-snug line-clamp-3">
                      "{item.note || item.title}"
                    </blockquote>
                    <p className="font-serif-body text-[9px] text-stone-500 italic mt-2 text-right">
                      — {item.author || 'Tú'}, {item.date}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL ELEVADO: INSPECCIÓN DEL RECUERDO FÍSICO
          - Se eleva visualmente sobre la mesa
          - La mesa permanece visible detrás (con leve oscurecimiento focal)
          - Soporta "Swipe down para cerrar"
      */}
      {selectedItem && (
        <div
          id="elevated-memory-stage"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-[3px] transition-all animate-fadeIn"
          onClick={() => {
            playTactileSound('drop');
            setSelectedItem(null);
          }}
        >
          {/* Spotlight aura concentrating onto the elevated physical object */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(5,3,2,0.65)_100%)]" />

          {/* THE ELEVATED PHYSICAL OBJECT CONTAINER */}
          <div
            id="elevated-physical-card"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handleElevatedPointerDown}
            onPointerMove={handleElevatedPointerMove}
            onPointerUp={handleElevatedPointerUp}
            className="relative w-full max-w-[540px] max-h-[85vh] memory-elevated-shadow rounded-2xl overflow-hidden transition-transform duration-150 ease-out cursor-grab active:cursor-grabbing will-change-transform"
            style={{
              transform: `translateY(${elevatedDragY}px) scale(${Math.max(
                0.9,
                1 - elevatedDragY / 600
              )})`,
            }}
          >
            {/* Gesture Hint: Swipe down to close */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-200/90 text-[10px] font-editorial font-bold border border-amber-400/30 shadow-md">
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
              <span>Desliza hacia abajo para devolver a la mesa</span>
            </div>

            {/* Close Button on Elevated Card */}
            <button
              type="button"
              onClick={() => {
                playTactileSound('drop');
                setSelectedItem(null);
              }}
              className="absolute top-2.5 right-2.5 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-stone-300 hover:text-white flex items-center justify-center border border-white/20 transition-all shadow-md"
              title="Devolver a la mesa"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ---------------- ELEVATED OBJECT: FOTO ---------------- */}
            {selectedItem.type === 'photo' && (
              <div className="w-full bg-[#fdfaf4] p-5 sm:p-7 rounded-2xl border-4 border-[#eae2d3] relative text-[#24170c]">
                {/* Washi tape on top */}
                <div className="w-24 h-6 washi-tape-amber rounded-xs absolute -top-3 left-1/2 -translate-x-1/2 shadow-md" />

                {!isPhotoFlipped ? (
                  /* FRONT: The Photograph */
                  <div className="flex flex-col gap-4">
                    <div className="w-full aspect-[4/3] rounded-sm overflow-hidden bg-black shadow-inner relative border border-[#dfd6c7]">
                      <img
                        src={selectedItem.mediaUrl}
                        alt={selectedItem.title}
                        className="w-full h-full object-cover filter contrast-[1.03]"
                      />
                    </div>

                    <div className="text-center pt-2">
                      <blockquote className="font-handwriting text-3xl sm:text-4xl text-[#1f140c] leading-snug">
                        "{selectedItem.title}"
                      </blockquote>
                      <div className="flex items-center justify-center gap-3 mt-3 text-xs font-serif-body text-stone-600 italic">
                        {selectedItem.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#b4712c]" />
                            <span>{selectedItem.location}</span>
                          </span>
                        )}
                        {selectedItem.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#b4712c]" />
                            <span>{selectedItem.date}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Button to flip to back */}
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          playTactileSound('tap');
                          setIsPhotoFlipped(true);
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#eee5d3] hover:bg-[#e4d8c2] text-[#2b1c10] font-editorial text-xs font-bold border border-[#d6c7b0] transition-all shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#b4712c]" />
                        <span>Ver dorso de la foto (Notas y fecha)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* BACK: Handwritten notes & stamp */
                  <div className="w-full min-h-[360px] p-6 rounded-xl bg-[#faf4e6] border-2 border-dashed border-[#d9cdb8] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#dfd2be] pb-2 mb-4">
                        <span className="font-editorial text-xs font-bold text-stone-600 tracking-widest uppercase">
                          Dorso del Recuerdo
                        </span>
                        <span className="font-mono text-xs text-stone-500">
                          {selectedItem.date} {selectedItem.time && `• ${selectedItem.time}`}
                        </span>
                      </div>

                      <p className="font-handwriting text-2xl sm:text-3xl text-[#1e1309] leading-relaxed">
                        {selectedItem.note || selectedItem.title || 'Instante capturado en el camino.'}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-[#dfd2be] flex items-center justify-between">
                      <div className="text-xs font-serif-body text-stone-600 italic">
                        <span>Anotado por: </span>
                        <strong className="font-editorial text-stone-800 not-italic">
                          {selectedItem.author || 'Tú'}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playTactileSound('tap');
                          setIsPhotoFlipped(false);
                        }}
                        className="px-3.5 py-1 rounded-full bg-[#e8deca] hover:bg-[#ded1bc] text-xs font-editorial font-bold text-[#2b1c10] border border-[#cfc0a8]"
                      >
                        Volver al frente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- ELEVATED OBJECT: VÍDEO CORTO ---------------- */}
            {selectedItem.type === 'video' && (
              <div className="w-full bg-[#18130f] p-5 sm:p-7 rounded-2xl border-4 border-[#3e2e21] text-stone-100 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#3e2e21] pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#e5ba79]" />
                    <span className="font-editorial font-bold text-amber-200">
                      Cinta de Celuloide 35mm
                    </span>
                  </div>
                  <span className="font-mono text-stone-400 text-[11px]">
                    {selectedItem.date} {selectedItem.time && `• ${selectedItem.time}`}
                  </span>
                </div>

                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black border-2 border-[#544131] shadow-2xl">
                  {selectedItem.mediaUrl ? (
                    <video
                      src={selectedItem.mediaUrl}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 p-6 text-center">
                      <Film className="w-12 h-12 text-amber-400/40 mb-2" />
                      <p className="font-editorial text-stone-300">Vídeo del momento</p>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-handwriting text-2xl sm:text-3xl text-amber-100 leading-snug">
                    "{selectedItem.title}"
                  </h2>
                  {selectedItem.note && (
                    <p className="font-serif-body text-xs text-stone-300 italic pt-1">
                      {selectedItem.note}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-stone-400 font-serif-body italic">
                    <MapPin className="w-3.5 h-3.5 text-[#e5ba79]" />
                    <span>{selectedItem.location}</span>
                    <span className="mx-1">•</span>
                    <span>Grabado por {selectedItem.author || 'Tú'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- ELEVATED OBJECT: CASSETTE DE AUDIO ---------------- */}
            {selectedItem.type === 'audio' && (
              <div className="w-full bg-[#181410] p-6 sm:p-8 rounded-2xl border-4 border-[#4d3a2a] text-stone-100 flex flex-col gap-6">
                {/* Cassette Header Bar */}
                <div className="flex items-center justify-between border-b border-[#3b2d20] pb-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-[#e5ba79]" />
                    <span className="font-editorial font-bold text-amber-100 text-sm">
                      Cinta Analógica de Campo
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#271d15] text-amber-300 border border-[#523d2b]">
                    {selectedItem.audioDuration}s
                  </span>
                </div>

                {/* Big Realistic Cassette Body */}
                <div className="w-full p-5 rounded-xl bg-gradient-to-b from-[#241c15] to-[#140e0a] border-2 border-[#543e2c] shadow-inner flex flex-col gap-4">
                  {/* Cassette Label */}
                  <div className="w-full p-4 rounded-lg bg-[#faf5e8] text-[#24170c] border border-[#d6c7b0] shadow-sm">
                    <p className="font-editorial text-[10px] uppercase font-bold text-[#b44820] tracking-widest border-b border-[#e5d8c3] pb-0.5">
                      GRABACIÓN ORIGINAL • {selectedItem.date}
                    </p>
                    <h3 className="font-handwriting text-2xl sm:text-3xl text-[#1f140c] pt-1 leading-snug">
                      "{selectedItem.title}"
                    </h3>
                  </div>

                  {/* Tape Spools Window with Rotating Animation */}
                  <div className="w-full h-16 rounded-lg bg-[#0e0a07] border border-[#3e2c1e] flex items-center justify-around px-8 shadow-inner">
                    {/* Left Spool */}
                    <div
                      className={`w-10 h-10 rounded-full bg-[#faf5e9] border-4 border-stone-400 flex items-center justify-center transition-transform ${
                        isAudioPlaying ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '2.5s' }}
                    >
                      <div className="w-3 h-3 rounded-full bg-stone-800" />
                    </div>

                    {/* Waveform & Scrubber */}
                    <div className="flex-1 mx-6 flex items-center gap-1">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full bg-amber-500/80 transition-all ${
                            isAudioPlaying ? 'animate-pulse' : 'opacity-30'
                          }`}
                          style={{
                            height: isAudioPlaying
                              ? `${Math.max(20, Math.sin(i * 0.5) * 80 + 20)}%`
                              : '25%',
                            animationDuration: `${0.3 + (i % 4) * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Right Spool */}
                    <div
                      className={`w-10 h-10 rounded-full bg-[#faf5e9] border-4 border-stone-400 flex items-center justify-center transition-transform ${
                        isAudioPlaying ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '2.5s' }}
                    >
                      <div className="w-3 h-3 rounded-full bg-stone-800" />
                    </div>
                  </div>

                  {/* Playback Controls on Cassette */}
                  <div className="flex items-center justify-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        playTactileSound('tap');
                        setIsAudioPlaying(!isAudioPlaying);
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#d69542] via-[#e5ba79] to-[#c88432] text-[#24170c] font-editorial font-bold text-sm shadow-lg shadow-amber-950/60 hover:scale-105 active:scale-95 transition-all"
                    >
                      {isAudioPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pausar cinta</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Reproducir grabación</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Location & Author */}
                <div className="flex items-center justify-between text-xs text-stone-400 font-serif-body italic">
                  <span>Rincón: {selectedItem.location}</span>
                  <span>Voz: {selectedItem.author || 'Tú'}</span>
                </div>
              </div>
            )}

            {/* ---------------- ELEVATED OBJECT: BILLETE DE VIAJE / LUGAR ---------------- */}
            {selectedItem.type === 'place' && (
              <div className="w-full bg-[#e8d7b9] p-6 sm:p-8 rounded-2xl border-4 border-[#c2aa83] text-[#281a0e] flex flex-col gap-5 relative">
                {/* Brass Grommet at top */}
                <div className="w-5 h-5 rounded-full bg-[#d4af37] border-2 border-[#8b6f20] mx-auto -mt-2 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#18120b]" />
                </div>

                {/* Header stamps */}
                <div className="flex items-center justify-between border-b-2 border-dashed border-[#bda682] pb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#8b5c32] uppercase tracking-wider block">
                      BOLETO DE VIAJE • {selectedItem.category || 'DESTINO'}
                    </span>
                    <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1a1008] pt-0.5">
                      {selectedItem.title}
                    </h2>
                  </div>

                  {selectedItem.worthReturning && (
                    <div className="px-3 py-1 rounded-sm border-2 border-[#a83226] text-[#a83226] font-editorial text-xs font-bold uppercase rotate-[-8deg] tracking-wider shadow-xs">
                      ★ Merece Volver
                    </div>
                  )}
                </div>

                {/* Place Photos Carousel if exists */}
                {selectedItem.photos && selectedItem.photos.length > 0 && (
                  <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-stone-900 border border-[#bfa581] shadow-md">
                    <img
                      src={selectedItem.photos[0]}
                      alt={selectedItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Address and Description */}
                <div className="space-y-2">
                  {selectedItem.address && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-700 font-serif-body">
                      <MapPin className="w-4 h-4 text-[#8b5c32] shrink-0" />
                      <span>{selectedItem.address}</span>
                    </div>
                  )}

                  {selectedItem.note && (
                    <div className="p-3.5 rounded-lg bg-[#dfcdad] border border-[#cfbd9c]">
                      <p className="font-serif-body text-sm text-[#24170c] italic leading-relaxed">
                        "{selectedItem.note}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Ticket Perforation Line */}
                <div className="pt-2 border-t-2 border-dashed border-[#bda682] flex items-center justify-between text-xs font-editorial font-bold text-[#734f2d]">
                  <span>EXPEDIDO POR 195 VIAJES</span>
                  <span>BILLETE CONSERVADO EN MEMORIA</span>
                </div>
              </div>
            )}

            {/* ---------------- ELEVATED OBJECT: NOTA ESCRITA ---------------- */}
            {selectedItem.type === 'note' && (
              <div className="w-full bg-[#faf5e8] p-6 sm:p-8 rounded-2xl border-4 border-[#ded2bc] text-[#24170c] flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#dfd2be] pb-2 text-xs">
                  <span className="font-editorial font-bold text-stone-600 tracking-wider uppercase">
                    Manuscrito de Viaje
                  </span>
                  <span className="font-mono text-stone-500">
                    {selectedItem.date} {selectedItem.time && `• ${selectedItem.time}`}
                  </span>
                </div>

                <blockquote className="font-handwriting text-3xl sm:text-4xl text-[#1e1309] leading-relaxed py-2">
                  "{selectedItem.note || selectedItem.title}"
                </blockquote>

                <div className="pt-4 border-t border-[#dfd2be] flex items-center justify-between text-xs font-serif-body text-stone-600 italic">
                  <span>Lugar: {selectedItem.location}</span>
                  <span>Escrito por: {selectedItem.author || 'Tú'}</span>
                </div>
              </div>
            )}

            {/* Bottom Button to return to table */}
            <div className="p-3 bg-[#0d0a08]/90 text-center border-t border-[#3e2e21]">
              <button
                type="button"
                onClick={() => {
                  playTactileSound('drop');
                  setSelectedItem(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#271b12] hover:bg-[#382619] text-amber-200 text-xs font-editorial font-bold border border-[#523c28] transition-all hover:scale-105 active:scale-95"
              >
                <span>Soltar y volver a la mesa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
