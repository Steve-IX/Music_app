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

export default class SpotifyAuthService {
  private config: SpotifyAuthConfig;
  private tokens: SpotifyTokens | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    // Determine the correct redirect URI based on environment
    const getRedirectUri = () => {
      // Check if we have an environment-specific redirect URI
      const envRedirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
      if (envRedirectUri) {
        return envRedirectUri;
      }
      
      // Fallback to dynamic construction
      return `${window.location.origin}/spotify-callback`;
    };

    this.config = {
      clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '',
      redirectUri: getRedirectUri(),
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
        'app-remote-control',
        'web-playback'
      ]
    };

    // Debug logging
    console.log('🔐 Spotify Auth Config:', {
      clientId: this.config.clientId ? '✅ Set' : '❌ Missing',
      clientSecret: this.config.clientSecret ? '✅ Set' : '❌ Missing',
      redirectUri: this.config.redirectUri,
      note: '⚠️ Web Playback SDK requires Spotify Premium account'
    });

    // Try to load stored tokens
    this.tokens = this.getStoredTokens();
    if (this.tokens) {
      console.log('✅ Using stored Spotify tokens');
    }
  }

  async initialize(): Promise<boolean> {
    // If we have tokens, validate them
    if (this.tokens) {
      if (this.isTokenValid()) {
        return true;
      }
      // Try to refresh if expired
      return await this.refreshTokens();
    }

    // Check URL for auth code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
      // Exchange code for tokens
      const success = await this.exchangeCodeForTokens(code);
      if (success) {
        // Remove code from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      }
    }

    return false;
  }

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

    console.log('🔐 Redirecting to Spotify OAuth...');
    window.location.href = authUrl.toString();
  }

  private async exchangeCodeForTokens(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.tokens = data;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      this.storeTokens(data);
      return true;
    } catch (error) {
      console.error('❌ Failed to exchange code for tokens:', error);
      return false;
    }
  }

  async refreshTokens(): Promise<boolean> {
    if (!this.tokens?.refresh_token) {
      console.error('❌ No refresh token available');
      return false;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Preserve the refresh token if not returned
      if (!data.refresh_token && this.tokens?.refresh_token) {
        data.refresh_token = this.tokens.refresh_token;
      }

      this.tokens = data;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      this.storeTokens(data);
      console.log('✅ Successfully refreshed Spotify tokens');
      return true;
    } catch (error) {
      console.error('❌ Failed to refresh tokens:', error);
      this.clearTokens();
      return false;
    }
  }

  getAccessToken(): string | null {
    if (!this.tokens) {
      return null;
    }

    // Check if token needs refresh
    if (!this.isTokenValid()) {
      console.log('⚠️ Token expired, needs refresh');
      return null;
    }

    return this.tokens.access_token;
  }

  public isTokenValid(): boolean {
    if (!this.tokens || !this.tokenExpiry) {
      return false;
    }
    // Add 60 second buffer for token expiry
    return Date.now() < (this.tokenExpiry - 60000);
  }

  private storeTokens(tokens: SpotifyTokens): void {
    try {
      localStorage.setItem('spotify_tokens', JSON.stringify({
        ...tokens,
        stored_at: Date.now(),
      }));
    } catch (error) {
      console.error('❌ Failed to store tokens:', error);
    }
  }

  private getStoredTokens(): SpotifyTokens | null {
    try {
      const stored = localStorage.getItem('spotify_tokens');
      if (!stored) {
        return null;
      }

      const data = JSON.parse(stored);
      const storedAt = data.stored_at || 0;
      const expiresIn = data.expires_in * 1000;
      this.tokenExpiry = storedAt + expiresIn;

      return data;
    } catch (error) {
      console.error('❌ Failed to retrieve stored tokens:', error);
      return null;
    }
  }

  public clearTokens(): void {
    try {
      localStorage.removeItem('spotify_tokens');
      this.tokens = null;
      this.tokenExpiry = 0;
      console.log('✅ Cleared Spotify tokens');
    } catch (error) {
      console.error('❌ Failed to clear tokens:', error);
    }
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  isAuthenticated(): boolean {
    return this.tokens !== null && this.isTokenValid();
  }

  logout(): void {
    this.clearTokens();
    window.location.reload();
  }

  async getUserProfile(): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }
} 