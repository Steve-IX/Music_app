// Spotify Authentication Service
// Handles OAuth flow to get access tokens for Web Playback SDK

import axios from 'axios';

export interface SpotifyAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

class SpotifyAuthService {
  private config: SpotifyAuthConfig;
  private tokens: SpotifyTokens | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/spotify-callback`,
      scopes: [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'playlist-read-private',
        'playlist-read-collaborative',
        'user-library-read',
        'user-top-read',
        'user-read-recently-played',
        'user-follow-read',
        'playlist-modify-public',
        'playlist-modify-private'
      ]
    };

    // Initialize from stored tokens
    this.tokens = this.getStoredTokens();
    if (this.tokens) {
      this.tokenExpiry = Date.now() + (this.tokens.expires_in * 1000);
      console.log('✅ Using stored Spotify tokens');
    }

    console.log('🔐 Spotify Auth Config:', {
      clientId: this.config.clientId ? '✅ Set' : '❌ Missing',
      clientSecret: this.config.clientSecret ? '✅ Set' : '❌ Missing',
      redirectUri: this.config.redirectUri,
      note: '⚠️ Web Playback SDK requires Spotify Premium account'
    });
  }

  // Initialize authentication
  async initialize(): Promise<boolean> {
    try {
      console.log('🔐 Spotify Auth Config:', {
        clientId: this.config.clientId ? '✅ Set' : '❌ Missing',
        clientSecret: this.config.clientSecret ? '✅ Set' : '❌ Missing',
        redirectUri: this.config.redirectUri,
        note: '⚠️ Web Playback SDK requires Spotify Premium account'
      });

      if (!this.config.clientId) {
        console.warn('⚠️ Spotify Client ID not configured');
        return false;
      }

      // Check if we have stored tokens that are still valid
      if (this.tokens && this.isTokenValid()) {
          console.log('✅ Using stored Spotify tokens');
          return true;
      }

      // Check for auth code from callback page
      const storedCode = sessionStorage.getItem('spotify_auth_code');
      if (storedCode) {
        console.log('🔄 Found stored auth code, exchanging for tokens...');
        sessionStorage.removeItem('spotify_auth_code');
        const success = await this.exchangeCodeForTokens(storedCode);
        return success;
      }

      // Check if we're returning from OAuth (URL parameters)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = localStorage.getItem('spotify_auth_state');

      if (code && state && state === storedState) {
        console.log('🔄 Processing OAuth callback...');
        const success = await this.exchangeCodeForTokens(code);
        
        // Clean up URL and state
          window.history.replaceState({}, document.title, window.location.pathname);
        localStorage.removeItem('spotify_auth_state');
        
        return success;
      }

      return false;
    } catch (error) {
      console.error('❌ Spotify auth initialization failed:', error);
      return false;
    }
  }

  // Start OAuth flow
  startAuth(): void {
    if (!this.config.clientId) {
      console.error('❌ Spotify Client ID not configured');
      return;
    }

    const state = this.generateState();
    localStorage.setItem('spotify_auth_state', state);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state,
      show_dialog: 'true' // Force login dialog
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    console.log('🚀 Starting Spotify OAuth flow...');
    window.location.href = authUrl;
  }

  // Exchange authorization code for tokens
  private async exchangeCodeForTokens(code: string): Promise<boolean> {
    try {
      console.log('🔄 Exchanging code for tokens...');
      
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.config.redirectUri,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      this.tokens = response.data;
      this.tokenExpiry = Date.now() + (this.tokens!.expires_in * 1000);
      this.storeTokens(this.tokens!);

      console.log('✅ Spotify tokens obtained successfully');
      console.log('🔍 Token scopes:', this.tokens!.scope);
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to exchange code for tokens:', error.response?.data || error.message);
      return false;
    }
  }

  // Refresh access token
  async refreshTokens(): Promise<boolean> {
    if (!this.tokens?.refresh_token) {
      console.error('❌ No refresh token available');
      return false;
    }

    try {
      console.log('🔄 Refreshing Spotify tokens...');
      
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );
      
      // Update tokens (refresh_token might not be included in response)
      const newTokens = {
        ...this.tokens,
        ...response.data
      };

      this.tokens = newTokens;
      this.tokenExpiry = Date.now() + (newTokens.expires_in * 1000);
      this.storeTokens(newTokens);

      console.log('✅ Spotify tokens refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to refresh tokens:', error.response?.data || error.message);
      this.clearTokens();
      return false;
    }
  }

  // Get current access token
  getAccessToken(): string | null {
    if (!this.tokens) {
      return null;
    }

    // Check if token is expired and try to refresh
    if (!this.isTokenValid()) {
      console.log('🔄 Token expired, attempting refresh...');
      // Note: This is async but we return the current token
      // The refresh will happen in the background
      this.refreshTokens().catch(console.error);
    }

    return this.tokens.access_token;
  }

  // Check if token is still valid
  private isTokenValid(): boolean {
    if (!this.tokens || !this.tokenExpiry) {
      return false;
    }
    
    // Add 5 minute buffer to avoid edge cases
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() < (this.tokenExpiry - bufferTime);
  }

  // Store tokens in localStorage
  private storeTokens(tokens: SpotifyTokens): void {
    try {
      localStorage.setItem('spotify_tokens', JSON.stringify(tokens));
      localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
    } catch (error) {
      console.error('❌ Failed to store Spotify tokens:', error);
    }
  }

  // Get stored tokens from localStorage
  private getStoredTokens(): SpotifyTokens | null {
    try {
      const storedTokens = localStorage.getItem('spotify_tokens');
      const storedExpiry = localStorage.getItem('spotify_token_expiry');
      
      if (storedTokens && storedExpiry) {
        this.tokenExpiry = parseInt(storedExpiry);
        return JSON.parse(storedTokens);
      }
    } catch (error) {
      console.error('❌ Failed to retrieve stored tokens:', error);
      this.clearTokens();
    }
    return null;
  }

  // Clear stored tokens
  private clearTokens(): void {
    this.tokens = null;
    this.tokenExpiry = 0;
    localStorage.removeItem('spotify_tokens');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_auth_state');
  }

  // Generate random state for OAuth
  private generateState(): string {
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    return Array.from(array, dec => dec.toString(16)).join('');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.tokens !== null && this.isTokenValid();
  }

  // Logout user
  logout(): void {
    console.log('🚪 Logging out of Spotify...');
    this.clearTokens();
  }

  // Get user profile
  async getUserProfile(): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get user profile:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        // Token is invalid, try to refresh
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          // Retry with new token
          const newToken = this.getAccessToken();
          if (newToken) {
            const retryResponse = await axios.get('https://api.spotify.com/v1/me', {
              headers: {
                'Authorization': `Bearer ${newToken}`
              }
            });
            return retryResponse.data;
          }
        }
      }
      
      throw error;
    }
  }
}

export default SpotifyAuthService; 