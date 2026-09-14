-- CreateEnum
CREATE TYPE "AffectationLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "location" geometry(Point, 4326);

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN "magnitude" DECIMAL(4,2);

-- CreateTable
CREATE TABLE "AffectationZone" (
    "id" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" "AffectationLevel" NOT NULL,
    "description" TEXT,
    "estimatedAffected" INTEGER,
    "location" geometry(Polygon, 4326) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffectationZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffectationZone_incidentId_idx" ON "AffectationZone"("incidentId");

-- CreateIndex
CREATE INDEX "AffectationZone_level_idx" ON "AffectationZone"("level");

-- AddForeignKey
ALTER TABLE "AffectationZone" ADD CONSTRAINT "AffectationZone_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;