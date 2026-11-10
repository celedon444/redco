import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../shared/prisma/prisma.service';
import { IncidentService } from './incident/incident.service';
import { PersonCaseService } from './person-case/person-case.service';
import { LostRelativeService } from './lost-relative/lost-relative.service';
import { VolunteerService } from './volunteer/volunteer.service';

describe('Prisma POST Services', () => {
  let incidentService: IncidentService;
  let personCaseService: PersonCaseService;
  let lostRelativeService: LostRelativeService;
  let volunteerService: VolunteerService;

  const mockPrisma = {
    incident: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    person: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    personCase: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    lostRelativeReport: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    volunteerApplication: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentService,
        PersonCaseService,
        LostRelativeService,
        VolunteerService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    incidentService = module.get<IncidentService>(IncidentService);
    personCaseService = module.get<PersonCaseService>(PersonCaseService);
    lostRelativeService = module.get<LostRelativeService>(LostRelativeService);
    volunteerService = module.get<VolunteerService>(VolunteerService);
  });

  it('IncidentService.create should save incident to Prisma', async () => {
    mockPrisma.incident.create.mockResolvedValue({ id: 'inc-123' });
    mockPrisma.incident.findUnique.mockResolvedValue({ id: 'inc-123', title: 'Terremoto' });

    const result = await incidentService.create('user-admin-1', {
      title: 'Terremoto Bogotá',
      description: 'Prueba',
      type: 'EARTHQUAKE' as any,
      severity: 'CRITICAL' as any,
      magnitude: 6.5,
      startedAt: new Date().toISOString(),
    });

    expect(mockPrisma.incident.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('PersonCaseService.create should save person and case to Prisma', async () => {
    mockPrisma.incident.findFirst.mockResolvedValue({ id: 'inc-123' });
    mockPrisma.person.create.mockResolvedValue({ id: 'person-123' });
    mockPrisma.personCase.create.mockResolvedValue({ id: 'case-123' });
    mockPrisma.personCase.findUnique.mockResolvedValue({ id: 'case-123' });

    const result = await personCaseService.create('user-1', {
      firstName: 'Carlos',
      lastName: 'Gomez',
      status: 'MISSING' as any,
      victimType: 'INJURED' as any,
    });

    expect(mockPrisma.person.create).toHaveBeenCalled();
    expect(mockPrisma.personCase.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('LostRelativeService.create should save report to Prisma', async () => {
    mockPrisma.lostRelativeReport.create.mockResolvedValue({ id: 'report-123' });
    mockPrisma.lostRelativeReport.findUnique.mockResolvedValue({ id: 'report-123', fullName: 'Maria' });

    const result = await lostRelativeService.create('user-1', {
      fullName: 'Maria Rodriguez',
      age: 30,
      gender: 'Femenino',
      phone: '3001234567',
    });

    expect(mockPrisma.lostRelativeReport.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('VolunteerService.apply should save volunteer application to Prisma', async () => {
    mockPrisma.volunteerApplication.findFirst.mockResolvedValue(null);
    mockPrisma.volunteerApplication.create.mockResolvedValue({ id: 'vol-123', userId: 'user-1' });

    const result = await volunteerService.apply('user-1', {
      notes: 'Quiero apoyar en la zona de desastre',
    });

    expect(mockPrisma.volunteerApplication.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
