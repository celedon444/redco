// src/services/api.ts
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper para convertir ubicación libre a un GeoJSON Point válido
function toGeoJsonPoint(val?: string): string | undefined {
  if (!val || val.trim() === '') return undefined;
  const trimmed = val.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && (parsed.type === 'Point' || Array.isArray(parsed.coordinates))) {
      return trimmed;
    }
  } catch {
    // Si viene como "lat, lon" o "lon, lat"
    const parts = trimmed.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      // GeoJSON usa [longitud, latitud]
      return JSON.stringify({ type: 'Point', coordinates: [parts[1], parts[0]] });
    }
  }
  return undefined;
}

// ==================== AUTENTICACIÓN ====================
export const autenticarLogin = (datos: { email: string; password: string }) =>
  API.post('/auth/login', datos);

export const autenticarRegistro = (datos: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) => API.post('/auth/register', datos);

// ==================== VOLUNTARIADO ====================
export const solicitarVoluntariado = (datos: {
  organizacionId?: string;
  organizationId?: string;
  notas?: string;
  notes?: string;
}) => {
  const payload: Record<string, any> = {};
  const org = datos.organizationId ?? datos.organizacionId;
  if (org && org.trim() !== '') {
    payload.organizationId = org.trim();
  }
  const notes = datos.notes ?? datos.notas;
  if (notes && notes.trim() !== '') {
    payload.notes = notes.trim();
  }
  return API.post('/volunteer/apply', payload);
};

export const obtenerMiSolicitud = () =>
  API.get('/volunteer/me');

export const listarTodasLasSolicitudes = () =>
  API.get('/volunteer/all');

export const revisarSolicitud = (
  id: string,
  datos: { estado?: string; status?: string; notas?: string; notes?: string },
) => {
  let status = datos.status ?? datos.estado;
  if (status === 'APROBADA') status = 'APPROVED';
  if (status === 'RECHAZADA') status = 'REJECTED';
  return API.patch(`/volunteer/${id}/review`, {
    status,
    notes: datos.notes ?? datos.notas,
  });
};

// ==================== PERSONAS DAMNIFICADAS ====================
export const crearCasoPersona = (datos: any) => {
  const payload: Record<string, any> = {};

  const incId = datos.incidentId || datos.incidenteId;
  if (incId && incId.trim() !== '') payload.incidentId = incId.trim();

  const persId = datos.personId || datos.personaId;
  if (persId && persId.trim() !== '') payload.personId = persId.trim();

  const fn = datos.firstName || datos.nombre;
  if (fn && fn.trim() !== '') payload.firstName = fn.trim();

  const ln = datos.lastName || datos.apellido;
  if (ln && ln.trim() !== '') payload.lastName = ln.trim();

  const idNum = datos.identificationNumber || datos.numeroIdentificacion;
  if (idNum && idNum.trim() !== '') payload.identificationNumber = idNum.trim();

  const phone = datos.phone || datos.telefono;
  if (phone && phone.trim() !== '') payload.phone = phone.trim();

  // Mapeo de estado
  const rawStatus = datos.status || datos.estado || 'MISSING';
  const statusMap: Record<string, string> = {
    MISSING: 'MISSING',
    UNDER_VERIFICATION: 'UNDER_VERIFICATION',
    LOCATED: 'LOCATED',
    DECEASED_CONFIRMED: 'DECEASED_CONFIRMED',
    CLOSED: 'CLOSED',
    DESAPARECIDO: 'MISSING',
    EN_VERIFICACION: 'UNDER_VERIFICATION',
    LOCALIZADO: 'LOCATED',
    FALLECIDO: 'DECEASED_CONFIRMED',
  };
  payload.status = statusMap[rawStatus] || 'MISSING';

  // Mapeo de tipo de víctima
  const rawVictim = datos.victimType || datos.tipoVictima;
  if (rawVictim) {
    const victimMap: Record<string, string> = {
      DECEASED: 'DECEASED',
      INJURED: 'INJURED',
      SAFE: 'SAFE',
      FALLECIDO: 'DECEASED',
      HERIDO: 'INJURED',
      SANA: 'SAFE',
      SANO: 'SAFE',
    };
    payload.victimType = victimMap[rawVictim] || rawVictim;
  }

  const desc = datos.description || datos.descripcion;
  if (desc && desc.trim() !== '') payload.description = desc.trim();

  const geoPoint = toGeoJsonPoint(datos.lastKnownLocation || datos.ultimaUbicacion);
  if (geoPoint) payload.lastKnownLocation = geoPoint;

  const transTo = datos.transferredTo || datos.trasladadoA;
  if (transTo && transTo.trim() !== '') payload.transferredTo = transTo.trim();

  const transAt = datos.transferredAt || datos.trasladadoEn;
  if (transAt && transAt.trim() !== '') payload.transferredAt = new Date(transAt).toISOString();

  return API.post('/person-cases', payload);
};

export const listarCasosPersona = (params?: { incidentId?: string; status?: string; victimType?: string }) =>
  API.get('/person-cases', { params });

export const actualizarCasoPersona = (id: string, datos: any) => {
  const payload: Record<string, any> = {};

  if (datos.status || datos.estado) {
    const s = datos.status || datos.estado;
    const statusMap: Record<string, string> = {
      MISSING: 'MISSING',
      UNDER_VERIFICATION: 'UNDER_VERIFICATION',
      LOCATED: 'LOCATED',
      DECEASED_CONFIRMED: 'DECEASED_CONFIRMED',
      CLOSED: 'CLOSED',
    };
    payload.status = statusMap[s] || s;
  }

  if (datos.victimType || datos.tipoVictima) {
    payload.victimType = datos.victimType || datos.tipoVictima;
  }

  if (datos.description !== undefined || datos.descripcion !== undefined) {
    payload.description = datos.description ?? datos.descripcion;
  }

  const geoPoint = toGeoJsonPoint(datos.lastKnownLocation || datos.ultimaUbicacion);
  if (geoPoint) payload.lastKnownLocation = geoPoint;

  if (datos.transferredTo !== undefined || datos.trasladadoA !== undefined) {
    payload.transferredTo = datos.transferredTo ?? datos.trasladadoA;
  }

  if (datos.transferredAt || datos.trasladadoEn) {
    payload.transferredAt = new Date(datos.transferredAt || datos.trasladadoEn).toISOString();
  }

  return API.patch(`/person-cases/${id}`, payload);
};

// ==================== FAMILIAR PERDIDO ====================
export const crearReporteFamiliar = (datos: any) => {
  const payload: Record<string, any> = {
    fullName: (datos.fullName || datos.nombreCompleto || 'Persona reportada').trim(),
  };

  const incId = datos.incidentId || datos.incidenteId;
  if (incId && incId.trim() !== '') payload.incidentId = incId.trim();

  const age = datos.age ?? datos.edad;
  if (age !== undefined && age !== '' && !isNaN(Number(age))) {
    payload.age = Number(age);
  }

  const gender = datos.gender || datos.genero;
  if (gender && gender.trim() !== '') payload.gender = gender.trim();

  const phone = datos.phone || datos.telefono;
  if (phone && phone.trim() !== '') payload.phone = phone.trim();

  const desc = datos.description || datos.descripcion;
  if (desc && desc.trim() !== '') payload.description = desc.trim();

  const geoPoint = toGeoJsonPoint(datos.lastKnownLocation || datos.ultimaUbicacion);
  if (geoPoint) payload.lastKnownLocation = geoPoint;

  return API.post('/lost-relative', payload);
};

export const listarReportesFamiliar = (params?: { incidentId?: string; status?: string }) =>
  API.get('/lost-relative', { params });

export const actualizarReporteFamiliar = (id: string, datos: any) => {
  const payload: Record<string, any> = {};

  if (datos.fullName || datos.nombreCompleto) {
    payload.fullName = (datos.fullName || datos.nombreCompleto).trim();
  }
  const age = datos.age ?? datos.edad;
  if (age !== undefined && age !== '' && !isNaN(Number(age))) {
    payload.age = Number(age);
  }
  if (datos.gender || datos.genero) payload.gender = (datos.gender || datos.genero).trim();
  if (datos.phone || datos.telefono) payload.phone = (datos.phone || datos.telefono).trim();
  if (datos.description !== undefined || datos.descripcion !== undefined) {
    payload.description = datos.description ?? datos.descripcion;
  }
  const geoPoint = toGeoJsonPoint(datos.lastKnownLocation || datos.ultimaUbicacion);
  if (geoPoint) payload.lastKnownLocation = geoPoint;

  return API.patch(`/lost-relative/${id}`, payload);
};

export const eliminarReporteFamiliar = (id: string) =>
  API.delete(`/lost-relative/${id}`);

// ==================== INCIDENTES / SISMOS ====================
export const crearIncidente = (datos: any) => {
  const sevMap: Record<string, string> = {
    BAJA: 'LOW',
    MODERADA: 'MODERATE',
    ALTA: 'HIGH',
    CRITICA: 'CRITICAL',
    CRÍTICA: 'CRITICAL',
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  };

  const statusMap: Record<string, string> = {
    ACTIVO: 'ACTIVE',
    ACTIVE: 'ACTIVE',
    BORRADOR: 'DRAFT',
    DRAFT: 'DRAFT',
    CONTROLADO: 'CONTROLLED',
    CONTROLLED: 'CONTROLLED',
    CERRADO: 'CLOSED',
    CLOSED: 'CLOSED',
  };

  let startedAt = datos.startedAt || datos.inicioEn;
  if (!startedAt) {
    startedAt = new Date().toISOString();
  } else {
    try {
      startedAt = new Date(startedAt).toISOString();
    } catch {
      startedAt = new Date().toISOString();
    }
  }

  const rawSev = datos.severity || datos.severidad || 'MODERATE';
  const rawStatus = datos.status || datos.estado || 'ACTIVE';

  const payload: Record<string, any> = {
    title: (datos.title || datos.titulo || 'Incidente REDCO').trim(),
    description: (datos.description || datos.descripcion || '').trim(),
    type: datos.type || datos.tipo || 'EARTHQUAKE',
    severity: sevMap[rawSev] || 'MODERATE',
    startedAt,
    status: statusMap[rawStatus] || 'ACTIVE',
  };

  const mag = datos.magnitude ?? datos.magnitud;
  if (mag !== undefined && mag !== '' && !isNaN(Number(mag))) {
    payload.magnitude = Number(mag);
  }

  // Ubicación geoespacial
  const geoPoint = toGeoJsonPoint(datos.location || datos.ubicacion);
  payload.location = geoPoint || JSON.stringify({ type: 'Point', coordinates: [-74.0836, 4.6534] });

  return API.post('/incidents', payload);
};

export const listarIncidentes = () =>
  API.get('/incidents');

export const crearZonaAfectacion = (incidenteId: string, datos: any) => {
  const sevMap: Record<string, string> = {
    BAJA: 'LOW',
    MODERADA: 'MODERATE',
    ALTA: 'HIGH',
    CRITICA: 'CRITICAL',
    CRÍTICA: 'CRITICAL',
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  };

  const payload: Record<string, any> = {
    name: datos.name || datos.nombre || 'Zona de Afectación',
    level: sevMap[datos.level || datos.nivel] || 'MODERATE',
    description: datos.description || datos.descripcion || '',
    location: datos.location || datos.ubicacion,
  };

  const affected = datos.estimatedAffected ?? datos.estimadoAfectados;
  if (affected !== undefined && affected !== '' && !isNaN(Number(affected))) {
    payload.estimatedAffected = Number(affected);
  }

  return API.post(`/incidents/${incidenteId}/affectation-zones`, payload);
};

export const eliminarIncidente = (id: string) =>
  API.delete(`/incidents/${id}`);
