# 🎵 Music API Integration Guide

This guide helps you connect MusicStream to real music APIs for searching and playing actual music.

## 🚀 Quick Start

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Get API keys** (see sections below)

3. **Add keys to `.env.local`**:
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   VITE_JAMENDO_CLIENT_ID=your_jamendo_client_id
   # VITE_SOUNDCLOUD_CLIENT_ID= (disabled - API forms closed)
   ```

   **For Production/Vercel deployment, also add these environment variables in your Vercel dashboard:**
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret  
   JAMENDO_CLIENT_ID=your_jamendo_client_id
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. **Install dependencies and restart**:
   ```bash
   npm install
   npm run dev
   ```

## 🎯 Available Music APIs

### 1. **Spotify Web API** (Metadata only - limited previews)

**What you get:**
- ✅ Huge music catalog with detailed metadata
- ⚠️ 30-second previews for some tracks (often unavailable)
- ✅ Artist info, album art, popularity scores
- ✅ Excellent search functionality
- ❌ Full playback requires Spotify Premium account

**Setup:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app
3. Copy Client ID and Client Secret
4. Add to `.env.local`:
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

**Rate Limits:** 100 requests per minute

---

### 2. **YouTube Music API** (Recommended - Working audio)

**What you get:**
- ✅ Huge music catalog with working audio
- ✅ Full music videos with audio
- ✅ Popular and trending content
- ✅ High-quality thumbnails and metadata
- ✅ Opens in YouTube for full playback
- ⚠️ Requires YouTube API key

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to `.env.local`:
   ```env
   VITE_YOUTUBE_API_KEY=your_youtube_api_key
   ```

**Rate Limits:** 10,000 requests per day (free tier)

---

### 3. **Jamendo API** (Best for full streaming)

**What you get:**
- ✅ Creative Commons licensed music (free to stream!)
- ✅ Full track playback allowed
- ✅ Independent artists and unique content
- ✅ No user account required
- ⚠️ Smaller catalog than commercial services

**Setup:**
1. Go to [Jamendo Developer](https://developer.jamendo.com/)
2. Create account and get Client ID
3. Add to `.env.local`:
   ```env
   VITE_JAMENDO_CLIENT_ID=your_client_id
   ```

**Rate Limits:** 10,000 requests per month (free tier)

---

### 4. **SoundCloud API** (Currently Disabled)

**Status:** ❌ **API Forms Closed**
- SoundCloud has closed their API application forms
- New API access is not available
- Existing integrations may continue to work

**What it would provide:**
- Great for podcasts and indie music
- Some tracks available for full streaming
- Large community of creators
- Limited commercial music

**Note:** This integration is disabled in the current version due to API access restrictions.

---

## 🎵 How It Works

### Search Flow
1. User types search query
2. App searches **all configured APIs** simultaneously
3. Results are combined and sorted by relevance
4. Real API results are shown first, demo content as fallback

### Playback Flow
1. **Preview Mode**: For Spotify tracks (30s snippets)
2. **Full Streaming**: For Jamendo/SoundCloud tracks with stream URLs
3. **Demo Mode**: For demo content (no actual audio)

### Smart Features
- **Auto-fallback**: If one API fails, others still work
- **Caching**: Results are cached to reduce API calls
- **Error handling**: Graceful degradation when APIs are unavailable

## 🔧 Environment Variables

Create `.env.local` with these variables:

```env
# ============================================================================
# FOR LOCAL DEVELOPMENT (.env.local file)
# ============================================================================

# Spotify (for metadata and limited previews)
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# YouTube Music (for working audio - recommended)
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Jamendo (for Creative Commons music)
VITE_JAMENDO_CLIENT_ID=your_jamendo_client_id

# SoundCloud (for indie content - disabled)
# VITE_SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id

# ============================================================================
# FOR PRODUCTION/VERCEL (Set in Vercel Dashboard)
# ============================================================================

# Spotify API (without VITE_ prefix for server-side)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# YouTube API (without VITE_ prefix for server-side)
YOUTUBE_API_KEY=your_youtube_api_key

# Jamendo API (without VITE_ prefix for server-side)
JAMENDO_CLIENT_ID=your_jamendo_client_id

# ============================================================================
# OPTIONAL: Additional Features
# ============================================================================

# Analytics
# VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error tracking
# VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

## 🚨 Legal Considerations

### ✅ What's Legal:
- Using **Spotify previews** (30s snippets)
- Streaming **Jamendo Creative Commons** tracks
- Playing **SoundCloud tracks** with proper attribution
- Displaying **metadata** from any API

### ⚠️ What Requires Care:
- **Full Spotify playback** (requires Premium + proper SDK)
- **Commercial use** of any content
- **Downloading** tracks (check API terms)
- **High-volume usage** (watch rate limits)

### 📋 Best Practices:
1. **Respect rate limits** - implement proper caching
2. **Attribute sources** - show where music comes from
3. **Handle errors gracefully** - don't break when APIs fail
4. **Cache metadata** - reduce unnecessary API calls
5. **Read API terms** - each service has specific rules

## 🛠️ Development Mode

Without API keys, the app works with demo content:
- Search shows mock results
- Player simulates playback
- All UI features work for testing

## 🔄 API Integration Status

| API | Status | Search | Preview | Full Stream | Metadata |
|-----|--------|---------|---------|-------------|----------|
| YouTube Music | ✅ Ready | ✅ | ✅ | ✅ Full | ✅ Rich |
| Jamendo | ✅ Ready | ✅ | ✅ | ✅ Full | ✅ Good |
| Spotify | ⚠️ Limited | ✅ | ⚠️ Unreliable | ❌ Premium | ✅ Rich |
| SoundCloud | ❌ Disabled | - | - | - | - |
| Apple Music | 🚧 Planned | - | - | - | - |
| Last.fm | 🚧 Planned | - | - | - | ✅ Rich |

## 🆘 Troubleshooting

### "No search results"
- Check API keys in `.env.local`
- Verify keys are valid in respective developer consoles
- Check browser console for API errors

### "Preview not available"
- Some tracks don't have preview URLs
- Try different search terms
- Check if the API service is down

### "CORS errors"
- This is normal in development
- APIs are called from our backend services
- Use the backend proxy endpoints in production

### Rate limit errors
- Implement caching (already included)
- Reduce search frequency
- Upgrade to paid API tiers if needed

## 🎯 Production Deployment

For production, you'll need:
1. **Backend API** to proxy requests (avoid CORS)
2. **Caching layer** (Redis) for API responses
3. **Rate limiting** to prevent abuse
4. **Monitoring** for API health
5. **Fallback mechanisms** when APIs are down

## 📞 Support

- Check the [main README](../../README.md) for general setup
- Open issues on GitHub for bugs
- Read API documentation for service-specific issues
- Join our Discord for community support 