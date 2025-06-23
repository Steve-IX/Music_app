# 🔑 API Keys Setup Guide

Follow these exact steps to get your music APIs working!

## 📋 **Quick Setup Checklist**

- [ ] Get YouTube API key (recommended - working audio)
- [ ] Get Spotify API keys (metadata only)
- [ ] Get Jamendo API key  
- [ ] ~~Get SoundCloud API key~~ (API forms closed)
- [ ] Create `.env.local` file
- [ ] Test the APIs

---

## 🎯 **Step 1: YouTube Music API Setup** (Recommended)

### **What you'll get:**
- Working audio playback (opens in YouTube)
- Huge music catalog with music videos
- Popular and trending content
- High-quality thumbnails

### **Exact steps:**

1. **Open Google Cloud Console**
   ```
   URL: https://console.cloud.google.com/
   ```

2. **Create/Select Project**
   - Click on project dropdown at top
   - Click "New Project" or select existing
   - Give it a name like "MusicStream"
   - Click "Create"

3. **Enable YouTube Data API**
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click on it and click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
   - ⚠️ **Keep API key private!**

5. **Restrict API Key** (Optional but recommended)
   - Click on the API key you just created
   - Under "Application restrictions" select "HTTP referrers"
   - Add: `localhost:3000/*`
   - Under "API restrictions" select "Restrict key"
   - Select "YouTube Data API v3"
   - Click "Save"

---

## 🎵 **Step 2: Spotify API Setup** (Metadata only)

### **What you'll get:**
- Rich metadata (album art, popularity, etc.)
- Some 30-second previews (often unavailable)
- Huge music catalog

### **Exact steps:**

1. **Open Spotify Developer Dashboard**
   ```
   URL: https://developer.spotify.com/dashboard/
   ```

2. **Login/Signup**
   - Use any Spotify account (free is fine)
   - Complete email verification if needed

3. **Create New App**
   - Click green "Create App" button
   - Fill in exactly:
     ```
     App name: MusicStream
     App description: Music streaming web application
     Website: https://localhost:3000
     Redirect URIs: https://localhost:3000/callback
     ```
   - Check both agreement boxes
   - Click "Save"

4. **Copy Your Keys**
   - Click on your new app name
   - Copy the **Client ID** (visible immediately)
   - Click "Show Client Secret" and copy it
   - ⚠️ **Keep Client Secret private!**

---

## 🎧 **Step 3: Jamendo API Setup**

### **What you'll get:**
- Full track streaming (Creative Commons music)
- Independent artists and unique content
- No user account required for playback

### **Exact steps:**

1. **Go to Jamendo Developer**
   ```
   URL: https://developer.jamendo.com/
   ```

2. **Create Account**
   - Click "Sign up"
   - Use any email address
   - Verify email (check spam folder)

3. **Create Application**
   - Login to your dashboard
   - Click "My Applications"
   - Click "Create a new application"
   - Fill in:
     ```
     Application name: MusicStream
     Description: Web music streaming application
     Website: http://localhost:3000
     Application type: Web Application
     ```

4. **Get Client ID**
   - After creation, copy your **Client ID**
   - No secret needed for Jamendo

---

## 🎧 **Step 4: SoundCloud API** (Currently Unavailable)

### **Status:** ❌ **API Forms Closed**
- SoundCloud has closed their API application forms
- New developers cannot get API access
- This step is **skipped** in the current setup

### **What it would provide:**
- Indie music and podcasts
- Community-created content
- Some full track streaming

**Note:** The app will work perfectly with YouTube and Jamendo APIs.

---

## 📁 **Step 5: Create Environment File**

### **Create the file:**

1. **Navigate to your web app folder:**
   ```bash
   cd apps/web
   ```

2. **Create `.env.local` file:**
   ```bash
   # On Windows (PowerShell):
   New-Item -ItemType File -Name ".env.local"
   
   # On Mac/Linux:
   touch .env.local
   ```

3. **Add your API keys to `.env.local`:**
   ```env
   # YouTube Music API Key (recommended - working audio)
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
   
   # Spotify API Keys (metadata only)
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   
   # Jamendo API Key
   VITE_JAMENDO_CLIENT_ID=your_jamendo_client_id
   
   # SoundCloud API Key (disabled - API forms closed)
   # VITE_SOUNDCLOUD_CLIENT_ID=
   
   # Development URLs
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=ws://localhost:3006
   
   # Feature flags
   VITE_ENABLE_YOUTUBE=true
   VITE_ENABLE_SPOTIFY=true
   VITE_ENABLE_JAMENDO=true
   VITE_ENABLE_SOUNDCLOUD=false
   ```

---

## 🧪 **Step 6: Test Your Setup**

### **Restart your app:**
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### **Test each API:**

1. **Open your app:** http://localhost:3000
2. **Search for music:** Try searching for "jazz" or "rock"
3. **Look for source tags:** You should see "youtube", "spotify", and "jamendo" badges
4. **Try YouTube tracks:** Click the 📺 button to open in YouTube
5. **Try preview buttons:** Click the 🎧 button on Spotify/Jamendo tracks
6. **Check browser console:** Look for any API errors

---

## 🔧 **Troubleshooting**

### **No search results:**
```bash
# Check your .env.local file exists:
ls -la .env.local

# Check for typos in API keys
# Make sure no extra spaces or quotes
```

### **YouTube API errors:**
- Verify API key is correct
- Check if YouTube Data API v3 is enabled
- Ensure API key has proper restrictions
- Check quota usage in Google Cloud Console

### **CORS errors:**
- This is normal in development
- The app will still work with demo content
- Real deployment uses backend proxies

### **Spotify "Invalid client" error:**
- Double-check Client ID and Secret
- Make sure no extra characters/spaces
- Verify app is created correctly in Spotify Dashboard

### **Rate limiting:**
- YouTube: 10,000 requests/day
- Spotify: 100 requests/minute
- Jamendo: 10,000/month  
- Use search sparingly during testing

---

## 🎉 **Success Indicators**

You'll know it's working when:

✅ **Search shows real results** with source tags  
✅ **YouTube tracks** show 📺 button and open in YouTube  
✅ **Preview buttons work** (🎧 icon) for other sources  
✅ **No API errors** in browser console  
✅ **Mix of demo and real content** appears  
✅ **Toast notifications** show track sources  

---

## 💡 **Pro Tips**

1. **Start with YouTube** - Easiest to set up, gives working audio
2. **YouTube gives best audio** - Full music videos with working playback
3. **Spotify gives best metadata** - Album art, popularity scores
4. **Keep API keys secure** - Never commit `.env.local` to git
5. **Test incrementally** - Add one API at a time
6. **Check rate limits** - Don't spam searches during testing

---

## 🆘 **Need Help?**

If you get stuck:

1. **Check the main API guide:** `apps/web/API_SETUP.md`
2. **Verify file location:** `.env.local` should be in `apps/web/` folder
3. **Restart the server** after adding keys
4. **Check browser console** for specific error messages
5. **Try one API at a time** to isolate issues

---

## 🔄 **What Happens Next**

Once your APIs are working:

- **Search will return real music** from multiple sources
- **YouTube tracks** will open in YouTube for full playback
- **Preview buttons** will play 30-second clips from other sources
- **Rich metadata** displays for all tracks
- **Professional music app** experience! 🎵

The app gracefully falls back to demo content if APIs aren't configured, so you can always see the full UI in action. 