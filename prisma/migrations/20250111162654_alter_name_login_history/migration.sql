/*
  Warnings:

  - You are about to drop the column `success` on the `LoginHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LoginHistory" DROP COLUMN "success",
ADD COLUMN     "hasError" BOOLEAN NOT NULL DEFAULT true;
