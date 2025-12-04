-- CreateTable
CREATE TABLE "shareable_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "share_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "report_data" TEXT NOT NULL,
    "date_range" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME,
    CONSTRAINT "shareable_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "shareable_reports_share_id_key" ON "shareable_reports"("share_id");

-- CreateIndex
CREATE INDEX "shareable_reports_share_id_idx" ON "shareable_reports"("share_id");
