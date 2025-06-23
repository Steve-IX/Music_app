import React, { createContext, useContext, useReducer, useEffect } from 'react';
import musicApi, { Track as ApiTrack } from '../services/musicApi';
import audioPlayer from '../services/audioPlayer';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  previewUrl?: string;
  coverUrl?: string;
  source?: 'spotify' | 'jamendo' | 'soundcloud' | 'youtube' | 'demo';
  explicit?: boolean;
  popularity?: number;
  genres?: string[];
}

interface MusicState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  repeat: 'none' | 'one' | 'all';
  shuffle: boolean;
  history: Track[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
  // API Integration
  searchResults: ApiTrack[];
  trending: ApiTrack[];
  isSearching: boolean;
}

type MusicAction =
  | { type: 'PLAY_TRACK'; payload: Track }
  | { type: 'PLAY_API_TRACK'; payload: ApiTrack }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'ADD_TO_QUEUE'; payload: Track }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'UPDATE_PROGRESS' }
  | { type: 'SET_QUEUE'; payload: Track[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: ApiTrack[] }
  | { type: 'SET_TRENDING'; payload: ApiTrack[] }
  | { type: 'SET_SEARCHING'; payload: boolean };

// Demo tracks for fallback/demo purposes
const demoTracks: Track[] = [
  {
    id: 'demo-1',
    title: 'Starlight Symphony',
    artist: 'Cosmic Orchestra',
    album: 'Space Melodies',
    duration: 195,
    url: '',
    coverUrl: 'https://picsum.photos/400/400?random=demo1',
    source: 'demo'
  },
  {
    id: 'demo-2',
    title: 'Digital Dreams',
    artist: 'Future Beats',
    album: 'Cyber Love',
    duration: 223,
    url: '',
    coverUrl: 'https://picsum.photos/400/400?random=demo2',
    source: 'demo'
  },
  {
    id: 'demo-3',
    title: 'Ocean Breeze',
    artist: 'Nature Sounds',
    album: 'Peaceful Waters',
    duration: 267,
    url: '',
    coverUrl: 'https://picsum.photos/400/400?random=demo3',
    source: 'demo'
  },
  {
    id: 'demo-4',
    title: 'Neon Nights',
    artist: 'Synthwave Collective',
    album: 'Retro Future',
    duration: 189,
    url: '',
    coverUrl: 'https://picsum.photos/400/400?random=demo4',
    source: 'demo'
  }
];

const initialState: MusicState = {
  currentTrack: {
    id: '1',
    title: 'Welcome to MusicStream',
    artist: 'Demo Artist',
    album: 'Getting Started',
    duration: 240,
    url: '',
    coverUrl: 'https://picsum.photos/400/400?random=welcome',
    source: 'demo'
  },
  queue: demoTracks,
  isPlaying: false,
  currentTime: 45,
  volume: 0.7,
  repeat: 'none',
  shuffle: false,
  history: [],
  currentIndex: -1,
  loading: false,
  error: null,
  searchResults: [],
  trending: [],
  isSearching: false,
};

// Helper function to convert API track to internal track format
const convertApiTrack = (apiTrack: ApiTrack): Track => ({
  id: apiTrack.id,
  title: apiTrack.title,
  artist: apiTrack.artist,
  album: apiTrack.album,
  duration: apiTrack.duration,
  url: apiTrack.url,
  previewUrl: apiTrack.previewUrl,
  coverUrl: apiTrack.coverUrl,
  source: apiTrack.source,
  explicit: apiTrack.explicit,
  popularity: apiTrack.popularity,
  genres: apiTrack.genres,
});

const musicReducer = (state: MusicState, action: MusicAction): MusicState => {
  switch (action.type) {
    case 'PLAY_TRACK': {
      const newTrack = action.payload;
      
      // Add current track to history if it's different
      let newHistory = state.history;
      if (state.currentTrack && state.currentTrack.id !== newTrack.id) {
        newHistory = [state.currentTrack, ...state.history.slice(0, 9)]; // Keep last 10
      }

      return {
        ...state,
        currentTrack: newTrack,
        isPlaying: true,
        currentTime: 0,
        history: newHistory,
        currentIndex: state.queue.findIndex(track => track.id === newTrack.id),
        loading: false,
        error: null,
      };
    }

    case 'PLAY_API_TRACK': {
      const apiTrack = action.payload;
      const track = convertApiTrack(apiTrack);
      
      // Add current track to history if it's different
      let newHistory = state.history;
      if (state.currentTrack && state.currentTrack.id !== track.id) {
        newHistory = [state.currentTrack, ...state.history.slice(0, 9)];
      }

      // Add to queue if not already there
      let newQueue = state.queue;
      if (!state.queue.some(t => t.id === track.id)) {
        newQueue = [...state.queue, track];
      }

      return {
        ...state,
        currentTrack: track,
        queue: newQueue,
        isPlaying: true,
        currentTime: 0,
        history: newHistory,
        currentIndex: newQueue.findIndex(t => t.id === track.id),
        loading: false,
        error: null,
      };
    }

    case 'TOGGLE_PLAY':
      console.log('🎵 TOGGLE_PLAY action - current isPlaying:', state.isPlaying);
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };

    case 'PAUSE':
      return {
        ...state,
        isPlaying: false,
      };

    case 'NEXT_TRACK': {
      if (!state.currentTrack || state.queue.length === 0) return state;

      let nextTrack: Track | null = null;
      let nextIndex = state.currentIndex;

      if (state.repeat === 'one') {
        // Repeat current track
        return {
          ...state,
          currentTime: 0,
          isPlaying: true,
        };
      }

      if (state.shuffle) {
        // Random track from queue
        const availableTracks = state.queue.filter(track => track.id !== state.currentTrack?.id);
        if (availableTracks.length > 0) {
          nextTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
          nextIndex = state.queue.findIndex(track => track.id === nextTrack?.id);
        }
      } else {
        // Next track in queue
        if (state.currentIndex < state.queue.length - 1) {
          nextIndex = state.currentIndex + 1;
          nextTrack = state.queue[nextIndex];
        } else if (state.repeat === 'all') {
          nextIndex = 0;
          nextTrack = state.queue[0];
        }
      }

      if (!nextTrack) return state;

      return {
        ...state,
        currentTrack: nextTrack,
        currentTime: 0,
        currentIndex: nextIndex,
        history: [state.currentTrack, ...state.history.slice(0, 9)],
      };
    }

    case 'PREVIOUS_TRACK': {
      if (!state.currentTrack) return state;

      // If we're more than 3 seconds into the track, restart it
      if (state.currentTime > 3) {
        return {
          ...state,
          currentTime: 0,
        };
      }

      // Go to previous track in history or queue
      if (state.history.length > 0) {
        const previousTrack = state.history[0];
        const newHistory = state.history.slice(1);
        const newIndex = state.queue.findIndex(track => track.id === previousTrack.id);

        return {
          ...state,
          currentTrack: previousTrack,
          currentTime: 0,
          history: newHistory,
          currentIndex: newIndex >= 0 ? newIndex : state.currentIndex,
        };
      }

      // Fallback to previous in queue
      if (state.currentIndex > 0) {
        const previousTrack = state.queue[state.currentIndex - 1];
        return {
          ...state,
          currentTrack: previousTrack,
          currentTime: 0,
          currentIndex: state.currentIndex - 1,
        };
      }

      return state;
    }

    case 'SET_CURRENT_TIME':
      return {
        ...state,
        currentTime: Math.max(0, Math.min(action.payload, state.currentTrack?.duration || 0)),
      };

    case 'SET_VOLUME':
      return {
        ...state,
        volume: Math.max(0, Math.min(1, action.payload)),
      };

    case 'TOGGLE_REPEAT': {
      const repeatStates: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
      const currentIndex = repeatStates.indexOf(state.repeat);
      const nextIndex = (currentIndex + 1) % repeatStates.length;
      return {
        ...state,
        repeat: repeatStates[nextIndex],
      };
    }

    case 'TOGGLE_SHUFFLE':
      return {
        ...state,
        shuffle: !state.shuffle,
      };

    case 'ADD_TO_QUEUE': {
      // Don't add if already in queue
      if (state.queue.some(track => track.id === action.payload.id)) {
        return state;
      }
      
      return {
        ...state,
        queue: [...state.queue, action.payload],
      };
    }

    case 'REMOVE_FROM_QUEUE': {
      const newQueue = state.queue.filter(track => track.id !== action.payload);
      let newCurrentIndex = state.currentIndex;
      
      // Adjust current index if necessary
      if (state.currentTrack) {
        newCurrentIndex = newQueue.findIndex(track => track.id === state.currentTrack?.id);
      }

      return {
        ...state,
        queue: newQueue,
        currentIndex: newCurrentIndex,
      };
    }

    case 'CLEAR_QUEUE':
      return {
        ...state,
        queue: [],
        currentIndex: -1,
      };

    case 'SET_QUEUE':
      return {
        ...state,
        queue: action.payload,
        currentIndex: state.currentTrack 
          ? action.payload.findIndex(track => track.id === state.currentTrack?.id)
          : -1,
      };

    case 'UPDATE_PROGRESS': {
      if (!state.isPlaying || !state.currentTrack) return state;

      const newTime = state.currentTime + 1;
      
      // Auto-advance to next track when current finishes
      if (newTime >= state.currentTrack.duration) {
        // Trigger next track
        return musicReducer(state, { type: 'NEXT_TRACK' });
      }

      return {
        ...state,
        currentTime: newTime,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload,
        isSearching: false,
      };

    case 'SET_TRENDING':
      return {
        ...state,
        trending: action.payload,
      };

    case 'SET_SEARCHING':
      return {
        ...state,
        isSearching: action.payload,
      };

    default:
      return state;
  }
};

interface MusicContextType {
  state: MusicState;
  dispatch: React.Dispatch<MusicAction>;
  // Helper functions
  playTrack: (track: Track) => void;
  playApiTrack: (track: ApiTrack) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  getQueueInfo: () => { current: number; total: number };
  // API functions
  searchMusic: (query: string) => Promise<void>;
  getTrending: () => Promise<void>;
  playPreview: (track: ApiTrack) => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

interface MusicProviderProps {
  children: React.ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(musicReducer, initialState);

  // Initialize audio player callbacks
  useEffect(() => {
    audioPlayer.setCallbacks({
      onPlay: () => {
        console.log('🎵 Audio player onPlay callback triggered');
        dispatch({ type: 'TOGGLE_PLAY' });
      },
      onPause: () => {
        console.log('⏸️ Audio player onPause callback triggered');
        dispatch({ type: 'PAUSE' });
      },
      onEnd: () => {
        console.log('⏭️ Audio player onEnd callback triggered');
        dispatch({ type: 'NEXT_TRACK' });
      },
      onTimeUpdate: (time) => {
        console.log('⏱️ Audio player time update:', time);
        dispatch({ type: 'SET_CURRENT_TIME', payload: time });
      },
      onVolumeChange: (volume) => dispatch({ type: 'SET_VOLUME', payload: volume }),
      onLoadError: (error) => dispatch({ type: 'SET_ERROR', payload: 'Failed to load track' }),
    });

    // Load trending music on mount
    getTrending();

    return () => {
      audioPlayer.destroy();
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    if (state.currentTrack) {
      // Prioritize preview URL over regular URL for better audio experience
      const audioUrl = state.currentTrack.previewUrl || state.currentTrack.url || '';
      
      console.log('🎵 Loading track:', {
        title: state.currentTrack.title,
        artist: state.currentTrack.artist,
        source: state.currentTrack.source,
        hasUrl: !!state.currentTrack.url,
        hasPreviewUrl: !!state.currentTrack.previewUrl,
        audioUrl: audioUrl,
        previewUrl: state.currentTrack.previewUrl,
        isSpotifyTrack: state.currentTrack.source === 'spotify',
        isWebUrl: audioUrl.includes('open.spotify.com'),
        isPreviewUrl: audioUrl.includes('scdn.co') || (audioUrl.includes('spotify') && !audioUrl.includes('open.spotify')),
        isJamendoTrack: state.currentTrack.source === 'jamendo',
        isYouTubeTrack: state.currentTrack.source === 'youtube',
      });

      // Handle Spotify web URLs (external links) - don't try to load as audio
      if (state.currentTrack.source === 'spotify' && audioUrl.includes('open.spotify.com')) {
        console.log('🎵 Spotify web URL detected - opening in external player');
        try {
          window.open(audioUrl, '_blank');
          console.log('✅ Opened Spotify track in external player');
        } catch (error) {
          console.error('❌ Failed to open Spotify URL:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to open Spotify track' });
        }
        return;
      }

      // Load audio for tracks with actual audio URLs
      if (audioUrl && (audioUrl.includes('scdn.co') || audioUrl.includes('jamendo') || audioUrl.includes('youtube') || audioUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i))) {
        console.log('🎵 Loading audio track with URL:', audioUrl);
        audioPlayer.loadTrack(audioUrl, state.currentTrack.id, state.currentTrack.duration);
      } else {
        // Fallback to simulation mode for demo content or tracks without audio
        console.log('🎵 Using simulation mode for track without audio URL');
        audioPlayer.loadTrack('', state.currentTrack.id, state.currentTrack.duration);
      }
    }
  }, [state.currentTrack, dispatch]);

  // Sync volume with audio player
  useEffect(() => {
    audioPlayer.setVolume(state.volume);
  }, [state.volume]);

  // Sync play/pause state with audio player
  useEffect(() => {
    if (state.currentTrack) {
      if (state.isPlaying) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    }
  }, [state.isPlaying, state.currentTrack]);

  // Helper functions
  const playTrack = (track: Track) => {
    dispatch({ type: 'PLAY_TRACK', payload: track });
  };

  const playApiTrack = (track: ApiTrack) => {
    dispatch({ type: 'PLAY_API_TRACK', payload: track });
  };

  const addToQueue = (track: Track) => {
    dispatch({ type: 'ADD_TO_QUEUE', payload: track });
  };

  const removeFromQueue = (trackId: string) => {
    dispatch({ type: 'REMOVE_FROM_QUEUE', payload: trackId });
  };

  const clearQueue = () => {
    dispatch({ type: 'CLEAR_QUEUE' });
  };

  const getQueueInfo = () => ({
    current: state.currentIndex + 1,
    total: state.queue.length,
  });

  // API functions
  const searchMusic = async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }

    console.log('Searching for:', query);
    dispatch({ type: 'SET_SEARCHING', payload: true });
    try {
      const results = await musicApi.search(query);
      console.log('Search results:', {
        totalTracks: results.tracks.length,
        tracksWithPreviews: results.tracks.filter(t => t.previewUrl).length,
        sampleTrack: results.tracks[0]
      });
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results.tracks });
    } catch (error) {
      console.error('Search failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Search failed' });
    }
  };

  const getTrending = async () => {
    try {
      console.log('Getting trending tracks...');
      const trending = await musicApi.getTrending();
      console.log('Trending results:', {
        count: trending.length,
        withPreviews: trending.filter(t => t.previewUrl).length
      });
      dispatch({ type: 'SET_TRENDING', payload: trending });
    } catch (error) {
      console.error('Failed to get trending:', error);
    }
  };

  const playPreview = async (track: ApiTrack) => {
    console.log('Playing preview for:', track.title, 'URL:', track.previewUrl);
    
    if (track.previewUrl) {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log('🎵 Loading preview audio from:', track.previewUrl);
        await audioPlayer.loadTrack(track.previewUrl, track.id, 30); // Previews are typically 30 seconds
        console.log('✅ Preview audio loaded, starting playback');
        audioPlayer.play();
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Failed to play preview:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to play preview' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else if (track.url && track.url.includes('open.spotify.com')) {
      // Open Spotify web URL in external player
      console.log('🎵 Opening Spotify track in external player');
      try {
        window.open(track.url, '_blank');
        console.log('✅ Opened Spotify track in external player');
      } catch (error) {
        console.error('Failed to open Spotify URL:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to open Spotify track' });
      }
    } else {
      console.log('No preview available for this track');
      dispatch({ type: 'SET_ERROR', payload: 'No preview available for this track' });
    }
  };

  const value: MusicContextType = {
    state,
    dispatch,
    playTrack,
    playApiTrack,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getQueueInfo,
    searchMusic,
    getTrending,
    playPreview,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}; 