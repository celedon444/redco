import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { PersonCaseService } from './person-case.service';
import { CreatePersonCaseDto, UpdatePersonCaseDto } from './dtos/create-person-case.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AuthRequest } from '../../shared/guards/auth-request';

@ApiTags('Casos de Personas / Damnificados')
@ApiBearerAuth('JWT-auth')
@Controller('person-cases')
export class PersonCaseController {
  constructor(private readonly personCaseService: PersonCaseService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reportar cuerpo o sobreviviente (damnificado)' })
  @ApiResponse({ status: 201, description: 'Reporte creado.' })
  async create(@Req() request: AuthRequest, @Body() dto: CreatePersonCaseDto) {
    const userId = request.user?.id || request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.personCaseService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar damnificados con filtros opcionales' })
  async findAll(
    @Query('incidentId') incidentId?: string,
    @Query('status') status?: string,
    @Query('victimType') victimType?: string,
  ) {
    return this.personCaseService.findAll(incidentId, status, victimType);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener detalle de un damnificado' })
  async findOne(@Param('id') id: string) {
    return this.personCaseService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar estado o traslado de un damnificado' })
  async update(
    @Param('id') id: string,
    @Req() request: AuthRequest,
    @Body() dto: UpdatePersonCaseDto,
  ) {
    const userId = request.user?.id || request.user?.sub;
    const userRole = request.user?.role;
    if (!userId || !userRole) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.personCaseService.update(id, userId, userRole, dto);
  }
}
