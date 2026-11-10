import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { VolunteerApplicationStatus } from '@prisma/client';

export class ApplyVolunteerDto {
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReviewVolunteerDto {
  @IsEnum(VolunteerApplicationStatus)
  status: VolunteerApplicationStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class VolunteerApplicationResponseDto {
  id: string;
  userId: string;
  organizationId?: string;
  status: VolunteerApplicationStatus;
  notes?: string;
  reviewedById?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
