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

// Spotify API Service
class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.spotify.com/v1',
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

    console.log('Spotify API credentials check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0
    });

    if (!clientId || !clientSecret) {
      console.warn('Spotify credentials not configured. Please check your .env.local file.');
      throw new Error('Spotify credentials not configured');
    }

    try {
      console.log('Requesting Spotify access token...');
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
      
      console.log('Spotify access token obtained successfully');
      return this.accessToken;
    } catch (error: any) {
      console.error('Failed to get Spotify access token:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async search(query: string, limit: number = 20): Promise<Partial<SearchResult>> {
    try {
      const token = await this.getAccessToken();
      
      // Enhanced search with market parameter for better preview URL availability
      const response = await this.api.get('/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: query,
          type: 'track,artist,album',
          limit,
          market: 'US', // Add market parameter for better preview URL availability
          include_external: 'audio', // Include external audio URLs
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
        webUrlPercentage: tracks.length > 0 ? Math.round((tracksWithWebUrls.length / tracks.length) * 100) : 0,
        sampleTrackWithPreview: tracksWithPreviews[0]?.title,
        sampleTrackWithWebUrl: tracksWithWebUrls[0]?.title,
        sampleTrackWithoutAudio: tracksWithNoAudio[0]?.title,
        averagePopularity: tracks.length > 0 ? 
          Math.round(tracks.reduce((sum, t) => sum + (t.popularity || 0), 0) / tracks.length) : 0
      });

      // Enhanced helpful messages about Spotify preview availability
      if (tracks.length > 0) {
        const previewPercent = Math.round((tracksWithPreviews.length / tracks.length) * 100);
        const webUrlPercent = Math.round((tracksWithWebUrls.length / tracks.length) * 100);
        
        console.log(`ℹ️ Spotify Preview Info: ${previewPercent}% of tracks have 30s previews, ${webUrlPercent}% can open in Spotify app`);
        
        if (previewPercent < 50) {
          console.log('💡 Tip: Many Spotify tracks don\'t have preview URLs. This is normal - use the "Connect Spotify" button for full playback!');
          console.log('💡 Tip: Preview availability depends on region, licensing, and track age. Newer/popular tracks are more likely to have previews.');
        }
        
        if (popularTracks.length > 0) {
          console.log(`🎯 Popular tracks found: ${popularTracks.length} tracks with popularity > 70`);
        }
      }

      const artists: Artist[] = response.data.artists?.items?.map((item: any) => ({
        id: `spotify:${item.id}`,
        name: item.name,
        image: item.images?.[0]?.url,
        genres: item.genres,
        followers: item.followers?.total,
        popularity: item.popularity,
        source: 'spotify',
      })) || [];

      const albums: Album[] = response.data.albums?.items?.map((item: any) => ({
        id: `spotify:${item.id}`,
        title: item.name,
        artist: item.artists?.[0]?.name || 'Unknown Artist',
        image: item.images?.[0]?.url || '',
        releaseDate: item.release_date,
        trackCount: item.total_tracks,
        source: 'spotify',
      })) || [];

      return { tracks, artists, albums };
    } catch (error: any) {
      console.error('Spotify search error:', error);
      
      // Enhanced error handling with specific error messages
      if (error.response?.status === 401) {
        console.error('❌ Spotify authentication expired - need to refresh token');
      } else if (error.response?.status === 429) {
        console.error('❌ Spotify rate limit exceeded - too many requests');
      } else if (error.response?.status >= 500) {
        console.error('❌ Spotify server error - service temporarily unavailable');
      }
      
      return { tracks: [], artists: [], albums: [] };
    }
  }
}

// Jamendo API Service (Creative Commons music)
class JamendoService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.jamendo.com/v3.0',
    });
  }

  async search(query: string, limit: number = 20): Promise<Partial<SearchResult>> {
    try {
      const [tracksResponse, artistsResponse, albumsResponse] = await Promise.all([
        this.api.get('/tracks/', {
          params: {
            client_id: import.meta.env.VITE_JAMENDO_CLIENT_ID,
            format: 'json',
            limit,
            search: query,
            include: 'musicinfo',
            audioformat: 'mp3',
          },
        }),
        this.api.get('/artists/', {
          params: {
            client_id: import.meta.env.VITE_JAMENDO_CLIENT_ID,
            format: 'json',
            limit,
            search: query,
          },
        }),
        this.api.get('/albums/', {
          params: {
            client_id: import.meta.env.VITE_JAMENDO_CLIENT_ID,
            format: 'json',
            limit,
            search: query,
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
      baseURL: 'https://www.googleapis.com/youtube/v3',
    });
  }

  async search(query: string, limit: number = 20): Promise<Partial<SearchResult>> {
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        console.warn('YouTube API key not configured');
        return { tracks: [] };
      }

      const response = await this.api.get('/search', {
        params: {
          part: 'snippet',
          q: `${query} music`,
          type: 'video',
          videoCategoryId: '10', // Music category
          maxResults: limit,
          key: apiKey,
          relevanceLanguage: 'en',
          regionCode: 'US',
          videoEmbeddable: 'true',
          videoSyndicated: 'true'
        }
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

      console.log(`YouTube search results: ${tracks.length} tracks found`);
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

  // Get audio stream URL for YouTube video
  async getAudioStream(videoId: string): Promise<string | null> {
    try {
      // For now, return the YouTube video URL
      // In a production app, you'd use youtube-dl or similar to extract audio streams
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
    const searchPromises = [
      this.spotify.search(query, limit),
      this.jamendo.search(query, limit),
      this.youtube.search(query, limit),
      // SoundCloud disabled - API forms closed
      // this.soundcloud.search(query, limit),
    ];

    try {
      const results = await Promise.allSettled(searchPromises);
      
      const combinedResults = results.reduce(
        (acc, result) => {
          if (result.status === 'fulfilled' && result.value) {
            acc.tracks.push(...(result.value.tracks || []));
            acc.artists.push(...(result.value.artists || []));
            acc.albums.push(...(result.value.albums || []));
          }
          return acc;
        },
        { tracks: [] as Track[], artists: [] as Artist[], albums: [] as Album[] }
      );

      // Sort by relevance/popularity
      combinedResults.tracks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      combinedResults.artists.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      return {
        ...combinedResults,
        total: combinedResults.tracks.length + combinedResults.artists.length + combinedResults.albums.length,
      };
    } catch (error) {
      console.error('Music search error:', error);
      return { tracks: [], artists: [], albums: [], total: 0 };
    }
  }

  async getTrackById(id: string): Promise<Track | null> {
    const [source, trackId] = id.split(':');
    
    try {
      switch (source) {
        case 'spotify':
          // Implement Spotify track details fetch
          break;
        case 'jamendo':
          // Implement Jamendo track details fetch
          break;
        case 'soundcloud':
          // Implement SoundCloud track details fetch
          break;
      }
    } catch (error) {
      console.error(`Failed to get track ${id}:`, error);
    }
    
    return null;
  }

  // Get trending/popular tracks
  async getTrending(limit: number = 50): Promise<Track[]> {
    try {
      const [spotifyResults, jamendoResults, youtubeResults] = await Promise.allSettled([
        this.spotify.search('year:2024', limit),
        this.jamendo.search('popular', limit),
        this.youtube.search('popular music 2024', limit),
      ]);

      const tracks: Track[] = [];
      
      if (spotifyResults.status === 'fulfilled') {
        tracks.push(...(spotifyResults.value.tracks || []));
      }
      
      if (jamendoResults.status === 'fulfilled') {
        tracks.push(...(jamendoResults.value.tracks || []));
      }

      if (youtubeResults.status === 'fulfilled') {
        tracks.push(...(youtubeResults.value.tracks || []));
      }

      return tracks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } catch (error) {
      console.error('Failed to get trending tracks:', error);
      return [];
    }
  }

  // Get recommendations based on a track
  async getRecommendations(trackId: string, limit: number = 20): Promise<Track[]> {
    // This would typically use the track's metadata to find similar tracks
    // For now, we'll use the artist name as a search query
    try {
      const track = await this.getTrackById(trackId);
      if (!track) return [];

      const results = await this.search(`artist:${track.artist}`, limit);
      return results.tracks.filter(t => t.id !== trackId);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const musicApi = new MusicApiService();
export default musicApi; 