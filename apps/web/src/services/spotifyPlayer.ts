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
    
    // Register for auth success callbacks
    this.authService.onAuthSuccess(() => {
      this.initializeAfterAuth();
    });

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
    if (this.isInitialized) {
      console.log('🎵 Spotify player already initialized');
      return;
    }

    try {
      if (!this.isSdkLoaded) {
        await new Promise<void>((resolve) => {
          window.onSpotifyWebPlaybackSDKReady = () => {
            this.isSdkLoaded = true;
            resolve();
          };
          this.loadSpotifySDK();
        });
      }

      // Check if user is authenticated before attempting to initialize
      if (!this.authService.isAuthenticated()) {
        console.log('🔐 User not authenticated with Spotify - please connect your account');
        this.setState({ 
          error: 'Please connect your Spotify account to use the player. Click the "Connect Spotify" button in the header.' 
        });
        return;
      }

      const accessToken = this.authService.getAccessToken();
      if (!accessToken) {
        console.log('❌ No access token available - authentication may have failed');
        this.setState({ 
          error: 'Spotify authentication failed. Please try connecting again.' 
        });
        return;
      }

      // Create player instance
      this.player = new window.Spotify.Player({
        name: 'MusicStream Web Player',
        getOAuthToken: (cb: (token: string) => void) => cb(accessToken),
        volume: this.state.volume / 100
      });

      // Set up event handlers
      this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('✅ Connected to Spotify player');
        this.setState({ 
          deviceId: device_id, 
          loading: false, 
          error: null 
        });
        this.isInitialized = true;
        
        // Trigger callbacks
        this.callbacks.onLoad?.();
        this.callbacks.onStateChange?.({ device_id });
      });

      this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('⚠️ Spotify player not ready:', device_id);
        this.setState({ 
          deviceId: null, 
          loading: false,
          error: 'Spotify player is not ready. Please check your Spotify app.' 
        });
      });

      this.player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('❌ Spotify player initialization error:', message);
        this.setState({ 
          loading: false, 
          error: `Spotify player error: ${message}` 
        });
      });

      this.player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('❌ Spotify authentication error:', message);
        this.setState({ 
          loading: false, 
          error: 'Spotify authentication failed. Please reconnect your account.' 
        });
        // Clear tokens on auth error
        this.authService.logout();
      });

      this.player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('❌ Spotify account error:', message);
        this.setState({ 
          loading: false, 
          error: `Spotify account error: ${message}. Premium account may be required.` 
        });
      });

      this.player.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('❌ Spotify playback error:', message);
        this.setState({ 
          error: `Playback error: ${message}` 
        });
      });

      // Playback state events
      this.player.addListener('player_state_changed', (state: any) => {
        if (state) {
          this.setState({
            isPlaying: !state.paused,
            currentTime: state.position,
            duration: state.duration,
            trackId: state.track_window?.current_track?.id || null
          });
          
          this.callbacks.onStateChange?.(state);
          
          if (!state.paused) {
            this.callbacks.onPlay?.();
          } else {
            this.callbacks.onPause?.();
          }
        }
      });

      // Connect to the player
      console.log('🎵 Connecting to Spotify player...');
      this.setState({ loading: true });
      await this.player.connect();

    } catch (error) {
      console.error('❌ Failed to initialize Spotify player:', error);
      this.setState({ 
        loading: false, 
        error: `Failed to initialize Spotify player: ${error instanceof Error ? error.message : 'Unknown error'}` 
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
      
      // Transfer playback to our device with a longer delay
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

      // Wait longer for the device transfer to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

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
        if (playResponse.status === 404) {
          throw new Error('No active device found. Please try again.');
        } else if (playResponse.status === 403) {
          throw new Error('Spotify Premium required to play full tracks.');
        } else {
          const errorData = await playResponse.json();
          throw new Error(errorData.error?.message || 'Failed to play track');
        }
      }

      this.setState({ loading: false, error: null });
      
    } catch (error: any) {
      console.error('❌ Failed to load Spotify track:', error);
      this.setState({ 
        loading: false, 
        error: error.message || 'Failed to load track'
      });
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

  // New method to initialize player after authentication
  async initializeAfterAuth(): Promise<void> {
    if (this.authService.isAuthenticated() && !this.isInitialized) {
      console.log('🔐 User authenticated - initializing Spotify player...');
      await this.initializePlayer();
    }
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