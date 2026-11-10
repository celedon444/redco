import { IsString, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { PersonCaseStatus, VictimType } from '@prisma/client';

export class CreatePersonCaseDto {
  @IsUUID()
  @IsOptional()
  incidentId?: string;

  @IsUUID()
  @IsOptional()
  personId?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  identificationNumber?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(PersonCaseStatus)
  status: PersonCaseStatus;

  @IsEnum(VictimType)
  @IsOptional()
  victimType?: VictimType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  lastKnownLocation?: string;

  @IsString()
  @IsOptional()
  transferredTo?: string;

  @IsDateString()
  @IsOptional()
  transferredAt?: string;
}

export class UpdatePersonCaseDto {
  @IsEnum(PersonCaseStatus)
  @IsOptional()
  status?: PersonCaseStatus;

  @IsEnum(VictimType)
  @IsOptional()
  victimType?: VictimType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  lastKnownLocation?: string;

  @IsString()
  @IsOptional()
  transferredTo?: string;

  @IsDateString()
  @IsOptional()
  transferredAt?: string;
}
