-- ============================================================
-- PROYECTO REDCO: Sistema de Gestión de Desastres Naturales y Emergencias
-- Base de Datos MySQL - Script DDL Completo y Optimizado
-- ============================================================

DROP DATABASE IF EXISTS redco_test;

CREATE DATABASE redco_test
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE redco_test;

-- ============================================================
-- 1. TABLA: User (Soporta RF01, RF02, RF03, RF30 - Autenticación y RBAC)
-- ============================================================
CREATE TABLE User (
    id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role ENUM(
        'CITIZEN',
        'EMERGENCY_OPERATOR',
        'RESPONSE_PERSONNEL',
        'ADMINISTRATOR'
    ) NOT NULL,
    status ENUM(
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED'
    ) NOT NULL,
    lastLoginAt DATETIME(3),
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    UNIQUE KEY uk_user_email (email),
    INDEX idx_user_role (role),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TABLA: Organization (Soporta RF24 - Directorio de Entidades / COE, Bomberos, etc.)
-- ============================================================
CREATE TABLE Organization (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM(
        'FIRE_DEPARTMENT',
        'CIVIL_DEFENSE',
        'RED_CROSS',
        'POLICE',
        'TERRITORIAL_ENTITY',
        'HEALTH',
        'OTHER'
    ) NOT NULL,
    description TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    INDEX idx_org_type (type),
    INDEX idx_org_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TABLA: ResponseUnit (Soporta RF25, RF26, RF27 - Unidades de Respuesta y Despacho con SIG)
-- ============================================================
CREATE TABLE ResponseUnit (
    id CHAR(36) NOT NULL,
    organizationId CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM(
        'VEHICLE',
        'BRIGADE',
        'MEDICAL_UNIT',
        'RESCUE_UNIT',
        'OTHER'
    ) NOT NULL,
    status ENUM(
        'AVAILABLE',
        'ASSIGNED',
        'UNAVAILABLE',
        'INACTIVE'
    ) NOT NULL,
    phone VARCHAR(50),
    location POINT SRID 4326 NOT NULL, -- Corregido con NOT NULL para índice espacial
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    CONSTRAINT fk_responseunit_organization
        FOREIGN KEY (organizationId)
        REFERENCES Organization(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    SPATIAL INDEX sx_responseunit_location (location),
    INDEX idx_responseunit_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TABLA: Incident (Soporta RF04, RF07, RF08, RF14, RF15, RF16 - Expedientes de Incidentes)
-- ============================================================
CREATE TABLE Incident (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    type ENUM(
        'EARTHQUAKE',
        'FLOOD',
        'LANDSLIDE',
        'WILDFIRE',
        'STORM',
        'OTHER'
    ) NOT NULL,

    severity ENUM(
        'LOW',
        'MODERATE',
        'HIGH',
        'CRITICAL'
    ) NOT NULL,

    status ENUM(
        'DRAFT',
        'ACTIVE',
        'CONTROLLED',
        'CLOSED'
    ) NOT NULL,

    location POINT SRID 4326 NOT NULL, -- Corregido con NOT NULL para índice espacial

    startedAt DATETIME(3) NOT NULL,
    controlledAt DATETIME(3),
    closedAt DATETIME(3),

    createdById CHAR(36) NOT NULL,

    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),

    CONSTRAINT fk_incident_user
        FOREIGN KEY (createdById)
        REFERENCES User(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    SPATIAL INDEX sx_incident_location (location),
    INDEX idx_incident_status (status),
    INDEX idx_incident_type (type),
    INDEX idx_incident_severity (severity),
    INDEX idx_incident_startedAt (startedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. TABLA: IncidentAssignment (Soporta RF26, RF27 - Asignación de Recursos a Incidentes)
-- ============================================================
CREATE TABLE IncidentAssignment (
    id CHAR(36) NOT NULL,
    incidentId CHAR(36) NOT NULL,
    responseUnitId CHAR(36) NOT NULL,

    role VARCHAR(255),

    status ENUM(
        'ASSIGNED',
        'ACTIVE',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL,

    assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    endedAt DATETIME(3),
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),

    UNIQUE KEY uk_incident_responseunit (
        incidentId,
        responseUnitId
    ),

    CONSTRAINT fk_assignment_incident
        FOREIGN KEY (incidentId)
        REFERENCES Incident(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_assignment_responseunit
        FOREIGN KEY (responseUnitId)
        REFERENCES ResponseUnit(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_assignment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. TABLA: Report (Soporta RF11, RF12, RF13 - Reportes Ciudadanos y de Campo)
-- ============================================================
CREATE TABLE Report (
    id CHAR(36) NOT NULL,

    incidentId CHAR(36),
    userId CHAR(36),

    type ENUM(
        'PERSON',
        'INJURY',
        'INFRASTRUCTURE',
        'ROAD',
        'HOSPITAL',
        'FIRE',
        'FLOOD',
        'NEED',
        'OTHER'
    ) NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    location POINT SRID 4326 NOT NULL, -- Corregido con NOT NULL para índice espacial

    status ENUM(
        'RECEIVED',
        'UNDER_REVIEW',
        'VALIDATED',
        'REJECTED',
        'ARCHIVED'
    ) NOT NULL,

    reportedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    reviewedAt DATETIME(3),
    reviewedById CHAR(36),
    deletedAt DATETIME(3),

    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),

    CONSTRAINT fk_report_incident
        FOREIGN KEY (incidentId)
        REFERENCES Incident(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_report_user
        FOREIGN KEY (userId)
        REFERENCES User(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_report_reviewer
        FOREIGN KEY (reviewedById)
        REFERENCES User(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    SPATIAL INDEX sx_report_location (location),
    INDEX idx_report_incidentId (incidentId),
    INDEX idx_report_userId (userId),
    INDEX idx_report_status (status),
    INDEX idx_report_reportedAt (reportedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. TABLA: Person (Soporta RF05, RF17, RF18, RF19, RF20 - Datos Maestros de Personas Involucradas)
-- ============================================================
CREATE TABLE Person (
    id CHAR(36) NOT NULL,

    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,

    identificationType VARCHAR(100),
    identificationNumber VARCHAR(100),

    dateOfBirth DATETIME(3),
    gender VARCHAR(50),
    phone VARCHAR(50),

    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),
    INDEX idx_person_idnumber (identificationNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. TABLA: PersonCase (Soporta RF18, RF19, RF20 - Casos de Desaparecidos, Heridos y Fallecidos)
-- ============================================================
CREATE TABLE PersonCase (
    id CHAR(36) NOT NULL,

    personId CHAR(36) NOT NULL,
    incidentId CHAR(36) NOT NULL,

    status ENUM(
        'MISSING',
        'UNDER_VERIFICATION',
        'LOCATED',
        'DECEASED_CONFIRMED',
        'CLOSED'
    ) NOT NULL,

    description TEXT,

    lastKnownLocation POINT SRID 4326 NOT NULL, -- Corregido con NOT NULL para índice espacial

    reportedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    verifiedAt DATETIME(3),
    verifiedById CHAR(36),

    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),

    CONSTRAINT fk_personcase_person
        FOREIGN KEY (personId)
        REFERENCES Person(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_personcase_incident
        FOREIGN KEY (incidentId)
        REFERENCES Incident(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_personcase_verifier
        FOREIGN KEY (verifiedById)
        REFERENCES User(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    SPATIAL INDEX sx_personcase_location (lastKnownLocation),
    INDEX idx_personcase_incidentId (incidentId),
    INDEX idx_personcase_personId (personId),
    INDEX idx_personcase_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. TABLA: Infrastructure (Soporta RF06, RF10, RF21 - Evaluación de Vías, Puentes, Hospitales y Edificios)
-- ============================================================
CREATE TABLE Infrastructure (
    id CHAR(36) NOT NULL,

    incidentId CHAR(36) NOT NULL,

    type ENUM(
        'ROAD',
        'BRIDGE',
        'BUILDING',
        'HOSPITAL',
        'SCHOOL',
        'OTHER'
    ) NOT NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    status ENUM(
        'REPORTED',
        'ASSESSED',
        'AFFECTED',
        'RECOVERED'
    ) NOT NULL,

    location POINT SRID 4326 NOT NULL, -- Corregido con NOT NULL para índice espacial

    reportedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    assessedAt DATETIME(3),
    recoveredAt DATETIME(3),

    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),

    CONSTRAINT fk_infrastructure_incident
        FOREIGN KEY (incidentId)
        REFERENCES Incident(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    SPATIAL INDEX sx_infrastructure_location (location),
    INDEX idx_infrastructure_incidentId (incidentId),
    INDEX idx_infrastructure_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. TABLA: HumanitarianNeed (Soporta RF22, RF23 - Registro y Gestión de Recursos y Necesidades Humanitarias)
-- ============================================================
CREATE TABLE HumanitarianNeed (
    id CHAR(36) NOT NULL,

    incidentId CHAR(36) NOT NULL,

    type ENUM(
        'WATER',
        'FOOD',
        'MEDICINE',
        'SHELTER',
        'CLOTHING',
        'MEDICAL_ATTENTION',
        'OTHER'
    ) NOT NULL,

    description TEXT,

    quantity INT,
    unit VARCHAR(100),

    location POINT SRID 4326 NOT NULL, -- Corregido con NOT NULL para índice espacial

    priority ENUM(
        'LOW',
        'MODERATE',
        'HIGH',
        'CRITICAL'
    ) NOT NULL,

    status ENUM(
        'REPORTED',
        'VALIDATED',
        'IN_PROGRESS',
        'FULFILLED',
        'CANCELLED'
    ) NOT NULL,

    reportedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    fulfilledAt DATETIME(3),

    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),

    CONSTRAINT fk_humanitarianneed_incident
        FOREIGN KEY (incidentId)
        REFERENCES Incident(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    SPATIAL INDEX sx_humanitarianneed_location (location),
    INDEX idx_humanitarianneed_incidentId (incidentId),
    INDEX idx_humanitarianneed_status (status),
    INDEX idx_humanitarianneed_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. TABLA: Evidence (Evidencias multimedia adjuntas a reportes: fotos, videos, documentos)
-- ============================================================
CREATE TABLE Evidence (
    id CHAR(36) NOT NULL,

    reportId CHAR(36) NOT NULL,

    type ENUM(
        'IMAGE',
        'VIDEO',
        'DOCUMENT',
        'OTHER'
    ) NOT NULL,

    fileName VARCHAR(255) NOT NULL,
    mimeType VARCHAR(255) NOT NULL,
    storageKey VARCHAR(500) NOT NULL,

    size INT NOT NULL,

    uploadedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    uploadedById CHAR(36),

    PRIMARY KEY (id),

    CONSTRAINT fk_evidence_report
        FOREIGN KEY (reportId)
        REFERENCES Report(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_evidence_user
        FOREIGN KEY (uploadedById)
        REFERENCES User(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_evidence_reportId (reportId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. TABLA: AuditLog (Soporta RF29 - Trazabilidad e Historial Inalterable de Operaciones)
-- ============================================================
CREATE TABLE AuditLog (
    id CHAR(36) NOT NULL,

    userId CHAR(36) NOT NULL,

    action VARCHAR(255) NOT NULL,
    entityType VARCHAR(255) NOT NULL,
    entityId VARCHAR(255) NOT NULL,

    metadata JSON,

    ipAddress VARCHAR(100),
    userAgent TEXT,

    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (id),

    CONSTRAINT fk_auditlog_user
        FOREIGN KEY (userId)
        REFERENCES User(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_auditlog_userId (userId),
    INDEX idx_auditlog_entity (entityType, entityId),
    INDEX idx_auditlog_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;