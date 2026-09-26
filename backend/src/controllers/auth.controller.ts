import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../models/register.dto';
import { LoginDto } from '../models/login.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { RolesGuard } from '../shared/guards/roles.guard';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar un nuevo ciudadano',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado correctamente.',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo ya está registrado.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica al usuario y genera un token JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o usuario inactivo.',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener usuario autenticado',
    description: 'Endpoint protegido que devuelve la información contenida en el JWT validado.',})
  @ApiResponse({status: 200,description: 'Token válido y usuario autenticado.',})
  @ApiResponse({status: 401,description: 'Token ausente, inválido o expirado.',})
  async me(@Req() request: Request) {return request.user;}}
