import { IsString, IsEnum, IsOptional, IsDateString, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description: string;

  @IsEnum(IncidentType)
  type: IncidentType;

  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  magnitude?: number;

  @IsString()
  @IsOptional()
  location?: string; // GeoJSON Point como string JSON

  @IsDateString()
  startedAt: string;

  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;
}

export class UpdateIncidentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(IncidentSeverity)
  @IsOptional()
  severity?: IncidentSeverity;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  magnitude?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;
}

export class CreateAffectationZoneDto {
  @IsString()
  name: string;

  @IsEnum(IncidentSeverity)
  level: IncidentSeverity;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  location: string; // GeoJSON Polygon como string JSON

  @IsOptional()
  estimatedAffected?: number;
}
