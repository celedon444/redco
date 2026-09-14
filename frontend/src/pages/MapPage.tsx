import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import * as L from 'leaflet';
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from 'react-leaflet';

import ElapsedTimer from '@/components/ElapsedTimer';
import { useCountUp } from '@/hooks/useCountUp';
import { useMapOverview } from '@/hooks/useMapOverview';
import {
  RESOURCE_BY_KIND,
  RESOURCE_KEYS,
  SEVERITY_LEVELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  ZONE_COLORS,
  ZONE_LEVELS,
  formatCoords,
  formatDate,
  pointToLatLng,
  polygonToLatLngs,
  zoneCentroid,
  type Coords,
  type StatsShape,
} from '@/lib/overview';
import type {
  GeoJsonFeature,
  MapOverview,
  ResourceFeatureProperties,
  ResourceKind,
  ZoneFeatureProperties,
} from '@/types/map';

// ---------------------------------------------------------------------
// Configuración visual
// ---------------------------------------------------------------------

const DEFAULT_VISIBLE: Record<string, boolean> = {
  zones: true,
  coverage: true,
  routes: true,
  distance: true,
  heat: false,
  ...Object.fromEntries(RESOURCE_KEYS.map((key) => [key, true])),
};

const AUTO_REFRESH_SECONDS = 30;

const epicenterIcon = L.divIcon({
  className: 'epicenter-icon-wrapper',
  html: '<div class="epicenter-icon"><div class="epicenter-ring"></div><div class="epicenter-ring2"></div><div class="epicenter-radar"></div><div class="epicenter-core"></div></div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// ---------------------------------------------------------------------
// Ajuste de la vista al contenido
// ---------------------------------------------------------------------

function MapBounds({ overview }: { overview: MapOverview | null }) {
  const map = useMap();

  const latlngs = useMemo(() => {
    const points: Coords[] = [];
    if (overview?.incident?.epicenter) {
      const point = pointToLatLng(overview.incident.epicenter.geometry);
      if (point) points.push(point);
    }
    overview?.zones.features.forEach((feature) => {
      polygonToLatLngs(feature.geometry).forEach((ring) => points.push(...ring));
    });
    return points;
  }, [overview]);

  useEffect(() => {
    if (latlngs.length === 0) return;
    const bounds = L.latLngBounds(latlngs);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15, animate: true });
    }
  }, [map, latlngs]);

  return null;
}

// ---------------------------------------------------------------------
// Capas avanzadas: distancia al epicentro y calor de población
// ---------------------------------------------------------------------

const DISTANCE_RINGS = [
  { radius: 1000, label: '1 km' },
  { radius: 3000, label: '3 km' },
  { radius: 6000, label: '6 km' },
  { radius: 12000, label: '12 km' },
];

const ringLabelIcon = (label: string) =>
  L.divIcon({
    className: '',
    html: `<div class="ring-label">${label}</div>`,
    iconSize: [56, 20],
    iconAnchor: [0, 10],
  });

function DistanceRingsLayer({ epicenter }: { epicenter: Coords }) {
  const kmPerDegLng = 111.32 * Math.cos((epicenter[0] * Math.PI) / 180);
  return (
    <>
      {DISTANCE_RINGS.map((ring) => {
        const labelPos: Coords = [
          epicenter[0],
          epicenter[1] + ring.radius / 1000 / kmPerDegLng,
        ];
        return (
          <Fragment key={ring.radius}>
            <Circle
              center={epicenter}
              radius={ring.radius}
              pathOptions={{
                color: '#fb7185',
                weight: 1.5,
                opacity: 0.4,
                dashArray: '2 6',
                fill: false,
              }}
              interactive={false}
            />
            <Marker position={labelPos} icon={ringLabelIcon(ring.label)} />
          </Fragment>
        );
      })}
    </>
  );
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pointInRing(lat: number, lng: number, ring: Coords[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function HeatLayer({
  zones,
}: {
  zones: GeoJsonFeature<ZoneFeatureProperties>[];
}) {
  const dots = useMemo(() => {
    const maxPop = Math.max(
      1,
      ...zones.map((zone) => zone.properties.estimatedAffected ?? 0),
    );
    const samples: {
      key: string;
      center: Coords;
      color: string;
      radius: number;
      opacity: number;
    }[] = [];
    zones.forEach((zone, zoneIndex) => {
      const ring = polygonToLatLngs(zone.geometry)[0];
      if (!ring || ring.length < 3) return;
      const color = ZONE_COLORS[zone.properties.level].fill;
      const rng = mulberry32(zoneIndex * 7919 + 13);
      const lats = ring.map((point) => point[0]);
      const lngs = ring.map((point) => point[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const population = zone.properties.estimatedAffected ?? 0;
      const count =
        Math.max(6, Math.min(22, Math.round((population / maxPop) * 16) + 6));
      let placed = 0;
      let attempts = 0;
      while (placed < count && attempts < 4000) {
        attempts += 1;
        const lat = minLat + rng() * (maxLat - minLat);
        const lng = minLng + rng() * (maxLng - minLng);
        if (!pointInRing(lat, lng, ring)) continue;
        samples.push({
          key: `${zone.properties.id}-${placed}`,
          center: [lat, lng],
          color,
          radius: 140 + rng() * 170,
          opacity: 0.16 + rng() * 0.2,
        });
        placed += 1;
      }
    });
    return samples;
  }, [zones]);

  return (
    <>
      {dots.map((dot) => (
        <Circle
          key={dot.key}
          center={dot.center}
          radius={dot.radius}
          pathOptions={{
            color: dot.color,
            fillColor: dot.color,
            fillOpacity: dot.opacity,
            weight: 0,
          }}
          interactive={false}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------
// Zona de afectación (polígono interactivo)
// ---------------------------------------------------------------------

function ZonePolygon({
  feature,
}: {
  feature: GeoJsonFeature<ZoneFeatureProperties>;
}) {
  const [hovered, setHovered] = useState(false);
  const color = ZONE_COLORS[feature.properties.level];
  const positions = polygonToLatLngs(feature.geometry);
  if (positions.length === 0) return null;

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: hovered ? color.fill : color.stroke,
        weight: hovered ? 3 : 1.5,
        fillColor: color.fill,
        fillOpacity: hovered ? 0.6 : 0.35,
      }}
      eventHandlers={{
        mouseover: () => setHovered(true),
        mouseout: () => setHovered(false),
      }}
    >
      <Tooltip direction="center" opacity={1} sticky>
        <div className="font-semibold text-white">
          {feature.properties.name}
        </div>
        <div className="text-slate-300">
          Nivel:{' '}
          <span className="font-medium" style={{ color: color.fill }}>
            {color.label}
          </span>
        </div>
        {feature.properties.estimatedAffected != null && (
          <div className="text-slate-300">
            Población:{' '}
            {feature.properties.estimatedAffected.toLocaleString('es-CO')}
          </div>
        )}
        {feature.properties.description && (
          <div className="mt-1 max-w-[220px] text-slate-400">
            {feature.properties.description}
          </div>
        )}
      </Tooltip>
    </Polygon>
  );
}

function ZonesLayer({
  features,
}: {
  features: GeoJsonFeature<ZoneFeatureProperties>[];
}) {
  return (
    <>
      {features.map((feature) => (
        <ZonePolygon key={feature.properties.id} feature={feature} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------
// Cobertura de hospitales (círculos) y rutas hacia zonas
// ---------------------------------------------------------------------

const COVERAGE_RADIUS = 4000;

function CoverageLayer({
  features,
}: {
  features: GeoJsonFeature<ResourceFeatureProperties>[];
}) {
  return (
    <>
      {features.map((feature) => {
        const center = pointToLatLng(feature.geometry);
        if (!center) return null;
        const color = '#f43f5e';
        return (
          <Circle
            key={`coverage-${feature.properties.id}`}
            center={center}
            radius={COVERAGE_RADIUS}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '6 8',
            }}
            interactive={false}
          >
            <Tooltip direction="top">
              <div className="font-semibold text-white">📡 Cobertura</div>
              <div className="text-slate-300">{feature.properties.name}</div>
              <div className="text-slate-400">~4 km radio</div>
            </Tooltip>
          </Circle>
        );
      })}
    </>
  );
}

const ROUTE_COLORS: Record<string, string> = {
  CRITICAL: '#f43f5e',
  HIGH: '#fb923c',
  MODERATE: '#facc15',
  LOW: '#4ade80',
};

function RoutesLayer({
  hospitals,
  zones,
}: {
  hospitals: GeoJsonFeature<ResourceFeatureProperties>[];
  zones: GeoJsonFeature<ZoneFeatureProperties>[];
}) {
  const lines = useMemo(() => {
    const result: {
      key: string;
      from: Coords;
      to: Coords;
      color: string;
      level: string;
    }[] = [];
    zones.forEach((zone) => {
      const centroid = zoneCentroid(zone.geometry);
      if (!centroid) return;
      const color = ROUTE_COLORS[zone.properties.level] ?? '#60a5fa';
      hospitals.forEach((hospital) => {
        const from = pointToLatLng(hospital.geometry);
        if (!from) return;
        result.push({
          key: `${hospital.properties.id}-${zone.properties.id}`,
          from,
          to: centroid,
          color,
          level: zone.properties.level,
        });
      });
    });
    return result;
  }, [hospitals, zones]);

  return (
    <>
      {lines.map((line) => (
        <Polyline
          key={line.key}
          positions={[line.from, line.to]}
          pathOptions={{
            color: line.color,
            weight: 2,
            opacity: 0.5,
            dashArray: '4 8',
          }}
          interactive={false}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------
// Recursos (hospitales, ambulancias, bomberos...)
// ---------------------------------------------------------------------

function buildResourceIcon(kind: ResourceKind, index: number): L.DivIcon {
  const config = RESOURCE_BY_KIND[kind];
  return L.divIcon({
    className: '',
    html: `<div class="resource-marker" style="border-color:${config.color};color:${config.color};animation-delay:${(
      0.25 +
      index * 0.07
    ).toFixed(2)}s">${config.emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function ResourcesLayer({
  features,
}: {
  features: GeoJsonFeature<ResourceFeatureProperties>[];
}) {
  return (
    <>
      {features.map((feature, index) => {
        const position = pointToLatLng(feature.geometry);
        if (!position) return null;
        const { kind, name, status, organizationName, assignmentStatus } =
          feature.properties;
        const config = RESOURCE_BY_KIND[kind];
        return (
          <Marker
            key={feature.properties.id}
            position={position}
            icon={buildResourceIcon(kind, index)}
          >
            <Tooltip direction="top" opacity={1}>
              <div className="font-semibold text-white">
                <span className="mr-1">{config.emoji}</span>
                {name}
              </div>
              {organizationName && (
                <div className="text-slate-300">{organizationName}</div>
              )}
              <div className="text-slate-400">
                {config.label} ·{' '}
                <span className="capitalize">{status.toLowerCase()}</span>
                {assignmentStatus === 'ACTIVE' && (
                  <span className="ml-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">
                    En zona
                  </span>
                )}
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------
// Medidor de severidad
// ---------------------------------------------------------------------

function SeverityMeter({
  severity,
  label,
}: {
  severity: string;
  label: string;
}) {
  const index = SEVERITY_LEVELS.indexOf(severity);
  const level = Math.max(0, index);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span>Índice de severidad</span>
        <span className="text-rose-300">{label}</span>
      </div>
      <div className="flex gap-1">
        {SEVERITY_LEVELS.map((lvl, i) => (
          <div
            key={lvl}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: i <= level ? '100%' : '0%',
                background: ZONE_COLORS[lvl as keyof typeof ZONE_COLORS].fill,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tarjeta del incidente (hero)
// ---------------------------------------------------------------------

function IncidentCard({
  overview,
  refreshing,
  countdown,
  onRefresh,
}: {
  overview: MapOverview;
  refreshing: boolean;
  countdown: number;
  onRefresh: () => void;
}) {
  const { incident } = overview;
  if (!incident) return null;

  const epicenter = incident.epicenter
    ? pointToLatLng(incident.epicenter.geometry)
    : null;

  return (
    <div className="hero-border panel-in absolute left-3 top-3 z-[1000] w-[21rem] max-w-[calc(100vw-1.5rem)]">
      <div
        className="glass relative overflow-hidden p-4 text-white"
        style={{ borderRadius: 'calc(1rem - 1px)' }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-rose-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-orange-500/15 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              <span className="live-dot relative inline-block h-2 w-2 rounded-full bg-emerald-400" />
              {STATUS_LABELS[incident.status] ?? incident.status} · en vivo
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              title="Actualizar datos"
            >
              <svg
                className={refreshing ? 'animate-spin' : ''}
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
              <span className="font-mono tabular-nums">{countdown}s</span>
            </button>
          </div>

          <h2 className="mt-2 text-lg font-bold leading-snug text-white">
            {incident.title}
          </h2>

          <div className="mt-3 flex items-center gap-2">
            {incident.magnitude != null && (
              <div className="rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 px-3.5 py-2 text-center shadow-lg shadow-rose-500/30">
                <div className="text-2xl font-extrabold leading-none text-white drop-shadow">
                  {incident.magnitude.toFixed(1)}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-100">
                  Magnitud Mw
                </div>
              </div>
            )}
            <div className="flex flex-1 flex-col justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                </span>
                Evento sismo
              </div>
              <div className="text-[10px] leading-tight text-slate-400">
                Terremoto principal
              </div>
            </div>
          </div>

          <div className="mt-3">
            <SeverityMeter
              severity={incident.severity}
              label={
                SEVERITY_LABELS[incident.severity] ?? incident.severity
              }
            />
          </div>

          <dl className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-400">
                <span>⏱️</span> Transcurrido
              </dt>
              <dd className="font-medium text-emerald-300">
                <ElapsedTimer startedAt={incident.startedAt} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-slate-400">
                <span>📅</span> Inicio del evento
              </dt>
              <dd className="font-medium text-slate-200">
                {formatDate(incident.startedAt)}
              </dd>
            </div>
            {epicenter && (
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-slate-400">
                  <span>📍</span> Epicentro
                </dt>
                <dd className="font-mono font-medium text-slate-200">
                  {formatCoords(epicenter)}
                </dd>
              </div>
            )}
          </dl>

          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
            {incident.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------

function StatChip({
  icon,
  label,
  value,
  delay,
  accent,
}: {
  icon: string;
  label: string;
  value: number;
  delay: number;
  accent?: string;
}) {
  const text = useCountUp(value, 1200 + delay);
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className="grid h-7 w-7 place-items-center rounded-lg text-sm"
        style={
          accent
            ? {
                background: `${accent}22`,
                boxShadow: `inset 0 0 0 1px ${accent}44`,
              }
            : { background: 'rgba(255,255,255,0.08)' }
        }
      >
        {icon}
      </span>
      <div className="leading-none">
        <div className="text-sm font-bold tabular-nums">{text}</div>
        <div className="mt-0.5 text-[10px] text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function StatsBar({
  overview,
  stats,
  populationAffected,
  hospitals,
  ambulances,
}: {
  overview: MapOverview;
  stats: StatsShape;
  populationAffected: number;
  hospitals: number;
  ambulances: number;
}) {
  const unitsByStatus = stats.unitsByStatus ?? {};
  const totalUnits = overview.resources.features.filter(
    (feature) => feature.properties.category === 'unit',
  ).length;

  return (
    <div className="panel-in pointer-events-none absolute bottom-3 left-3 z-[1000] flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center gap-2 px-3 py-2">
      <StatChip
        icon="🗺️"
        label="Zonas"
        value={stats.totalZones ?? 0}
        delay={200}
      />
      <StatChip
        icon="👥"
        label="Población afectada"
        value={populationAffected}
        delay={280}
      />
      <StatChip
        icon="🏥"
        label="Hospitales"
        value={hospitals}
        delay={360}
        accent="#fb7185"
      />
      <StatChip
        icon="🚑"
        label="Ambulancias"
        value={ambulances}
        delay={440}
        accent="#22d3ee"
      />
      <StatChip
        icon="🚨"
        label="Unidades"
        value={totalUnits}
        delay={520}
        accent="#a78bfa"
      />
      <StatChip
        icon="✅"
        label="Disponibles"
        value={unitsByStatus.AVAILABLE ?? 0}
        delay={600}
        accent="#10b981"
      />
      <StatChip
        icon="⚠️"
        label="Asignadas"
        value={unitsByStatus.ASSIGNED ?? 0}
        delay={680}
        accent="#fb923c"
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Panel de capas
// ---------------------------------------------------------------------

function LayersPanel({
  visible,
  counts,
  zonesByLevel,
  onToggle,
}: {
  visible: Record<string, boolean>;
  counts: Record<string, number>;
  zonesByLevel: Record<string, number>;
  onToggle: (key: string) => void;
}) {
  const maxZones = Math.max(
    1,
    ...ZONE_LEVELS.map((lvl) => zonesByLevel[lvl] ?? 0),
  );

  return (
    <div
      className="glass glass-scroll panel-in absolute right-3 top-3 z-[1000] max-h-[calc(100vh-2rem)] w-60 overflow-y-auto p-3 text-white"
      style={{ animationDelay: '0.22s' }}
    >
      <div className="mb-2 flex items-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
        <h3 className="text-sm font-semibold text-white">Capas</h3>
      </div>

      <button
        type="button"
        onClick={() => onToggle('zones')}
        className={`mb-2 flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-all duration-300 ${
          visible.zones
            ? 'border-rose-400/30 bg-rose-500/10 text-white shadow-lg shadow-rose-500/10'
            : 'border-white/10 bg-white/5 text-slate-400'
        }`}
      >
        <span
          className="h-3 w-3 shrink-0 rounded-sm"
          style={{
            background: 'linear-gradient(135deg,#f43f5e,#fb923c,#facc15,#4ade80)',
            boxShadow: '0 0 8px rgba(244,63,94,0.4)',
          }}
        />
        Zonas de afectación
        <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums">
          {counts.zones ?? 0}
        </span>
      </button>

      <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 pl-1">
        {ZONE_LEVELS.map((level) => {
          const count = zonesByLevel[level] ?? 0;
          const width = Math.round((count / maxZones) * 100);
          return (
            <div key={level} className="flex items-center gap-1.5">
              <span
                className="h-1 w-1 shrink-0 rounded-full"
                style={{
                  background: ZONE_COLORS[level].fill,
                  boxShadow: `0 0 5px ${ZONE_COLORS[level].fill}`,
                }}
              />
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${width}%`,
                    background: ZONE_COLORS[level].fill,
                  }}
                />
              </div>
              <span className="w-4 text-right text-[9px] tabular-nums text-slate-400">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mb-3 border-t border-white/10 pt-1">
        <button
          type="button"
          onClick={() => onToggle('coverage')}
          className={`mb-1.5 flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-all duration-300 ${
            visible.coverage
              ? 'border-rose-400/30 bg-rose-500/10 text-white'
              : 'border-white/10 bg-white/5 text-slate-400'
          }`}
        >
          <span className="text-sm leading-none">📡</span>
          Cobertura hospitales
        </button>
        <button
          type="button"
          onClick={() => onToggle('routes')}
          className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-all duration-300 ${
            visible.routes
              ? 'border-sky-400/30 bg-sky-500/10 text-white'
              : 'border-white/10 bg-white/5 text-slate-400'
          }`}
        >
          <span className="text-sm leading-none">🗺️</span>
          Rutas hacia zonas
        </button>
        <button
          type="button"
          onClick={() => onToggle('distance')}
          className={`mb-1.5 mt-1.5 flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-all duration-300 ${
            visible.distance
              ? 'border-amber-400/30 bg-amber-500/10 text-white'
              : 'border-white/10 bg-white/5 text-slate-400'
          }`}
        >
          <span className="text-sm leading-none">📏</span>
          Distancia epicentro
          <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums">
            {counts.distance ?? 0}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onToggle('heat')}
          className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-all duration-300 ${
            visible.heat
              ? 'border-orange-400/30 bg-orange-500/10 text-white'
              : 'border-white/10 bg-white/5 text-slate-400'
          }`}
        >
          <span className="text-sm leading-none">🔥</span>
          Calor de población
          <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums">
            {counts.heat ?? 0}
          </span>
        </button>
      </div>

      <div className="space-y-1">
        {RESOURCE_KEYS.map((kind, index) => (
          <button
            key={kind}
            type="button"
            onClick={() => onToggle(kind)}
            className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-all duration-300 ${
              visible[kind]
                ? 'border-white/15 bg-white/10 text-white'
                : 'border-white/5 bg-transparent text-slate-500'
            }`}
            style={{ transitionDelay: `${index * 8}ms` }}
          >
            <span className="text-sm leading-none">
              {RESOURCE_BY_KIND[kind].emoji}
            </span>
            <span className="truncate">{RESOURCE_BY_KIND[kind].label}</span>
            <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums">
              {counts[kind] ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Leyenda
// ---------------------------------------------------------------------

function Legend() {
  return (
    <div
      className="glass panel-in pointer-events-none absolute bottom-16 left-3 z-[1000] px-3 py-2 text-xs text-white"
      style={{ animationDelay: '0.38s' }}
    >
      <div className="mb-1 font-semibold text-slate-300">
        Nivel de afectación
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {ZONE_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                background: ZONE_COLORS[level].fill,
                boxShadow: `0 0 6px ${ZONE_COLORS[level].fill}66`,
              }}
            />
            <span className="text-slate-200">{ZONE_COLORS[level].label}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 border-t border-white/10 pt-1.5">
        <span
          className="epicenter-icon"
          style={{
            width: 18,
            height: 18,
            position: 'relative',
            display: 'inline-block',
          }}
        >
          <span className="epicenter-ring" />
          <span className="epicenter-core" />
        </span>
        <span className="text-slate-200">Epicentro</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------

const DEFAULT_CENTER: Coords = [4.6534, -74.0836];

export default function MapPage() {
  const { overview, loading, error, reload } = useMapOverview();
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(DEFAULT_VISIBLE);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          void reload();
          return AUTO_REFRESH_SECONDS;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [reload]);

  const toggleLayer = useCallback(
    (key: string) => setVisible((prev) => ({ ...prev, [key]: !prev[key] })),
    [],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCountdown(AUTO_REFRESH_SECONDS);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  const stats = useMemo(() => (overview?.stats ?? {}) as StatsShape, [overview]);
  const resourcesByKind = useMemo(() => stats.resourcesByKind ?? {}, [stats]);
  const zonesByLevel = useMemo(() => stats.zonesByLevel ?? {}, [stats]);

  const populationAffected =
    overview?.zones.features.reduce(
      (acc, feature) => acc + (feature.properties.estimatedAffected ?? 0),
      0,
    ) ?? 0;

  const visibleZones = visible.zones ? (overview?.zones.features ?? []) : [];
  const visibleResources =
    overview?.resources.features.filter(
      (feature) => visible[feature.properties.kind],
    ) ?? [];

  const counts = useMemo(
    () => ({
      zones: overview?.zones.features.length ?? 0,
      distance: DISTANCE_RINGS.length,
      heat: populationAffected,
      ...resourcesByKind,
    }),
    [overview, resourcesByKind, populationAffected],
  );

  if (loading) {
    return (
      <div className="app-bg flex h-full items-center justify-center text-white">
        <div className="panel-in w-64 text-center">
          <div className="animate-soft-float mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 shadow-2xl shadow-rose-900/50">
            <span className="text-3xl">🛰️</span>
          </div>
          <h2 className="mt-4 text-lg font-bold">REDCO</h2>
          <p className="mb-4 text-sm text-slate-400">
            Cargando mapa de emergencias…
          </p>
          <div className="shimmer-bar h-1.5 w-full" />
        </div>
      </div>
    );
  }

  if (error || !overview || !overview.incident) {
    return (
      <div className="app-bg flex h-full items-center justify-center text-white">
        <div className="glass panel-in max-w-md p-6 text-center">
          <div className="animate-soft-float mb-2 inline-block text-4xl">🛰️</div>
          <h2 className="mb-1 text-lg font-semibold">Mapa no disponible</h2>
          <p className="text-sm text-slate-400">
            {error ??
              'No hay un sismo con zonas de afectación registrado. Ejecuta el seed del backend para cargar los datos demo.'}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 rounded-lg bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition hover:from-rose-500 hover:to-orange-400"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { incident } = overview;
  const epicenter = pointToLatLng(incident.epicenter?.geometry ?? null);

  return (
    <div className="relative h-full bg-[#d6d6d6]">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        minZoom={5}
        maxBounds={[
          [-4.5, -79.5],
          [13.5, -66.5],
        ]}
        maxBoundsViscosity={1}
        className="h-full w-full"
        scrollWheelZoom
        attributionControl={false}
      >
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" />
        <MapBounds overview={overview} />
        {visible.heat && <HeatLayer zones={overview.zones.features} />}
        {visible.zones && <ZonesLayer features={visibleZones} />}
        <ResourcesLayer features={visibleResources} />
        {visible.coverage && (
          <CoverageLayer
            features={overview.resources.features.filter(
              (feature) => feature.properties.kind === 'hospital',
            )}
          />
        )}
        {visible.routes && (
          <RoutesLayer
            hospitals={overview.resources.features.filter(
              (feature) => feature.properties.kind === 'hospital',
            )}
            zones={overview.zones.features.filter(
              (feature) =>
                feature.properties.level === 'CRITICAL' ||
                feature.properties.level === 'HIGH',
            )}
          />
        )}
        {visible.distance && epicenter && (
          <DistanceRingsLayer epicenter={epicenter} />
        )}
        {epicenter && (
          <Marker position={epicenter} icon={epicenterIcon}>
            <Tooltip direction="top" offset={[0, -22]} opacity={1}>
              <div className="font-semibold text-white">📍 Epicentro</div>
              <div className="text-slate-300">{incident.title}</div>
              {incident.magnitude != null && (
                <div className="text-slate-300">
                  Magnitud:{' '}
                  <span className="font-medium">{incident.magnitude} Mw</span>
                </div>
              )}
            </Tooltip>
          </Marker>
        )}
        <ZoomControl position="bottomright" />
      </MapContainer>

      <IncidentCard
        overview={overview}
        refreshing={refreshing}
        countdown={countdown}
        onRefresh={handleRefresh}
      />
      <LayersPanel
        visible={visible}
        counts={counts}
        zonesByLevel={zonesByLevel}
        onToggle={toggleLayer}
      />
      <StatsBar
        overview={overview}
        stats={stats}
        populationAffected={populationAffected}
        hospitals={resourcesByKind.hospital ?? 0}
        ambulances={resourcesByKind.ambulance ?? 0}
      />
      <Legend />

      <div className="pointer-events-none absolute bottom-1 left-1/2 z-[1000] -translate-x-1/2 text-[9px] text-slate-500">
        © Esri · OpenStreetMap · REDCO
      </div>
    </div>
  );
}