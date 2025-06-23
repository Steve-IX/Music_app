import { Howl } from 'howler';
import youtubePlayer, { YouTubePlayerCallbacks } from './youtubePlayer';
import SpotifyPlayerService from './spotifyPlayer';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loading: boolean;
  error: string | null;
}

export interface AudioPlayerCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onLoad?: () => void;
  onLoadError?: (error: any) => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
}

class AudioPlayerService {
  private currentHowl: Howl | null = null;
  private spotifyPlayer: SpotifyPlayerService | null = null;
  private callbacks: AudioPlayerCallbacks = {};
  private updateInterval: NodeJS.Timeout | null = null;
  private simulationInterval: NodeJS.Timeout | null = null;
  private state: AudioPlayerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 50,
    loading: false,
    error: null,
  };
  private currentTrackId: string | null = null;
  private isSimulationMode: boolean = false;
  private currentSource: 'howler' | 'spotify' | 'youtube' | 'simulation' = 'simulation';

  constructor() {
    this.initializeYouTubePlayer();
    this.initializeSpotifyPlayer();
  }

  // Initialize YouTube player callbacks
  private initializeYouTubePlayer(): void {
    const youtubeCallbacks: YouTubePlayerCallbacks = {
      onPlay: () => {
        console.log('🎵 YouTube player onPlay');
        this.setState({ isPlaying: true });
        this.callbacks.onPlay?.();
      },
      onPause: () => {
        console.log('⏸️ YouTube player onPause');
        this.setState({ isPlaying: false });
        this.callbacks.onPause?.();
      },
      onEnd: () => {
        console.log('⏭️ YouTube player onEnd');
        this.setState({ isPlaying: false, currentTime: 0 });
        this.callbacks.onEnd?.();
      },
      onLoad: () => {
        console.log('✅ YouTube player onLoad');
        this.setState({ loading: false });
        this.callbacks.onLoad?.();
      },
      onLoadError: (error) => {
        console.error('❌ YouTube player onLoadError:', error);
        this.setState({ loading: false, error: `YouTube error: ${error}` });
        this.callbacks.onLoadError?.(error);
      },
      onTimeUpdate: (time) => {
        this.setState({ currentTime: time });
        this.callbacks.onTimeUpdate?.(time);
      },
      onVolumeChange: (volume) => {
        this.setState({ volume });
        this.callbacks.onVolumeChange?.(volume);
      },
    };

    youtubePlayer.setCallbacks(youtubeCallbacks);
  }

  private initializeSpotifyPlayer(): void {
    try {
      this.spotifyPlayer = new SpotifyPlayerService();
      this.spotifyPlayer.setCallbacks({
        onPlay: () => {
          this.setState({ isPlaying: true });
          this.callbacks.onPlay?.();
        },
        onPause: () => {
          this.setState({ isPlaying: false });
          this.callbacks.onPause?.();
        },
        onLoad: () => {
          this.setState({ loading: false });
          this.callbacks.onLoad?.();
        },
        onLoadError: (error) => {
          this.setState({ error: `Spotify error: ${error}`, loading: false });
          this.callbacks.onLoadError?.(error);
        },
        onTimeUpdate: (time) => {
          this.setState({ currentTime: time });
          this.callbacks.onTimeUpdate?.(time);
        },
        onVolumeChange: (volume) => {
          this.setState({ volume });
          this.callbacks.onVolumeChange?.(volume);
        },
      });
    } catch (error) {
      console.warn('⚠️ Failed to initialize Spotify player:', error);
    }
  }

  setCallbacks(callbacks: AudioPlayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Load and play a track
  async loadTrack(url: string, trackId?: string, duration?: number): Promise<void> {
    return new Promise(async (resolve) => {
      // Stop current track if playing
      this.stop();

      this.setState({ loading: true, error: null });

      // Enhanced audio source detection
      const isSpotifyTrack = trackId?.startsWith('spotify:') || url.includes('spotify.com');
      const isSpotifyPreview = url.includes('scdn.co') || url.includes('p.scdn.co');
      const isYouTubeTrack = trackId?.startsWith('youtube:') || url.includes('youtube.com') || url.includes('youtu.be');
      const isJamendoTrack = trackId?.startsWith('jamendo:') || url.includes('jamendo.com');
      const isAudioFile = url.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i);
      const hasRealAudio = url && url !== '' && !url.includes('demo');

      console.log('🎵 Loading track:', {
        url,
        trackId,
        duration,
        isSpotifyTrack,
        isSpotifyPreview,
        isYouTubeTrack,
        isJamendoTrack,
        isAudioFile,
        hasRealAudio
      });

      // Handle empty or demo URLs
      if (!hasRealAudio) {
        console.log('🎵 Using simulation mode for track without audio URL');
        this.currentSource = 'simulation';
        this.isSimulationMode = true;
        this.currentTrackId = trackId || 'demo-track';
        this.loadSimulationMode(this.currentTrackId, duration || 180);
        this.setState({ loading: false });
        resolve();
        return;
      }

      // Handle Spotify tracks
      if (isSpotifyTrack && !isSpotifyPreview) {
        if (this.spotifyPlayer) {
          try {
            const spotifyId = trackId?.split(':')[1] || this.extractSpotifyId(url);
            await this.spotifyPlayer.loadTrack(spotifyId);
            this.currentSource = 'spotify';
            this.setState({ loading: false });
            resolve();
            return;
          } catch (error: any) {
            console.warn('⚠️ Spotify playback failed:', error);
            // If premium required but preview available, use preview
            if (error.message.includes('Premium') && isSpotifyPreview) {
              console.log('🎵 Falling back to preview URL');
            } else {
              this.setState({ 
                loading: false,
                error: error.message
              });
              resolve();
              return;
            }
          }
        }
      }

      // Handle YouTube tracks
      if (isYouTubeTrack) {
        try {
          const videoId = this.extractVideoId(url);
          if (videoId) {
            this.loadYouTubeTrack(videoId);
            this.currentSource = 'youtube';
            resolve();
            return;
          }
        } catch (error) {
          console.error('❌ YouTube playback failed:', error);
          this.setState({ 
            loading: false,
            error: 'Failed to load YouTube track'
          });
          resolve();
          return;
        }
      }

      // Handle audio files and previews with Howler
      try {
        console.log('🎵 Loading audio track with Howler');
        this.currentSource = 'howler';
        this.isSimulationMode = false;
        this.currentTrackId = trackId || url;

        this.currentHowl = new Howl({
          src: [url],
          html5: true,
          preload: true,
          volume: this.state.volume / 100,
          onload: () => {
            console.log('✅ Audio loaded successfully');
            this.setState({ 
              loading: false, 
              duration: this.currentHowl?.duration() || duration || 0,
              error: null 
            });
            this.callbacks.onLoad?.();
            resolve();
          },
          onloaderror: (id, error) => {
            console.error('❌ Failed to load audio:', error);
            this.setState({ 
              loading: false, 
              error: 'Failed to load audio track'
            });
            this.callbacks.onLoadError?.(error);
            resolve();
          },
          onplay: () => {
            this.setState({ isPlaying: true });
            this.startTimeUpdate();
            this.callbacks.onPlay?.();
          },
          onpause: () => {
            this.setState({ isPlaying: false });
            this.stopTimeUpdate();
            this.callbacks.onPause?.();
          },
          onend: () => {
            this.setState({ isPlaying: false, currentTime: 0 });
            this.stopTimeUpdate();
            this.callbacks.onEnd?.();
          },
          onstop: () => {
            this.setState({ isPlaying: false, currentTime: 0 });
            this.stopTimeUpdate();
          },
          onseek: () => {
            this.callbacks.onSeek?.(this.currentHowl?.seek() || 0);
          }
        });
      } catch (error) {
        console.error('❌ Failed to initialize audio:', error);
        this.setState({ 
          loading: false,
          error: 'Failed to initialize audio player'
        });
        resolve();
      }
    });
  }

  private extractVideoId(url: string): string | null {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  private loadYouTubeTrack(url: string): void {
    try {
      const videoId = this.extractVideoId(url);
      if (videoId) {
        this.currentSource = 'youtube';
        youtubePlayer.setCallbacks({
          onPlay: () => {
            this.setState({ isPlaying: true, loading: false });
            this.callbacks.onPlay?.();
          },
          onPause: () => {
            this.setState({ isPlaying: false });
            this.callbacks.onPause?.();
          },
          onEnd: () => {
            this.setState({ isPlaying: false });
            this.callbacks.onEnd?.();
          },
          onLoad: () => {
            this.setState({ loading: false });
            this.callbacks.onLoad?.();
          },
          onLoadError: (error) => {
            this.setState({ loading: false, error: 'Failed to load YouTube video' });
            this.callbacks.onLoadError?.(error);
          },
          onTimeUpdate: (time) => {
            this.setState({ currentTime: time });
            this.callbacks.onTimeUpdate?.(time);
          }
        });
        youtubePlayer.loadVideo(videoId);
      }
    } catch (error) {
      console.error('Failed to load YouTube track:', error);
      this.setState({ error: 'Failed to load YouTube track' });
    }
  }

  private loadSimulationMode(trackId: string, duration: number): void {
    this.isSimulationMode = true;
    this.currentTrackId = trackId;
    this.setState({ duration, currentTime: 0, isPlaying: false });
  }

  private startSimulation(): void {
    if (this.simulationInterval) return;
    
    this.simulationInterval = setInterval(() => {
      if (this.state.isPlaying && this.state.currentTime < this.state.duration) {
        this.setState({ currentTime: this.state.currentTime + 1 });
        this.callbacks.onTimeUpdate?.(this.state.currentTime);
        
        if (this.state.currentTime >= this.state.duration) {
          this.setState({ isPlaying: false, currentTime: 0 });
          this.stopSimulation();
          this.callbacks.onEnd?.();
        }
      }
    }, 1000);
  }

  private stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  play(): void {
    console.log('🎵 Play requested:', {
      isSimulationMode: this.isSimulationMode,
      hasYouTubePlayer: this.currentSource === 'youtube',
      hasHowl: !!this.currentHowl,
      hasSpotifyPlayer: !!this.spotifyPlayer
    });

    if (this.currentSource === 'spotify' && this.spotifyPlayer) {
      console.log('🎵 Playing Spotify track');
      this.spotifyPlayer.play();
    } else if (this.currentHowl) {
      console.log('🎵 Playing audio track');
      this.currentHowl.play();
    } else if (this.isSimulationMode) {
      console.log('🎵 Playing simulation');
      this.setState({ isPlaying: true });
      this.startSimulation();
      this.callbacks.onPlay?.();
    }
  }

  pause(): void {
    if (this.currentSource === 'spotify' && this.spotifyPlayer) {
      this.spotifyPlayer.pause();
    } else if (this.currentHowl) {
      this.currentHowl.pause();
    } else if (this.isSimulationMode) {
      this.setState({ isPlaying: false });
      this.stopSimulation();
      this.callbacks.onPause?.();
    }
  }

  stop(): void {
    if (this.currentSource === 'spotify' && this.spotifyPlayer) {
      this.spotifyPlayer.stop();
    } else if (this.currentHowl) {
      this.currentHowl.stop();
    } else if (this.isSimulationMode) {
      this.setState({ isPlaying: false, currentTime: 0 });
      this.stopSimulation();
    }
    
    this.stopTimeUpdate();
  }

  toggle(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(time: number): void {
    if (this.currentSource === 'spotify' && this.spotifyPlayer) {
      this.spotifyPlayer.seek(time);
    } else if (this.currentHowl) {
      this.currentHowl.seek(time);
    } else if (this.isSimulationMode) {
      this.setState({ currentTime: Math.max(0, Math.min(time, this.state.duration)) });
      this.callbacks.onSeek?.(time);
    }
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    
    if (this.currentSource === 'spotify' && this.spotifyPlayer) {
      this.spotifyPlayer.setVolume(clampedVolume);
    } else if (this.currentHowl) {
      this.currentHowl.volume(clampedVolume / 100);
    }
    
    this.setState({ volume: clampedVolume });
    this.callbacks.onVolumeChange?.(clampedVolume);
  }

  getState(): AudioPlayerState {
    return { ...this.state };
  }

  isLoaded(): boolean {
    return this.currentHowl !== null || this.isSimulationMode || (this.spotifyPlayer && this.spotifyPlayer.isLoaded());
  }

  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  getCurrentTime(): number {
    if (this.currentSource === 'spotify' && this.spotifyPlayer) {
      return this.spotifyPlayer.getCurrentTime();
    } else if (this.currentHowl) {
      return this.currentHowl.seek();
    }
    return this.state.currentTime;
  }

  getDuration(): number {
    if (this.currentSource === 'spotify' && this.spotifyPlayer) {
      return this.spotifyPlayer.getDuration();
    } else if (this.currentHowl) {
      return this.currentHowl.duration();
    }
    return this.state.duration;
  }

  private setState(updates: Partial<AudioPlayerState>): void {
    this.state = { ...this.state, ...updates };
  }

  private startTimeUpdate(): void {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      if (this.currentSource === 'spotify' && this.spotifyPlayer) {
        const time = this.spotifyPlayer.getCurrentTime();
        this.setState({ currentTime: time });
        this.callbacks.onTimeUpdate?.(time);
      } else if (this.currentHowl && this.state.isPlaying) {
        const time = this.currentHowl.seek();
        this.setState({ currentTime: time });
        this.callbacks.onTimeUpdate?.(time);
      }
    }, 100);
  }

  private stopTimeUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  destroy(): void {
    this.stop();
    this.stopTimeUpdate();
    this.stopSimulation();
    
    if (this.currentHowl) {
      this.currentHowl.unload();
      this.currentHowl = null;
    }
    
    if (this.spotifyPlayer) {
      this.spotifyPlayer.destroy();
      this.spotifyPlayer = null;
    }
  }

  private extractSpotifyId(url: string): string {
    const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : '';
  }

  private async loadPreviewTrack(url: string): Promise<void> {
    this.currentHowl = new Howl({
      src: [url],
      html5: true,
      preload: true,
      volume: this.state.volume / 100,
      onload: () => {
        console.log('✅ Preview loaded successfully');
        this.setState({ 
          loading: false, 
          duration: this.currentHowl?.duration() || 0,
          error: null 
        });
        this.callbacks.onLoad?.();
      },
      onloaderror: (id, error) => {
        console.error('❌ Failed to load preview:', error);
        this.setState({ 
          loading: false, 
          error: `Failed to load preview: ${error}` 
        });
        this.callbacks.onLoadError?.(error);
      },
      onplay: () => {
        this.setState({ isPlaying: true });
        this.startTimeUpdate();
        this.callbacks.onPlay?.();
      },
      onpause: () => {
        this.setState({ isPlaying: false });
        this.stopTimeUpdate();
        this.callbacks.onPause?.();
      },
      onend: () => {
        this.setState({ isPlaying: false, currentTime: 0 });
        this.stopTimeUpdate();
        this.callbacks.onEnd?.();
      }
    });
  }
}

export default new AudioPlayerService(); 