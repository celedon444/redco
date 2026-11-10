// src/types/modelos.ts

export type RolUsuario = 'CIUDADANO' | 'PERSONAL_RESPUESTA' | 'VOLUNTARIO' | 'ADMINISTRADOR';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rol: RolUsuario;
  estado: string;
}

// Voluntariado
export interface SolicitudVoluntariado {
  id: string;
  usuarioId: string;
  organizacionId?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  notas?: string;
  revisadoPorId?: string;
  revisadoEn?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface DtoSolicitarVoluntariado {
  organizacionId?: string;
  notas?: string;
}

export interface DtoRevisarSolicitud {
  estado: 'APROBADA' | 'RECHAZADA';
  notas?: string;
}

// Personas damnificadas
export type TipoVictima = 'DECEASED' | 'INJURED' | 'SAFE';
export type EstadoCasoPersona = 'MISSING' | 'UNDER_VERIFICATION' | 'LOCATED' | 'DECEASED_CONFIRMED' | 'CLOSED';

export interface CasoPersona {
  id: string;
  personaId: string;
  incidenteId: string;
  estado: EstadoCasoPersona;
  victimType?: TipoVictima;
  descripcion?: string;
  ultimaUbicacion?: string;
  trasladadoA?: string;
  trasladadoEn?: string;
  reportadoEn: string;
  reportadoPorId?: string;
  persona: {
    id: string;
    nombre: string;
    apellido: string;
    numeroIdentificacion?: string;
    telefono?: string;
  };
  reportadoPor?: {
    id: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

export interface DtoCrearCasoPersona {
  incidenteId: string;
  personaId: string;
  estado: EstadoCasoPersona;
  victimType?: TipoVictima;
  descripcion?: string;
  ultimaUbicacion?: string;
  trasladadoA?: string;
  trasladadoEn?: string;
}

// Familiar perdido
export type EstadoReporte = 'RECIBIDO' | 'EN_REVISION' | 'VALIDADO' | 'RECHAZADO' | 'ARCHIVADO';

export interface ReporteFamiliarPerdido {
  id: string;
  reportadoPorId: string;
  incidenteId?: string;
  nombreCompleto: string;
  edad?: number;
  genero?: string;
  telefono?: string;
  ultimaUbicacion?: string;
  descripcion?: string;
  estado: EstadoReporte;
  reportadoEn: string;
  reportadoPor: {
    id: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

export interface DtoCrearReporteFamiliar {
  incidenteId?: string;
  nombreCompleto: string;
  edad?: number;
  genero?: string;
  telefono?: string;
  ultimaUbicacion?: string;
  descripcion?: string;
}

// Incidentes / Sismos
export type TipoIncidente = 'EARTHQUAKE' | 'FLOOD' | 'LANDSLIDE' | 'WILDFIRE' | 'STORM' | 'OTHER';
export type SeveridadIncidente = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type EstadoIncidente = 'DRAFT' | 'ACTIVE' | 'CONTROLLED' | 'CLOSED';

export interface Incidente {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoIncidente;
  severidad: SeveridadIncidente;
  estado: EstadoIncidente;
  magnitud?: number;
  inicioEn: string;
  creadoPor: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

export interface DtoCrearIncidente {
  titulo: string;
  descripcion: string;
  tipo: TipoIncidente;
  severidad: SeveridadIncidente;
  magnitud?: number;
  ubicacion: string; // GeoJSON Point
  inicioEn: string;
  estado?: EstadoIncidente;
}

export interface ZonaAfectacion {
  id: string;
  incidenteId: string;
  nombre: string;
  nivel: SeveridadIncidente;
  descripcion?: string;
  estimadoAfectados?: number;
  ubicacion: string; // GeoJSON Polygon
}

export interface DtoCrearZonaAfectacion {
  nombre: string;
  nivel: SeveridadIncidente;
  descripcion?: string;
  estimadoAfectados?: number;
  ubicacion: string;
}