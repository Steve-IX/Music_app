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
    // Disable Spotify Web Playback SDK to prevent authentication errors
    // The SDK requires Premium account and proper OAuth with user consent
    console.log('🎵 Spotify Web Playback SDK disabled - requires Premium account');
    this.isSdkLoaded = true;
    return;

    // Original SDK loading code commented out to prevent 401 errors
    /*
    if (this.isSdkLoaded || document.querySelector('script[src*="sdk.scdn.co"]')) {
      this.isSdkLoaded = true;
      return;
    }

    console.log('🎵 Loading Spotify Web Playback SDK...');
    
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    
    document.head.appendChild(script);
    
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('🎵 Spotify Web Playback SDK ready');
      this.isSdkLoaded = true;
      this.initializePlayer();
    };
    */
  }

  private async initializePlayer(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.authService.isAuthenticated()) {
        console.warn('⚠️ Cannot initialize Spotify player - not authenticated');
        resolve();
        return;
      }

      const token = this.authService.getAccessToken();
      if (!token) {
        console.warn('⚠️ Cannot initialize Spotify player - no access token');
        resolve();
        return;
      }

      console.log('🎵 Initializing Spotify player...');

      this.player = new window.Spotify.Player({
        name: 'MusicStream Web Player',
        getOAuthToken: (cb: (token: string) => void) => {
          const currentToken = this.authService.getAccessToken();
          if (currentToken) {
            cb(currentToken);
          } else {
            console.error('❌ No valid token available for Spotify player');
            this.setState({ error: 'Authentication required' });
          }
        },
        volume: 0.5
      });

      // Error handling
      this.player.addListener('initialization_error', ({ message }: any) => {
        console.error('❌ Spotify player initialization error:', message);
        this.setState({ error: `Initialization error: ${message}` });
      });

      this.player.addListener('authentication_error', ({ message }: any) => {
        console.error('❌ Spotify player authentication error:', message);
        this.setState({ error: `Authentication error: ${message}` });
        
        // Try to refresh tokens
        this.authService.refreshTokens().then(success => {
          if (!success) {
            console.log('🔐 Token refresh failed, user needs to re-authenticate');
            this.authService.logout();
          }
        });
      });

      this.player.addListener('account_error', ({ message }: any) => {
        console.error('❌ Spotify account error:', message);
        this.setState({ error: `Account error: ${message}. Premium account required.` });
      });

      this.player.addListener('playback_error', ({ message }: any) => {
        console.error('❌ Spotify playback error:', message);
        this.setState({ error: `Playback error: ${message}` });
      });

      // Ready
      this.player.addListener('ready', ({ device_id }: any) => {
        console.log('✅ Connected to Spotify player');
        console.log('✅ Spotify player ready with device ID:', device_id);
        this.setState({ 
          deviceId: device_id,
          loading: false,
          error: null
        });
        if (this.callbacks.onLoad) this.callbacks.onLoad();
      });

      // Not Ready
      this.player.addListener('not_ready', ({ device_id }: any) => {
        console.log('❌ Spotify player not ready with device ID:', device_id);
        this.setState({ deviceId: null });
      });

      // Player state changed
      this.player.addListener('player_state_changed', (state: any) => {
        if (!state) {
          console.log('🔇 Spotify player state: No active device');
          return;
        }

        const track = state.track_window.current_track;
        const isPlaying = !state.paused;
        const position = state.position;
        const duration = state.duration;

        this.setState({
          isPlaying,
          currentTime: Math.floor(position / 1000),
          duration: Math.floor(duration / 1000),
          trackId: track?.id || null,
          loading: false,
          error: null
        });

        if (this.callbacks.onStateChange) {
          this.callbacks.onStateChange(state);
        }

        if (isPlaying && this.callbacks.onPlay) {
          this.callbacks.onPlay();
        } else if (!isPlaying && this.callbacks.onPause) {
          this.callbacks.onPause();
        }
      });

      // Connect to the player
      console.log('🎵 Connecting to Spotify player...');
      this.player.connect().then((success: boolean) => {
        if (success) {
          console.log('🎉 Spotify Web Playback SDK ready! You can now play tracks in-site.');
          this.isInitialized = true;
        } else {
          console.error('❌ Failed to connect to Spotify player');
          this.setState({ error: 'Failed to connect to Spotify player' });
        }
        resolve();
      }).catch((error: any) => {
        console.error('❌ Error connecting to Spotify player:', error);
        this.setState({ error: 'Failed to connect to Spotify player' });
        resolve();
      });
    });
  }

  setCallbacks(callbacks: SpotifyPlayerCallbacks): void {
    this.callbacks = callbacks;
  }

  async loadTrack(trackId: string): Promise<void> {
    if (!this.isInitialized || !this.state.deviceId) {
      console.warn('⚠️ Spotify player not ready, falling back to external player');
      this.setState({ error: 'Spotify player not ready - opening in Spotify app' });
      
      // Fallback to opening in Spotify with better user feedback
      const spotifyUrl = `https://open.spotify.com/track/${trackId}`;
      console.log('🔄 Opening track in Spotify app:', spotifyUrl);
      
      // Try to open in new tab, fallback to current tab if blocked
      try {
        const newWindow = window.open(spotifyUrl, '_blank');
        if (!newWindow) {
          // Popup blocked, open in current tab
          window.location.href = spotifyUrl;
        }
      } catch (error) {
        console.error('❌ Failed to open Spotify URL:', error);
        window.location.href = spotifyUrl;
      }
      
      return;
    }

    try {
      this.setState({ loading: true, error: null });
      
      const accessToken = this.authService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      console.log('🎵 Loading Spotify track:', trackId);
      
      // Enhanced API call with better error handling
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.state.deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [`spotify:track:${trackId}`]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Enhanced error messages based on status codes
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication expired - please reconnect to Spotify';
            break;
          case 403:
            errorMessage = 'Premium required for this track';
            break;
          case 404:
            errorMessage = 'Track not found or unavailable';
            break;
          case 429:
            errorMessage = 'Too many requests - please wait a moment';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Spotify service temporarily unavailable';
            break;
          default:
            errorMessage = `Playback error: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Spotify track loaded successfully:', trackId);
      this.setState({ 
        trackId,
        loading: false,
        error: null
      });
      this.callbacks.onLoad?.();

    } catch (error: any) {
      console.error('❌ Failed to load Spotify track:', error);
      
      let userMessage = `Failed to load track: ${error.message}`;
      
      // Provide fallback options based on error type
      if (error.message.includes('Premium')) {
        userMessage = 'Premium required - opening in Spotify app';
        // Open in Spotify app as fallback
        window.open(`https://open.spotify.com/track/${trackId}`, '_blank');
      } else if (error.message.includes('unavailable')) {
        userMessage = 'Track unavailable in your region';
      } else if (error.message.includes('Authentication')) {
        userMessage = 'Please reconnect to Spotify';
        // Trigger re-authentication
        setTimeout(() => {
          this.authService.startAuth();
        }, 1000);
      }
      
      this.setState({ 
        error: userMessage,
        loading: false 
      });
      this.callbacks.onLoadError?.(error);
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