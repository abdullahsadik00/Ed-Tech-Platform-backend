-- AlterTable
ALTER TABLE "LoginHistory" ALTER COLUMN "hasError" SET DEFAULT false;

-- CreateTable
CREATE TABLE "SubSectionProgress" (
    "id" SERIAL NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseProgressId" INTEGER NOT NULL,
    "subSectionId" INTEGER NOT NULL,

    CONSTRAINT "SubSectionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubSectionProgress_subSectionId_idx" ON "SubSectionProgress"("subSectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubSectionProgress_courseProgressId_subSectionId_key" ON "SubSectionProgress"("courseProgressId", "subSectionId");

-- AddForeignKey
ALTER TABLE "SubSectionProgress" ADD CONSTRAINT "SubSectionProgress_courseProgressId_fkey" FOREIGN KEY ("courseProgressId") REFERENCES "CourseProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSectionProgress" ADD CONSTRAINT "SubSectionProgress_subSectionId_fkey" FOREIGN KEY ("subSectionId") REFERENCES "SubSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
