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
    if (!this.authService.isAuthenticated()) {
      throw new Error('Spotify authentication required');
    }

    if (this.isInitialized) {
      console.log('✅ Spotify player already initialized');
      return;
    }

    try {
      console.log('🎵 Initializing Spotify player...');
      
      // Wait for SDK to be ready
      if (!this.isSdkLoaded) {
        await new Promise<void>((resolve) => {
          window.onSpotifyWebPlaybackSDKReady = () => {
            this.isSdkLoaded = true;
            resolve();
          };
          this.loadSpotifySDK();
        });
      }

      const accessToken = this.authService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Initialize player
      this.player = new window.Spotify.Player({
        name: 'MusicStream Web Player',
        getOAuthToken: cb => cb(accessToken),
        volume: this.state.volume / 100
      });

      // Error handling
      this.player.addListener('initialization_error', ({ message }) => {
        console.error('❌ Spotify player initialization error:', message);
        this.setState({ error: 'Failed to initialize player: ' + message });
      });

      this.player.addListener('authentication_error', ({ message }) => {
        console.error('❌ Spotify authentication error:', message);
        this.setState({ error: 'Authentication failed: ' + message });
        // Try to refresh token
        this.authService.refreshTokens().catch(console.error);
      });

      this.player.addListener('account_error', ({ message }) => {
        console.error('❌ Spotify account error:', message);
        if (message.includes('premium')) {
          this.setState({ error: 'Spotify Premium required for playback' });
        } else {
          this.setState({ error: 'Account error: ' + message });
        }
      });

      this.player.addListener('playback_error', ({ message }) => {
        console.error('❌ Spotify playback error:', message);
        this.setState({ error: 'Playback error: ' + message });
      });

      // Playback status updates
      this.player.addListener('player_state_changed', state => {
        if (!state) {
          console.log('⚠️ No playback state available');
          return;
        }

        this.setState({
          isPlaying: !state.paused,
          currentTime: state.position / 1000,
          duration: state.duration / 1000,
          loading: false,
          error: null
        });

        this.callbacks.onStateChange?.(state);
      });

      // Ready
      this.player.addListener('ready', ({ device_id }) => {
        console.log('✅ Spotify player ready with device ID:', device_id);
        this.setState({ deviceId: device_id, error: null });
        this.isInitialized = true;

        // Transfer playback to this device
        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
          fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device_ids: [device_id],
              play: false
            })
          }).then(() => {
            console.log('🎉 Spotify Web Playback SDK ready! You can now play tracks in-site.');
          }).catch(error => {
            console.warn('⚠️ Failed to transfer playback:', error);
          });
        }
      });

      // Not Ready
      this.player.addListener('not_ready', ({ device_id }) => {
        console.warn('⚠️ Device ID has gone offline:', device_id);
        this.setState({ deviceId: null });
      });

      // Connect to the player
      console.log('🎵 Connecting to Spotify player...');
      const connected = await this.player.connect();
      
      if (connected) {
        console.log('✅ Connected to Spotify player');
      } else {
        throw new Error('Failed to connect to Spotify player');
      }

    } catch (error: any) {
      console.error('❌ Failed to initialize Spotify player:', error);
      this.isInitialized = false;
      this.setState({ 
        error: error.message || 'Failed to initialize Spotify player',
        loading: false 
      });
      throw error;
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