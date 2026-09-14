import type {
  AffectationLevel,
  GeoJsonGeometry,
  ResourceKind,
} from '@/types/map';

export type Coords = [number, number];

export const ZONE_COLORS: Record<
  AffectationLevel,
  { fill: string; stroke: string; label: string }
> = {
  CRITICAL: { fill: '#f43f5e', stroke: '#be123c', label: 'Crítica' },
  HIGH: { fill: '#fb923c', stroke: '#c2410c', label: 'Alta' },
  MODERATE: { fill: '#facc15', stroke: '#a16207', label: 'Moderada' },
  LOW: { fill: '#4ade80', stroke: '#15803d', label: 'Baja' },
};

export const ZONE_LEVELS = Object.keys(ZONE_COLORS) as AffectationLevel[];

export const RESOURCE_BY_KIND: Record<
  ResourceKind,
  { label: string; emoji: string; color: string }
> = {
  hospital: { label: 'Hospitales', emoji: '🏥', color: '#fb7185' },
  'fire-station': { label: 'Estaciones de bomberos', emoji: '🧯', color: '#fdba74' },
  'red-cross': { label: 'Cruz Roja', emoji: '⛑️', color: '#fca5a5' },
  police: { label: 'Policía', emoji: '🚓', color: '#60a5fa' },
  ambulance: { label: 'Ambulancias', emoji: '🚑', color: '#22d3ee' },
  'fire-truck': { label: 'Carros de bomberos', emoji: '🚒', color: '#a78bfa' },
  'medical-unit': { label: 'Unidades médicas', emoji: '🏥', color: '#5eead4' },
  'rescue-unit': { label: 'Unidades de rescate', emoji: '🛟', color: '#4ade80' },
  unit: { label: 'Otras unidades', emoji: '🚙', color: '#94a3b8' },
};

export const RESOURCE_KEYS = Object.keys(RESOURCE_BY_KIND) as ResourceKind[];

export const SEVERITY_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  CONTROLLED: 'Controlado',
  CLOSED: 'Cerrado',
};

export const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MODERATE: 'Moderada',
  LOW: 'Baja',
};

export interface StatsShape {
  zonesByLevel?: Record<string, number>;
  resourcesByKind?: Record<string, number>;
  unitsByStatus?: Record<string, number>;
  totalZones?: number;
  totalResources?: number;
}

export function pointToLatLng(geometry: GeoJsonGeometry | null): Coords | null {
  if (!geometry || geometry.type !== 'Point') return null;
  const [lng, lat] = geometry.coordinates as [number, number];
  return [lat, lng];
}

export function polygonToLatLngs(geometry: GeoJsonGeometry | null): Coords[][] {
  if (!geometry || geometry.type !== 'Polygon') return [];
  const rings = geometry.coordinates as [number, number][][];
  return rings.map((ring) =>
    ring.map(([lng, lat]) => [lat, lng] as Coords),
  );
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatCoords(point: Coords): string {
  const [lat, lng] = point;
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'O';
  return `${lat.toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

export function zoneCentroid(geometry: GeoJsonGeometry | null): Coords | null {
  const rings = polygonToLatLngs(geometry);
  if (!rings.length || !rings[0].length) return null;
  const pts = rings[0];
  const sum = pts.reduce<Coords>(
    ([lat, lng], p) => [lat + p[0], lng + p[1]],
    [0, 0],
  );
  return [sum[0] / pts.length, sum[1] / pts.length];
}