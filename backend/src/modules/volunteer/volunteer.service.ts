import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ApplyVolunteerDto, ReviewVolunteerDto } from './dtos/apply-volunteer.dto';
import { VolunteerApplicationStatus } from '@prisma/client';

@Injectable()
export class VolunteerService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, dto: ApplyVolunteerDto) {
    const existing = await this.prisma.volunteerApplication.findFirst({
      where: { userId },
    });

    if (existing) {
      throw new ForbiddenException('Ya tienes una solicitud de voluntariado registrada.');
    }

    let organizationId = dto.organizationId;
    if (organizationId) {
      const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) {
        organizationId = undefined;
      }
    }

    return this.prisma.volunteerApplication.create({
      data: {
        userId,
        organizationId,
        notes: dto.notes,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        organization: true,
      },
    });
  }

  async findMyApplication(userId: string) {
    return this.prisma.volunteerApplication.findFirst({
      where: { userId },
      include: {
        organization: true,
        reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.volunteerApplication.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true } },
        organization: true,
        reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(applicationId: string, adminId: string, dto: ReviewVolunteerDto) {
    const application = await this.prisma.volunteerApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Solicitud de voluntariado no encontrada.');
    }

    if (application.status !== 'PENDING') {
      throw new ForbiddenException('Esta solicitud ya fue revisada.');
    }

    const updated = await this.prisma.volunteerApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        reviewedById: adminId,
        reviewedAt: new Date(),
        notes: dto.notes ?? application.notes,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        organization: true,
        reviewedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (dto.status === 'APPROVED') {
      const newRole = application.organizationId ? 'RESPONSE_PERSONNEL' : 'VOLUNTEER';
      await this.prisma.user.update({
        where: { id: application.userId },
        data: { status: 'ACTIVE', role: newRole },
      });
    }

    return updated;
  }
}
