# System Architecture

## Database Schema (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spotify_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(255),
    image_url TEXT,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_polled_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE play_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    track_id VARCHAR(255), -- Spotify Track ID
    played_at TIMESTAMP WITH TIME ZONE NOT NULL,
    track_metadata JSONB, -- Snapshot of track name/artist at time of play
    UNIQUE (user_id, played_at)
);