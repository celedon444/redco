import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { IncidentService } from './incident.service';
import { CreateIncidentDto, UpdateIncidentDto, CreateAffectationZoneDto } from './dtos/create-incident.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AuthRequest } from '../../shared/guards/auth-request';

@ApiTags('Incidentes / Sismos')
@ApiBearerAuth('JWT-auth')
@Controller('incidents')
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  @ApiOperation({ summary: 'Crear incidente / sismo (solo admin)' })
  @ApiResponse({ status: 201, description: 'Incidente creado.' })
  async create(@Req() request: AuthRequest, @Body() dto: CreateIncidentDto) {
    const userId = request.user?.id || request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.incidentService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar todos los incidentes' })
  async findAll() {
    return this.incidentService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener detalle de un incidente' })
  async findOne(@Param('id') id: string) {
    return this.incidentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un incidente' })
  async update(
    @Param('id') id: string,
    @Req() request: AuthRequest,
    @Body() dto: UpdateIncidentDto,
  ) {
    const userId = request.user?.id || request.user?.sub;
    const userRole = request.user?.role;
    if (!userId || !userRole) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.incidentService.update(id, userId, userRole, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un incidente (solo admin)' })
  async remove(
    @Param('id') id: string,
    @Req() request: AuthRequest,
  ) {
    const userId = request.user?.id || request.user?.sub;
    const userRole = request.user?.role;
    if (!userId || !userRole) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.incidentService.remove(id, userId, userRole);
  }

  @Post(':id/affectation-zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  @ApiOperation({ summary: 'Crear zona de afectación para un sismo (solo admin)' })
  async createAffectationZone(
    @Param('id') incidentId: string,
    @Req() request: AuthRequest,
    @Body() dto: CreateAffectationZoneDto,
  ) {
    const userId = request.user?.id || request.user?.sub;
    const userRole = request.user?.role;
    if (!userId || !userRole) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.incidentService.createAffectationZone(
      incidentId,
      userId,
      userRole,
      dto,
    );
  }
}
