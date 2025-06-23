# 🚀 Quick Setup Guide - Get Music Loading!

Your Spotify Web Playback SDK is ready, but you need API keys to load actual music tracks.

## 🎯 Current Status
- ✅ Spotify Web Playback SDK is working
- ✅ App is deployed and running
- ❌ No music tracks loading (0 tracks)
- ❌ Missing API keys

## 🔑 Quick Fix - Add API Keys

### Option 1: Just Demo Content (5 seconds)
The app will now show **realistic demo tracks** with popular songs like:
- Blinding Lights (The Weeknd) - Spotify-style preview
- Bohemian Rhapsody (Queen) - YouTube link
- Shape of You (Ed Sheeran) - Spotify-style preview
- Despacito (Luis Fonsi) - YouTube link

**No setup needed** - just refresh your app!

### Option 2: Real Music APIs (10 minutes)

1. **Create `.env.local` file** in `apps/web/` folder:
   ```env
   # Add at least ONE of these APIs:
   
   # YouTube Music (Easiest - working audio)
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
   
   # Spotify (Rich metadata + some previews)
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   
   # Jamendo (Free Creative Commons music)
   VITE_JAMENDO_CLIENT_ID=your_jamendo_client_id_here
   ```

2. **Get API Keys:**
   - **YouTube**: [Google Cloud Console](https://console.cloud.google.com/) → Enable YouTube Data API v3
   - **Spotify**: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) → Create App
   - **Jamendo**: [Jamendo Developer](https://developer.jamendo.com/) → Create Application

3. **For Production** (Vercel), add these in your Vercel Dashboard **without** `VITE_` prefix:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   JAMENDO_CLIENT_ID=your_jamendo_client_id_here
   ```

## 🎵 What You'll Get

### With Demo Content (Current)
- 10 realistic demo tracks
- Mix of Spotify, YouTube, and Jamendo style tracks
- Full UI functionality
- Spotify Web Playback SDK working for compatible tracks

### With Real APIs
- **YouTube**: Thousands of music videos with working audio
- **Spotify**: Rich metadata, album art, some 30s previews
- **Jamendo**: Full Creative Commons tracks you can stream
- **Search**: Real-time search across all configured APIs

## 🔍 Check Console Logs

Open browser console (F12) and look for:
```
🔑 API Keys Status: { spotify: ❌, youtube: ❌, jamendo: ❌ }
⚠️ No API keys configured, using demo content
🔥 Total trending tracks: 10
```

This tells you exactly what's happening!

## 🎯 Next Steps

1. **Try the demo content** - should work immediately
2. **Add YouTube API key** for working music videos
3. **Add Spotify keys** for rich metadata and Web Playback SDK integration
4. **Test search functionality** with real APIs

## 📞 Need Help?

- Check `apps/web/API_SETUP.md` for detailed setup
- Check `apps/web/SPOTIFY_SETUP.md` for Spotify integration
- Look at browser console for specific error messages

Your Spotify Web Playback SDK is ready - now you just need content to play! 🎵 