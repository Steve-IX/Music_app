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

      // Check if player is already initialized
      if (this.isInitialized && this.player) {
        console.log('✅ Spotify player already initialized');
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
        enableMediaSession: true,
        enableMediaSessionMetadata: true
      });

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.isInitialized) {
          console.error('❌ Spotify player connection timeout');
          this.setState({ 
            error: 'Connection timeout - please check your Spotify Premium subscription',
            loading: false 
          });
        }
      }, 15000);

      // Enhanced error handlers with better user feedback
      this.player.addListener('initialization_error', ({ message }) => {
        console.error('❌ Spotify initialization error:', message);
        clearTimeout(connectionTimeout);
        
        let userMessage = 'Failed to initialize Spotify player';
        
        if (message.includes('Premium')) {
          userMessage = 'Spotify Premium required for in-site playback';
          this.isInitialized = false;
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

      this.player.addListener('ready', ({ device_id }) => {
        console.log('✅ Spotify player ready with device ID:', device_id);
        clearTimeout(connectionTimeout);
        this.isInitialized = true;
        this.setState({
          deviceId: device_id,
          loading: false,
          error: null
        });
      });

      this.player.addListener('not_ready', ({ device_id }) => {
        console.warn('⚠️ Spotify player device not ready:', device_id);
        this.setState({
          deviceId: null,
          error: 'Player not ready - please try again'
        });
      });

      // Connect to the player
      console.log('🎵 Connecting to Spotify player...');
      const connected = await this.player.connect();
      
      if (!connected) {
        clearTimeout(connectionTimeout);
        throw new Error('Failed to connect to Spotify player');
      }

    } catch (error: any) {
      console.error('❌ Error initializing Spotify player:', error);
      this.setState({ 
        error: error.message || 'Failed to initialize player',
        loading: false 
      });
      this.isInitialized = false;
    }
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