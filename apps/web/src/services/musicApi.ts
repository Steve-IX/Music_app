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
  audioType?: 'preview' | 'web' | 'full' | 'none';
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

      // Debug the response structure
      console.log('🔍 Spotify API response:', response.data);

      // Check if we have the expected structure
      if (!response.data || typeof response.data !== 'object') {
        console.error('❌ Spotify API returned invalid data structure');
        return { tracks: [], artists: [], albums: [] };
      }

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
        genres: [],
        releaseDate: item.album?.release_date,
        license: 'Spotify'
      }));

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

      console.log(`📊 Spotify search results: ${tracks.length} tracks, ${artists.length} artists, ${albums.length} albums`);
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

      // Debug the response structure
      console.log('🔍 Jamendo API response:', response.data);

      // Check if we have the expected structure
      if (!response.data || typeof response.data !== 'object') {
        console.error('❌ Jamendo API returned invalid data structure');
        return { tracks: [] };
      }

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

      // Debug the response structure
      console.log('🔍 YouTube API response:', response.data);

      // Check if response has the expected structure
      if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
        console.error('❌ YouTube API returned unexpected structure:', response.data);
        return { tracks: [] };
      }

      const tracks: Track[] = response.data.items.map((item: any) => {
        const videoId = item.id.videoId;
        const duration = this.parseDuration(item.snippet.duration || 'PT3M');
        
        return {
          id: `youtube:${videoId}`,
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
      
      // Check if we have API keys configured
      const hasSpotifyKeys = import.meta.env.VITE_SPOTIFY_CLIENT_ID && import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
      const hasYouTubeKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      const hasJamendoKey = import.meta.env.VITE_JAMENDO_CLIENT_ID;
      
      console.log('🔑 API Keys Status:', {
        spotify: hasSpotifyKeys ? '✅' : '❌',
        youtube: hasYouTubeKey ? '✅' : '❌', 
        jamendo: hasJamendoKey ? '✅' : '❌'
      });
      
      // If no API keys are configured, return demo content immediately
      if (!hasSpotifyKeys && !hasYouTubeKey && !hasJamendoKey) {
        console.log('⚠️ No API keys configured, using demo content');
        return this.getDemoTracks(limit);
      }
      
      // Use popular search terms to get varied content
      const popularQueries = ['pop music', 'rock hits', 'hip hop', 'electronic', 'jazz classics'];
      const randomQuery = popularQueries[Math.floor(Math.random() * popularQueries.length)];
      
      const promises: Promise<Partial<SearchResult>>[] = [];
      
      // Only call APIs that have keys configured
      if (hasSpotifyKeys) {
        promises.push(this.spotify.search(randomQuery, Math.floor(limit / 3)));
      }
      if (hasJamendoKey) {
        promises.push(this.jamendo.search('popular', Math.floor(limit / 3)));
      }
      if (hasYouTubeKey) {
        promises.push(this.youtube.search('trending music 2024', Math.floor(limit / 3)));
      }
      
      const results = await Promise.allSettled(promises);
      const trendingTracks: Track[] = [];

      results.forEach((result, index) => {
        const serviceName = index === 0 && hasSpotifyKeys ? 'Spotify' : 
                           index === 1 && hasJamendoKey ? 'Jamendo' : 'YouTube';
        
        if (result.status === 'fulfilled') {
          const tracks = result.value.tracks || [];
          trendingTracks.push(...tracks);
          console.log(`✅ ${serviceName} trending: ${tracks.length} tracks`);
        } else {
          console.error(`❌ ${serviceName} trending failed:`, result.reason);
        }
      });

      // Always mix in some demo content for a better experience
      const demoTracks = this.getDemoTracks(Math.min(10, Math.max(5, limit - trendingTracks.length)));
      const allTracks = [...trendingTracks, ...demoTracks];
      
      // Shuffle the results to mix different sources
      const shuffledTracks = allTracks.sort(() => Math.random() - 0.5);
      
      console.log(`🔥 Total trending tracks: ${shuffledTracks.length} (${trendingTracks.length} from APIs, ${demoTracks.length} demo)`);
      
      // Return the requested number of tracks
      return shuffledTracks.slice(0, limit);
    } catch (error) {
      console.error('Failed to get trending tracks:', error);
      console.log('⚠️ Using demo content due to error');
      return this.getDemoTracks(limit);
    }
  }

  private getDemoTracks(limit: number = 20): Track[] {
    const demoTracks: Track[] = [
      // Mix of demo tracks and some with realistic Spotify-style data
      {
        id: 'spotify:demo1',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        duration: 200,
        url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
        previewUrl: 'https://p.scdn.co/mp3-preview/9ecf5ed35d2d6f9e6a4c5b8e3c9f8d5e7f2b1c4d',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273c06f0e8b3e5b4c8f7e2b1c4d',
        source: 'spotify' as const,
        explicit: false,
        popularity: 0.95,
        genres: ['Pop', 'Synth-pop'],
        releaseDate: '2019-11-29',
        license: 'Spotify',
        audioType: 'preview'
      },
      {
        id: 'spotify:demo2',
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        album: '÷ (Divide)',
        duration: 233,
        url: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3',
        previewUrl: 'https://p.scdn.co/mp3-preview/c5e9b8e3c9f8d5e7f2b1c4d9ecf5ed35d2d6f9e6',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
        source: 'spotify' as const,
        explicit: false,
        popularity: 0.92,
        genres: ['Pop', 'Folk'],
        releaseDate: '2017-01-06',
        license: 'Spotify',
        audioType: 'preview'
      },
      {
        id: 'youtube:demo1',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        duration: 355,
        url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
        previewUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
        coverUrl: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg',
        source: 'youtube' as const,
        explicit: false,
        popularity: 0.98,
        genres: ['Rock', 'Opera'],
        releaseDate: '1975-10-31',
        license: 'YouTube',
        audioType: 'web'
      },
      {
        id: 'jamendo:demo1',
        title: 'Sunset Dreams',
        artist: 'Electronic Vibes',
        album: 'Chill Waves',
        duration: 215,
        url: 'https://prod-1.storage.jamendo.com/download/track/1234567/mp32/',
        previewUrl: 'https://prod-1.storage.jamendo.com/download/track/1234567/mp32/',
        coverUrl: 'https://usercontent.jamendo.com/covers/1234567/cover.jpg',
        source: 'jamendo' as const,
        explicit: false,
        popularity: 0.8,
        genres: ['Electronic', 'Chill'],
        releaseDate: '2024-01-15',
        license: 'Creative Commons',
        audioType: 'full'
      },
      {
        id: 'demo:1',
        title: 'City Lights',
        artist: 'Urban Beats',
        album: 'Night Life',
        duration: 198,
        url: '',
        previewUrl: undefined,
        coverUrl: 'https://picsum.photos/400/400?random=2',
        source: 'demo' as const,
        explicit: false,
        popularity: 0.9,
        genres: ['Hip Hop', 'Urban'],
        releaseDate: '2024-02-01',
        license: 'Demo',
        audioType: 'none'
      },
      {
        id: 'demo:2',
        title: 'Ocean Waves',
        artist: 'Nature Sounds',
        album: 'Peaceful Moments',
        duration: 254,
        url: '',
        previewUrl: undefined,
        coverUrl: 'https://picsum.photos/400/400?random=3',
        source: 'demo' as const,
        explicit: false,
        popularity: 0.7,
        genres: ['Ambient', 'Nature'],
        releaseDate: '2024-01-20',
        license: 'Demo',
        audioType: 'none'
      },
      {
        id: 'demo:3',
        title: 'Guitar Hero',
        artist: 'Rock Masters',
        album: 'Greatest Hits',
        duration: 267,
        url: '',
        previewUrl: undefined,
        coverUrl: 'https://picsum.photos/400/400?random=4',
        source: 'demo' as const,
        explicit: false,
        popularity: 0.85,
        genres: ['Rock', 'Classic'],
        releaseDate: '2024-01-10',
        license: 'Demo',
        audioType: 'none'
      },
      {
        id: 'demo:4',
        title: 'Jazz Night',
        artist: 'Smooth Jazz Collective',
        album: 'Late Night Sessions',
        duration: 289,
        url: '',
        previewUrl: undefined,
        coverUrl: 'https://picsum.photos/400/400?random=5',
        source: 'demo' as const,
        explicit: false,
        popularity: 0.75,
        genres: ['Jazz', 'Smooth'],
        releaseDate: '2024-01-25',
        license: 'Demo',
        audioType: 'none'
      },
      {
        id: 'spotify:demo3',
        title: 'Someone Like You',
        artist: 'Adele',
        album: '21',
        duration: 285,
        url: 'https://open.spotify.com/track/1zwMYTA5nlNjZxYrvBB2pV',
        previewUrl: 'https://p.scdn.co/mp3-preview/f8d5e7f2b1c4d9ecf5ed35d2d6f9e6a4c5b8e3c9',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273372eb75c4b8f8b5e7f2b1c4d',
        source: 'spotify' as const,
        explicit: false,
        popularity: 0.88,
        genres: ['Pop', 'Soul'],
        releaseDate: '2011-01-24',
        license: 'Spotify',
        audioType: 'preview'
      },
      {
        id: 'youtube:demo2',
        title: 'Despacito',
        artist: 'Luis Fonsi ft. Daddy Yankee',
        album: 'Vida',
        duration: 229,
        url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        previewUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        coverUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
        source: 'youtube' as const,
        explicit: false,
        popularity: 0.96,
        genres: ['Latin', 'Reggaeton'],
        releaseDate: '2017-01-12',
        license: 'YouTube',
        audioType: 'web'
      }
    ];

    // Shuffle and return requested number
    const shuffled = demoTracks.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
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