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
    if (typeof window !== 'undefined' && !this.spotifyPlayer) {
      try {
        this.spotifyPlayer = new SpotifyPlayerService();
        
        // Only initialize if we have proper authentication
        this.spotifyPlayer.setCallbacks({
          onPlay: () => {
            console.log('▶️ Spotify player onPlay callback triggered');
            this.setState({ isPlaying: true });
            this.callbacks.onPlay?.();
          },
          onPause: () => {
            console.log('⏸️ Spotify player onPause callback triggered');
            this.setState({ isPlaying: false });
            this.callbacks.onPause?.();
          },
          onEnd: () => {
            console.log('⏹️ Spotify player onEnd callback triggered');
            this.setState({ isPlaying: false });
            this.callbacks.onEnd?.();
          },
          onLoadError: (error: any) => {
            console.error('❌ Spotify player load error:', error);
            this.setState({ error: 'Failed to load Spotify track' });
            this.callbacks.onLoadError?.(error);
          },
          onTimeUpdate: (time: number) => {
            this.setState({ currentTime: time });
            this.callbacks.onTimeUpdate?.(time);
          },
          onVolumeChange: (volume: number) => {
            this.setState({ volume: volume });
            this.callbacks.onVolumeChange?.(volume);
          }
        });
      } catch (error) {
        console.error('❌ Failed to initialize Spotify player:', error);
      }
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
      const hasRealAudio = url && url !== '' && url !== 'demo-audio' && !url.includes('demo') && (url.startsWith('http') || url.startsWith('blob:'));
      
      // Special handling for different audio sources
      const isSpotifyPreview = url.includes('scdn.co') || (url.includes('spotify.com') && !url.includes('open.spotify.com'));
      const isSpotifyWebUrl = url.includes('open.spotify.com');
      const isJamendoStream = url.includes('jamendo.com') || url.includes('jamendo');
      const isYouTubeUrl = url.includes('youtube.com') || url.includes('youtu.be');
      const isYouTubeVideoId = /^[a-zA-Z0-9_-]{11}$/.test(url); // YouTube video ID pattern
      const isPreviewUrl = isSpotifyPreview || url.includes('preview') || url.includes('sample');
      const isAudioFile = url.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i);
      const isStreamUrl = url.includes('stream') || url.includes('audio') || url.includes('media');

      console.log('🎵 Loading track:', {
        url,
        trackId,
        duration,
        hasRealAudio,
        isSpotifyPreview,
        isSpotifyWebUrl,
        isJamendoStream,
        isYouTubeUrl,
        isPreviewUrl,
        isAudioFile,
        isStreamUrl
      });

      // Handle empty or invalid URLs - fallback to simulation
      if (!url || url === '' || url === 'demo-audio') {
        console.log('🎵 No audio URL provided - using simulation mode');
        this.currentSource = 'simulation';
        this.isSimulationMode = true;
        this.currentTrackId = trackId || 'demo-track';
        this.loadSimulationMode(this.currentTrackId, duration || 180);
        this.setState({ loading: false });
        resolve();
        return;
      }

      // Handle YouTube URLs - open in external player (no embedding allowed)
      if (isYouTubeUrl || isYouTubeVideoId) {
        console.log('🎵 YouTube URL detected - opening in external player');
        this.currentSource = 'youtube';
        this.currentTrackId = trackId || 'youtube-external';
        
        try {
          // Extract video ID if needed
          let videoUrl = url;
          if (isYouTubeVideoId) {
            videoUrl = `https://www.youtube.com/watch?v=${url}`;
          }
          
          // Open in new tab/window
          window.open(videoUrl, '_blank');
          console.log('✅ Opened YouTube video in external player');
          
          // Use simulation mode for UI feedback
          this.isSimulationMode = true;
          this.loadSimulationMode(this.currentTrackId, duration || 180);
          this.setState({ loading: false });
          resolve();
        } catch (error) {
          console.error('❌ Failed to open YouTube URL:', error);
          this.setState({ 
            loading: false, 
            error: 'Failed to open YouTube video' 
          });
          resolve();
        }
        return;
      }

      // Handle Spotify Web URLs - try to play within site first
      if (isSpotifyWebUrl) {
        console.log('🎵 Spotify Web URL detected - attempting in-site playback');
        this.currentSource = 'spotify';
        this.currentTrackId = trackId || 'spotify-external';
        
        if (this.spotifyPlayer && this.spotifyPlayer.isAuthenticated() && this.spotifyPlayer.isLoaded()) {
          try {
            console.log('🎵 Attempting Spotify Web Playback SDK...');
            await this.spotifyPlayer.loadTrackFromUrl(url);
            console.log('✅ Spotify track loaded in-site via Web Playback SDK');
            this.isSimulationMode = false;
            this.setState({ loading: false });
            resolve();
            return;
          } catch (error: any) {
            console.warn('⚠️ Spotify Web Playback SDK failed:', error.message);
            
            // If it's an authentication error, try to re-authenticate
            if (error.message.includes('Authentication') || error.message.includes('401')) {
              console.log('🔐 Attempting to re-authenticate with Spotify...');
              this.spotifyPlayer.startAuth();
            }
            
            // Don't immediately fall back to external - try preview URL first if available
            console.log('🎵 Checking for Spotify preview URL...');
            // Extract track ID and try to get preview URL
            const trackId = this.spotifyPlayer.extractTrackId ? this.spotifyPlayer.extractTrackId(url) : null;
            if (trackId) {
              try {
                // Try to get track info including preview URL
                const trackInfo = await this.getSpotifyTrackInfo(trackId);
                if (trackInfo && trackInfo.preview_url) {
                  console.log('🎵 Found Spotify preview URL, using Howler.js');
                  this.currentSource = 'howler';
                  this.isSimulationMode = false;
                  
                  this.currentHowl = new Howl({
                    src: [trackInfo.preview_url],
                    html5: true,
                    preload: true,
                    volume: this.state.volume / 100,
                    onload: () => {
                      console.log('✅ Spotify preview loaded successfully');
                      this.setState({ 
                        loading: false, 
                        duration: 30, // Previews are 30 seconds
                        error: null 
                      });
                      this.callbacks.onLoad?.();
                      resolve();
                    },
                    onloaderror: (id, error) => {
                      console.warn('⚠️ Spotify preview failed to load, using simulation');
                      this.fallbackToSimulation(resolve);
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
                  return;
                }
              } catch (previewError) {
                console.warn('⚠️ Failed to get Spotify track info:', previewError);
              }
            }
          }
        } else {
          console.log('🔐 Spotify player not ready - authentication required');
          if (this.spotifyPlayer && !this.spotifyPlayer.isAuthenticated()) {
            console.log('🔐 Starting Spotify authentication...');
            this.spotifyPlayer.startAuth();
          }
        }
        
        // Final fallback: use simulation mode with external link option
        console.log('🎵 Using simulation mode with external Spotify option');
        this.isSimulationMode = true;
        this.loadSimulationMode(this.currentTrackId, duration || 180);
        this.setState({ loading: false });
        
        // Show user they can click to open in Spotify
        setTimeout(() => {
          console.log('💡 User can click track to open in Spotify app');
        }, 1000);
        
        resolve();
        return;
      }

      // Handle Spotify Preview URLs or Jamendo streams - use Howler.js
      if (isSpotifyPreview || isJamendoStream || isAudioFile || isStreamUrl) {
        console.log('🎵 Loading real audio track (preview/stream)');
        this.currentSource = 'howler';
        this.isSimulationMode = false;
        this.currentTrackId = trackId || 'audio-stream';
        
        try {
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
              console.error('❌ Failed to load audio track:', error);
              // Fallback to simulation mode
              console.log('🎵 Falling back to simulation mode');
              this.isSimulationMode = true;
              this.loadSimulationMode(this.currentTrackId || 'fallback-track', duration || 180);
              this.setState({ 
                loading: false, 
                error: null // Don't show error, just use simulation
              });
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
          console.error('❌ Error creating Howl instance:', error);
          // Fallback to simulation mode
          console.log('🎵 Falling back to simulation mode');
          this.isSimulationMode = true;
          this.loadSimulationMode(this.currentTrackId || 'fallback-track', duration || 180);
          this.setState({ 
            loading: false, 
            error: null // Don't show error, just use simulation
          });
          resolve();
        }
        return;
      }

      // Default fallback to simulation mode
      console.log('🎵 Unknown audio format - using simulation mode');
      this.currentSource = 'simulation';
      this.isSimulationMode = true;
      this.currentTrackId = trackId || 'unknown-track';
      this.loadSimulationMode(this.currentTrackId, duration || 180);
      this.setState({ loading: false });
      resolve();
    });
  }

  private extractVideoId(url: string): string | null {
    // Extract YouTube video ID from various URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
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

  // Helper method to get Spotify track info including preview URL
  private async getSpotifyTrackInfo(trackId: string): Promise<any> {
    try {
      if (!this.spotifyPlayer || !this.spotifyPlayer.isAuthenticated()) {
        throw new Error('Spotify not authenticated');
      }
      
      const accessToken = this.spotifyPlayer.getAccessToken?.();
      if (!accessToken) {
        throw new Error('No Spotify access token');
      }
      
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get Spotify track info:', error);
      return null;
    }
  }

  // Helper method to fallback to simulation mode
  private fallbackToSimulation(resolve: () => void): void {
    console.log('🎵 Falling back to simulation mode');
    this.isSimulationMode = true;
    this.currentSource = 'simulation';
    this.loadSimulationMode(this.currentTrackId || 'fallback-track', 180);
    this.setState({ 
      loading: false, 
      error: null 
    });
    resolve();
  }
}

export default new AudioPlayerService(); 