-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'EMERGENCY_OPERATOR', 'RESPONSE_PERSONNEL', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('EARTHQUAKE', 'FLOOD', 'LANDSLIDE', 'WILDFIRE', 'STORM', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CONTROLLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PERSON', 'INJURY', 'INFRASTRUCTURE', 'ROAD', 'HOSPITAL', 'FIRE', 'FLOOD', 'NEED', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'VALIDATED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PersonCaseStatus" AS ENUM ('MISSING', 'UNDER_VERIFICATION', 'LOCATED', 'DECEASED_CONFIRMED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InfrastructureType" AS ENUM ('ROAD', 'BRIDGE', 'BUILDING', 'HOSPITAL', 'SCHOOL', 'OTHER');

-- CreateEnum
CREATE TYPE "InfrastructureStatus" AS ENUM ('REPORTED', 'ASSESSED', 'AFFECTED', 'RECOVERED');

-- CreateEnum
CREATE TYPE "HumanitarianNeedType" AS ENUM ('WATER', 'FOOD', 'MEDICINE', 'SHELTER', 'CLOTHING', 'MEDICAL_ATTENTION', 'OTHER');

-- CreateEnum
CREATE TYPE "HumanitarianNeedPriority" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HumanitarianNeedStatus" AS ENUM ('REPORTED', 'VALIDATED', 'IN_PROGRESS', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('FIRE_DEPARTMENT', 'CIVIL_DEFENSE', 'RED_CROSS', 'POLICE', 'TERRITORIAL_ENTITY', 'HEALTH', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ResponseUnitType" AS ENUM ('VEHICLE', 'BRIGADE', 'MEDICAL_UNIT', 'RESCUE_UNIT', 'OTHER');

-- CreateEnum
CREATE TYPE "ResponseUnitStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'UNAVAILABLE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "IncidentAssignmentStatus" AS ENUM ('ASSIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "status" "OrganizationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseUnit" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResponseUnitType" NOT NULL,
    "status" "ResponseUnitStatus" NOT NULL,
    "phone" TEXT,
    "location" geometry(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponseUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL,
    "location" geometry(Point, 4326),
    "startedAt" TIMESTAMP(3) NOT NULL,
    "controlledAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentAssignment" (
    "id" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "responseUnitId" UUID NOT NULL,
    "role" TEXT,
    "status" "IncidentAssignmentStatus" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "incidentId" UUID,
    "userId" UUID,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" geometry(Point, 4326),
    "status" "ReportStatus" NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "identificationType" TEXT,
    "identificationNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonCase" (
    "id" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "status" "PersonCaseStatus" NOT NULL,
    "description" TEXT,
    "lastKnownLocation" geometry(Point, 4326),
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Infrastructure" (
    "id" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "type" "InfrastructureType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "InfrastructureStatus" NOT NULL,
    "location" geometry(Point, 4326),
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Infrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanitarianNeed" (
    "id" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "type" "HumanitarianNeedType" NOT NULL,
    "description" TEXT,
    "quantity" INTEGER,
    "unit" TEXT,
    "location" geometry(Point, 4326),
    "priority" "HumanitarianNeedPriority" NOT NULL,
    "status" "HumanitarianNeedStatus" NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanitarianNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" UUID,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_type_idx" ON "Incident"("type");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- CreateIndex
CREATE INDEX "Incident_startedAt_idx" ON "Incident"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentAssignment_incidentId_responseUnitId_key" ON "IncidentAssignment"("incidentId", "responseUnitId");

-- CreateIndex
CREATE INDEX "Report_incidentId_idx" ON "Report"("incidentId");

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_reportedAt_idx" ON "Report"("reportedAt");

-- CreateIndex
CREATE INDEX "PersonCase_incidentId_idx" ON "PersonCase"("incidentId");

-- CreateIndex
CREATE INDEX "PersonCase_personId_idx" ON "PersonCase"("personId");

-- CreateIndex
CREATE INDEX "PersonCase_status_idx" ON "PersonCase"("status");

-- CreateIndex
CREATE INDEX "Infrastructure_incidentId_idx" ON "Infrastructure"("incidentId");

-- CreateIndex
CREATE INDEX "Infrastructure_status_idx" ON "Infrastructure"("status");

-- CreateIndex
CREATE INDEX "HumanitarianNeed_incidentId_idx" ON "HumanitarianNeed"("incidentId");

-- CreateIndex
CREATE INDEX "HumanitarianNeed_status_idx" ON "HumanitarianNeed"("status");

-- CreateIndex
CREATE INDEX "HumanitarianNeed_priority_idx" ON "HumanitarianNeed"("priority");

-- AddForeignKey
ALTER TABLE "ResponseUnit" ADD CONSTRAINT "ResponseUnit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentAssignment" ADD CONSTRAINT "IncidentAssignment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentAssignment" ADD CONSTRAINT "IncidentAssignment_responseUnitId_fkey" FOREIGN KEY ("responseUnitId") REFERENCES "ResponseUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonCase" ADD CONSTRAINT "PersonCase_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonCase" ADD CONSTRAINT "PersonCase_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Infrastructure" ADD CONSTRAINT "Infrastructure_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanitarianNeed" ADD CONSTRAINT "HumanitarianNeed_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
