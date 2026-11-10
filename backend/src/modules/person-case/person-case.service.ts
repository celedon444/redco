import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreatePersonCaseDto, UpdatePersonCaseDto } from './dtos/create-person-case.dto';
import { PersonCaseStatus, VictimType } from '@prisma/client';

@Injectable()
export class PersonCaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePersonCaseDto) {
    let personId = dto.personId;

    if (personId) {
      const existingPerson = await this.prisma.person.findUnique({ where: { id: personId } });
      if (!existingPerson) {
        personId = undefined;
      }
    }

    if (!personId) {
      const newPerson = await this.prisma.person.create({
        data: {
          firstName: dto.firstName || 'Persona',
          lastName: dto.lastName || 'Afectada',
          identificationNumber: dto.identificationNumber,
          phone: dto.phone,
        },
      });
      personId = newPerson.id;
    }

    let incidentId = dto.incidentId;
    if (incidentId) {
      const existingIncident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
      if (!existingIncident) {
        incidentId = undefined;
      }
    }

    if (!incidentId) {
      const latestIncident = await this.prisma.incident.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (!latestIncident) {
        throw new NotFoundException('No existe un incidente registrado para asociar este caso.');
      }
      incidentId = latestIncident.id;
    }

    const personCase = await this.prisma.personCase.create({
      data: {
        personId,
        incidentId,
        status: dto.status,
        victimType: dto.victimType,
        description: dto.description,
        transferredTo: dto.transferredTo,
        transferredAt: dto.transferredAt ? new Date(dto.transferredAt) : null,
        reporterId: userId,
      },
      include: {
        person: true,
        incident: { select: { id: true, title: true, type: true, severity: true, startedAt: true } },
        reporter: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    });

    if (dto.lastKnownLocation) {
      let isGeoJson = false;
      try {
        const parsed = typeof dto.lastKnownLocation === 'string' ? JSON.parse(dto.lastKnownLocation) : dto.lastKnownLocation;
        if (parsed && (parsed.type === 'Point' || Array.isArray(parsed.coordinates))) {
          isGeoJson = true;
        }
      } catch {
        isGeoJson = false;
      }

      if (isGeoJson) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE "PersonCase" SET "lastKnownLocation" = ST_GeomFromGeoJSON($1) WHERE "id" = $2::uuid`,
          dto.lastKnownLocation,
          personCase.id,
        );
      }
    }

    return this.findOne(personCase.id);
  }

  async findAll(incidentId?: string, status?: string, victimType?: string) {
    const where: Record<string, unknown> = {};

    if (incidentId) where.incidentId = incidentId;
    if (status) where.status = status as PersonCaseStatus;
    if (victimType) where.victimType = victimType as VictimType;

    return this.prisma.personCase.findMany({
      where,
      include: {
        person: true,
        incident: { select: { id: true, title: true, type: true, severity: true } },
        reporter: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pc = await this.prisma.personCase.findUnique({
      where: { id },
      include: {
        person: true,
        incident: true,
        reporter: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    });

    if (!pc) {
      throw new NotFoundException('Caso de persona no encontrado.');
    }

    return pc;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdatePersonCaseDto) {
    const existing = await this.prisma.personCase.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Caso de persona no encontrado.');
    }

    const isAdmin = userRole === 'ADMINISTRATOR';
    const isReporter = existing.reporterId === userId;

    if (!isAdmin && !isReporter) {
      throw new ForbiddenException('No tienes permisos para modificar este caso.');
    }

    await this.prisma.personCase.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.victimType ? { victimType: dto.victimType } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.transferredTo !== undefined ? { transferredTo: dto.transferredTo } : {}),
        ...(dto.transferredAt ? { transferredAt: new Date(dto.transferredAt) } : {}),
      },
    });

    if (dto.lastKnownLocation !== undefined) {
      let isGeoJson = false;
      try {
        const parsed = typeof dto.lastKnownLocation === 'string' ? JSON.parse(dto.lastKnownLocation) : dto.lastKnownLocation;
        if (parsed && (parsed.type === 'Point' || Array.isArray(parsed.coordinates))) {
          isGeoJson = true;
        }
      } catch {
        isGeoJson = false;
      }

      if (isGeoJson) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE "PersonCase" SET "lastKnownLocation" = ST_GeomFromGeoJSON($1) WHERE "id" = $2::uuid`,
          dto.lastKnownLocation,
          id,
        );
      }
    }

    return this.findOne(id);
  }
}
