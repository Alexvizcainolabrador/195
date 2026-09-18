import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3Geo from 'd3-geo';
import { CountryRecord, WorldCountryInfo } from '../types';
import {
  COUNTRY_FEATURES,
  CODE_TO_FEATURE,
  CODE_TO_CENTER,
  EXTRA_TERRITORY_FEATURES,
  BASE_WORLD_LAND_FEATURES,
  WORLD_GRATICULE,
  SPHERE_OBJECT,
  findCountryAtCoords,
  ExtendedCountryFeature,
} from '../lib/geoData';
import {
  RotateCw,
  Compass,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Calendar,
  Building2,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';

interface WorldGlobeProps {
  visitedCountries: CountryRecord[];
  onSelectCountry: (countryCodeOrId: string) => void;
  onOpenAddCountry?: (countryCode?: string) => void;
}

export const WorldGlobe: React.FC<WorldGlobeProps> = ({
  visitedCountries,
  onSelectCountry,
  onOpenAddCountry,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction & Camera states
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [activeCountry, setActiveCountry] = useState<{
    feature: ExtendedCountryFeature;
    record?: CountryRecord;
  } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{
    feature: ExtendedCountryFeature;
    record?: CountryRecord;
  } | null>(null);

  // Rotation angles: [yaw (longitude rotation), pitch (latitude rotation)]
  const rotationRef = useRef<[number, number]>([15, -20]);
  const scaleRef = useRef<number>(1.0); // 1.0 = base radius
  const isDraggingRef = useRef<boolean>(false);
  const pointerDownPosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera flight animation target
  const flightTargetRef = useRef<{
    startYaw: number;
    startPitch: number;
    startScale: number;
    targetYaw: number;
    targetPitch: number;
    targetScale: number;
    startTime: number;
    duration: number;
    active: boolean;
    feature?: ExtendedCountryFeature;
  }>({
    startYaw: 0,
    startPitch: 0,
    startScale: 1,
    targetYaw: 0,
    targetPitch: 0,
    targetScale: 1,
    startTime: 0,
    duration: 800,
    active: false,
  });

  // Visited countries map
  const visitedMapRef = useRef<Map<string, CountryRecord>>(new Map());
  useEffect(() => {
    const map = new Map<string, CountryRecord>();
    visitedCountries.forEach((c) => {
      map.set(c.code.toUpperCase(), c);
    });
    visitedMapRef.current = map;
  }, [visitedCountries]);

  // Handle country selection with cinematic rotation and zoom
  const flyToCountry = useCallback(
    (feature: ExtendedCountryFeature, record?: CountryRecord) => {
      setAutoRotate(false);
      setActiveCountry({ feature, record });

      const center = CODE_TO_CENTER.get(feature.properties.code.toUpperCase()) || [
        feature.properties.lng,
        feature.properties.lat,
      ];
      const targetLng = center[0];
      const targetLat = center[1];

      // Orthographic projection requires rotation [-lng, -lat]
      let targetYaw = -targetLng;
      let targetPitch = -targetLat;

      // Clamp pitch to prevent extreme pole distortions
      targetPitch = Math.max(-65, Math.min(65, targetPitch));

      // Calculate shortest angular path for yaw
      let currentYaw = rotationRef.current[0];
      let diff = ((targetYaw - currentYaw + 180) % 360) - 180;
      if (diff < -180) diff += 360;
      targetYaw = currentYaw + diff;

      // Calculate adaptive cinematic zoom scale based on country territory size
      const [[w, s], [e, n]] = feature.bounds;
      const spanLng = Math.abs(e - w);
      const spanLat = Math.abs(n - s);
      const maxSpan = Math.max(spanLng, spanLat);
      const targetScale = Math.max(1.45, Math.min(2.05, 1.35 + 24 / Math.max(12, maxSpan)));

      flightTargetRef.current = {
        startYaw: currentYaw,
        startPitch: rotationRef.current[1],
        startScale: scaleRef.current,
        targetYaw,
        targetPitch,
        targetScale, // Smooth automatic zoom into country territory
        startTime: performance.now(),
        duration: 850,
        active: true,
        feature,
      };
    },
    []
  );

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;

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

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.44;

      // 1. Update Camera Flight or Auto-Rotation
      const now = performance.now();
      const flight = flightTargetRef.current;

      if (flight.active) {
        const elapsed = now - flight.startTime;
        const progress = Math.min(1, elapsed / flight.duration);
        // Quintic ease out for cinematic deceleration
        const ease = 1 - Math.pow(1 - progress, 4);

        rotationRef.current[0] =
          flight.startYaw + (flight.targetYaw - flight.startYaw) * ease;
        rotationRef.current[1] =
          flight.startPitch + (flight.targetPitch - flight.startPitch) * ease;
        scaleRef.current =
          flight.startScale + (flight.targetScale - flight.startScale) * ease;

        if (progress >= 1) {
          flight.active = false;
        }
      } else if (autoRotate && !isDraggingRef.current) {
        rotationRef.current[0] += 0.22; // Gentle constant rotation
      }

      const currentRadius = baseRadius * scaleRef.current;
      const [yaw, pitch] = rotationRef.current;

      // 2. Setup D3 Orthographic Projection & Path Generator
      const projection = d3Geo
        .geoOrthographic()
        .scale(currentRadius)
        .translate([cx, cy])
        .rotate([yaw, pitch, 0])
        .clipAngle(90);

      const path = d3Geo.geoPath(projection, ctx);

      // 3. Draw Cosmic Atmosphere Glow (Outside of Sphere)
      const atmosphereGrad = ctx.createRadialGradient(
        cx,
        cy,
        currentRadius * 0.94,
        cx,
        cy,
        currentRadius * 1.18
      );
      atmosphereGrad.addColorStop(0, 'rgba(14, 165, 233, 0.35)'); // Electric cyan-blue ionosphere
      atmosphereGrad.addColorStop(0.35, 'rgba(2, 132, 199, 0.16)');
      atmosphereGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.05)');
      atmosphereGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = atmosphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // 4. Draw Ocean Sphere Base (Deep Space Obsidian Cosmos)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.clip(); // Restrict everything inside planet sphere

      const oceanGrad = ctx.createRadialGradient(
        cx - currentRadius * 0.3,
        cy - currentRadius * 0.3,
        currentRadius * 0.05,
        cx,
        cy,
        currentRadius
      );
      oceanGrad.addColorStop(0, '#060c18'); // Deep space obsidian center
      oceanGrad.addColorStop(0.65, '#030710');
      oceanGrad.addColorStop(1, '#010306'); // Pitch black space boundary

      ctx.fillStyle = oceanGrad;
      ctx.fillRect(cx - currentRadius, cy - currentRadius, currentRadius * 2, currentRadius * 2);

      // 5. Draw Subtle Graticule Grid Lines (Latitudes & Longitudes)
      ctx.beginPath();
      path(WORLD_GRATICULE);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // 6. Draw Equator & Prime Meridian accents
      ctx.beginPath();
      path(d3Geo.geoCircle().center([0, 0]).radius(90)());
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 0.7;
      ctx.stroke();

      const visitedMap = visitedMapRef.current;
      const activeCode = activeCountry?.feature.properties.code.toUpperCase();
      const hoveredCode = hoveredCountry?.feature.properties.code.toUpperCase();

      // 7. PASS A: Render UNVISITED Land & Countries
      // Mandated styling: Gris oscuro, Baja opacidad, Alto contraste con los países visitados
      ctx.fillStyle = 'rgba(30, 41, 59, 0.45)'; // Charcoal slate with soft opacity
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)'; // Crisp subtle boundaries
      ctx.lineWidth = 0.6;

      // Base world landmasses (Antarctica, global terrain)
      BASE_WORLD_LAND_FEATURES.forEach((landFeature) => {
        ctx.beginPath();
        path(landFeature);
        ctx.fillStyle = 'rgba(28, 36, 50, 0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
        ctx.stroke();
      });

      // Unvisited sovereign countries
      COUNTRY_FEATURES.forEach((feature) => {
        const code = feature.properties.code.toUpperCase();
        if (visitedMap.has(code) || code === activeCode) return; // Handled in illuminated pass

        ctx.beginPath();
        path(feature as any);
        // If hovered, give it a soft subtle slate lift
        if (code === hoveredCode) {
          ctx.fillStyle = 'rgba(51, 65, 85, 0.70)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.60)';
          ctx.lineWidth = 0.9;
          ctx.stroke();
          ctx.lineWidth = 0.6;
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
          ctx.fillStyle = 'rgba(30, 41, 59, 0.45)'; // Reset
        } else {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
          ctx.fill();
          ctx.stroke();
        }
      });

      // Unvisited territories
      EXTRA_TERRITORY_FEATURES.forEach(({ feature, sovereignCode }) => {
        if (visitedMap.has(sovereignCode) || sovereignCode === activeCode) return;
        ctx.beginPath();
        path(feature);
        if (sovereignCode === hoveredCode) {
          ctx.fillStyle = 'rgba(51, 65, 85, 0.70)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.60)';
          ctx.stroke();
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
          ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
        } else {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
          ctx.fill();
          ctx.stroke();
        }
      });

      // 8. PASS B: Render VISITED Countries
      // Mandated styling:
      // - Silueta geográfica real completa (todos los polígonos e islas: España, Japón, Italia, etc.)
      // - Azul brillante
      // - Gradiente luminoso
      // - Ligero brillo exterior
      // - Cero puntos o marcadores: la silueta real es el elemento protagonista

      // Gradient definitions for visited countries
      const visitedBlueGrad = ctx.createLinearGradient(
        cx - currentRadius * 0.7,
        cy - currentRadius * 0.7,
        cx + currentRadius * 0.7,
        cy + currentRadius * 0.7
      );
      visitedBlueGrad.addColorStop(0, '#38bdf8');   // Vivid electric cyan
      visitedBlueGrad.addColorStop(0.35, '#0ea5e9'); // Radiant sky blue
      visitedBlueGrad.addColorStop(0.75, '#0284c7'); // Deep luminous sapphire
      visitedBlueGrad.addColorStop(1, '#0369a1');    // Rich electric azure

      const hoveredBlueGrad = ctx.createLinearGradient(
        cx - currentRadius * 0.7,
        cy - currentRadius * 0.7,
        cx + currentRadius * 0.7,
        cy + currentRadius * 0.7
      );
      hoveredBlueGrad.addColorStop(0, '#7dd3fc');
      hoveredBlueGrad.addColorStop(0.4, '#38bdf8');
      hoveredBlueGrad.addColorStop(1, '#0284c7');

      // Layer 1: Ligero brillo exterior (Radiant blue outer halo)
      ctx.save();
      ctx.shadowColor = 'rgba(14, 165, 233, 0.90)';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 2.2;

      COUNTRY_FEATURES.forEach((feature) => {
        const code = feature.properties.code.toUpperCase();
        if (!visitedMap.has(code) || code === activeCode) return;
        ctx.beginPath();
        path(feature as any);
        ctx.stroke();
      });

      EXTRA_TERRITORY_FEATURES.forEach(({ feature, sovereignCode }) => {
        if (!visitedMap.has(sovereignCode) || sovereignCode === activeCode) return;
        ctx.beginPath();
        path(feature);
        ctx.stroke();
      });
      ctx.restore();

      // Layer 2: Azul brillante + Gradiente interior + Borde costero nítido
      COUNTRY_FEATURES.forEach((feature) => {
        const code = feature.properties.code.toUpperCase();
        if (!visitedMap.has(code) || code === activeCode) return;

        ctx.beginPath();
        path(feature as any);

        // Luminous electric blue gradient fill
        ctx.fillStyle = code === hoveredCode ? hoveredBlueGrad : visitedBlueGrad;
        ctx.fill();

        // Illuminated cyan coastline border
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      });

      // Visited territories (e.g., Greenland when Denmark is visited, French Guiana when France is visited)
      EXTRA_TERRITORY_FEATURES.forEach(({ feature, sovereignCode }) => {
        if (!visitedMap.has(sovereignCode) || sovereignCode === activeCode) return;
        ctx.beginPath();
        path(feature);
        ctx.fillStyle = sovereignCode === hoveredCode ? hoveredBlueGrad : visitedBlueGrad;
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      });

      // 9. PASS C: Render ACTIVE / SELECTED Country
      // Mandated styling:
      // - Glow animado (Pulsating radiant corona)
      // - Resplandor de alta intensidad
      // - Silueta nítida destacada
      if (activeCountry) {
        const pulse = (Math.sin(now * 0.005) + 1) / 2; // 0.0 to 1.0 breathing cycle
        const selectedGlowBlur = 20 + pulse * 18; // 20px to 38px pulsating resplandor

        ctx.save();
        ctx.shadowColor = 'rgba(56, 189, 248, 1.0)';
        ctx.shadowBlur = selectedGlowBlur;

        const activeBeaconGrad = ctx.createLinearGradient(
          cx - currentRadius * 0.5,
          cy - currentRadius * 0.5,
          cx + currentRadius * 0.5,
          cy + currentRadius * 0.5
        );
        activeBeaconGrad.addColorStop(0, '#e0f2fe'); // Radiant white-cyan beacon core
        activeBeaconGrad.addColorStop(0.35, '#38bdf8'); // Pure electric blue
        activeBeaconGrad.addColorStop(1, '#0284c7'); // Sapphire azure

        ctx.beginPath();
        path(activeCountry.feature as any);

        ctx.fillStyle = activeBeaconGrad;
        ctx.fill();

        // Resplandor animated white-cyan border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4 + pulse * 1.0;
        ctx.stroke();

        // Also illuminate its territories if any
        EXTRA_TERRITORY_FEATURES.forEach(({ feature, sovereignCode }) => {
          if (sovereignCode === activeCode) {
            ctx.beginPath();
            path(feature);
            ctx.fillStyle = activeBeaconGrad;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.2 + pulse * 0.8;
            ctx.stroke();
          }
        });

        ctx.restore();
      }

      // 10. Specular Shading for realistic 3D sphere curvature
      const specularGrad = ctx.createRadialGradient(
        cx - currentRadius * 0.45,
        cy - currentRadius * 0.45,
        0,
        cx,
        cy,
        currentRadius
      );
      specularGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      specularGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
      specularGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0.3)');
      specularGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');

      ctx.fillStyle = specularGrad;
      ctx.fillRect(cx - currentRadius, cy - currentRadius, currentRadius * 2, currentRadius * 2);

      ctx.restore(); // Exit sphere clipping

      // 11. Delicate rim border of the planet
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [autoRotate, activeCountry, hoveredCountry]);

  // Pointer Handlers (Smooth drag, hover, and click detection)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    flightTargetRef.current.active = false; // Interrupt flight if user grabs
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;

      // Sensitivity factor
      const sensitivity = 0.38 / (scaleRef.current || 1);
      rotationRef.current[0] += dx * sensitivity;
      rotationRef.current[1] = Math.max(
        -70,
        Math.min(70, rotationRef.current[1] - dy * sensitivity)
      );

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // Hover detection
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const cx = canvas.clientWidth / 2;
      const cy = canvas.clientHeight / 2;
      const currentRadius = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.43 * scaleRef.current;

      const dist = Math.hypot(mouseX - cx, mouseY - cy);
      if (dist <= currentRadius) {
        const projection = d3Geo
          .geoOrthographic()
          .scale(currentRadius)
          .translate([cx, cy])
          .rotate([rotationRef.current[0], rotationRef.current[1], 0])
          .clipAngle(90);

        const inverted = projection.invert([mouseX, mouseY]);
        if (inverted) {
          const visitedCodesSet = new Set<string>(Array.from(visitedMapRef.current.keys()));
          const found = findCountryAtCoords(inverted[0], inverted[1], visitedCodesSet);
          if (found) {
            const record = visitedMapRef.current.get(found.properties.code.toUpperCase());
            setHoveredCountry({ feature: found, record });
            return;
          }
        }
      }
      setHoveredCountry(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
      const dt = performance.now() - pointerDownPosRef.current.time;
      isDraggingRef.current = false;

      // Considered a click if movement was under 8px and quick
      if (dx < 8 && dy < 8 && dt < 400) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const cx = canvas.clientWidth / 2;
        const cy = canvas.clientHeight / 2;
        const currentRadius = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.44 * scaleRef.current;

        const dist = Math.hypot(mouseX - cx, mouseY - cy);
        if (dist <= currentRadius) {
          const projection = d3Geo
            .geoOrthographic()
            .scale(currentRadius)
            .translate([cx, cy])
            .rotate([rotationRef.current[0], rotationRef.current[1], 0])
            .clipAngle(90);

          const inverted = projection.invert([mouseX, mouseY]);
          if (inverted) {
            const visitedCodesSet = new Set<string>(Array.from(visitedMapRef.current.keys()));
            const hit = findCountryAtCoords(inverted[0], inverted[1], visitedCodesSet);
            if (hit) {
              const record = visitedMapRef.current.get(hit.properties.code.toUpperCase());
              flyToCountry(hit, record);
              return;
            }
          }
        }
        // Clicked on deep ocean: dismiss active card and return zoom to normal
        setActiveCountry(null);
        scaleRef.current = 1.0;
      }
    }
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    scaleRef.current = Math.max(0.85, Math.min(2.0, scaleRef.current + zoomDelta));
  };

  return (
    <div
      id="globe-container"
      className="relative w-full aspect-square max-w-[620px] mx-auto flex items-center justify-center select-none touch-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing rounded-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Floating HUD Controls (Apple Vision Pro Glassmorphism) */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          id="toggle-auto-rotate-btn"
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2.5 rounded-full backdrop-blur-xl border transition-all text-xs flex items-center justify-center shadow-lg ${
            autoRotate
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10'
              : 'bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800/80'
          }`}
          title={autoRotate ? 'Pausar rotación del planeta' : 'Activar rotación suave'}
        >
          <RotateCw
            className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`}
            style={{ animationDuration: '8s' }}
          />
        </button>

        <button
          id="reset-orientation-btn"
          type="button"
          onClick={() => {
            flightTargetRef.current = {
              startYaw: rotationRef.current[0],
              startPitch: rotationRef.current[1],
              startScale: scaleRef.current,
              targetYaw: 15,
              targetPitch: -20,
              targetScale: 1.0,
              startTime: performance.now(),
              duration: 700,
              active: true,
            };
            setActiveCountry(null);
          }}
          className="p-2.5 rounded-full backdrop-blur-xl bg-slate-900/60 text-slate-300 border border-white/10 hover:bg-slate-800/80 transition-all text-xs shadow-lg"
          title="Centrar planeta"
        >
          <Compass className="w-4 h-4" />
        </button>

        <button
          id="zoom-in-btn"
          type="button"
          onClick={() => {
            scaleRef.current = Math.min(2.0, scaleRef.current + 0.2);
          }}
          className="p-2.5 rounded-full backdrop-blur-xl bg-slate-900/60 text-slate-300 border border-white/10 hover:bg-slate-800/80 transition-all text-xs shadow-lg"
          title="Acercar planeta"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          id="zoom-out-btn"
          type="button"
          onClick={() => {
            scaleRef.current = Math.max(0.85, scaleRef.current - 0.2);
          }}
          className="p-2.5 rounded-full backdrop-blur-xl bg-slate-900/60 text-slate-300 border border-white/10 hover:bg-slate-800/80 transition-all text-xs shadow-lg"
          title="Alejar planeta"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Tooltip (Subtle tag while roaming) */}
      {hoveredCountry && !activeCountry && (
        <div
          id="globe-country-tooltip"
          className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full backdrop-blur-2xl bg-slate-950/80 border border-white/15 text-white text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none animate-fadeIn"
        >
          <span className="text-base">{hoveredCountry.feature.properties.flag}</span>
          <span className="font-semibold tracking-tight">{hoveredCountry.feature.properties.name}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
              hoveredCountry.record
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
            }`}
          >
            {hoveredCountry.record ? 'Silueta Iluminada' : 'Por Descubrir'}
          </span>
        </div>
      )}

      {/* Elegant Apple Vision Pro Docked Glassmorphic Country Preview Card
          Shown upon tapping/clicking a country:
          "Cuando un país tiene foto:
           - Mostrar la foto elegida al pulsar el país.
           - No mostrar la foto como un pin flotante.
           Al tocar un país:
           1. El país se ilumina.
           2. El globo rota automáticamente hacia él.
           3. Zoom suave.
           4. Se abre CountryDetail."
      */}
      {activeCountry && (
        <div
          id="globe-country-preview-card"
          className="absolute -bottom-2 left-2 right-2 sm:left-4 sm:right-4 p-3.5 sm:p-4 rounded-3xl backdrop-blur-3xl bg-slate-950/85 border border-white/20 shadow-2xl text-white flex flex-col sm:flex-row items-center gap-3.5 z-20 animate-slideUp"
        >
          {/* Close / Dismiss button */}
          <button
            type="button"
            onClick={() => {
              setActiveCountry(null);
              scaleRef.current = 1.0;
            }}
            className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* If the country has a photo, show it elegantly framed (NOT as a pin on the globe) */}
          {activeCountry.record?.coverPhoto ? (
            <div className="relative w-full sm:w-28 h-24 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-white/15 shadow-md">
              <img
                src={activeCountry.record.coverPhoto}
                alt={activeCountry.feature.properties.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1 left-2 text-xl drop-shadow-md">
                {activeCountry.feature.properties.flag}
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800/90 border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              {activeCountry.feature.properties.flag}
            </div>
          )}

          {/* Info & Stats */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                {activeCountry.feature.properties.name}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  activeCountry.record
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {activeCountry.record ? 'Parte de tu planeta' : 'No visitado'}
              </span>
            </div>

            {activeCountry.record ? (
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {activeCountry.record.firstVisitDate}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {activeCountry.record.visitCount || 1}{' '}
                  {activeCountry.record.visitCount === 1 ? 'visita' : 'visitas'}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">
                Territorio listo para ser iluminado con tus recuerdos y lugares
              </p>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
            {activeCountry.record ? (
              <button
                id="btn-open-country-detail"
                type="button"
                onClick={() => onSelectCountry(activeCountry.record!.code)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Entrar al País</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                id="btn-add-country-from-globe"
                type="button"
                onClick={() => {
                  if (onOpenAddCountry) {
                    onOpenAddCountry(activeCountry.feature.properties.code);
                  } else {
                    onSelectCountry(activeCountry.feature.properties.code);
                  }
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-white/10 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Iluminar País</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interaction Hint */}
      {!activeCountry && (
        <div className="absolute bottom-2 right-3 text-[10px] text-slate-400/60 font-mono tracking-wider pointer-events-none">
          Toca una nación · Arrastra para girar
        </div>
      )}
    </div>
  );
};
