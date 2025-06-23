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
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api';
  }
  // In production, use the deployed URL
  return '/api';
};

// Spotify API Service
class SpotifyService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: getApiBaseUrl(),
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

      const tracks: Track[] = response.data.tracks?.items?.map((item: any) => {
        const previewUrl = item.preview_url;
        const webUrl = item.external_urls?.spotify || '';
        const externalAudioUrl = item.external_ids?.isrc ? 
          `https://open.spotify.com/track/${item.id}` : null;
        
        // Enhanced logging for Spotify track analysis
        console.log('🎵 Spotify track analysis:', {
          name: item.name,
          artist: item.artists?.[0]?.name,
          hasPreview: !!previewUrl,
          previewUrl: previewUrl,
          webUrl: webUrl,
          externalAudioUrl: externalAudioUrl,
          duration: item.duration_ms,
          popularity: item.popularity,
          album: item.album?.name,
          explicit: item.explicit,
          isrc: item.external_ids?.isrc,
          availableMarkets: item.available_markets?.length || 0
        });
        
        // Determine the best audio URL to use with improved logic
        let audioUrl = '';
        let audioType: 'preview' | 'web' | 'none' = 'none';
        
        if (previewUrl) {
          audioUrl = previewUrl;
          audioType = 'preview';
          console.log('✅ Using Spotify preview URL for audio');
        } else if (externalAudioUrl) {
          audioUrl = externalAudioUrl;
          audioType = 'web';
          console.log('⚠️ No preview URL - will use Spotify Web URL for external playback');
        } else if (webUrl) {
          audioUrl = webUrl;
          audioType = 'web';
          console.log('⚠️ No preview URL - will use Spotify Web URL for external playback');
        } else {
          console.log('❌ No audio URL available - track will be metadata only');
        }
        
        return {
          id: `spotify:${item.id}`,
          title: item.name,
          artist: item.artists?.[0]?.name || 'Unknown Artist',
          album: item.album?.name || 'Unknown Album',
          duration: Math.floor(item.duration_ms / 1000),
          url: audioUrl, // Use the determined audio URL
          previewUrl: previewUrl, // Keep original preview URL for reference
          coverUrl: item.album?.images?.[0]?.url || '',
          source: 'spotify' as const,
          explicit: item.explicit,
          popularity: item.popularity,
          genres: item.album?.genres || [],
          releaseDate: item.album?.release_date,
          // Add metadata about audio availability
          audioType: audioType,
          hasAudio: audioType !== 'none',
        };
      }) || [];

      // Enhanced summary logging with more details
      const tracksWithPreviews = tracks.filter(t => t.previewUrl);
      const tracksWithWebUrls = tracks.filter(t => t.url && t.url.includes('open.spotify.com'));
      const tracksWithNoAudio = tracks.filter(t => !t.hasAudio);
      const popularTracks = tracks.filter(t => (t.popularity || 0) > 70);
      
      console.log('📊 Spotify search summary:', {
        totalTracks: tracks.length,
        tracksWithPreviews: tracksWithPreviews.length,
        tracksWithWebUrls: tracksWithWebUrls.length,
        tracksWithNoAudio: tracksWithNoAudio.length,
        popularTracks: popularTracks.length,
        previewPercentage: tracks.length > 0 ? Math.round((tracksWithPreviews.length / tracks.length) * 100) : 0,
      });

      return { tracks };
    } catch (error: any) {
      console.error('Spotify search error:', error.response?.data || error.message);
      return { tracks: [] };
    }
  }
}

// Jamendo API Service
class JamendoService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: getApiBaseUrl(),
    });
  }

  async search(query: string, limit: number = 20): Promise<Partial<SearchResult>> {
    try {
      console.log('🎵 Searching Jamendo via proxy...');
      
      const [tracksResponse, artistsResponse, albumsResponse] = await Promise.all([
        this.api.get('/jamendo', {
          params: {
            type: 'tracks',
            query,
            limit,
          },
        }),
        this.api.get('/jamendo', {
          params: {
            type: 'artists',
            query,
            limit,
          },
        }),
        this.api.get('/jamendo', {
          params: {
            type: 'albums',
            query,
            limit,
          },
        }),
      ]);

      const tracks: Track[] = tracksResponse.data.results?.map((item: any) => ({
        id: `jamendo:${item.id}`,
        title: item.name,
        artist: item.artist_name,
        album: item.album_name,
        duration: item.duration,
        url: item.audio || item.audiodownload,
        coverUrl: item.album_image || item.image,
        source: 'jamendo' as const,
        license: item.license_ccurl,
        genres: [item.musicinfo?.tags?.genres?.[0]?.name].filter(Boolean),
        releaseDate: item.releasedate,
      })) || [];

      const artists: Artist[] = artistsResponse.data.results?.map((item: any) => ({
        id: `jamendo:${item.id}`,
        name: item.name,
        image: item.image,
        source: 'jamendo',
      })) || [];

      const albums: Album[] = albumsResponse.data.results?.map((item: any) => ({
        id: `jamendo:${item.id}`,
        title: item.name,
        artist: item.artist_name,
        image: item.image,
        releaseDate: item.releasedate,
        source: 'jamendo',
      })) || [];

      console.log(`📊 Jamendo search results: ${tracks.length} tracks, ${artists.length} artists, ${albums.length} albums`);
      return { tracks, artists, albums };
    } catch (error) {
      console.error('Jamendo search error:', error);
      return { tracks: [], artists: [], albums: [] };
    }
  }
}

// SoundCloud API Service
class SoundCloudService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.soundcloud.com',
    });
  }

  async search(query: string, limit: number = 20): Promise<Partial<SearchResult>> {
    try {
      const clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
      if (!clientId) {
        console.info('SoundCloud API disabled - API forms are closed');
        return { tracks: [], artists: [], albums: [] };
      }

      const response = await this.api.get('/tracks', {
        params: {
          client_id: clientId,
          q: query,
          limit,
        },
      });

      const tracks: Track[] = response.data?.map((item: any) => ({
        id: `soundcloud:${item.id}`,
        title: item.title,
        artist: item.user?.username || 'Unknown Artist',
        album: 'SoundCloud Track',
        duration: Math.floor(item.duration / 1000),
        url: item.permalink_url,
        previewUrl: item.stream_url ? `${item.stream_url}?client_id=${clientId}` : undefined,
        coverUrl: item.artwork_url || item.user?.avatar_url || '',
        source: 'soundcloud' as const,
        genres: item.genre ? [item.genre] : [],
        releaseDate: item.created_at,
      })) || [];

      return { tracks, artists: [], albums: [] };
    } catch (error) {
      console.error('SoundCloud search error:', error);
      return { tracks: [], artists: [], albums: [] };
    }
  }
}

// YouTube Music API Service
class YouTubeService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: getApiBaseUrl(),
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

      const tracks: Track[] = response.data.items.map((item: any) => {
        const videoId = item.id.videoId;
        const duration = this.parseDuration(item.snippet.duration || 'PT3M');
        
        return {
          id: videoId,
          title: item.snippet.title.replace(/\(Official Music Video\)|\(Official Video\)|\(Official\)|\(Music Video\)|\(MV\)/gi, '').trim(),
          artist: item.snippet.channelTitle,
          album: 'YouTube Music',
          duration: duration,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          previewUrl: `https://www.youtube.com/watch?v=${videoId}`,
          coverUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
          source: 'youtube' as const,
          explicit: false,
          popularity: 0.8,
          genres: ['Music'],
          releaseDate: item.snippet.publishedAt,
          license: 'YouTube'
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
      const [spotifyResult, jamendoResult, youtubeResult] = await Promise.allSettled([
        this.spotify.search(query, limit),
        this.jamendo.search(query, limit),
        this.youtube.search(query, limit),
      ]);

      const allTracks: Track[] = [];
      const allArtists: Artist[] = [];
      const allAlbums: Album[] = [];

      // Process Spotify results
      if (spotifyResult.status === 'fulfilled') {
        allTracks.push(...(spotifyResult.value.tracks || []));
        allArtists.push(...(spotifyResult.value.artists || []));
        allAlbums.push(...(spotifyResult.value.albums || []));
        console.log(`✅ Spotify: ${spotifyResult.value.tracks?.length || 0} tracks`);
      } else {
        console.error('❌ Spotify search failed:', spotifyResult.reason);
      }

      // Process Jamendo results
      if (jamendoResult.status === 'fulfilled') {
        allTracks.push(...(jamendoResult.value.tracks || []));
        allArtists.push(...(jamendoResult.value.artists || []));
        allAlbums.push(...(jamendoResult.value.albums || []));
        console.log(`✅ Jamendo: ${jamendoResult.value.tracks?.length || 0} tracks`);
      } else {
        console.error('❌ Jamendo search failed:', jamendoResult.reason);
      }

      // Process YouTube results
      if (youtubeResult.status === 'fulfilled') {
        allTracks.push(...(youtubeResult.value.tracks || []));
        console.log(`✅ YouTube: ${youtubeResult.value.tracks?.length || 0} tracks`);
      } else {
        console.error('❌ YouTube search failed:', youtubeResult.reason);
      }

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
        this.jamendo.search('popular', limit),
        this.youtube.search('trending music', limit),
      ]);

      const trendingTracks: Track[] = [];

      if (jamendoTrending.status === 'fulfilled') {
        trendingTracks.push(...(jamendoTrending.value.tracks || []));
        console.log(`✅ Jamendo trending: ${jamendoTrending.value.tracks?.length || 0} tracks`);
      }

      if (youtubeTrending.status === 'fulfilled') {
        trendingTracks.push(...(youtubeTrending.value.tracks || []));
        console.log(`✅ YouTube trending: ${youtubeTrending.value.tracks?.length || 0} tracks`);
      }

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

export default MusicApiService;
export type { Track, Artist, Album, SearchResult }; 