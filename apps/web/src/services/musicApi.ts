import axios, { AxiosInstance } from 'axios';

// Types for different music APIs
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  previewUrl?: string;
  coverUrl: string;
  source: 'spotify' | 'jamendo' | 'soundcloud' | 'youtube' | 'demo';
  explicit?: boolean;
  popularity?: number;
  genres?: string[];
  releaseDate?: string;
  license?: string;
  audioType?: 'preview' | 'web' | 'none';
  hasAudio?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  image?: string;
  genres?: string[];
  followers?: number;
  popularity?: number;
  source: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  image: string;
  releaseDate?: string;
  trackCount?: number;
  source: string;
}

export interface SearchResult {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  total: number;
}

// Helper function to get API base URL
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return window.location.origin;
  }
  // Server environment (Vercel)
  return process.env.VITE_API_URL || 'http://localhost:3000';
};

// Spotify Service
class SpotifyService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${getApiBaseUrl()}/api`,
      timeout: 10000,
    });
  }

  async search(query: string, limit: number = 20): Promise<Partial<SearchResult>> {
    try {
      console.log('🎵 Searching Spotify via proxy...');
      
      const response = await this.api.get('/spotify', {
        params: {
          query,
          limit,
        },
      });

      const tracks: Track[] = (response.data.tracks?.items || []).map((item: any) => ({
          id: `spotify:${item.id}`,
          title: item.name,
          artist: item.artists?.[0]?.name || 'Unknown Artist',
          album: item.album?.name || 'Unknown Album',
        duration: Math.round(item.duration_ms / 1000),
        url: item.external_urls?.spotify || '',
        previewUrl: item.preview_url || undefined,
          coverUrl: item.album?.images?.[0]?.url || '',
          source: 'spotify' as const,
        explicit: item.explicit || false,
        popularity: item.popularity / 100,
        genres: item.artists?.[0]?.genres || [],
          releaseDate: item.album?.release_date,
        license: 'Spotify',
        audioType: item.preview_url ? 'preview' : 'web',
        hasAudio: true
      }));

      // Sort tracks by popularity and availability of preview
      tracks.sort((a, b) => {
        // Prioritize tracks with preview URLs
        if (a.previewUrl && !b.previewUrl) return -1;
        if (!a.previewUrl && b.previewUrl) return 1;
        // Then sort by popularity
        return (b.popularity || 0) - (a.popularity || 0);
      });

      const artists: Artist[] = (response.data.artists?.items || []).map((item: any) => ({
        id: `spotify:${item.id}`,
        name: item.name,
        image: item.images?.[0]?.url,
        genres: item.genres || [],
        followers: item.followers?.total,
        popularity: item.popularity / 100,
        source: 'spotify'
      }));

      const albums: Album[] = (response.data.albums?.items || []).map((item: any) => ({
        id: `spotify:${item.id}`,
        title: item.name,
        artist: item.artists?.[0]?.name || 'Unknown Artist',
        image: item.images?.[0]?.url || '',
        releaseDate: item.release_date,
        trackCount: item.total_tracks,
        source: 'spotify'
      }));

      console.log(`📊 Spotify search results: ${tracks.length} tracks (${tracks.filter(t => t.previewUrl).length} with previews), ${artists.length} artists, ${albums.length} albums`);
      return { tracks, artists, albums };
    } catch (error) {
      console.error('Spotify search failed:', error);
      return { tracks: [], artists: [], albums: [] };
    }
  }
}

// Jamendo Service
class JamendoService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${getApiBaseUrl()}/api`,
      timeout: 10000,
    });
  }

  async search(query: string, limit: number = 20): Promise<Partial<SearchResult>> {
    try {
      console.log('🎵 Searching Jamendo via proxy...');
      
      const response = await this.api.get('/jamendo', {
          params: {
          type: 'tracks',
          query,
            limit,
          },
      });

      const tracks: Track[] = (response.data.results || []).map((item: any) => ({
        id: `jamendo:${item.id}`,
        title: item.name,
        artist: item.artist_name,
        album: item.album_name || 'Unknown Album',
        duration: item.duration,
        url: item.audio,
        previewUrl: item.audio,
        coverUrl: item.image || '',
        source: 'jamendo' as const,
        explicit: false,
        popularity: item.popularity / 100,
        genres: item.tags || [],
        releaseDate: item.releasedate,
        license: item.license_ccurl || 'Creative Commons'
      }));

      console.log(`📊 Jamendo search results: ${tracks.length} tracks found`);
      return { tracks };
    } catch (error) {
      console.error('Jamendo search failed:', error);
      return { tracks: [] };
    }
  }
}

// SoundCloud Service (disabled - API forms closed)
class SoundCloudService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${getApiBaseUrl()}/api`,
      timeout: 10000,
    });
  }

  async search(query: string, limit: number = 20): Promise<Partial<SearchResult>> {
    // SoundCloud API is currently disabled
    console.log('🎵 SoundCloud search disabled - API forms closed');
    return { tracks: [] };
  }
}

// YouTube Service
class YouTubeService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${getApiBaseUrl()}/api`,
      timeout: 10000,
    });
  }

  async search(query: string, limit: number = 20): Promise<Partial<SearchResult>> {
    try {
      console.log('🎵 Searching YouTube via proxy...');
      
      const response = await this.api.get('/youtube', {
        params: {
          query,
          limit,
        },
      });

      if (!response.data || !response.data.items) {
        console.log('📊 YouTube search results: 0 tracks (no items in response)');
        return { tracks: [] };
      }

      const tracks: Track[] = response.data.items.map((item: any) => {
        const videoId = item.id.videoId;
        const duration = this.parseDuration(item.snippet?.duration || 'PT3M');
        
        return {
          id: `youtube:${videoId}`,
          title: (item.snippet?.title || 'Unknown Title').replace(/\(Official Music Video\)|\(Official Video\)|\(Official\)|\(Music Video\)|\(MV\)/gi, '').trim(),
          artist: item.snippet?.channelTitle || 'Unknown Artist',
          album: 'YouTube Music',
          duration: duration,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          previewUrl: `https://www.youtube.com/watch?v=${videoId}`,
          coverUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          source: 'youtube' as const,
          explicit: false,
          popularity: 0.8,
          genres: ['Music'],
          releaseDate: item.snippet?.publishedAt,
          license: 'YouTube',
          audioType: 'web',
          hasAudio: true
        };
      });

      console.log(`📊 YouTube search results: ${tracks.length} tracks found`);
      return { tracks };
    } catch (error) {
      console.error('YouTube search failed:', error);
      return { tracks: [] };
    }
  }

  // Parse YouTube duration format (PT4M13S -> 253 seconds)
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  async getAudioStream(videoId: string): Promise<string | null> {
    try {
      // For YouTube, we return the video URL since we'll use the YouTube player
      return `https://www.youtube.com/watch?v=${videoId}`;
    } catch (error) {
      console.error('Failed to get YouTube audio stream:', error);
      return null;
    }
  }
}

// Main Music API Service
class MusicApiService {
  private spotify: SpotifyService;
  private jamendo: JamendoService;
  private soundcloud: SoundCloudService;
  private youtube: YouTubeService;

  constructor() {
    this.spotify = new SpotifyService();
    this.jamendo = new JamendoService();
    this.soundcloud = new SoundCloudService();
    this.youtube = new YouTubeService();
  }

  async search(query: string, limit: number = 20): Promise<SearchResult> {
    console.log(`🔍 Searching for: "${query}" across all APIs...`);
    
    try {
      // Run searches in parallel with error handling
      const [spotifyResult, jamendoResult, youtubeResult] = await Promise.allSettled([
        this.spotify.search(query, limit).catch(error => {
          console.error('Spotify search error:', error);
          return { tracks: [], artists: [], albums: [] };
        }),
        this.jamendo.search(query, limit).catch(error => {
          console.error('Jamendo search error:', error);
          return { tracks: [] };
        }),
        this.youtube.search(query, limit).catch(error => {
          console.error('YouTube search error:', error);
          return { tracks: [] };
        })
      ]);

      const allTracks: Track[] = [];
      const allArtists: Artist[] = [];
      const allAlbums: Album[] = [];

      // Process Spotify results
      if (spotifyResult.status === 'fulfilled' && spotifyResult.value.tracks?.length > 0) {
        const tracks = spotifyResult.value.tracks.filter(track => 
          track.title && track.artist && (track.previewUrl || track.url)
        );
        allTracks.push(...tracks);
        allArtists.push(...(spotifyResult.value.artists || []));
        allAlbums.push(...(spotifyResult.value.albums || []));
        console.log(`✅ Spotify: ${tracks.length} tracks (${tracks.filter(t => t.previewUrl).length} with previews)`);
      }

      // Process Jamendo results
      if (jamendoResult.status === 'fulfilled' && jamendoResult.value.tracks?.length > 0) {
        const tracks = jamendoResult.value.tracks.filter(track => 
          track.title && track.artist && track.url
        );
        allTracks.push(...tracks);
        console.log(`✅ Jamendo: ${tracks.length} tracks`);
      }

      // Process YouTube results
      if (youtubeResult.status === 'fulfilled' && youtubeResult.value.tracks?.length > 0) {
        const tracks = youtubeResult.value.tracks.filter(track => 
          track.title && track.url && track.source === 'youtube'
        );
        allTracks.push(...tracks);
        console.log(`✅ YouTube: ${tracks.length} tracks`);
      }

      // Sort tracks by availability and popularity
      allTracks.sort((a, b) => {
        // First prioritize tracks with direct audio
        if (a.hasAudio && !b.hasAudio) return -1;
        if (!a.hasAudio && b.hasAudio) return 1;
        
        // Then prioritize by source preference
        const sourceOrder = { youtube: 3, jamendo: 2, spotify: 1 };
        const sourceCompare = (sourceOrder[b.source] || 0) - (sourceOrder[a.source] || 0);
        if (sourceCompare !== 0) return sourceCompare;
        
        // Finally sort by popularity
        return (b.popularity || 0) - (a.popularity || 0);
      });

      console.log(`🎉 Total results: ${allTracks.length} tracks, ${allArtists.length} artists, ${allAlbums.length} albums`);

      return {
        tracks: allTracks,
        artists: allArtists,
        albums: allAlbums,
        total: allTracks.length + allArtists.length + allAlbums.length,
      };
    } catch (error) {
      console.error('Search failed:', error);
      return { tracks: [], artists: [], albums: [], total: 0 };
    }
  }

  async getTrackById(id: string): Promise<Track | null> {
    try {
      // Extract source and ID
      const [source, trackId] = id.split(':');
      
      switch (source) {
        case 'spotify':
          const spotifyResult = await this.spotify.search(trackId, 1);
          return spotifyResult.tracks?.[0] || null;
        case 'jamendo':
          const jamendoResult = await this.jamendo.search(trackId, 1);
          return jamendoResult.tracks?.[0] || null;
        case 'youtube':
          const youtubeResult = await this.youtube.search(trackId, 1);
          return youtubeResult.tracks?.[0] || null;
        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to get track by ID:', error);
      return null;
    }
  }

  async getTrending(limit: number = 50): Promise<Track[]> {
    try {
      console.log('🔥 Fetching trending tracks...');
      
      const [jamendoTrending, youtubeTrending] = await Promise.allSettled([
        this.jamendo.search('popular', limit).catch(error => {
          console.error('Jamendo trending error:', error);
          return { tracks: [] };
        }),
        this.youtube.search('trending music', limit).catch(error => {
          console.error('YouTube trending error:', error);
          return { tracks: [] };
        })
      ]);

      const trendingTracks: Track[] = [];
      
      if (jamendoTrending.status === 'fulfilled' && jamendoTrending.value.tracks?.length > 0) {
        const tracks = jamendoTrending.value.tracks.filter(track => 
          track.title && track.artist && track.url
        );
        trendingTracks.push(...tracks);
        console.log(`✅ Jamendo trending: ${tracks.length} tracks`);
      }

      if (youtubeTrending.status === 'fulfilled' && youtubeTrending.value.tracks?.length > 0) {
        const tracks = youtubeTrending.value.tracks.filter(track => 
          track.title && track.url && track.source === 'youtube'
        );
        trendingTracks.push(...tracks);
        console.log(`✅ YouTube trending: ${tracks.length} tracks`);
      }

      // Sort trending tracks
      trendingTracks.sort((a, b) => {
        if (a.hasAudio && !b.hasAudio) return -1;
        if (!a.hasAudio && b.hasAudio) return 1;
        return (b.popularity || 0) - (a.popularity || 0);
      });

      console.log(`🔥 Total trending tracks: ${trendingTracks.length}`);
      return trendingTracks;
    } catch (error) {
      console.error('Failed to get trending tracks:', error);
      return [];
    }
  }

  async getRecommendations(trackId: string, limit: number = 20): Promise<Track[]> {
    try {
      // For now, return trending tracks as recommendations
      // In a real app, you'd use the track ID to get specific recommendations
      return await this.getTrending(limit);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }
}

// Create singleton instance
const musicApi = new MusicApiService();

export default musicApi; 