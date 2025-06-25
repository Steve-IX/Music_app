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
  audioType?: 'preview' | 'web' | 'none' | 'full';
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
      
      // Try API first, then fallback to demo tracks
      let apiTracks: Track[] = [];
      let apiArtists: Artist[] = [];
      let apiAlbums: Album[] = [];
      
      try {
        const response = await this.api.get('/spotify', {
          params: {
            query,
            limit,
          },
        });

        apiTracks = (response.data.tracks?.items || []).map((item: any) => ({
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
          license: 'Spotify',
          audioType: item.preview_url ? 'preview' : (item.external_urls?.spotify ? 'web' : 'none'),
          hasAudio: !!(item.preview_url || item.external_urls?.spotify)
        }));

        apiArtists = (response.data.artists?.items || []).map((item: any) => ({
          id: `spotify:${item.id}`,
          name: item.name,
          image: item.images?.[0]?.url,
          genres: item.genres || [],
          followers: item.followers?.total,
          popularity: item.popularity / 100,
          source: 'spotify'
        }));

        apiAlbums = (response.data.albums?.items || []).map((item: any) => ({
          id: `spotify:${item.id}`,
          title: item.name,
          artist: item.artists?.[0]?.name || 'Unknown Artist',
          image: item.images?.[0]?.url || '',
          releaseDate: item.release_date,
          trackCount: item.total_tracks,
          source: 'spotify'
        }));
      } catch (apiError) {
        console.log('🎵 Spotify API unavailable, using demo tracks');
      }

      // Filter demo tracks based on search query
      const demoTracks = query.trim() 
        ? DEMO_SPOTIFY_TRACKS.filter(track => 
            track.title.toLowerCase().includes(query.toLowerCase()) ||
            track.artist.toLowerCase().includes(query.toLowerCase()) ||
            track.album.toLowerCase().includes(query.toLowerCase()) ||
            track.genres?.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
          )
        : DEMO_SPOTIFY_TRACKS;

      // Filter demo artists based on search query
      const demoArtists = query.trim() 
        ? DEMO_SPOTIFY_ARTISTS.filter(artist => 
            artist.name.toLowerCase().includes(query.toLowerCase()) ||
            artist.genres?.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
          )
        : DEMO_SPOTIFY_ARTISTS;

      // Filter demo albums based on search query
      const demoAlbums = query.trim() 
        ? DEMO_SPOTIFY_ALBUMS.filter(album => 
            album.title.toLowerCase().includes(query.toLowerCase()) ||
            album.artist.toLowerCase().includes(query.toLowerCase())
          )
        : DEMO_SPOTIFY_ALBUMS;

      // Combine API results with demo data, prioritizing API results
      const tracks = [...apiTracks, ...demoTracks.slice(0, Math.max(0, limit - apiTracks.length))];
      const artists = [...apiArtists, ...demoArtists.slice(0, Math.max(0, limit - apiArtists.length))];
      const albums = [...apiAlbums, ...demoAlbums.slice(0, Math.max(0, limit - apiAlbums.length))];

      console.log(`📊 Spotify search results: ${tracks.length} tracks (${apiTracks.length} API + ${tracks.length - apiTracks.length} demo), ${artists.length} artists, ${albums.length} albums`);
      return { tracks, artists, albums };
    } catch (error) {
      console.error('Spotify search failed:', error);
      // Fallback to demo data only
      const demoTracks = query.trim() 
        ? DEMO_SPOTIFY_TRACKS.filter(track => 
            track.title.toLowerCase().includes(query.toLowerCase()) ||
            track.artist.toLowerCase().includes(query.toLowerCase()) ||
            track.album.toLowerCase().includes(query.toLowerCase())
          ).slice(0, limit)
        : DEMO_SPOTIFY_TRACKS.slice(0, limit);

      const demoArtists = query.trim() 
        ? DEMO_SPOTIFY_ARTISTS.filter(artist => 
            artist.name.toLowerCase().includes(query.toLowerCase()) ||
            artist.genres?.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
          ).slice(0, limit)
        : DEMO_SPOTIFY_ARTISTS.slice(0, limit);

      const demoAlbums = query.trim() 
        ? DEMO_SPOTIFY_ALBUMS.filter(album => 
            album.title.toLowerCase().includes(query.toLowerCase()) ||
            album.artist.toLowerCase().includes(query.toLowerCase())
          ).slice(0, limit)
        : DEMO_SPOTIFY_ALBUMS.slice(0, limit);
      
      console.log(`📊 Spotify fallback: ${demoTracks.length} demo tracks, ${demoArtists.length} artists, ${demoAlbums.length} albums`);
      return { tracks: demoTracks, artists: demoArtists, albums: demoAlbums };
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
      
      // If query is a video ID, modify the search to be more specific
      const isVideoId = /^[a-zA-Z0-9_-]{11}$/.test(query);
      const searchQuery = isVideoId ? `id:${query}` : query;
      
      const response = await this.api.get('/youtube', {
        params: {
          query: searchQuery,
          limit,
        },
      });

      if (!response.data || !response.data.items) {
        console.log('📊 YouTube search results: 0 tracks (no items in response)');
        return { tracks: [] };
      }

      const tracks: Track[] = response.data.items.map((item: any) => {
        const videoId = item.id.videoId || (isVideoId ? query : null);
        const duration = this.parseDuration(item.contentDetails?.duration || item.snippet?.duration || 'PT3M');
        const title = this.cleanupTitle(item.snippet?.title || 'Unknown Title');
        
        return {
          id: `youtube:${videoId}`,
          title: title.title,
          artist: title.artist || item.snippet?.channelTitle || 'Unknown Artist',
          album: title.album || 'YouTube Music',
          duration: duration,
          url: videoId,  // Just store the ID, let the player handle the full URL
          previewUrl: null, // YouTube doesn't provide preview URLs
          coverUrl: this.getBestThumbnail(item.snippet?.thumbnails),
          source: 'youtube' as const,
          explicit: false,
          popularity: 0.8,
          genres: ['Music'],
          releaseDate: item.snippet?.publishedAt,
          license: 'YouTube',
          audioType: 'full',
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

  private cleanupTitle(title: string): { title: string; artist?: string; album?: string } {
    // Remove common YouTube title extras
    title = title.replace(/\(Official Music Video\)|\(Official Video\)|\(Official\)|\(Music Video\)|\(MV\)|\(Audio\)|\(Lyric Video\)|\[.*?\]/gi, '').trim();
    
    // Try to split artist and title if they're separated by common patterns
    const patterns = [
      /^(.+?)\s*[-–]\s*(.+)$/,  // Artist - Title
      /^(.+?)\s*[:|]\s*(.+)$/,  // Artist : Title
      /^(.+?)\s*"\s*(.+)\s*"$/  // Artist "Title"
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return {
          artist: match[1].trim(),
          title: match[2].trim()
        };
      }
    }
    
    return { title };
  }

  private getBestThumbnail(thumbnails: any): string {
    if (!thumbnails) return '';
    // Try to get the highest quality thumbnail
    const qualities = ['maxres', 'high', 'medium', 'standard', 'default'];
    for (const quality of qualities) {
      if (thumbnails[quality]?.url) {
        return thumbnails[quality].url;
      }
    }
    return '';
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

// Demo Spotify tracks for development/fallback (with real working URLs)
const DEMO_SPOTIFY_TRACKS: Track[] = [
  {
    id: 'spotify:demo:1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    url: 'https://open.spotify.com/track/0VjIjW4GlULA1w8PDhEZaP',
    previewUrl: undefined, // No fake preview URLs
    coverUrl: 'https://picsum.photos/400/400?random=1&blur=1',
    source: 'spotify',
    explicit: false,
    popularity: 0.95,
    genres: ['pop', 'synthwave'],
    releaseDate: '2020-03-20',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false // Demo tracks don't have real audio
  },
  {
    id: 'spotify:demo:2',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: 233,
    url: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3',
    previewUrl: undefined,
    coverUrl: 'https://picsum.photos/400/400?random=2&blur=1',
    source: 'spotify',
    explicit: false,
    popularity: 0.92,
    genres: ['pop', 'acoustic'],
    releaseDate: '2017-01-06',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false
  },
  {
    id: 'spotify:demo:3',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 203,
    url: 'https://open.spotify.com/track/463CkQjx2Zk1yXoBuierM9',
    previewUrl: undefined,
    coverUrl: 'https://picsum.photos/400/400?random=3&blur=1',
    source: 'spotify',
    explicit: false,
    popularity: 0.89,
    genres: ['pop', 'disco'],
    releaseDate: '2020-03-27',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false
  },
  {
    id: 'spotify:demo:4',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    album: 'Fine Line',
    duration: 174,
    url: 'https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY',
    previewUrl: undefined,
    coverUrl: 'https://picsum.photos/400/400?random=4&blur=1',
    source: 'spotify',
    explicit: false,
    popularity: 0.87,
    genres: ['pop', 'rock'],
    releaseDate: '2019-12-13',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false
  },
  {
    id: 'spotify:demo:5',
    title: 'good 4 u',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    duration: 178,
    url: 'https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG',
    previewUrl: undefined,
    coverUrl: 'https://picsum.photos/400/400?random=5&blur=1',
    source: 'spotify',
    explicit: false,
    popularity: 0.91,
    genres: ['pop', 'alternative'],
    releaseDate: '2021-05-21',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false
  },
  {
    id: 'spotify:demo:6',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'Stay',
    duration: 141,
    url: 'https://open.spotify.com/track/5HCyWlXZPP0y6Gqq8TgA20',
    previewUrl: undefined,
    coverUrl: 'https://picsum.photos/400/400?random=6&blur=1',
    source: 'spotify',
    explicit: false,
    popularity: 0.88,
    genres: ['pop', 'hip-hop'],
    releaseDate: '2021-07-09',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false
  },
  {
    id: 'spotify:demo:7',
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    album: 'Midnights',
    duration: 200,
    url: 'https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu',
    previewUrl: undefined,
    coverUrl: 'https://picsum.photos/400/400?random=7&blur=1',
    source: 'spotify',
    explicit: false,
    popularity: 0.94,
    genres: ['pop', 'alternative'],
    releaseDate: '2022-10-21',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false
  },
  {
    id: 'spotify:demo:8',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: 167,
    url: 'https://open.spotify.com/track/4Dvkj6JhhA12EX05fT7y2e',
    previewUrl: undefined,
    coverUrl: 'https://picsum.photos/400/400?random=8&blur=1',
    source: 'spotify',
    explicit: false,
    popularity: 0.93,
    genres: ['pop', 'indie'],
    releaseDate: '2022-05-20',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false
  },
  {
    id: 'spotify:demo:9',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    duration: 200,
    url: 'https://open.spotify.com/track/0yLdNVWF3Srea0uzk55zFn',
    previewUrl: undefined,
    coverUrl: 'https://picsum.photos/400/400?random=9&blur=1',
    source: 'spotify',
    explicit: false,
    popularity: 0.90,
    genres: ['pop', 'country'],
    releaseDate: '2023-01-13',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false
  },
  {
    id: 'spotify:demo:10',
    title: 'Unholy',
    artist: 'Sam Smith ft. Kim Petras',
    album: 'Unholy',
    duration: 156,
    url: 'https://open.spotify.com/track/3nqQXoyQOWXiESFLlDF1hG',
    previewUrl: undefined,
    coverUrl: 'https://picsum.photos/400/400?random=10&blur=1',
    source: 'spotify',
    explicit: true,
    popularity: 0.86,
    genres: ['pop', 'electronic'],
    releaseDate: '2022-09-22',
    license: 'Spotify',
    audioType: 'web',
    hasAudio: false
  }
];

// Demo Spotify artists for development/fallback
const DEMO_SPOTIFY_ARTISTS: Artist[] = [
  {
    id: 'spotify:artist:1',
    name: 'The Weeknd',
    image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
    genres: ['pop', 'r&b', 'synthwave'],
    followers: 85000000,
    popularity: 0.95,
    source: 'spotify'
  },
  {
    id: 'spotify:artist:2',
    name: 'Ed Sheeran',
    image: 'https://i.scdn.co/image/ab6761610000e5eb12d5ab979779aa21d6c4b2a2',
    genres: ['pop', 'acoustic', 'singer-songwriter'],
    followers: 78000000,
    popularity: 0.92,
    source: 'spotify'
  },
  {
    id: 'spotify:artist:3',
    name: 'Dua Lipa',
    image: 'https://i.scdn.co/image/ab6761610000e5eb0707267bb35d3d6b5d5b4b4b',
    genres: ['pop', 'disco', 'dance'],
    followers: 65000000,
    popularity: 0.89,
    source: 'spotify'
  },
  {
    id: 'spotify:artist:4',
    name: 'Harry Styles',
    image: 'https://i.scdn.co/image/ab6761610000e5eb4b7b7b7b7b7b7b7b7b7b7b7b',
    genres: ['pop', 'rock', 'indie'],
    followers: 72000000,
    popularity: 0.93,
    source: 'spotify'
  },
  {
    id: 'spotify:artist:5',
    name: 'Taylor Swift',
    image: 'https://i.scdn.co/image/ab6761610000e5eb8b8b8b8b8b8b8b8b8b8b8b8b',
    genres: ['pop', 'country', 'alternative'],
    followers: 95000000,
    popularity: 0.96,
    source: 'spotify'
  }
];

// Demo Spotify albums for development/fallback
const DEMO_SPOTIFY_ALBUMS: Album[] = [
  {
    id: 'spotify:album:1',
    title: 'After Hours',
    artist: 'The Weeknd',
    image: 'https://i.scdn.co/image/ab67616d0000b273ef2c2b0e4c5b4a5c5b4a5c5b',
    releaseDate: '2020-03-20',
    trackCount: 14,
    source: 'spotify'
  },
  {
    id: 'spotify:album:2',
    title: '÷ (Divide)',
    artist: 'Ed Sheeran',
    image: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
    releaseDate: '2017-03-03',
    trackCount: 16,
    source: 'spotify'
  },
  {
    id: 'spotify:album:3',
    title: 'Future Nostalgia',
    artist: 'Dua Lipa',
    image: 'https://i.scdn.co/image/ab67616d0000b273ef2c2b0e4c5b4a5c5b4a5c5b',
    releaseDate: '2020-03-27',
    trackCount: 11,
    source: 'spotify'
  },
  {
    id: 'spotify:album:4',
    title: "Harry's House",
    artist: 'Harry Styles',
    image: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0',
    releaseDate: '2022-05-20',
    trackCount: 13,
    source: 'spotify'
  },
  {
    id: 'spotify:album:5',
    title: 'Midnights',
    artist: 'Taylor Swift',
    image: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5',
    releaseDate: '2022-10-21',
    trackCount: 13,
    source: 'spotify'
  }
];

// Demo tracks with working audio from free sources
const DEMO_WORKING_TRACKS: Track[] = [
  {
    id: 'demo:working:1',
    title: 'Chill Ambient Background',
    artist: 'Free Music Archive',
    album: 'Ambient Collection',
    duration: 180,
    url: 'https://archive.org/download/FMA_Various_Artists_Ambient/01-Birocratic-Fresh_Air.mp3',
    previewUrl: 'https://archive.org/download/FMA_Various_Artists_Ambient/01-Birocratic-Fresh_Air.mp3',
    coverUrl: 'https://picsum.photos/400/400?random=101&blur=1',
    source: 'demo',
    explicit: false,
    popularity: 0.8,
    genres: ['ambient', 'chill'],
    releaseDate: '2023-01-01',
    license: 'Creative Commons',
    audioType: 'full',
    hasAudio: true
  },
  {
    id: 'demo:working:2',
    title: 'Upbeat Electronic',
    artist: 'Freesound Community',
    album: 'Electronic Vibes',
    duration: 120,
    url: 'https://freesound.org/data/previews/316/316847_5123451-lq.mp3',
    previewUrl: 'https://freesound.org/data/previews/316/316847_5123451-lq.mp3',
    coverUrl: 'https://picsum.photos/400/400?random=102&blur=1',
    source: 'demo',
    explicit: false,
    popularity: 0.75,
    genres: ['electronic', 'upbeat'],
    releaseDate: '2023-02-15',
    license: 'Creative Commons',
    audioType: 'full',
    hasAudio: true
  },
  {
    id: 'demo:working:3',
    title: 'Piano Melody',
    artist: 'Classical Archive',
    album: 'Piano Solo',
    duration: 150,
    url: 'https://archive.org/download/MusOpen-DebussyClairDeLune/01-Claude_Debussy-Clair_de_Lune.mp3',
    previewUrl: 'https://archive.org/download/MusOpen-DebussyClairDeLune/01-Claude_Debussy-Clair_de_Lune.mp3',
    coverUrl: 'https://picsum.photos/400/400?random=103&blur=1',
    source: 'demo',
    explicit: false,
    popularity: 0.85,
    genres: ['classical', 'piano'],
    releaseDate: '2023-03-10',
    license: 'Public Domain',
    audioType: 'full',
    hasAudio: true
  }
];

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

      // Add demo Spotify tracks first (they're popular!)
      const spotifyTrending = [...DEMO_SPOTIFY_TRACKS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      trendingTracks.push(...spotifyTrending.slice(0, Math.min(15, limit)));
      console.log(`✅ Spotify trending: ${spotifyTrending.slice(0, Math.min(15, limit)).length} tracks`);

      if (jamendoTrending.status === 'fulfilled') {
        const remainingLimit = Math.max(0, limit - trendingTracks.length);
        trendingTracks.push(...(jamendoTrending.value.tracks || []).slice(0, remainingLimit));
        console.log(`✅ Jamendo trending: ${jamendoTrending.value.tracks?.length || 0} tracks`);
      }

      if (youtubeTrending.status === 'fulfilled') {
        const remainingLimit = Math.max(0, limit - trendingTracks.length);
        trendingTracks.push(...(youtubeTrending.value.tracks || []).slice(0, remainingLimit));
        console.log(`✅ YouTube trending: ${youtubeTrending.value.tracks?.length || 0} tracks`);
      }

      console.log(`🔥 Total trending tracks: ${trendingTracks.length}`);
      return trendingTracks;
    } catch (error) {
      console.error('Failed to get trending tracks:', error);
      // Fallback to demo Spotify tracks if all APIs fail
      const fallbackTracks = [...DEMO_SPOTIFY_TRACKS].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      console.log(`🔥 Fallback to demo tracks: ${fallbackTracks.length}`);
      return fallbackTracks.slice(0, limit);
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