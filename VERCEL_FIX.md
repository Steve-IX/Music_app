# 🚨 URGENT FIX: API Routes Returning HTML

Your music app APIs are broken because environment variables are missing in Vercel. Here's the 5-minute fix:

## 🔧 **Quick Fix Steps**

### **Step 1: Go to Vercel Dashboard**
1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your `music-app-eta-vert` project

### **Step 2: Add Environment Variables**
1. Click **"Settings"** tab
2. Click **"Environment Variables"** in left sidebar
3. Add these 4 variables (click **"Add"** for each):

```
Name: SPOTIFY_CLIENT_ID
Value: [your Spotify client ID]
Environment: Production, Preview, Development
```

```
Name: SPOTIFY_CLIENT_SECRET  
Value: [your Spotify client secret]
Environment: Production, Preview, Development
```

```
Name: YOUTUBE_API_KEY
Value: [your YouTube API key]
Environment: Production, Preview, Development
```

```
Name: JAMENDO_CLIENT_ID
Value: [your Jamendo client ID]  
Environment: Production, Preview, Development
```

⚠️ **IMPORTANT**: Do NOT use `VITE_` prefix for these variables!

### **Step 3: Redeploy**
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait 1-2 minutes for deployment to complete

### **Step 4: Test**
1. Open your app: https://music-app-eta-vert.vercel.app
2. Check browser console - should see:
   ```
   ✅ Spotify trending: 15 tracks
   ✅ YouTube trending: 18 tracks  
   ✅ Jamendo trending: 12 tracks
   ```

## 🆘 **Don't Have API Keys?**

If you don't have the API keys yet:

1. **YouTube API Key** (5 minutes):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable YouTube Data API v3
   - Create API key

2. **Spotify API Keys** (3 minutes):
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Create app, copy Client ID and Secret

3. **Jamendo API Key** (2 minutes):
   - Go to [Jamendo Developer](https://developer.jamendo.com/)
   - Create account, get Client ID

## ✅ **Success Indicators**

You'll know it's fixed when:
- Browser console shows API success messages
- Search returns real music tracks
- No more "HTML instead of JSON" errors
- Tracks have source badges (spotify, youtube, jamendo)

---

**💡 The app works with demo content even without APIs, but real music APIs make it much better!** 