// src/dto/stats.dto.ts

/**
 * User statistics response
 */
export interface UserStatsResponse {
  totalPlays: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

/**
 * Top track statistics
 */
export interface TopTrackStats {
  trackId: string;
  trackName: string;
  artistNames: string[];
  albumName: string;
  playCount: number;
}

/**
 * Top artist statistics
 */
export interface TopArtistStats {
  artistId: string;
  artistName: string;
  playCount: number;
  genres: string[];
}

/**
 * Genre distribution data
 */
export interface GenreDistribution {
  genre: string;
  count: number;
  percentage: number;
}

/**
 * Activity data point
 */
export interface ActivityDataPoint {
  date: string;
  playCount: number;
}
