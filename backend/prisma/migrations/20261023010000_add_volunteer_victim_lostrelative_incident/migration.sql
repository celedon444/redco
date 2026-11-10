-- Create new enums
CREATE TYPE "VolunteerApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "VictimType" AS ENUM ('DECEASED', 'INJURED', 'SAFE');

-- Alter UserRole enum: add VOLUNTEER, remove EMERGENCY_OPERATOR
ALTER TYPE "UserRole" ADD VALUE 'VOLUNTEER';

-- Create VolunteerApplication table
CREATE TABLE "VolunteerApplication" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "organizationId" UUID,
    "status" "VolunteerApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerApplication_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VolunteerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VolunteerApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VolunteerApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "VolunteerApplication_userId_idx" ON "VolunteerApplication"("userId");
CREATE INDEX "VolunteerApplication_status_idx" ON "VolunteerApplication"("status");

-- Add columns to PersonCase
ALTER TABLE "PersonCase" ADD COLUMN "victimType" "VictimType";
ALTER TABLE "PersonCase" ADD COLUMN "transferredTo" TEXT;
ALTER TABLE "PersonCase" ADD COLUMN "transferredAt" TIMESTAMP(3);
ALTER TABLE "PersonCase" ADD COLUMN "reporterId" UUID;

ALTER TABLE "PersonCase" ADD CONSTRAINT "PersonCase_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PersonCase_victimType_idx" ON "PersonCase"("victimType");

-- Create LostRelativeReport table
CREATE TABLE "LostRelativeReport" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporterId" UUID NOT NULL,
    "incidentId" UUID,
    "fullName" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "phone" TEXT,
    "lastKnownLocation" geometry(Point, 4326),
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'RECEIVED',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LostRelativeReport_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LostRelativeReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LostRelativeReport_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "LostRelativeReport_reporterId_idx" ON "LostRelativeReport"("reporterId");
CREATE INDEX "LostRelativeReport_incidentId_idx" ON "LostRelativeReport"("incidentId");
CREATE INDEX "LostRelativeReport_status_idx" ON "LostRelativeReport"("status");
