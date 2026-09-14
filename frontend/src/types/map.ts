export type AffectationLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type ResourceKind =
  | 'hospital'
  | 'fire-station'
  | 'red-cross'
  | 'police'
  | 'ambulance'
  | 'fire-truck'
  | 'medical-unit'
  | 'rescue-unit'
  | 'unit';

export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface GeoJsonFeature<P> {
  type: 'Feature';
  geometry: GeoJsonGeometry | null;
  properties: P;
}

export interface GeoJsonFeatureCollection<P> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<P>[];
}

export interface EpicenterFeature
  extends GeoJsonFeature<{ id: string; title: string }> {}

export interface ZoneFeatureProperties {
  id: string;
  name: string;
  level: AffectationLevel;
  description: string | null;
  estimatedAffected: number | null;
}

export interface ResourceFeatureProperties {
  id: string;
  name: string;
  kind: ResourceKind;
  category: 'organization' | 'unit';
  type: string;
  status: string;
  assignmentStatus?: string | null;
  phone?: string | null;
  email?: string | null;
  organizationId?: string;
  organizationName?: string;
}

export interface MapIncident {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  magnitude: number | null;
  startedAt: string;
  createdAt: string;
  epicenter: EpicenterFeature | null;
}

export interface MapAssignment {
  id: string;
  unitId: string;
  unitName: string;
  unitType: string;
  unitStatus: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  kind: ResourceKind;
  status: string;
  role: string | null;
  assignedAt: string;
  zoneId: string | null;
  zoneName: string | null;
  zoneLevel: AffectationLevel | null;
  location: EpicenterFeature | null;
}

export interface MapOverview {
  incident: MapIncident | null;
  zones: GeoJsonFeatureCollection<ZoneFeatureProperties>;
  resources: GeoJsonFeatureCollection<ResourceFeatureProperties>;
  assignments: MapAssignment[];
  stats: Record<string, unknown>;
}