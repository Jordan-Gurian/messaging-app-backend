-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profile_bio" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "profile_url" TEXT NOT NULL DEFAULT 'images/profile-default.svg';
