import { IsString, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLostRelativeDto {
  @IsUUID()
  @IsOptional()
  incidentId?: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  lastKnownLocation?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateLostRelativeDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  lastKnownLocation?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
