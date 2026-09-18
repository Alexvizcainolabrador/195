import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3Geo from 'd3-geo';
import { CountryRecord, CityRecord, PlaceRecord, MomentRecord } from '../types';
import { CODE_TO_FEATURE, ExtendedCountryFeature } from '../lib/geoData';
import { getCityCoordinates } from '../lib/cityCoordinates';
import { COUNTRIES_195 } from '../data/countriesData';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Compass,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface CountryAtlasViewProps {
  country: CountryRecord;
  cities: CityRecord[];
  moments: MomentRecord[];
  places: PlaceRecord[];
  onSelectCity: (city: CityRecord) => void;
  onOpenAddCity: () => void;
  onOpenAddMoment: (cityId?: string) => void;
  onBackToGlobe: () => void;
  onReliveCountry?: (country: CountryRecord) => void;
}

interface ProjectedCity {
  city: CityRecord;
  x: number;
  y: number;
  lng: number;
  lat: number;
  momentsCount: number;
  placesCount: number;
}

export const CountryAtlasView: React.FC<CountryAtlasViewProps> = ({
  country,
  cities,
  moments,
  places,
  onSelectCity,
  onOpenAddCity,
  onOpenAddMoment,
  onBackToGlobe,
  onReliveCountry,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Country metadata & geo feature
  const countryCode = country.code.toUpperCase();
  const countryFeature = useMemo<ExtendedCountryFeature | undefined>(
    () => CODE_TO_FEATURE.get(countryCode),
    [countryCode]
  );
  const countryInfo = useMemo(
    () => COUNTRIES_195.find((c) => c.code.toUpperCase() === countryCode),
    [countryCode]
  );

  // Filter items for this country
  const countryCities = useMemo(
    () => cities.filter((c) => c.countryId === country.id),
    [cities, country.id]
  );
  const countryMoments = useMemo(
    () => moments.filter((m) => m.countryId === country.id),
    [moments, country.id]
  );

  // Store projected cities positions to handle clicks on canvas
  const projectedCitiesRef = useRef<ProjectedCity[]>([]);

  // Project country geometry and compute city points
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animFrame: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Deep space starry background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Ambient nebula glow centered in viewport
      const cx = width / 2 + panOffset.x;
      const cy = height / 2 + panOffset.y;
      const nebula = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.65);
      nebula.addColorStop(0, 'rgba(217, 119, 6, 0.12)'); // Warm amber heart
      nebula.addColorStop(0.4, 'rgba(14, 165, 233, 0.06)'); // Distant cyan ionosphere
      nebula.addColorStop(1, 'rgba(6, 10, 18, 0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, width, height);

      // Draw distant stars
      const starCount = 60;
      for (let i = 0; i < starCount; i++) {
        const sx = ((i * 137.5 + 43) % width);
        const sy = ((i * 223.1 + 89) % height);
        const radius = (i % 3 === 0) ? 1.2 : 0.7;
        const alpha = 0.2 + ((Math.sin(performance.now() * 0.001 + i) + 1) / 2) * 0.35;
        ctx.fillStyle = `rgba(254, 243, 199, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (countryFeature) {
        // Compute D3 Mercator projection fitted to country bounds with padding
        const padding = Math.min(width, height) * 0.22;
        const projection = d3Geo
          .geoMercator()
          .fitExtent(
            [
              [padding, padding],
              [width - padding, height - padding],
            ],
            countryFeature as any
          );

        // Apply custom zoom & pan
        const baseScale = projection.scale();
        const baseTranslate = projection.translate();
        projection
          .scale(baseScale * zoomLevel)
          .translate([baseTranslate[0] + panOffset.x, baseTranslate[1] + panOffset.y]);

        const path = d3Geo.geoPath(projection, ctx);

        // 1. Outer radiant glow around country borders
        ctx.save();
        ctx.shadowColor = 'rgba(245, 158, 11, 0.65)'; // Warm golden celestial glow
        ctx.shadowBlur = 24 * zoomLevel;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        path(countryFeature as any);
        ctx.stroke();
        ctx.restore();

        // 2. Interior country terrain fill (Deep obsidian with subtle gold velvet gradient)
        const countryGrad = ctx.createLinearGradient(0, 0, width, height);
        countryGrad.addColorStop(0, 'rgba(30, 24, 18, 0.85)');
        countryGrad.addColorStop(0.5, 'rgba(24, 19, 15, 0.92)');
        countryGrad.addColorStop(1, 'rgba(18, 14, 11, 0.95)');

        ctx.fillStyle = countryGrad;
        ctx.beginPath();
        path(countryFeature as any);
        ctx.fill();

        // 3. Crisp coastline boundary line
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        path(countryFeature as any);
        ctx.stroke();

        // 4. Project Visited Cities as Radiant Luminous Points of Light
        const projectedList: ProjectedCity[] = [];
        const now = performance.now();

        countryCities.forEach((city) => {
          const [cityLng, cityLat] = getCityCoordinates(
            city.name,
            countryInfo?.lng || countryFeature.properties.lng,
            countryInfo?.lat || countryFeature.properties.lat
          );

          const coords = projection([cityLng, cityLat]);
          if (!coords) return;
          const [px, py] = coords;

          const cityMomentsCount = countryMoments.filter((m) => m.cityId === city.id).length;
          const cityPlacesCount = places.filter((p) => p.cityId === city.id).length;

          projectedList.push({
            city,
            x: px,
            y: py,
            lng: cityLng,
            lat: cityLat,
            momentsCount: cityMomentsCount,
            placesCount: cityPlacesCount,
          });
        });

        projectedCitiesRef.current = projectedList;

        // Draw luminous constellation lines between visited cities
        if (projectedList.length > 1) {
          ctx.beginPath();
          for (let i = 0; i < projectedList.length - 1; i++) {
            ctx.moveTo(projectedList[i].x, projectedList[i].y);
            ctx.lineTo(projectedList[i + 1].x, projectedList[i + 1].y);
          }
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.setLineDash([4, 6]);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw each glowing city beacon
        projectedList.forEach(({ city, x, y, momentsCount }) => {
          const isHovered = hoveredCityId === city.id;
          const isSelected = selectedCityId === city.id;

          // Pulsing wave animation
          const pulseCycle = (now * 0.003 + (city.name.charCodeAt(0) % 10)) % (Math.PI * 2);
          const pulseRadius = 10 + Math.sin(pulseCycle) * 6;
          const pulseAlpha = 0.35 + Math.sin(pulseCycle) * 0.25;

          // Outer ripple halo
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius * (isHovered ? 1.5 : 1.2), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${pulseAlpha * 0.5})`;
          ctx.fill();

          // Second tight halo
          ctx.beginPath();
          ctx.arc(x, y, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
          ctx.fill();

          // Core radiant point of light
          ctx.beginPath();
          ctx.arc(x, y, isHovered ? 4.5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;

          // City Name Badge & Label
          ctx.font = 'bold 12px "Newsreader", serif';
          const labelText = city.name;
          const badgeText = `${momentsCount} ${momentsCount === 1 ? 'recuerdo' : 'recuerdos'}`;

          const textMetrics = ctx.measureText(labelText);
          const badgeMetrics = ctx.measureText(badgeText);
          const labelWidth = Math.max(textMetrics.width, badgeMetrics.width) + 16;
          const labelHeight = 32;

          const lx = x + 10;
          const ly = y - 16;

          // Backdrop for city label
          ctx.fillStyle = isHovered ? 'rgba(36, 25, 16, 0.95)' : 'rgba(18, 14, 11, 0.85)';
          ctx.strokeStyle = isHovered ? 'rgba(245, 158, 11, 0.8)' : 'rgba(217, 119, 6, 0.4)';
          ctx.lineWidth = 1;

          ctx.beginPath();
          // Draw rounded rectangle
          const r = 6;
          ctx.moveTo(lx + r, ly);
          ctx.lineTo(lx + labelWidth - r, ly);
          ctx.quadraticCurveTo(lx + labelWidth, ly, lx + labelWidth, ly + r);
          ctx.lineTo(lx + labelWidth, ly + labelHeight - r);
          ctx.quadraticCurveTo(lx + labelWidth, ly + labelHeight, lx + labelWidth - r, ly + labelHeight);
          ctx.lineTo(lx + r, ly + labelHeight);
          ctx.quadraticCurveTo(lx, ly + labelHeight, lx, ly + labelHeight - r);
          ctx.lineTo(lx, ly + r);
          ctx.quadraticCurveTo(lx, ly, lx + r, ly);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // City name text
          ctx.fillStyle = '#fef3c7';
          ctx.fillText(labelText, lx + 8, ly + 14);

          // Moments subtitle text
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#d97706';
          ctx.fillText(badgeText, lx + 8, ly + 26);
        });
      }

      ctx.restore();
      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [countryFeature, countryInfo, countryCities, countryMoments, places, zoomLevel, panOffset, hoveredCityId, selectedCityId]);

  // Pointer interactions (Hover detection, Drag to pan, Tap to select city)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPanOffset({
        x: dragStartRef.current.startPanX + dx,
        y: dragStartRef.current.startPanY + dy,
      });
      return;
    }

    // Check hover over city beacons
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundCityId: string | null = null;
    const threshold = 28; // Click/hover target radius

    for (const p of projectedCitiesRef.current) {
      const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
      if (dist < threshold || (mouseX >= p.x + 8 && mouseX <= p.x + 120 && mouseY >= p.y - 18 && mouseY <= p.y + 20)) {
        foundCityId = p.city.id;
        break;
      }
    }

    setHoveredCityId(foundCityId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasDragging =
      Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y) > 6;
    isDraggingRef.current = false;

    if (!wasDragging) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (const p of projectedCitiesRef.current) {
        const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
        if (
          dist < 28 ||
          (mouseX >= p.x + 8 && mouseX <= p.x + 120 && mouseY >= p.y - 18 && mouseY <= p.y + 20)
        ) {
          setSelectedCityId(p.city.id);
          onSelectCity(p.city);
          return;
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      id="screen-country-atlas"
      className="relative w-full h-[calc(100vh-4.5rem)] min-h-[580px] overflow-hidden rounded-3xl bg-[#060a12] border border-[#2a221a] shadow-2xl flex flex-col justify-between"
    >
      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
      />

      {/* Floating Top Bar: Breadcrumb + Country Title + Quick Actions */}
      <header className="relative z-10 p-5 sm:p-7 flex flex-wrap items-center justify-between gap-4 pointer-events-none">
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              id="btn-back-globe-top"
              type="button"
              onClick={onBackToGlobe}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b1510]/80 hover:bg-[#281f18] text-amber-200/90 text-xs font-editorial border border-amber-900/40 backdrop-blur-md transition-all shadow-md"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#e5ba79]" />
              <span>Volver al Globo</span>
            </button>
            <span className="text-stone-500 text-xs">•</span>
            <span className="text-xs font-editorial uppercase tracking-wider text-[#e5ba79]">
              Atlas Regional
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl sm:text-4xl drop-shadow-md">{countryInfo?.flag || '🌍'}</span>
            <h1 className="font-editorial text-2xl sm:text-4xl font-bold tracking-tight text-[#fbf6ed] drop-shadow-md">
              {country.name}
            </h1>
            <span className="text-xs font-editorial px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-200">
              {countryCities.length} {countryCities.length === 1 ? 'ciudad iluminada' : 'ciudades iluminadas'}
            </span>
          </div>

          <p className="font-serif-body text-xs sm:text-sm text-stone-300/80 italic max-w-md drop-shadow">
            {country.notes || 'Puntos luminosos marcando las ciudades y recuerdos atesorados en este país.'}
          </p>
        </div>

        {/* Top Right Action Pills */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {countryMoments.length > 0 && onReliveCountry && (
            <button
              id="btn-country-relive-memories"
              type="button"
              onClick={() => onReliveCountry(country)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#f59e0b] hover:to-[#d97706] text-[#24170c] font-editorial font-bold text-xs shadow-lg shadow-amber-950/60 border border-[#fde68a] transition-all"
              title="Abrir la mesa de recuerdos de este país"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#24170c]" />
              <span>Mesa de Recuerdos ({countryMoments.length})</span>
            </button>
          )}

          <button
            id="btn-add-moment-country"
            type="button"
            onClick={() => onOpenAddMoment()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#201812]/90 hover:bg-[#2c221a] text-stone-200 font-editorial font-bold text-xs border border-amber-900/50 backdrop-blur-md transition-all shadow-md"
            title="Añadir nuevo momento en este país en menos de 10 segundos"
          >
            <Plus className="w-3.5 h-3.5 text-[#e5ba79]" />
            <span>Guardar Momento</span>
          </button>
        </div>
      </header>

      {/* Floating Bottom: Constellation of Visited Cities & Zoom controls */}
      <footer className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pointer-events-none">
        {/* Constellation chips of visited cities */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto max-w-2xl">
          <span className="text-xs font-editorial text-amber-200/70 mr-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#e5ba79]" />
            <span>Ciudades:</span>
          </span>

          {countryCities.length > 0 ? (
            countryCities.map((c) => {
              const count = countryMoments.filter((m) => m.cityId === c.id).length;
              const isHovered = hoveredCityId === c.id;
              return (
                <button
                  key={c.id}
                  id={`chip-city-${c.id}`}
                  type="button"
                  onClick={() => onSelectCity(c)}
                  onMouseEnter={() => setHoveredCityId(c.id)}
                  onMouseLeave={() => setHoveredCityId(null)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-editorial transition-all backdrop-blur-md ${
                    isHovered
                      ? 'bg-amber-500/30 text-[#fef3c7] border border-amber-400/70 scale-105 shadow-md shadow-amber-950/40'
                      : 'bg-[#1b1510]/80 text-stone-200 border border-amber-900/40 hover:border-amber-700/60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-bold">{c.name}</span>
                  <span className="text-[10px] text-amber-300/80 bg-amber-950/50 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs font-serif-body italic text-stone-400">
              Ninguna ciudad iluminada todavía.
            </span>
          )}

          <button
            id="btn-add-city-atlas"
            type="button"
            onClick={onOpenAddCity}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 text-xs font-editorial border border-dashed border-amber-700/60 transition-all hover:scale-105"
          >
            <Plus className="w-3 h-3" />
            <span>Iluminar ciudad</span>
          </button>
        </div>

        {/* Map View Controls (Zoom in/out, Reset) */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#1b1510]/85 border border-amber-900/40 backdrop-blur-md pointer-events-auto shadow-lg">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
            className="p-2 text-stone-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Acercar mapa"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
            className="p-2 text-stone-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Alejar mapa"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomLevel(1.0);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-2 text-stone-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Centrar mapa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
