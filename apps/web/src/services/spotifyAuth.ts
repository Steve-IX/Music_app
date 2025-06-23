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

class SpotifyAuthService {
  private config: SpotifyAuthConfig;
  private tokens: SpotifyTokens | null = null;
  private tokenExpiry: number = 0;

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

  // Initialize authentication
  async initialize(): Promise<boolean> {
    try {
      // Check if we have stored tokens
      const storedTokens = this.getStoredTokens();
      if (storedTokens) {
        this.tokens = storedTokens;
        this.tokenExpiry = Date.now() + (storedTokens.expires_in * 1000);
        
        // Check if token is still valid
        if (this.isTokenValid()) {
          console.log('✅ Using stored Spotify tokens');
          return true;
        } else {
          console.log('🔄 Spotify token expired, refreshing...');
          return await this.refreshTokens();
        }
      }

      // Check if we're returning from OAuth
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');

      if (error) {
        console.error('❌ Spotify OAuth error:', error);
        return false;
      }

      if (code) {
        console.log('🔄 Exchanging authorization code for tokens...');
        const success = await this.exchangeCodeForTokens(code);
        if (success) {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Return to the original URL if stored
          const returnUrl = sessionStorage.getItem('spotify_auth_return_url');
          if (returnUrl) {
            sessionStorage.removeItem('spotify_auth_return_url');
            window.location.href = returnUrl;
          }
        }
        return success;
      }

      // No tokens and no code - need to authenticate
      console.log('🔐 No Spotify tokens found, need to authenticate');
      return false;

    } catch (error) {
      console.error('❌ Error initializing Spotify auth:', error);
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
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', this.config.clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.append('scope', this.config.scopes.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('show_dialog', 'true');

    // Store the current URL to return to after auth
    sessionStorage.setItem('spotify_auth_return_url', window.location.href);
    
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
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
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

      const tokens = JSON.parse(tokensStr);
      this.tokenExpiry = parseInt(expiryStr);
      
      return tokens;
    } catch (error) {
      console.error('❌ Error retrieving stored tokens:', error);
      return null;
    }
  }

  // Clear stored tokens
  private clearTokens(): void {
    try {
      localStorage.removeItem('spotify_tokens');
      localStorage.removeItem('spotify_token_expiry');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
    
    this.tokens = null;
    this.tokenExpiry = 0;
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