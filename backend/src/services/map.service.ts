import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

/** Tipos de recurso para el mapa (iconografía en el frontend). */
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

interface IncidentRow {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  magnitude: string | null;
  startedAt: Date;
  createdAt: Date;
  geojson: string | null;
}

interface ZoneRow {
  id: string;
  name: string;
  level: string;
  description: string | null;
  estimatedAffected: number | null;
  geojson: string;
}

interface OrganizationRow {
  id: string;
  name: string;
  type: string;
  status: string;
  phone: string | null;
  email: string | null;
  geojson: string;
}

interface UnitRow {
  id: string;
  name: string;
  unitType: string;
  unitStatus: string;
  phone: string | null;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  assignmentStatus: string | null;
  geojson: string;
}

interface AssignmentRow {
  id: string;
  unitId: string;
  unitName: string;
  unitType: string;
  unitStatus: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  status: string;
  role: string | null;
  assignedAt: Date;
  zoneId: string | null;
  zoneName: string | null;
  zoneLevel: string | null;
  geojson: string;
}

@Injectable()
export class MapService {
  private readonly logger = new Logger(MapService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resumen completo para el mapa: epicentro del sismo, zonas de afectación
   * y recursos despliegados (hospitales, bomberos, ambulancias, etc.).
   */
  async getOverview() {
    const incidentRows = await this.prisma.$queryRawUnsafe<IncidentRow[]>(`
      SELECT i."id", i.title, i.description, i.severity, i.status, i."magnitude",
             i."startedAt", i."createdAt",
             ST_AsGeoJSON(i."location") AS geojson
      FROM "Incident" i
      WHERE i."type" = 'EARTHQUAKE'
        AND i."status" <> 'DRAFT'
      ORDER BY i."startedAt" DESC
      LIMIT 1
    `);

    const incident = incidentRows[0];
    if (!incident) {
      throw new NotFoundException('No hay un sismo registrado para mostrar en el mapa.');
    }

    const epicenter =
      incident.geojson !== null
        ? this.feature(incident.geojson, {
            id: incident.id,
            title: incident.title,
          })
        : null;

    const [zoneRows, organizationRows, unitRows, assignmentRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<ZoneRow[]>(
        `
        SELECT z."id", z.name, z.level, z."description", z."estimatedAffected",
               ST_AsGeoJSON(z."location") AS geojson
        FROM "AffectationZone" z
        WHERE z."incidentId" = $1::uuid
        ORDER BY CASE z."level"
          WHEN 'CRITICAL' THEN 0
          WHEN 'HIGH' THEN 1
          WHEN 'MODERATE' THEN 2
          ELSE 3
        END
        `,
        incident.id,
      ),
      this.prisma.$queryRawUnsafe<OrganizationRow[]>(
        `
        SELECT o."id", o.name, o."type", o."status", o."phone", o."email",
               ST_AsGeoJSON(o."location") AS geojson
        FROM "Organization" o
        WHERE o."location" IS NOT NULL
          AND o."status" = 'ACTIVE'
        ORDER BY o.name
        `,
      ),
      this.prisma.$queryRawUnsafe<UnitRow[]>(
        `
        SELECT u."id", u.name, u."type" AS "unitType", u."status" AS "unitStatus",
               u."phone", o."id" AS "organizationId", o.name AS "organizationName",
               o."type" AS "organizationType", ia."status" AS "assignmentStatus",
               ST_AsGeoJSON(u."location") AS geojson
        FROM "ResponseUnit" u
        JOIN "Organization" o ON o."id" = u."organizationId"
        LEFT JOIN "IncidentAssignment" ia
          ON ia."responseUnitId" = u."id"
         AND ia."incidentId" = $1::uuid
        WHERE u."location" IS NOT NULL
          AND u."status" <> 'INACTIVE'
        ORDER BY u.name
        `,
        incident.id,
      ),
      this.prisma.$queryRawUnsafe<AssignmentRow[]>(
        `
        SELECT DISTINCT ON (ia."id")
               ia."id", u."id" AS "unitId", u.name AS "unitName",
               u."type" AS "unitType", u."status" AS "unitStatus",
               o."id" AS "organizationId", o.name AS "organizationName",
               o."type" AS "organizationType",
               ia."status", ia."role", ia."assignedAt",
               z."id" AS "zoneId", z.name AS "zoneName", z."level" AS "zoneLevel",
               ST_AsGeoJSON(u."location") AS geojson
        FROM "IncidentAssignment" ia
        JOIN "ResponseUnit" u ON u."id" = ia."responseUnitId"
        JOIN "Organization" o ON o."id" = u."organizationId"
        LEFT JOIN "AffectationZone" z
          ON z."incidentId" = ia."incidentId"
         AND z."location" && u."location"
         AND ST_Contains(z."location", u."location")
        WHERE ia."incidentId" = $1::uuid
        ORDER BY ia."id", z."level" DESC NULLS LAST
        `,
        incident.id,
      ),
    ]);

    const zoneFeatures = zoneRows.map((zone) =>
      this.feature(zone.geojson, {
        id: zone.id,
        name: zone.name,
        level: zone.level,
        description: zone.description,
        estimatedAffected: zone.estimatedAffected,
      }),
    );

    const resourceFeatures = [
      ...organizationRows.map((org) =>
        this.feature(org.geojson, {
          id: org.id,
          name: org.name,
          kind: this.organizationKind(org.type),
          category: 'organization',
          type: org.type,
          status: org.status,
          phone: org.phone,
          email: org.email,
        }),
      ),
      ...unitRows.map((unit) =>
        this.feature(unit.geojson, {
          id: unit.id,
          name: unit.name,
          kind: this.unitKind(unit),
          category: 'unit',
          type: unit.unitType,
          status: unit.unitStatus,
          assignmentStatus: unit.assignmentStatus,
          phone: unit.phone,
          organizationId: unit.organizationId,
          organizationName: unit.organizationName,
        }),
      ),
    ];

    const assignmentFeatures = assignmentRows.map((a) => ({
      id: a.id,
      unitId: a.unitId,
      unitName: a.unitName,
      unitType: a.unitType,
      unitStatus: a.unitStatus,
      organizationId: a.organizationId,
      organizationName: a.organizationName,
      organizationType: a.organizationType,
      kind: this.unitKind(a),
      status: a.status,
      role: a.role,
      assignedAt: a.assignedAt,
      zoneId: a.zoneId,
      zoneName: a.zoneName,
      zoneLevel: a.zoneLevel,
      location: this.feature(a.geojson, { id: a.unitId, name: a.unitName }),
    }));

    return {
      incident: {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        type: 'EARTHQUAKE',
        severity: incident.severity,
        status: incident.status,
        magnitude: incident.magnitude !== null ? Number(incident.magnitude) : null,
        startedAt: incident.startedAt,
        createdAt: incident.createdAt,
        epicenter,
      },
      zones: this.featureCollection(zoneFeatures),
      resources: this.featureCollection(resourceFeatures),
      assignments: assignmentFeatures,
      stats: this.buildStats(zoneRows, unitRows),
    };
  }

  private buildStats(zoneRows: ZoneRow[], unitRows: UnitRow[]): Record<string, unknown> {
    const zonesByLevel: Record<string, number> = {};
    for (const zone of zoneRows) {
      zonesByLevel[zone.level] = (zonesByLevel[zone.level] ?? 0) + 1;
    }

    const resourcesByKind: Record<string, number> = {};
    const unitsByStatus: Record<string, number> = {};
    for (const unit of unitRows) {
      const kind = this.unitKind(unit);
      resourcesByKind[kind] = (resourcesByKind[kind] ?? 0) + 1;
      unitsByStatus[unit.unitStatus] = (unitsByStatus[unit.unitStatus] ?? 0) + 1;
    }

    return {
      zonesByLevel,
      resourcesByKind,
      unitsByStatus,
      totalZones: zoneRows.length,
      totalResources: unitRows.length,
    };
  }

  private organizationKind(type: string): ResourceKind {
    switch (type) {
      case 'HEALTH':
        return 'hospital';
      case 'FIRE_DEPARTMENT':
        return 'fire-station';
      case 'RED_CROSS':
        return 'red-cross';
      case 'POLICE':
        return 'police';
      default:
        return 'unit';
    }
  }

  private unitKind(unit: UnitRow | AssignmentRow): ResourceKind {
    if (unit.unitType === 'VEHICLE') {
      if (unit.organizationType === 'HEALTH') return 'ambulance';
      if (unit.organizationType === 'FIRE_DEPARTMENT') return 'fire-truck';
    }
    if (unit.unitType === 'MEDICAL_UNIT') return 'medical-unit';
    if (unit.unitType === 'RESCUE_UNIT') return 'rescue-unit';
    return 'unit';
  }

  private featureCollection(features: unknown[]) {
    return {
      type: 'FeatureCollection',
      features,
    };
  }

  private feature(geojson: string, properties: Record<string, unknown>) {
    return {
      type: 'Feature',
      geometry: JSON.parse(geojson),
      properties,
    };
  }
}
