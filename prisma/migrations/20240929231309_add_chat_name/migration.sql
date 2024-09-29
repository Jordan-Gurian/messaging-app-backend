/*
  Warnings:

  - You are about to drop the column `chatname` on the `Chat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "chatname",
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';
