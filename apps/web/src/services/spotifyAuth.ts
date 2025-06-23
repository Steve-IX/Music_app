// Spotify Authentication Service
// Handles OAuth flow to get access tokens for Web Playback SDK

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

export type AuthCallback = () => void;

class SpotifyAuthService {
  private config: SpotifyAuthConfig;
  private tokens: SpotifyTokens | null = null;
  private tokenExpiry: number = 0;
  private authCallbacks: AuthCallback[] = [];

  constructor() {
    const isProd = window.location.hostname !== 'localhost';
    const redirectUri = isProd 
      ? 'https://music-app-eta-vert.vercel.app/spotify-callback'
      : `${window.location.origin}/spotify-callback`;

    this.config = {
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '',
      redirectUri,
      scopes: [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'app-remote-control',
        'playlist-read-private',
        'playlist-read-collaborative',
        'user-library-read',
        'user-top-read',
        'user-read-recently-played',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-follow-read',
        'user-follow-modify',
        'user-library-modify',
        'streaming'
      ]
    };

    console.log('🔐 Spotify Auth Config:', {
      clientId: this.config.clientId ? '✅ Set' : '❌ Missing',
      clientSecret: this.config.clientSecret ? '✅ Set' : '❌ Missing',
      redirectUri: this.config.redirectUri,
      note: '⚠️ Web Playback SDK requires Spotify Premium account'
    });
  }

  // Add callback for when authentication is successful
  onAuthSuccess(callback: AuthCallback): void {
    this.authCallbacks.push(callback);
  }

  // Remove callback
  removeAuthCallback(callback: AuthCallback): void {
    const index = this.authCallbacks.indexOf(callback);
    if (index > -1) {
      this.authCallbacks.splice(index, 1);
    }
  }

  // Trigger auth success callbacks
  private triggerAuthSuccess(): void {
    this.authCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in auth success callback:', error);
      }
    });
  }

  // Initialize authentication
  async initialize(): Promise<boolean> {
    try {
      console.log('🔐 Initializing Spotify auth service...');
      
      // Check for auth result in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const authResult = urlParams.get('spotify_auth');
      
      if (authResult === 'success') {
        console.log('✅ Spotify authentication successful, checking for code...');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (authResult === 'error') {
        const error = urlParams.get('error');
        console.error('❌ Spotify authentication failed:', error);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return false;
      }
      
      // Check if we have stored tokens first
      const storedTokens = this.getStoredTokens();
      if (storedTokens && this.isTokenValid()) {
        this.tokens = storedTokens;
        console.log('✅ Using stored Spotify tokens');
        this.triggerAuthSuccess();
        return true;
      }

      // Check if we have a pending authorization code (from callback)
      const authCode = localStorage.getItem('spotify_auth_code');
      const authTimestamp = localStorage.getItem('spotify_auth_timestamp');
      
      if (authCode && authTimestamp) {
        const timestamp = parseInt(authTimestamp);
        const now = Date.now();
        
        // Check if the code is not too old (5 minutes)
        if (now - timestamp < 5 * 60 * 1000) {
          console.log('🔄 Found recent authorization code, exchanging for tokens...');
          localStorage.removeItem('spotify_auth_code'); // Clear it immediately
          localStorage.removeItem('spotify_auth_timestamp');
          
          const success = await this.exchangeCodeForTokens(authCode);
          if (success) {
            return true;
          }
        } else {
          console.log('⚠️ Authorization code is too old, clearing...');
          localStorage.removeItem('spotify_auth_code');
          localStorage.removeItem('spotify_auth_timestamp');
        }
      }

      // Check if we have expired tokens and can refresh them
      if (storedTokens && storedTokens.refresh_token) {
        console.log('🔄 Attempting to refresh expired tokens...');
        const refreshSuccess = await this.refreshTokens();
        if (refreshSuccess) {
          return true;
        }
      }

      console.log('ℹ️ No valid Spotify authentication found');
      return false;

    } catch (error) {
      console.error('❌ Error initializing Spotify auth:', error);
      return false;
    }
  }

  // Validate configuration
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.clientId) {
      errors.push('Spotify Client ID is not configured (VITE_SPOTIFY_CLIENT_ID)');
    }
    
    if (!this.config.clientSecret) {
      errors.push('Spotify Client Secret is not configured (VITE_SPOTIFY_CLIENT_SECRET)');
    }
    
    if (!this.config.redirectUri) {
      errors.push('Spotify Redirect URI is not configured');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Start OAuth flow
  startAuth(): void {
    const configValidation = this.validateConfig();
    if (!configValidation.isValid) {
      console.error('❌ Spotify configuration errors:', configValidation.errors);
      alert('Spotify is not properly configured. Please check the environment variables.');
      return;
    }

    const state = this.generateState();
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', this.config.clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.append('scope', this.config.scopes.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('show_dialog', 'true');

    console.log('🔐 Starting Spotify OAuth flow...');
    console.log('🔗 Auth URL:', authUrl.toString());
    
    // Redirect to Spotify auth
    window.location.href = authUrl.toString();
  }

  // Exchange authorization code for tokens
  private async exchangeCodeForTokens(code: string): Promise<boolean> {
    try {
      console.log('🔄 Exchanging code for tokens...');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.config.redirectUri
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const tokens: SpotifyTokens = await response.json();
      this.tokens = tokens;
      this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);
      this.storeTokens(tokens);

      console.log('✅ Successfully obtained Spotify tokens');
      this.triggerAuthSuccess();
      return true;

    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error);
      return false;
    }
  }

  // Refresh access token
  async refreshTokens(): Promise<boolean> {
    if (!this.tokens?.refresh_token) {
      console.warn('⚠️ No refresh token available');
      return false;
    }

    try {
      console.log('🔄 Refreshing Spotify tokens...');
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const newTokens: SpotifyTokens = await response.json();
      
      // Preserve refresh token if not provided in response
      if (!newTokens.refresh_token && this.tokens.refresh_token) {
        newTokens.refresh_token = this.tokens.refresh_token;
      }

      this.tokens = newTokens;
      this.tokenExpiry = Date.now() + (newTokens.expires_in * 1000);
      this.storeTokens(newTokens);

      console.log('✅ Successfully refreshed Spotify tokens');
      this.triggerAuthSuccess();
      return true;

    } catch (error) {
      console.error('❌ Error refreshing tokens:', error);
      this.clearTokens();
      return false;
    }
  }

  // Get current access token
  getAccessToken(): string | null {
    if (!this.tokens) {
      return null;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    if (!this.isTokenValid()) {
      console.warn('⚠️ Token expired, attempting refresh...');
      this.refreshTokens().catch(console.error);
      return null;
    }

    return this.tokens.access_token;
  }

  // Check if token is still valid
  private isTokenValid(): boolean {
    if (!this.tokens || !this.tokenExpiry) {
      return false;
    }
    
    // Consider token expired if it expires within 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() < (this.tokenExpiry - bufferTime);
  }

  // Store tokens in localStorage
  private storeTokens(tokens: SpotifyTokens): void {
    try {
      localStorage.setItem('spotify_tokens', JSON.stringify(tokens));
      localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
      console.log('💾 Spotify tokens stored successfully');
    } catch (error) {
      console.error('❌ Error storing Spotify tokens:', error);
    }
  }

  // Get stored tokens from localStorage
  private getStoredTokens(): SpotifyTokens | null {
    try {
      const tokensStr = localStorage.getItem('spotify_tokens');
      const expiryStr = localStorage.getItem('spotify_token_expiry');
      
      if (!tokensStr || !expiryStr) {
        return null;
      }

      const tokens: SpotifyTokens = JSON.parse(tokensStr);
      const expiry = parseInt(expiryStr);
      
      // Check if tokens are expired
      if (Date.now() > expiry) {
        console.log('⚠️ Stored Spotify tokens are expired');
        this.clearTokens();
        return null;
      }

      return tokens;
    } catch (error) {
      console.error('❌ Error reading stored Spotify tokens:', error);
      this.clearTokens();
      return null;
    }
  }

  // Clear stored tokens
  private clearTokens(): void {
    try {
      localStorage.removeItem('spotify_tokens');
      localStorage.removeItem('spotify_token_expiry');
      localStorage.removeItem('spotify_auth_code');
      localStorage.removeItem('spotify_auth_timestamp');
      console.log('🗑️ Spotify tokens cleared');
    } catch (error) {
      console.error('❌ Error clearing Spotify tokens:', error);
    }
  }

  // Generate random state for OAuth
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  // Logout user
  logout(): void {
    console.log('🔓 Logging out from Spotify...');
    this.clearTokens();
  }

  // Get user profile
  async getUserProfile(): Promise<any> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  }
}

export default SpotifyAuthService; 