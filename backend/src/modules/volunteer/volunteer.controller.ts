import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { VolunteerService } from './volunteer.service';
import { ApplyVolunteerDto, ReviewVolunteerDto } from './dtos/apply-volunteer.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AuthRequest } from '../../shared/guards/auth-request';

@ApiTags('Voluntariado')
@ApiBearerAuth('JWT-auth')
@Controller('volunteer')
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Solicitar ser voluntario / organismo de socorro' })
  @ApiResponse({ status: 201, description: 'Solicitud creada.' })
  @ApiResponse({ status: 403, description: 'Ya existe una solicitud.' })
  async apply(@Req() request: AuthRequest, @Body() dto: ApplyVolunteerDto) {
    const userId = request.user?.id || request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.volunteerService.apply(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener mi solicitud de voluntariado' })
  async me(@Req() request: AuthRequest) {
    const userId = request.user?.id || request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return this.volunteerService.findMyApplication(userId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  @ApiOperation({ summary: 'Listar todas las solicitudes (solo admin)' })
  async findAll() {
    return this.volunteerService.findAll();
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar o rechazar solicitud (solo admin)' })
  async review(
    @Param('id') id: string,
    @Req() request: AuthRequest,
    @Body() dto: ReviewVolunteerDto,
  ) {
    const userId = request.user?.sub;
    if (!userId) {
      throw new Error('Usuario no autenticado.');
    }
    return this.volunteerService.review(id, userId, dto);
  }
}
