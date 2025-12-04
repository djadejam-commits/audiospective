// src/dto/share.dto.ts

/**
 * Share report creation response
 */
export interface ShareReportResponse {
  shareId: string;
  shareUrl: string;
  title: string;
  createdAt: string;
}

/**
 * Share report data structure
 */
export interface ShareReportData {
  totalPlays: number;
  userName: string;
  topTracks: TopTrackInfo[];
  generatedAt: string;
}

/**
 * Top track information
 */
export interface TopTrackInfo {
  name: string;
  artists: string;
  playCount: number;
}

/**
 * Public share report response
 */
export interface PublicShareReportResponse {
  title: string;
  description: string | null;
  reportData: ShareReportData;
  createdAt: Date;
  viewCount: number;
  userName: string;
  userImage: string | null;
}
