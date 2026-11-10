import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { LostRelativeService } from './lost-relative.service';
import { CreateLostRelativeDto, UpdateLostRelativeDto } from './dtos/create-lost-relative.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { AuthRequest } from '../../shared/guards/auth-request';

@ApiTags('Familiar Perdido')
@ApiBearerAuth('JWT-auth')
@Controller('lost-relative')
export class LostRelativeController {
  constructor(private readonly lostRelativeService: LostRelativeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Publicar familiar perdido durante la catástrofe' })
  @ApiResponse({ status: 201, description: 'Reporte creado.' })
  async create(@Req() request: AuthRequest, @Body() dto: CreateLostRelativeDto) {
    const userId = request.user?.sub;
    if (!userId) {
      throw new Error('Usuario no autenticado.');
    }
    return this.lostRelativeService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar reportes de familiares perdidos' })
  async findAll(
    @Query('incidentId') incidentId?: string,
    @Query('status') status?: string,
  ) {
    return this.lostRelativeService.findAll(incidentId, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener detalle de un reporte' })
  async findOne(@Param('id') id: string) {
    return this.lostRelativeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar reporte de familiar perdido' })
  async update(
    @Param('id') id: string,
    @Req() request: AuthRequest,
    @Body() dto: UpdateLostRelativeDto,
  ) {
    const userId = request.user?.sub;
    const userRole = request.user?.role;
    if (!userId || !userRole) {
      throw new Error('Usuario no autenticado.');
    }
    return this.lostRelativeService.update(id, userId, userRole, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar reporte de familiar perdido' })
  async remove(
    @Param('id') id: string,
    @Req() request: AuthRequest,
  ) {
    const userId = request.user?.sub;
    const userRole = request.user?.role;
    if (!userId || !userRole) {
      throw new Error('Usuario no autenticado.');
    }
    return this.lostRelativeService.remove(id, userId, userRole);
  }
}
