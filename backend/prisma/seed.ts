import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const EPICENTER = { lat: 4.6534, lon: -74.0836 };

/** Asigna un punto a una columna geometry(Point, 4326) usando PostGIS. */
async function setPoint(
  table: string,
  id: string,
  lat: number,
  lon: number,
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "${table}" SET "location" = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE "id" = $3::uuid`,
    lon,
    lat,
    id,
  );
}

/** Construye un polígono cuadrado aproximado alrededor de un centro. */
function squareWkt(center: { lat: number; lon: number }, radiusDeg: number): string {
  const { lat, lon } = center;
  const rings = [
    [lat - radiusDeg, lon - radiusDeg],
    [lat - radiusDeg, lon + radiusDeg],
    [lat + radiusDeg, lon + radiusDeg],
    [lat + radiusDeg, lon - radiusDeg],
    [lat - radiusDeg, lon - radiusDeg],
  ];
  const coords = rings.map(([y, x]) => `${x} ${y}`).join(',');
  return `POLYGON((${coords}))`;
}

/** Inserta una zona de afectación con su polígono (SQL raw, PostGIS). */
async function insertAffectationZone(data: {
  incidentId: string;
  name: string;
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  description: string;
  estimatedAffected: number;
  wkt: string;
}): Promise<string> {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO "AffectationZone"
       ("id", "incidentId", "name", "level", "description", "estimatedAffected", "location", "updatedAt")
     VALUES (gen_random_uuid(), $1::uuid, $2, $3::"AffectationLevel", $4, $5, ST_GeomFromText($6, 4326), now())
     RETURNING "id"`,
    data.incidentId,
    data.name,
    data.level,
    data.description,
    data.estimatedAffected,
    data.wkt,
  );
  return rows[0].id;
}

interface OrgSeed {
  name: string;
  type: 'FIRE_DEPARTMENT' | 'HEALTH' | 'RED_CROSS' | 'POLICE';
  description: string;
  phone: string;
  email: string;
  website?: string;
  location: { lat: number; lon: number };
}

interface UnitSeed {
  name: string;
  type: 'VEHICLE' | 'MEDICAL_UNIT' | 'RESCUE_UNIT' | 'BRIGADE';
  status: 'AVAILABLE' | 'ASSIGNED' | 'UNAVAILABLE';
  phone: string;
  location: { lat: number; lon: number };
}

const hospitals: OrgSeed[] = [
  {
    name: 'Hospital Universitario San Ignacio',
    type: 'HEALTH',
    description: 'Hospital universitario de alta complejidad.',
    phone: '+57 601 594 6161',
    email: 'contacto@husi.org.co',
    website: 'https://www.husi.org.co',
    location: { lat: 4.6161, lon: -74.0653 },
  },
  {
    name: 'Hospital de San José',
    type: 'HEALTH',
    description: 'Hospital general de la ciudad. Centro médico de referencia.',
    phone: '+57 601 352 1111',
    email: 'contacto@sanjose.org.co',
    location: { lat: 4.6571, lon: -74.0683 },
  },
  {
    name: 'Clínica del Country',
    type: 'HEALTH',
    description: 'Clínica privada con servicio de urgencias 24/7.',
    phone: '+57 601 668 8000',
    email: 'contacto@clinicacountry.com',
    website: 'https://www.clinicacountry.com',
    location: { lat: 4.6714, lon: -74.0521 },
  },
  {
    name: 'Hospital Santa Clara',
    type: 'HEALTH',
    description: 'Hospital público del centro de Bogotá.',
    phone: '+57 601 352 5555',
    email: 'contacto@hospitalsantaclara.gov.co',
    location: { lat: 4.6359, lon: -74.0709 },
  },
  {
    name: 'Cuerpo de Bomberos Bogotá — Estación Central',
    type: 'FIRE_DEPARTMENT',
    description: 'Estación central de bomberos. Cuartel general.',
    phone: '+57 601 382 2500',
    email: 'central@bomberosbogota.gov.co',
    website: 'https://www.bomberosbogota.gov.co',
    location: { lat: 4.6212, lon: -74.0725 },
  },
  {
    name: 'Bomberos Bogotá — Estación Chapinero',
    type: 'FIRE_DEPARTMENT',
    description: 'Estación de bomberos de la localidad de Chapinero.',
    phone: '+57 601 800 7700',
    email: 'chapinero@bomberosbogota.gov.co',
    location: { lat: 4.6455, lon: -74.0497 },
  },
  {
    name: 'Cruz Roja Colombiana — Sede Bogotá',
    type: 'RED_CROSS',
    description: 'Socorro, salud y atención humanitaria de emergencia.',
    phone: '+57 601 437 6300',
    email: 'bogota@cruzrojacolombiana.org',
    website: 'https://www.cruzrojacolombiana.org',
    location: { lat: 4.6097, lon: -74.0657 },
  },
  {
    name: 'Policía Nacional — Centro de Mando Bogotá',
    type: 'POLICE',
    description: 'Unidad de coordinación policial para emergencias.',
    phone: '+57 601 112',
    email: 'centro.mando@policia.gov.co',
    location: { lat: 4.6298, lon: -74.0774 },
  },
];

const units: UnitSeed[] = [
  {
    name: 'Ambulancia 01 — San Ignacio',
    type: 'VEHICLE',
    status: 'ASSIGNED',
    phone: '+57 601 594 6161 ext 101',
    location: { lat: 4.632, lon: -74.07 },
  },
  {
    name: 'Ambulancia 02 — San José',
    type: 'VEHICLE',
    status: 'ASSIGNED',
    phone: '+57 601 352 1111 ext 202',
    location: { lat: 4.661, lon: -74.075 },
  },
  {
    name: 'Ambulancia 03 — Santa Clara',
    type: 'VEHICLE',
    status: 'AVAILABLE',
    phone: '+57 601 352 5555 ext 303',
    location: { lat: 4.623, lon: -74.079 },
  },
  {
    name: 'Ambulancia 04 — Clínica del Country',
    type: 'VEHICLE',
    status: 'AVAILABLE',
    phone: '+57 601 668 8000 ext 404',
    location: { lat: 4.67, lon: -74.07 },
  },
  {
    name: 'Motor 01 — Estación Central',
    type: 'VEHICLE',
    status: 'ASSIGNED',
    phone: '+57 601 382 2500',
    location: { lat: 4.622, lon: -74.073 },
  },
  {
    name: 'Escalera 02 — Chapinero',
    type: 'VEHICLE',
    status: 'ASSIGNED',
    phone: '+57 601 800 7700',
    location: { lat: 4.647, lon: -74.06 },
  },
  {
    name: 'Unidad Médica Cruz Roja 01',
    type: 'MEDICAL_UNIT',
    status: 'ASSIGNED',
    phone: '+57 601 437 6300',
    location: { lat: 4.61, lon: -74.068 },
  },
  {
    name: 'Unidad de Rescate 01 — Bomberos',
    type: 'RESCUE_UNIT',
    status: 'AVAILABLE',
    phone: '+57 601 382 2500',
    location: { lat: 4.628, lon: -74.085 },
  },
];

/** Asocia una unidad con su organización a partir de su nombre. */
function resolveOrganizationForUnit(
  unitName: string,
  orgIds: Record<string, string>,
): string {
  if (unitName.includes('San Ignacio')) return orgIds['Hospital Universitario San Ignacio'];
  if (unitName.includes('San José')) return orgIds['Hospital de San José'];
  if (unitName.includes('Santa Clara')) return orgIds['Hospital Santa Clara'];
  if (unitName.includes('Country')) return orgIds['Clínica del Country'];
  if (unitName.includes('Chapinero')) return orgIds['Bomberos Bogotá — Estación Chapinero'];
  if (unitName.includes('Cruz Roja')) return orgIds['Cruz Roja Colombiana — Sede Bogotá'];
  return orgIds['Cuerpo de Bomberos Bogotá — Estación Central'];
}

async function main() {
  const ADMIN_EMAIL = 'admin@redco.local';
  const INCIDENT_TITLE = 'Sismo de Bogotá — Magnitud 6.2 Mw';

  const existing = await prisma.incident.findFirst({
    where: { title: INCIDENT_TITLE },
  });
  if (existing) {
    await prisma.incidentAssignment.deleteMany({
      where: { incidentId: existing.id },
    });
    await prisma.affectationZone.deleteMany({
      where: { incidentId: existing.id },
    });
    const orgEmails = hospitals.map((h) => h.email);
    const orgs = await prisma.organization.findMany({
      where: { email: { in: orgEmails } },
    });
    await prisma.responseUnit.deleteMany({
      where: { organizationId: { in: orgs.map((o) => o.id) } },
    });
    await prisma.organization.deleteMany({
      where: { email: { in: orgEmails } },
    });
    await prisma.incident.delete({ where: { id: existing.id } });
    console.log('Datos demo anteriores eliminados. Recreando...');
  }

  // ------------------------------------------------------------
  // Usuario administrador
  // ------------------------------------------------------------
  let admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        firstName: 'Admin',
        lastName: 'REDCO',
        role: 'ADMINISTRATOR',
        status: 'ACTIVE',
      },
    });
    console.log(`Usuario admin creado: ${ADMIN_EMAIL} / Admin123!`);
  }

  // ------------------------------------------------------------
  // Incidente (sismo) con epicentro
  // ------------------------------------------------------------
  const incident = await prisma.incident.create({
    data: {
      title: INCIDENT_TITLE,
      description:
        'Sismo de magnitud 6.2 Mw con epicentro en el centro de Bogotá. ' +
        'Las zonas cercanas al epicentro presentan afectación crítica en ' +
        'infraestructura y servicios básicos.',
      type: 'EARTHQUAKE',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      magnitude: 6.2,
      startedAt: new Date('2026-09-14T03:00:00.000Z'),
      createdById: admin.id,
    },
  });
  await setPoint('Incident', incident.id, EPICENTER.lat, EPICENTER.lon);

  // ------------------------------------------------------------
  // Zonas de afectación (anillos concéntricos)
  // ------------------------------------------------------------
  const zones = [
    {
      name: 'Zona crítica — Epicentro (Centro Histórico)',
      level: 'CRITICAL' as const,
      description:
        'Colapso parcial de edificaciones antiguas, daños en vías y cortes ' +
        'de energía. Se requiere evacuación inmediata.',
      estimatedAffected: 12000,
      radius: 0.012,
    },
    {
      name: 'Zona alta — Centro ampliado',
      level: 'HIGH' as const,
      description:
        'Afectación estructural moderada, caída de fachadas y aglomeraciones ' +
        'en vías principales.',
      estimatedAffected: 45000,
      radius: 0.028,
    },
    {
      name: 'Zona moderada — Chapinero y Teusaquillo',
      level: 'MODERATE' as const,
      description:
        'Daños menores en viviendas, ventanas y vías. Operatividad parcial ' +
        'de servicios básicos.',
      estimatedAffected: 90000,
      radius: 0.05,
    },
    {
      name: 'Zona baja — Periferia de Bogotá',
      level: 'LOW' as const,
      description: 'Percepción del sismo con daños menores. Comunidad en alerta por réplicas.',
      estimatedAffected: 180000,
      radius: 0.085,
    },
  ];

  const zoneRows: string[] = [];
  for (const zone of zones) {
    const id = await insertAffectationZone({
      incidentId: incident.id,
      name: zone.name,
      level: zone.level,
      description: zone.description,
      estimatedAffected: zone.estimatedAffected,
      wkt: squareWkt(EPICENTER, zone.radius),
    });
    zoneRows.push(id);
  }
  console.log(`Zonas de afectación creadas: ${zoneRows.length}`);

  // ------------------------------------------------------------
  // Organizaciones (hospitales, bomberos, etc.)
  // ------------------------------------------------------------
  const orgIds: Record<string, string> = {};
  for (const org of hospitals) {
    const created = await prisma.organization.create({
      data: {
        name: org.name,
        type: org.type,
        description: org.description,
        phone: org.phone,
        email: org.email,
        website: org.website,
        status: 'ACTIVE',
      },
    });
    await setPoint('Organization', created.id, org.location.lat, org.location.lon);
    orgIds[org.name] = created.id;
  }
  console.log(`Organizaciones creadas: ${hospitals.length}`);

  // ------------------------------------------------------------
  // Unidades de respuesta (ambulancias, motores de bomberos...)
  // ------------------------------------------------------------
  const unitRows: { id: string; organizationId: string; name: string }[] = [];
  for (const unit of units) {
    const org = resolveOrganizationForUnit(unit.name, orgIds);
    const created = await prisma.responseUnit.create({
      data: {
        organizationId: org,
        name: unit.name,
        type: unit.type,
        status: unit.status,
        phone: unit.phone,
      },
    });
    await setPoint('ResponseUnit', created.id, unit.location.lat, unit.location.lon);
    unitRows.push({ id: created.id, organizationId: org, name: unit.name });
  }
  console.log(`Unidades de respuesta creadas: ${unitRows.length}`);

  // ------------------------------------------------------------
  // Asignaciones de unidades al incidente
  // ------------------------------------------------------------
  const assigned = unitRows.filter((u) => u.name.includes('01') || u.name.includes('02'));
  for (const unit of assigned) {
    await prisma.incidentAssignment.create({
      data: {
        incidentId: incident.id,
        responseUnitId: unit.id,
        role: 'Activa en zona afectada',
        status: 'ACTIVE',
      },
    });
  }
  console.log(`Asignaciones realizadas: ${assigned.length}`);

  console.log('Seed completado. Los datos demo están listos.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });