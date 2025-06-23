/**
 * End-to-End Test: Music Discovery and Playback Journey
 * 
 * This test simulates a complete user journey through the MusicStream application:
 * 1. User authentication and login
 * 2. Search for music (tracks, artists, albums)
 * 3. Play a track with queue management
 * 4. Add tracks to playlists
 * 5. Download tracks for offline playback
 * 6. Verify streaming analytics
 * 
 * @author CodeSmith-Maestro
 * @created 2024
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:80/api';

// Test data
const testUser = {
  email: 'test.user@musicstream.com',
  password: 'TestPassword123!',
  displayName: 'Test Music Lover'
};

const testTrack = {
  title: 'Bohemian Rhapsody',
  artist: 'Queen',
  album: 'A Night at the Opera'
};

const testPlaylist = {
  name: 'My E2E Test Playlist',
  description: 'Created during automated testing'
};

// Page Object Models
class AuthPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/login`);
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for successful login and redirect
    await this.page.waitForURL(`${BASE_URL}/dashboard`);
  }

  async register(email: string, password: string, displayName: string) {
    await this.page.goto(`${BASE_URL}/register`);
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.fill('input[name="confirmPassword"]', password);
    await this.page.fill('input[name="displayName"]', displayName);
    await this.page.check('input[name="termsAccepted"]');
    await this.page.click('button[type="submit"]');
    
    // Wait for successful registration
    await this.page.waitForSelector('[data-testid="welcome-message"]');
  }
}

class SearchPage {
  constructor(private page: Page) {}

  async searchFor(query: string) {
    await this.page.fill('input[data-testid="search-input"]', query);
    await this.page.press('input[data-testid="search-input"]', 'Enter');
    
    // Wait for search results to load
    await this.page.waitForSelector('[data-testid="search-results"]');
    await this.page.waitForLoadState('networkidle');
  }

  async selectTrack(trackTitle: string) {
    const trackSelector = `[data-testid="track-item"][data-track-title="${trackTitle}"]`;
    await this.page.click(trackSelector);
  }

  async getSearchResults() {
    await this.page.waitForSelector('[data-testid="search-results"]');
    
    const tracks = await this.page.$$eval(
      '[data-testid="track-item"]',
      elements => elements.map(el => ({
        title: el.getAttribute('data-track-title'),
        artist: el.getAttribute('data-track-artist'),
        duration: el.getAttribute('data-track-duration')
      }))
    );

    return tracks;
  }

  async filterByGenre(genre: string) {
    await this.page.click(`[data-testid="genre-filter-${genre}"]`);
    await this.page.waitForLoadState('networkidle');
  }
}

class PlayerPage {
  constructor(private page: Page) {}

  async playTrack() {
    await this.page.click('[data-testid="play-button"]');
    await this.page.waitForSelector('[data-testid="player-playing"]');
  }

  async pauseTrack() {
    await this.page.click('[data-testid="pause-button"]');
    await this.page.waitForSelector('[data-testid="player-paused"]');
  }

  async skipToNext() {
    await this.page.click('[data-testid="next-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  async skipToPrevious() {
    await this.page.click('[data-testid="previous-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  async setVolume(volume: number) {
    const slider = this.page.locator('[data-testid="volume-slider"]');
    await slider.fill(volume.toString());
  }

  async addToQueue() {
    await this.page.click('[data-testid="add-to-queue-button"]');
    await this.page.waitForSelector('[data-testid="queue-updated-toast"]');
  }

  async getCurrentTrack() {
    return {
      title: await this.page.textContent('[data-testid="current-track-title"]'),
      artist: await this.page.textContent('[data-testid="current-track-artist"]'),
      position: await this.page.getAttribute('[data-testid="progress-slider"]', 'value'),
      duration: await this.page.textContent('[data-testid="track-duration"]')
    };
  }

  async isPlaying() {
    return await this.page.isVisible('[data-testid="player-playing"]');
  }

  async toggleShuffle() {
    await this.page.click('[data-testid="shuffle-button"]');
  }

  async toggleRepeat() {
    await this.page.click('[data-testid="repeat-button"]');
  }
}

class PlaylistPage {
  constructor(private page: Page) {}

  async createPlaylist(name: string, description: string) {
    await this.page.click('[data-testid="create-playlist-button"]');
    await this.page.fill('input[name="playlistName"]', name);
    await this.page.fill('textarea[name="playlistDescription"]', description);
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForSelector(`[data-testid="playlist-${name}"]`);
  }

  async addTrackToPlaylist(trackId: string, playlistName: string) {
    await this.page.click(`[data-testid="track-${trackId}"] [data-testid="add-to-playlist"]`);
    await this.page.click(`[data-testid="playlist-option-${playlistName}"]`);
    await this.page.waitForSelector('[data-testid="track-added-toast"]');
  }

  async openPlaylist(playlistName: string) {
    await this.page.click(`[data-testid="playlist-${playlistName}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  async getPlaylistTracks() {
    await this.page.waitForSelector('[data-testid="playlist-tracks"]');
    
    return await this.page.$$eval(
      '[data-testid="playlist-track-item"]',
      elements => elements.map(el => ({
        title: el.getAttribute('data-track-title'),
        artist: el.getAttribute('data-track-artist'),
        addedAt: el.getAttribute('data-added-at')
      }))
    );
  }
}

class OfflinePage {
  constructor(private page: Page) {}

  async downloadTrack(trackId: string) {
    await this.page.click(`[data-testid="track-${trackId}"] [data-testid="download-button"]`);
    await this.page.waitForSelector('[data-testid="download-started-toast"]');
  }

  async getDownloadStatus(trackId: string) {
    const statusElement = this.page.locator(`[data-testid="download-status-${trackId}"]`);
    return await statusElement.getAttribute('data-status');
  }

  async waitForDownloadComplete(trackId: string, timeout: number = 30000) {
    await this.page.waitForFunction(
      (id) => {
        const element = document.querySelector(`[data-testid="download-status-${id}"]`);
        return element?.getAttribute('data-status') === 'completed';
      },
      trackId,
      { timeout }
    );
  }

  async getOfflineTracks() {
    await this.page.goto(`${BASE_URL}/offline`);
    await this.page.waitForSelector('[data-testid="offline-tracks"]');
    
    return await this.page.$$eval(
      '[data-testid="offline-track-item"]',
      elements => elements.map(el => ({
        title: el.getAttribute('data-track-title'),
        artist: el.getAttribute('data-track-artist'),
        size: el.getAttribute('data-file-size'),
        downloadedAt: el.getAttribute('data-downloaded-at')
      }))
    );
  }
}

// Test Suite
test.describe('Music Discovery and Playback Journey', () => {
  let context: BrowserContext;
  let page: Page;
  let authPage: AuthPage;
  let searchPage: SearchPage;
  let playerPage: PlayerPage;
  let playlistPage: PlaylistPage;
  let offlinePage: OfflinePage;

  test.beforeAll(async ({ browser }) => {
    // Create a persistent context to maintain session across tests
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      permissions: ['microphone'], // For voice search if implemented
      geolocation: { latitude: 40.7128, longitude: -74.0060 } // New York for location-based features
    });
    
    page = await context.newPage();
    
    // Initialize page objects
    authPage = new AuthPage(page);
    searchPage = new SearchPage(page);
    playerPage = new PlayerPage(page);
    playlistPage = new PlaylistPage(page);
    offlinePage = new OfflinePage(page);

    // Set up API request/response interceptors for testing
    await page.route('**/api/analytics/**', async route => {
      // Mock analytics endpoint to avoid external dependencies
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('User Authentication Flow', async () => {
    // Navigate to login page
    await authPage.goto();
    
    // Verify login page loads correctly
    await expect(page).toHaveTitle(/MusicStream - Login/);
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Attempt login with test credentials
    await authPage.login(testUser.email, testUser.password);
    
    // Verify successful login
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(testUser.displayName);
  });

  test('Music Search and Discovery', async () => {
    // Navigate to search page
    await page.goto(`${BASE_URL}/search`);
    
    // Test search functionality
    await searchPage.searchFor(testTrack.title);
    
    // Verify search results
    const searchResults = await searchPage.getSearchResults();
    expect(searchResults.length).toBeGreaterThan(0);
    
    // Find the specific track we're looking for
    const targetTrack = searchResults.find(track => 
      track.title?.includes(testTrack.title) && 
      track.artist?.includes(testTrack.artist)
    );
    expect(targetTrack).toBeDefined();

    // Test genre filtering
    await searchPage.filterByGenre('Rock');
    await page.waitForTimeout(1000); // Allow filter to apply
    
    const filteredResults = await searchPage.getSearchResults();
    expect(filteredResults.length).toBeGreaterThan(0);

    // Test search suggestions
    await page.fill('input[data-testid="search-input"]', 'Queen');
    await page.waitForSelector('[data-testid="search-suggestions"]');
    const suggestions = await page.$$eval(
      '[data-testid="suggestion-item"]',
      elements => elements.map(el => el.textContent)
    );
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test('Music Playback and Queue Management', async () => {
    // Search for and select a track
    await searchPage.searchFor(testTrack.title);
    await searchPage.selectTrack(testTrack.title);
    
    // Verify track details page loads
    await expect(page.locator('[data-testid="track-details"]')).toBeVisible();
    
    // Start playback
    await playerPage.playTrack();
    
    // Verify playback started
    await expect(page.locator('[data-testid="player-playing"]')).toBeVisible();
    const isPlaying = await playerPage.isPlaying();
    expect(isPlaying).toBe(true);

    // Test playback controls
    await playerPage.setVolume(75);
    await page.waitForTimeout(500);
    
    // Test pause/resume
    await playerPage.pauseTrack();
    await expect(page.locator('[data-testid="player-paused"]')).toBeVisible();
    
    await playerPage.playTrack();
    await expect(page.locator('[data-testid="player-playing"]')).toBeVisible();

    // Add track to queue
    await playerPage.addToQueue();
    await expect(page.locator('[data-testid="queue-updated-toast"]')).toBeVisible();

    // Test shuffle and repeat
    await playerPage.toggleShuffle();
    await expect(page.locator('[data-testid="shuffle-active"]')).toBeVisible();
    
    await playerPage.toggleRepeat();
    await expect(page.locator('[data-testid="repeat-active"]')).toBeVisible();

    // Verify current track information
    const currentTrack = await playerPage.getCurrentTrack();
    expect(currentTrack.title).toBeTruthy();
    expect(currentTrack.artist).toBeTruthy();
  });

  test('Playlist Management', async () => {
    // Navigate to playlists page
    await page.goto(`${BASE_URL}/playlists`);
    
    // Create a new playlist
    await playlistPage.createPlaylist(testPlaylist.name, testPlaylist.description);
    
    // Verify playlist was created
    await expect(page.locator(`[data-testid="playlist-${testPlaylist.name}"]`)).toBeVisible();

    // Search for a track to add to playlist
    await page.goto(`${BASE_URL}/search`);
    await searchPage.searchFor(testTrack.title);
    
    // Get the first track ID from search results
    const firstTrackId = await page.getAttribute('[data-testid="track-item"]:first-child', 'data-track-id');
    expect(firstTrackId).toBeTruthy();

    // Add track to playlist
    await playlistPage.addTrackToPlaylist(firstTrackId!, testPlaylist.name);
    
    // Verify track was added
    await expect(page.locator('[data-testid="track-added-toast"]')).toBeVisible();

    // Open playlist and verify contents
    await page.goto(`${BASE_URL}/playlists`);
    await playlistPage.openPlaylist(testPlaylist.name);
    
    const playlistTracks = await playlistPage.getPlaylistTracks();
    expect(playlistTracks.length).toBeGreaterThan(0);
    expect(playlistTracks[0].title).toBeTruthy();
  });

  test('Offline Download Functionality', async () => {
    // Search for a track to download
    await page.goto(`${BASE_URL}/search`);
    await searchPage.searchFor(testTrack.title);
    
    // Get the first track ID
    const trackId = await page.getAttribute('[data-testid="track-item"]:first-child', 'data-track-id');
    expect(trackId).toBeTruthy();

    // Initiate download
    await offlinePage.downloadTrack(trackId!);
    
    // Verify download started
    await expect(page.locator('[data-testid="download-started-toast"]')).toBeVisible();

    // Check download status
    const initialStatus = await offlinePage.getDownloadStatus(trackId!);
    expect(['pending', 'downloading'].includes(initialStatus!)).toBe(true);

    // Wait for download to complete (with timeout)
    await offlinePage.waitForDownloadComplete(trackId!, 30000);
    
    // Verify download completed
    const finalStatus = await offlinePage.getDownloadStatus(trackId!);
    expect(finalStatus).toBe('completed');

    // Navigate to offline tracks and verify
    const offlineTracks = await offlinePage.getOfflineTracks();
    expect(offlineTracks.length).toBeGreaterThan(0);
    
    const downloadedTrack = offlineTracks.find(track => track.title?.includes(testTrack.title));
    expect(downloadedTrack).toBeDefined();
    expect(downloadedTrack!.size).toBeTruthy();
  });

  test('Real-time Features and WebSocket Connection', async () => {
    // Test WebSocket connection for real-time updates
    let websocketConnected = false;
    
    page.on('websocket', ws => {
      websocketConnected = true;
      
      ws.on('framereceived', event => {
        const data = JSON.parse(event.payload as string);
        console.log('WebSocket message received:', data);
      });
    });

    // Navigate to a page that uses WebSocket (like social feed)
    await page.goto(`${BASE_URL}/social`);
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for WebSocket to connect
    await page.waitForTimeout(2000);
    expect(websocketConnected).toBe(true);

    // Test real-time notifications
    await expect(page.locator('[data-testid="notification-center"]')).toBeVisible();
  });

  test('Accessibility and Performance', async () => {
    // Test keyboard navigation
    await page.goto(`${BASE_URL}/search`);
    
    // Test tab navigation through search interface
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify keyboard accessibility
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBeTruthy();

    // Test screen reader attributes
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toHaveAttribute('aria-label');
    await expect(searchInput).toHaveAttribute('role');

    // Test color contrast and visual accessibility
    const playButton = page.locator('[data-testid="play-button"]');
    await expect(playButton).toHaveCSS('cursor', 'pointer');
    
    // Basic performance check - measure page load time
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('Error Handling and Edge Cases', async () => {
    // Test network failure scenarios
    await page.route('**/api/tracks/**', route => route.abort());
    
    await page.goto(`${BASE_URL}/search`);
    await searchPage.searchFor('test query');
    
    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Test retry functionality
    await page.unroute('**/api/tracks/**');
    await page.click('[data-testid="retry-button"]');
    await page.waitForLoadState('networkidle');

    // Test invalid search queries
    await searchPage.searchFor('🎵🎶🎵🎶'); // Special characters
    await page.waitForLoadState('networkidle');
    
    // Should handle gracefully without crashing
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

    // Test extremely long search query
    const longQuery = 'a'.repeat(1000);
    await searchPage.searchFor(longQuery);
    await page.waitForLoadState('networkidle');
    
    // Should handle without error
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue(longQuery.substring(0, 500)); // Assuming input limit
  });

  test('Analytics and Tracking', async () => {
    let analyticsEvents: any[] = [];
    
    // Intercept analytics calls
    await page.route('**/api/analytics/playback', async route => {
      const request = route.request();
      const postData = request.postData();
      if (postData) {
        analyticsEvents.push(JSON.parse(postData));
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Perform actions that should generate analytics
    await page.goto(`${BASE_URL}/search`);
    await searchPage.searchFor(testTrack.title);
    await searchPage.selectTrack(testTrack.title);
    await playerPage.playTrack();
    
    // Wait for analytics to be sent
    await page.waitForTimeout(2000);

    // Verify analytics events were captured
    expect(analyticsEvents.length).toBeGreaterThan(0);
    
    const playEvent = analyticsEvents.find(event => event.event_type === 'play');
    expect(playEvent).toBeDefined();
    expect(playEvent.track_id).toBeTruthy();
    expect(playEvent.timestamp).toBeTruthy();
  });
});