// Spotify Web Playback SDK Service
// This service integrates with Spotify's Web Playback SDK to play tracks within the site

import SpotifyAuthService from './spotifyAuth';

export interface SpotifyPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loading: boolean;
  error: string | null;
  trackId: string | null;
  deviceId: string | null;
}

export interface SpotifyPlayerCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onLoad?: () => void;
  onLoadError?: (error: any) => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onStateChange?: (state: any) => void;
}

class SpotifyPlayerService {
  private player: any = null;
  private authService: SpotifyAuthService;
  private callbacks: SpotifyPlayerCallbacks = {};
  private updateInterval: NodeJS.Timeout | null = null;
  private state: SpotifyPlayerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 50,
    loading: false,
    error: null,
    trackId: null,
    deviceId: null,
  };
  private isInitialized = false;
  private isSdkLoaded = false;

  constructor() {
    this.authService = new SpotifyAuthService();
    this.loadSpotifySDK();
  }

  private loadSpotifySDK(): void {
    // Check if SDK is already loaded
    if (window.Spotify) {
      this.isSdkLoaded = true;
      this.initializePlayer();
      return;
    }

    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    
    script.onload = () => {
      console.log('🎵 Spotify Web Playback SDK loaded');
      this.isSdkLoaded = true;
      
      // Set up the ready callback
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('🎵 Spotify Web Playback SDK ready');
        this.initializePlayer();
      };
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Spotify Web Playback SDK');
      this.setState({ error: 'Failed to load Spotify SDK' });
    };
    
    document.head.appendChild(script);
  }

  private async initializePlayer(): Promise<void> {
    if (!this.isSdkLoaded || !window.Spotify) {
      console.warn('⚠️ Spotify SDK not loaded yet');
      this.setState({ error: 'Spotify SDK not loaded' });
      return;
    }

    try {
      // Initialize authentication first
      const isAuthenticated = await this.authService.initialize();
      
      if (!isAuthenticated) {
        console.warn('⚠️ Spotify authentication required for in-site playback');
        this.setState({ error: 'Spotify authentication required - click "Connect Spotify" to enable in-site playback' });
        return;
      }

      const accessToken = this.authService.getAccessToken();
      if (!accessToken) {
        console.warn('⚠️ No Spotify access token available');
        this.setState({ error: 'No access token available - please reconnect to Spotify' });
        return;
      }

      console.log('🎵 Initializing Spotify player...');
      this.setState({ loading: true, error: null });

      // Create the player instance with enhanced configuration
      this.player = new window.Spotify.Player({
        name: 'MusicStream Web Player',
        getOAuthToken: cb => { 
          const token = this.authService.getAccessToken();
          if (token) {
            cb(token);
          } else {
            console.error('❌ No access token available for player');
            this.setState({ error: 'Authentication token expired - please reconnect' });
          }
        },
        volume: this.state.volume / 100,
        enableMediaSession: true, // Enable media session for better integration
        enableMediaSessionMetadata: true
      });

      // Enhanced error handlers with better user feedback
      this.player.addListener('initialization_error', ({ message }) => {
        console.error('❌ Spotify initialization error:', message);
        let userMessage = 'Failed to initialize Spotify player';
        
        if (message.includes('Premium')) {
          userMessage = 'Spotify Premium required for in-site playback';
        } else if (message.includes('browser')) {
          userMessage = 'Your browser may not support Spotify Web Playback SDK';
        } else if (message.includes('network')) {
          userMessage = 'Network error - check your internet connection';
        }
        
        this.setState({ 
          error: userMessage,
          loading: false 
        });
      });

      this.player.addListener('authentication_error', ({ message }) => {
        console.error('❌ Spotify authentication error:', message);
        this.setState({ 
          error: 'Spotify authentication failed - please reconnect',
          loading: false 
        });
        // Try to re-authenticate after a delay
        setTimeout(() => {
          this.authService.startAuth();
        }, 2000);
      });

      this.player.addListener('account_error', ({ message }) => {
        console.error('❌ Spotify account error:', message);
        let userMessage = 'Spotify account error';
        
        if (message.includes('Premium')) {
          userMessage = 'Spotify Premium account required for in-site playback';
        } else if (message.includes('country')) {
          userMessage = 'Spotify not available in your region';
        } else if (message.includes('restricted')) {
          userMessage = 'Your Spotify account has playback restrictions';
        }
        
        this.setState({ 
          error: userMessage,
          loading: false 
        });
      });

      this.player.addListener('playback_error', ({ message }) => {
        console.error('❌ Spotify playback error:', message);
        let userMessage = 'Playback error occurred';
        
        if (message.includes('Premium')) {
          userMessage = 'Premium required for this track';
        } else if (message.includes('unavailable')) {
          userMessage = 'Track not available in your region';
        } else if (message.includes('explicit')) {
          userMessage = 'Explicit content blocked';
        }
        
        this.setState({ 
          error: userMessage,
          loading: false 
        });
      });

      // Enhanced playback state change handler
      this.player.addListener('player_state_changed', (state: any) => {
        if (state) {
          const newState = {
            isPlaying: !state.paused,
            currentTime: state.position,
            duration: state.duration,
            trackId: state.track_window?.current_track?.id || null,
          };
          
          this.setState(newState);
          
          // Clear any previous errors when playback starts successfully
          if (!state.paused && this.state.error) {
            this.setState({ error: null });
          }
          
          if (!state.paused) {
            this.callbacks.onPlay?.();
          } else {
            this.callbacks.onPause?.();
          }
          
          this.callbacks.onStateChange?.(state);
          
          // Log track info for debugging
          if (state.track_window?.current_track) {
            const track = state.track_window.current_track;
            console.log('🎵 Now playing:', {
              name: track.name,
              artist: track.artists?.[0]?.name,
              album: track.album?.name,
              duration: state.duration,
              position: state.position
            });
          }
        }
      });

      // Enhanced ready handler
      this.player.addListener('ready', ({ device_id }) => {
        console.log('✅ Spotify player ready with device ID:', device_id);
        this.setState({ 
          deviceId: device_id,
          loading: false,
          error: null 
        });
        this.isInitialized = true;
        this.callbacks.onLoad?.();
        
        // Log success message
        console.log('🎉 Spotify Web Playback SDK ready! You can now play tracks in-site.');
      });

      // Enhanced not ready handler
      this.player.addListener('not_ready', ({ device_id }) => {
        console.log('⚠️ Spotify player not ready:', device_id);
        this.setState({ 
          deviceId: null,
          loading: false,
          error: 'Spotify player disconnected'
        });
        this.isInitialized = false;
      });

      // Connect to the player with timeout
      console.log('🎵 Connecting to Spotify player...');
      const connectPromise = this.player.connect();
      
      // Add timeout for connection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
      
      const connected = await Promise.race([connectPromise, timeoutPromise]);
      
      if (connected) {
        console.log('✅ Connected to Spotify player');
      } else {
        console.error('❌ Failed to connect to Spotify player');
        this.setState({ 
          error: 'Failed to connect to Spotify player - please try again',
          loading: false 
        });
      }

    } catch (error: any) {
      console.error('❌ Error initializing Spotify player:', error);
      
      let userMessage = 'Failed to initialize Spotify player';
      if (error.message === 'Connection timeout') {
        userMessage = 'Connection to Spotify timed out - please check your internet connection';
      } else if (error.message.includes('Premium')) {
        userMessage = 'Spotify Premium required for in-site playback';
      }
      
      this.setState({ 
        error: userMessage,
        loading: false 
      });
    }
  }

  setCallbacks(callbacks: SpotifyPlayerCallbacks): void {
    this.callbacks = callbacks;
  }

  async loadTrack(trackId: string): Promise<void> {
    if (!this.isInitialized || !this.state.deviceId) {
      console.warn('⚠️ Spotify player not ready, initializing...');
      await this.initializePlayer();
      
      if (!this.isInitialized || !this.state.deviceId) {
        throw new Error('Failed to initialize Spotify player');
      }
    }

    try {
      this.setState({ loading: true, error: null });
      
      const accessToken = this.authService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      console.log('🎵 Loading Spotify track:', trackId);
      
      // First, ensure the track exists and is playable
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Track not found or not available: ${response.statusText}`);
      }

      const trackData = await response.json();
      
      // Transfer playback to our device
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [this.state.deviceId],
          play: false
        })
      });

      // Wait a moment for the device transfer to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Start playing the track
      const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.state.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [`spotify:track:${trackId}`],
          position_ms: 0
        })
      });

      if (!playResponse.ok) {
        const errorData = await playResponse.json();
        let errorMessage = `Playback failed: ${playResponse.statusText}`;
        
        if (errorData.error?.reason === 'PREMIUM_REQUIRED') {
          errorMessage = 'Spotify Premium is required for full playback';
        } else if (errorData.error?.reason === 'NO_ACTIVE_DEVICE') {
          errorMessage = 'No active device found - please try again';
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Spotify track loaded successfully:', trackId);
      this.setState({ 
        trackId,
        loading: false,
        error: null,
        duration: trackData.duration_ms / 1000
      });
      this.callbacks.onLoad?.();

    } catch (error: any) {
      console.error('❌ Failed to load Spotify track:', error);
      
      let userMessage = error.message;
      
      if (error.message.includes('Premium')) {
        userMessage = 'Premium required for Spotify playback';
      } else if (error.message.includes('device')) {
        userMessage = 'Playback device error - please try again';
        // Attempt to reinitialize the player
        setTimeout(() => this.initializePlayer(), 2000);
      }
      
      this.setState({ 
        error: userMessage,
        loading: false 
      });
      this.callbacks.onLoadError?.(error);
      throw error;
    }
  }

  async loadTrackFromUrl(url: string): Promise<void> {
    // Extract track ID from Spotify URL
    const trackId = this.extractTrackId(url);
    if (trackId) {
      await this.loadTrack(trackId);
    } else {
      throw new Error('Invalid Spotify URL');
    }
  }

  private extractTrackId(url: string): string | null {
    const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  play(): void {
    if (this.player && this.isInitialized) {
      this.player.resume();
    }
  }

  pause(): void {
    if (this.player && this.isInitialized) {
      this.player.pause();
    }
  }

  stop(): void {
    if (this.player && this.isInitialized) {
      this.player.pause();
    }
  }

  seek(time: number): void {
    if (this.player && this.isInitialized) {
      this.player.seek(time);
    }
  }

  setVolume(volume: number): void {
    if (this.player && this.isInitialized) {
      this.player.setVolume(volume / 100);
      this.setState({ volume });
      this.callbacks.onVolumeChange?.(volume);
    }
  }

  getState(): SpotifyPlayerState {
    return { ...this.state };
  }

  isLoaded(): boolean {
    return this.isInitialized && !!this.state.deviceId;
  }

  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  getCurrentTime(): number {
    return this.state.currentTime;
  }

  getDuration(): number {
    return this.state.duration;
  }

  getTrackId(): string | null {
    return this.state.trackId;
  }

  // Start authentication flow
  startAuth(): void {
    this.authService.startAuth();
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  private setState(updates: Partial<SpotifyPlayerState>): void {
    this.state = { ...this.state, ...updates };
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.player) {
      this.player.disconnect();
    }
  }
}

// Extend Window interface for Spotify SDK
declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export default SpotifyPlayerService; 