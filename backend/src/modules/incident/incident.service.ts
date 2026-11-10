import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateIncidentDto, UpdateIncidentDto, CreateAffectationZoneDto } from './dtos/create-incident.dto';
import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';

@Injectable()
export class IncidentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateIncidentDto) {
    let hasValidGeoJson = false;
    if (dto.location) {
      try {
        const parsed = typeof dto.location === 'string' ? JSON.parse(dto.location) : dto.location;
        if (parsed && (parsed.type === 'Point' || Array.isArray(parsed.coordinates))) {
          hasValidGeoJson = true;
        }
      } catch {
        hasValidGeoJson = false;
      }
    }

    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        severity: dto.severity,
        magnitude: dto.magnitude !== undefined && dto.magnitude !== null ? dto.magnitude : null,
        startedAt: new Date(dto.startedAt),
        status: dto.status ?? 'ACTIVE',
        createdById: userId,
      },
    });

    if (hasValidGeoJson) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "Incident" SET "location" = ST_GeomFromGeoJSON($1) WHERE "id" = $2::uuid`,
        dto.location,
        incident.id,
      );
    } else {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "Incident" SET "location" = ST_SetSRID(ST_MakePoint(-74.0836, 4.6534), 4326) WHERE "id" = $1::uuid`,
        incident.id,
      );
    }

    return this.findOne(incident.id);
  }

  async findAll() {
    return this.prisma.incident.findMany({
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        affectationZones: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        affectationZones: true,
        personCases: {
          include: { person: true, reporter: { select: { id: true, firstName: true, lastName: true, role: true } } },
        },
      },
    });

    if (!incident) {
      throw new NotFoundException('Incidente no encontrado.');
    }

    return incident;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateIncidentDto) {
    const existing = await this.prisma.incident.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Incidente no encontrado.');
    }

    if (userRole !== 'ADMINISTRATOR' && existing.createdById !== userId) {
      throw new ForbiddenException('No tienes permisos para modificar este incidente.');
    }

    await this.prisma.incident.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.severity !== undefined ? { severity: dto.severity } : {}),
        ...(dto.magnitude !== undefined ? { magnitude: dto.magnitude } : {}),
        ...(dto.startedAt ? { startedAt: new Date(dto.startedAt) } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    });

    if (dto.location !== undefined) {
      let isGeoJson = false;
      try {
        const parsed = typeof dto.location === 'string' ? JSON.parse(dto.location) : dto.location;
        if (parsed && (parsed.type === 'Point' || Array.isArray(parsed.coordinates))) {
          isGeoJson = true;
        }
      } catch {
        isGeoJson = false;
      }

      if (isGeoJson) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE "Incident" SET "location" = ST_GeomFromGeoJSON($1) WHERE "id" = $2::uuid`,
          dto.location,
          id,
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, userId: string, userRole: string) {
    const existing = await this.prisma.incident.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Incidente no encontrado.');
    }

    if (userRole !== 'ADMINISTRATOR' && existing.createdById !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar este incidente.');
    }

    return this.prisma.incident.delete({ where: { id } });
  }

  async createAffectationZone(incidentId: string, userId: string, userRole: string, dto: CreateAffectationZoneDto) {
    if (userRole !== 'ADMINISTRATOR') {
      throw new ForbiddenException('Solo el administrador puede crear zonas de afectación.');
    }

    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });

    if (!incident) {
      throw new NotFoundException('Incidente no encontrado.');
    }

    return this.prisma.$queryRawUnsafe(`
      INSERT INTO "AffectationZone" ("id", "incidentId", "name", "level", "description", "estimatedAffected", "location", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1::uuid, $2, $3::"AffectationLevel", $4, $5, ST_GeomFromGeoJSON($6), NOW(), NOW())
      RETURNING *
    `, incidentId, dto.name, dto.level, dto.description ?? null, dto.estimatedAffected ?? null, dto.location);
  }
}
