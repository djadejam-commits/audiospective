-- AlterTable
ALTER TABLE "users" ADD COLUMN "archive_requested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "archive_requested_at" TIMESTAMP;
