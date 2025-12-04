-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotify_id" TEXT NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "image_url" TEXT,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "token_expires_at" INTEGER,
    "last_polled_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_successful_scrobble" DATETIME,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "last_failure_type" TEXT,
    "last_failed_at" DATETIME,
    "auth_notification_count" INTEGER NOT NULL DEFAULT 0,
    "last_notification_sent" DATETIME,
    "subscription_plan" TEXT NOT NULL DEFAULT 'free',
    "founding_member_number" INTEGER
);

-- CreateTable
CREATE TABLE "play_history" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "played_at" DATETIME NOT NULL,
    "track_metadata" TEXT,
    CONSTRAINT "play_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_spotify_id_key" ON "users"("spotify_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_founding_member_number_key" ON "users"("founding_member_number");

-- CreateIndex
CREATE INDEX "play_history_user_id_played_at_idx" ON "play_history"("user_id", "played_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "play_history_user_id_played_at_key" ON "play_history"("user_id", "played_at");
