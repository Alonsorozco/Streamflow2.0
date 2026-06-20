export interface PlaylistItem {
  id: string; // Unique generated or URL-based ID
  name: string; // Channel/track title
  url: string; // Stream URL
  group: string; // Category or group-title
  logo?: string; // Logo image URL
  tvgId?: string; // TV guide ID if present
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  sourceType: 'file' | 'url' | 'text' | 'preset';
  sourceValue: string; // File name, URL, or template name
  createdAt: number;
}

export interface PlaybackHistoryItem {
  channelId: string;
  channelName: string;
  channelUrl: string;
  channelGroup: string;
  logo?: string;
  playedAt: number;
}

