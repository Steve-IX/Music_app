# 🎵 Spotify Web Playback SDK Setup Guide

This guide helps you set up Spotify integration for in-site playback using the official Web Playback SDK.

## 🚀 Quick Setup

### 1. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Click "Create App"
3. Fill in the details:
   - **App name**: `MusicStream`
   - **App description**: `Music streaming web application`
   - **Website**: `http://localhost:3000`
   - **Redirect URIs**: `http://localhost:3000/spotify-callback`
4. Accept the terms and click "Save"

### 2. Get Your Credentials

1. Click on your new app in the dashboard
2. Copy the **Client ID** (visible immediately)
3. Click "Show Client Secret" and copy it
4. ⚠️ **Keep these secure!**

### 3. Create Environment File

Create `.env.local` in the `apps/web/` directory:

```env
# Spotify Web API & Web Playback SDK
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret_here

# Other APIs (optional)
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_JAMENDO_CLIENT_ID=your_jamendo_client_id_here
```

### 4. Restart Your App

```bash
npm run dev
```

## 🎯 How It Works

### Authentication Flow
1. User clicks "Connect Spotify" button
2. Redirected to Spotify OAuth
3. User authorizes the app
4. Redirected back with authorization code
5. App exchanges code for access tokens
6. Tokens stored securely in localStorage
7. Web Playback SDK initialized with tokens

### Playback Flow
1. **Spotify Preview URLs** (30s snippets) → Play via Howler.js
2. **Spotify Web URLs** (full tracks) → Attempt in-site via Web Playback SDK
3. **Fallback** → Open in Spotify app if in-site fails

### Requirements
- ✅ Spotify Premium account (required for Web Playback SDK)
- ✅ User authentication (one-time setup)
- ✅ Valid API credentials
- ✅ HTTPS in production (localhost works for development)

## 🔧 Technical Details

### Web Playback SDK Features
- **In-site playback** of full Spotify tracks
- **Real-time controls** (play, pause, seek, volume)
- **State synchronization** with Spotify app
- **Cross-device control** via Spotify Connect

### API Endpoints Used
- `https://api.spotify.com/v1/me/player/play` - Start playback
- `https://api.spotify.com/v1/me/player/pause` - Pause playback
- `https://api.spotify.com/v1/me/player/seek` - Seek to position
- `https://api.spotify.com/v1/me/player/volume` - Set volume

### Scopes Required
- `user-read-private` - Read user profile
- `user-read-playback-state` - Read playback state
- `user-modify-playback-state` - Control playback
- `user-read-currently-playing` - Get current track
- `streaming` - Enable Web Playback SDK
- `playlist-read-private` - Read private playlists
- `user-library-read` - Read user's library

## 🛠️ Troubleshooting

### "Spotify authentication required"
- User needs to click "Connect Spotify" button
- Check that Client ID and Secret are correct
- Verify redirect URI matches exactly

### "Spotify player not ready"
- User must have Spotify Premium account
- Check browser console for SDK loading errors
- Ensure user is authenticated

### "Failed to load Spotify track"
- Track might not be available in user's region
- User's Spotify account might have restrictions
- Check network connectivity

### CORS Errors
- Normal in development (SDK loads from CDN)
- Production should use HTTPS
- Check browser console for specific errors

### Token Refresh Issues
- Tokens automatically refresh when needed
- If refresh fails, user needs to re-authenticate
- Check that Client Secret is correct

## 🔒 Security Notes

### Token Storage
- Access tokens stored in localStorage
- Refresh tokens stored securely
- Tokens automatically expire and refresh
- No sensitive data in URL parameters

### OAuth Security
- State parameter prevents CSRF attacks
- Redirect URI validation prevents redirect attacks
- Tokens are scoped to minimum required permissions

### Production Considerations
- Use HTTPS in production
- Set up proper redirect URIs for your domain
- Monitor API usage and rate limits
- Implement proper error handling

## 📱 User Experience

### First Time Setup
1. User sees "Connect Spotify" button
2. Clicks to start authentication
3. Redirected to Spotify login
4. Authorizes MusicStream app
5. Returns to app, now connected
6. Can play Spotify tracks in-site

### Daily Usage
1. User searches for music
2. Spotify tracks show with play buttons
3. Clicking play attempts in-site playback
4. If successful, track plays in MusicStream
5. If not, opens in Spotify app
6. User can control playback from MusicStream

### Cross-Device Sync
- Playback state syncs with Spotify app
- Can control from phone, continue on web
- Queue and history sync across devices
- Volume and settings persist

## 🎉 Success Indicators

You'll know it's working when:

✅ **"Connect Spotify" button** shows "Connected"  
✅ **Spotify tracks** play directly in the site  
✅ **No authentication errors** in console  
✅ **Playback controls** work smoothly  
✅ **Cross-device sync** works with Spotify app  
✅ **User profile** loads correctly  

## 🆘 Common Issues

### "Premium required"
- Web Playback SDK requires Spotify Premium
- Free accounts can only use preview URLs
- Consider showing upgrade prompt

### "SDK not loaded"
- Check internet connection
- Verify script loads from CDN
- Check browser console for errors

### "Invalid redirect URI"
- Must match exactly in Spotify Dashboard
- Include protocol (http:// or https://)
- Include port number if using localhost

### "Rate limit exceeded"
- Spotify API has rate limits
- Implement caching to reduce calls
- Monitor usage in Spotify Dashboard

## 🔄 Next Steps

Once Spotify integration is working:

1. **Test with different tracks** - Some may not be available
2. **Test cross-device sync** - Use Spotify app on phone
3. **Monitor API usage** - Check Spotify Dashboard
4. **Add error handling** - Graceful fallbacks
5. **Optimize performance** - Cache responses
6. **Add analytics** - Track usage patterns

## 📞 Support

- [Spotify Web Playback SDK Documentation](https://developer.spotify.com/documentation/web-playback-sdk)
- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api)
- [Spotify Developer Community](https://community.spotify.com/t5/Spotify-for-Developers/bd-p/Spotify_Developer)

---

**Note**: The Web Playback SDK is the official way to play Spotify tracks within web applications. It provides the best user experience and complies with Spotify's terms of service. 