import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateLostRelativeDto, UpdateLostRelativeDto } from './dtos/create-lost-relative.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class LostRelativeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLostRelativeDto) {
    const report = await this.prisma.lostRelativeReport.create({
      data: {
        reporterId: userId,
        incidentId: dto.incidentId,
        fullName: dto.fullName,
        age: dto.age,
        gender: dto.gender,
        phone: dto.phone,
        description: dto.description,
      },
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        incident: { select: { id: true, title: true, type: true, severity: true, startedAt: true } },
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
          `UPDATE "LostRelativeReport" SET "lastKnownLocation" = ST_GeomFromGeoJSON($1) WHERE "id" = $2::uuid`,
          dto.lastKnownLocation,
          report.id,
        );
      }
    }

    return this.findOne(report.id);
  }

  async findAll(incidentId?: string, status?: string) {
    const where: Record<string, unknown> = {};

    if (incidentId) where.incidentId = incidentId;
    if (status) where.status = status as ReportStatus;

    return this.prisma.lostRelativeReport.findMany({
      where,
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, role: true } },
        incident: { select: { id: true, title: true, type: true } },
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.lostRelativeReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        incident: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Reporte de familiar perdido no encontrado.');
    }

    return report;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateLostRelativeDto) {
    const existing = await this.prisma.lostRelativeReport.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Reporte no encontrado.');
    }

    const isAdmin = userRole === 'ADMINISTRATOR';
    const isReporter = existing.reporterId === userId;

    if (!isAdmin && !isReporter) {
      throw new NotFoundException('No tienes permisos para modificar este reporte.');
    }

    await this.prisma.lostRelativeReport.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.age !== undefined ? { age: dto.age } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        incident: true,
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
          `UPDATE "LostRelativeReport" SET "lastKnownLocation" = ST_GeomFromGeoJSON($1) WHERE "id" = $2::uuid`,
          dto.lastKnownLocation,
          id,
        );
      }
    }

    return this.findOne(id);
  }

  async remove(id: string, userId: string, userRole: string) {
    const existing = await this.prisma.lostRelativeReport.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Reporte no encontrado.');
    }

    const isAdmin = userRole === 'ADMINISTRATOR';
    const isReporter = existing.reporterId === userId;

    if (!isAdmin && !isReporter) {
      throw new NotFoundException('No tienes permisos para eliminar este reporte.');
    }

    return this.prisma.lostRelativeReport.delete({ where: { id } });
  }
}
