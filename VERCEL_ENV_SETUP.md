# 🚀 Vercel Environment Variables Setup

This guide explains how to set up the required environment variables in Vercel for the MusicStream application.

## 🔑 Required Environment Variables

For the MusicStream app to work properly in production, you need to set these environment variables in your Vercel dashboard:

### Production Environment Variables (Required)

Go to your Vercel project dashboard → Settings → Environment Variables and add:

```bash
# Spotify API (for metadata and premium playback)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# YouTube API (for music videos and streaming)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Jamendo API (for Creative Commons music)
JAMENDO_CLIENT_ID=your_jamendo_client_id_here
```

### Important Notes:

1. **Do NOT use `VITE_` prefix** for production environment variables in Vercel
2. **Set Environment to "Production"** for all variables
3. **The API routes need server-side access** to these variables

## 🎯 Getting API Keys

### 1. Spotify Web API
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app
3. Copy the **Client ID** and **Client Secret**
4. Add redirect URI: `https://your-vercel-domain.vercel.app/spotify-callback`

### 2. YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the API key

### 3. Jamendo API
1. Go to [Jamendo Developer](https://developer.jamendo.com/)
2. Create account and get Client ID
3. Copy the Client ID

## 🔧 Vercel Dashboard Setup

1. **Open your Vercel project dashboard**
2. **Go to Settings → Environment Variables**
3. **Add each variable:**
   - **Name**: `SPOTIFY_CLIENT_ID`
   - **Value**: Your actual Spotify client ID
   - **Environment**: Select "Production" 
   - Click "Save"

4. **Repeat for all variables**

## 🐛 Debugging Environment Variables

You can check if your environment variables are properly set by visiting:
```
https://your-app.vercel.app/api/debug
```

This will show you which variables are set without exposing the actual values.

## 🚨 Common Issues

### "API key not configured" errors
- ✅ Make sure variables are set in Vercel dashboard
- ✅ Use exact names (without VITE_ prefix)
- ✅ Set environment to "Production"
- ✅ Redeploy after adding variables

### "0 search results" from APIs
- ✅ Check API keys are valid in respective developer consoles
- ✅ Verify API quotas haven't been exceeded
- ✅ Check if external APIs are down

### Spotify authentication errors
- ✅ Add correct redirect URI in Spotify app settings
- ✅ Requires Spotify Premium for full playback
- ✅ Check browser console for detailed errors

## 🔄 Local Development

For local development, create `.env.local` in the `apps/web/` directory:

```bash
# Client-side variables (with VITE_ prefix for local development)
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_YOUTUBE_API_KEY=your_youtube_api_key
VITE_JAMENDO_CLIENT_ID=your_jamendo_client_id

# Server-side variables (without VITE_ prefix for API routes)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
YOUTUBE_API_KEY=your_youtube_api_key
JAMENDO_CLIENT_ID=your_jamendo_client_id
```

## ✅ Verification

After setting up environment variables:

1. **Deploy your app** (Vercel will automatically redeploy)
2. **Check the debug endpoint**: `https://your-app.vercel.app/api/debug`
3. **Test API endpoints**:
   - `https://your-app.vercel.app/api/jamendo?query=rock&limit=5`
   - `https://your-app.vercel.app/api/youtube?query=jazz&limit=5`
   - `https://your-app.vercel.app/api/spotify?query=pop&limit=5`

4. **Test the main app** - you should see real music results instead of demo content

## 🎉 Success!

Once properly configured, your MusicStream app will:
- ✅ Load real music from APIs
- ✅ Display actual search results  
- ✅ Play audio previews and streams
- ✅ Show rich metadata and artwork
- ✅ Support Spotify authentication (Premium accounts)

---

**Need help?** Check the browser console for detailed error messages and API responses. 