import React, { useState, useMemo, useEffect } from 'react';
import { useMusic } from '../context/MusicContext';
import { Track as ApiTrack } from '../services/musicApi';

interface MainContentProps {
  searchQuery?: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface SectionState {
  featuredAlbums: boolean;
  popularTracks: boolean;
  curatedPlaylists: boolean;
  trendingTracks: boolean;
}

// Professional SVG Icons for Music Cards
const CardIcons = {
  play: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  ),
  pause: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  ),
  like: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  liked: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  preview: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  ),
  youtube: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  add: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
  demo: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  )
};

const MainContent: React.FC<MainContentProps> = ({ searchQuery = '' }) => {
  const { dispatch, state, addToQueue, searchMusic, playApiTrack, playPreview } = useMusic();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedSections, setExpandedSections] = useState<SectionState>({
    featuredAlbums: false,
    popularTracks: false,
    curatedPlaylists: false,
    trendingTracks: false,
  });

  // Enhanced demo data with more realistic content
  const demoContent = useMemo(() => [
    // Featured Albums
    { id: '1', title: 'Midnight Dreams', artist: 'Luna Eclipse', type: 'Album', genre: 'Ambient', year: 2024, duration: 3840, plays: 1200000 },
    { id: '2', title: 'Electric Nights', artist: 'Neon Pulse', type: 'Album', genre: 'Synthwave', year: 2023, duration: 2880, plays: 850000 },
    { id: '3', title: 'Ocean Waves', artist: 'Coastal Winds', type: 'Album', genre: 'New Age', year: 2024, duration: 4200, plays: 650000 },
    { id: '4', title: 'City Lights', artist: 'Urban Symphony', type: 'Album', genre: 'Lo-fi Hip Hop', year: 2023, duration: 2640, plays: 2100000 },
    { id: '5', title: 'Forest Tales', artist: 'Nature Sounds', type: 'Album', genre: 'Ambient', year: 2024, duration: 3600, plays: 420000 },
    { id: '6', title: 'Jazz Fusion', artist: 'The Modern Quartet', type: 'Album', genre: 'Jazz', year: 2023, duration: 3120, plays: 780000 },
    { id: '21', title: 'Synthwave Legends', artist: 'Retro Masters', type: 'Album', genre: 'Synthwave', year: 2024, duration: 3240, plays: 920000 },
    { id: '22', title: 'Acoustic Sessions', artist: 'Folk Collective', type: 'Album', genre: 'Folk', year: 2023, duration: 2760, plays: 680000 },
    
    // Popular Tracks
    { id: '7', title: 'Golden Hour', artist: 'Sunset Collective', type: 'Track', genre: 'Indie Pop', year: 2024, duration: 245, plays: 5600000 },
    { id: '8', title: 'Dance Revolution', artist: 'Beat Masters', type: 'Track', genre: 'Electronic', year: 2024, duration: 198, plays: 3200000 },
    { id: '9', title: 'Peaceful Mind', artist: 'Meditation Zone', type: 'Track', genre: 'Ambient', year: 2023, duration: 420, plays: 1800000 },
    { id: '10', title: 'Rock Anthem', artist: 'Thunder Strike', type: 'Track', genre: 'Rock', year: 2024, duration: 312, plays: 2400000 },
    { id: '15', title: 'Neon Dreams', artist: 'Cyber Punk', type: 'Track', genre: 'Synthwave', year: 2024, duration: 276, plays: 1900000 },
    { id: '16', title: 'Coffee Shop Vibes', artist: 'Acoustic Soul', type: 'Track', genre: 'Indie Folk', year: 2023, duration: 203, plays: 4100000 },
    { id: '17', title: 'Digital Love', artist: 'Retro Future', type: 'Track', genre: 'Electronic', year: 2024, duration: 234, plays: 2800000 },
    { id: '18', title: 'Midnight Rain', artist: 'Chill Beats', type: 'Track', genre: 'Lo-fi Hip Hop', year: 2023, duration: 187, plays: 3500000 },
    { id: '23', title: 'Summer Breeze', artist: 'Coastal Winds', type: 'Track', genre: 'Chill', year: 2024, duration: 223, plays: 2100000 },
    { id: '24', title: 'Urban Nights', artist: 'City Sounds', type: 'Track', genre: 'Hip Hop', year: 2023, duration: 195, plays: 2900000 },
    
    // Curated Playlists
    { id: '11', title: 'Today\'s Top Hits', artist: 'MusicStream', type: 'Playlist', genre: 'Pop', tracks: 50, duration: 10800, plays: 15000000 },
    { id: '12', title: 'Chill Indie', artist: 'MusicStream', type: 'Playlist', genre: 'Indie', tracks: 35, duration: 8400, plays: 8200000 },
    { id: '13', title: 'Workout Beats', artist: 'MusicStream', type: 'Playlist', genre: 'Electronic', tracks: 42, duration: 9600, plays: 6800000 },
    { id: '14', title: 'Focus Flow', artist: 'MusicStream', type: 'Playlist', genre: 'Ambient', tracks: 28, duration: 11200, plays: 4500000 },
    { id: '19', title: 'Late Night Jazz', artist: 'MusicStream', type: 'Playlist', genre: 'Jazz', tracks: 32, duration: 9800, plays: 3200000 },
    { id: '20', title: 'Road Trip Classics', artist: 'MusicStream', type: 'Playlist', genre: 'Rock', tracks: 48, duration: 12600, plays: 5900000 },
    { id: '25', title: 'Discover Weekly', artist: 'MusicStream', type: 'Playlist', genre: 'Mixed', tracks: 30, duration: 7200, plays: 12000000 },
    { id: '26', title: 'Throwback Thursday', artist: 'MusicStream', type: 'Playlist', genre: 'Classics', tracks: 40, duration: 9600, plays: 8500000 },
  ], []);

  // Search real music APIs when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchMusic(searchQuery);
    }
  }, [searchQuery, searchMusic]);

  // Combine API results with demo content for search
  const allContent = useMemo(() => {
    if (searchQuery && state.searchResults.length > 0) {
      // When searching, prioritize API results but also include relevant demo content
      const apiResults = state.searchResults.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        type: 'Track' as const,
        genre: track.genres?.[0] || 'Unknown',
        year: new Date(track.releaseDate || '2024').getFullYear(),
        duration: track.duration,
        plays: track.popularity ? track.popularity * 10000 : 0,
        source: track.source,
        apiTrack: track, // Store the original API track
      }));

      // Filter demo content that matches the search
      const query = searchQuery.toLowerCase();
      const relevantDemo = demoContent.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.artist.toLowerCase().includes(query) ||
        item.genre.toLowerCase().includes(query)
      );

      return [...apiResults, ...relevantDemo];
    }
    
    return demoContent;
  }, [searchQuery, state.searchResults, demoContent]);

  // Smart search functionality
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return allContent;
    
    const query = searchQuery.toLowerCase();
    return allContent.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.artist.toLowerCase().includes(query) ||
      item.genre.toLowerCase().includes(query)
    );
  }, [allContent, searchQuery]);

  // Categorize content with proper limits
  const categorizedContent = useMemo(() => {
    const albums = filteredContent.filter(item => item.type === 'Album');
    const tracks = filteredContent.filter(item => item.type === 'Track');
    const playlists = filteredContent.filter(item => item.type === 'Playlist');
    
    return {
      featuredAlbums: {
        items: albums,
        visible: expandedSections.featuredAlbums ? albums : albums.slice(0, 6),
        hasMore: albums.length > 6
      },
      popularTracks: {
        items: tracks,
        visible: expandedSections.popularTracks ? tracks : tracks.slice(0, 8),
        hasMore: tracks.length > 8
      },
      curatedPlaylists: {
        items: playlists,
        visible: expandedSections.curatedPlaylists ? playlists : playlists.slice(0, 6),
        hasMore: playlists.length > 6
      },
      // Add trending from API
      trendingTracks: {
        items: state.trending,
        visible: expandedSections.trendingTracks ? state.trending : state.trending.slice(0, 6),
        hasMore: state.trending.length > 6
      },
    };
  }, [filteredContent, state.trending, expandedSections]);

  // Handle section expansion
  const toggleSection = (section: keyof SectionState) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toast notification system
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatPlays = (plays: number): string => {
    if (plays >= 1000000) {
      return `${(plays / 1000000).toFixed(1)}M plays`;
    }
    if (plays >= 1000) {
      return `${(plays / 1000).toFixed(0)}K plays`;
    }
    return `${plays} plays`;
  };

  const handlePlayTrack = (item: any) => {
    if (item.apiTrack) {
      // This is an API track
      playApiTrack(item.apiTrack);
      
      // Show different messages based on audio availability and source
      if (item.apiTrack.source === 'youtube') {
        showToast(`🎵 YouTube: "${item.title}" by ${item.artist} - Playing directly in site`, 'info');
      } else if (item.apiTrack.source === 'spotify') {
        if (item.apiTrack.previewUrl) {
          showToast(`🎵 Spotify: "${item.title}" by ${item.artist} - Playing 30s preview`, 'info');
        } else if (item.apiTrack.url && item.apiTrack.url.includes('open.spotify.com')) {
          showToast(`🎵 Spotify: "${item.title}" by ${item.artist} - Opening in Spotify app`, 'info');
        } else {
          showToast(`🎵 Spotify: "${item.title}" by ${item.artist} - No audio available`, 'error');
        }
      } else if (item.apiTrack.source === 'jamendo') {
        showToast(`🎵 Jamendo: "${item.title}" by ${item.artist} - Playing full track`, 'info');
      } else {
        showToast(`🎵 ${item.apiTrack.source}: "${item.title}" by ${item.artist}`, 'info');
      }
    } else {
      // This is a demo track
    const track = {
      id: item.id,
      title: item.title,
      artist: item.artist,
        album: item.type === 'Album' ? item.title : item.album || 'Single',
        duration: item.type === 'Track' ? item.duration : 240,
      url: '',
        coverUrl: `https://picsum.photos/400/400?random=${item.id}`,
        source: 'demo' as const,
    };
    dispatch({ type: 'PLAY_TRACK', payload: track });
      showToast(`🎵 Demo: "${item.title}" by ${item.artist} - Simulation mode`, 'info');
    }
  };

  const handlePlayPreview = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (item.apiTrack?.source === 'youtube') {
      // For YouTube tracks, show info about in-site playback
      showToast(`🎵 YouTube track - click play button to listen directly in site`, 'info');
    } else if (item.apiTrack?.source === 'spotify') {
      if (item.apiTrack.previewUrl) {
        try {
          await playPreview(item.apiTrack);
          showToast(`Playing Spotify preview of "${item.title}"`, 'info');
        } catch (error) {
          showToast('Spotify preview not available', 'error');
        }
      } else if (item.apiTrack.url && item.apiTrack.url.includes('open.spotify.com')) {
        // Open in Spotify app/browser
        window.open(item.apiTrack.url, '_blank');
        showToast(`Opening "${item.title}" in Spotify app`, 'info');
      } else {
        showToast('No preview available for this Spotify track', 'info');
      }
    } else if (item.apiTrack?.previewUrl) {
      try {
        await playPreview(item.apiTrack);
        showToast(`Playing preview of "${item.title}"`, 'info');
      } catch (error) {
        showToast('Preview not available', 'error');
      }
    } else {
      showToast('Preview not available for this track', 'info');
    }
  };

  const handleLike = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = allContent.find(content => content.id === itemId);
    const isLiked = likedItems.has(itemId);
    
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });

    if (item) {
      showToast(
        isLiked 
          ? `Removed "${item.title}" from your liked ${item.type.toLowerCase()}s`
          : `Added "${item.title}" to your liked ${item.type.toLowerCase()}s`,
        'success'
      );
    }
  };

  const handleAddToQueue = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (item.apiTrack) {
      // Convert API track to internal format
      const track = {
        id: item.apiTrack.id,
        title: item.apiTrack.title,
        artist: item.apiTrack.artist,
        album: item.apiTrack.album,
        duration: item.apiTrack.duration,
        url: item.apiTrack.url,
        previewUrl: item.apiTrack.previewUrl,
        coverUrl: item.apiTrack.coverUrl,
        source: item.apiTrack.source,
      };
      
      // Check if already in queue
      const isInQueue = state.queue.some(queueTrack => queueTrack.id === track.id);
      
      if (isInQueue) {
        showToast(`"${item.title}" is already in your queue`, 'info');
      } else {
        addToQueue(track);
        showToast(`Added "${item.title}" to queue`, 'success');
      }
    } else {
      // Demo track
      const track = {
        id: item.id,
        title: item.title,
        artist: item.artist,
        album: item.type === 'Album' ? item.title : item.album || 'Single',
        duration: item.type === 'Track' ? item.duration : 240,
        url: '',
        coverUrl: `https://picsum.photos/400/400?random=${item.id}`,
      };
      
      const isInQueue = state.queue.some(queueTrack => queueTrack.id === track.id);
      
      if (isInQueue) {
        showToast(`"${item.title}" is already in your queue`, 'info');
      } else {
        addToQueue(track);
        showToast(`Added "${item.title}" to queue`, 'success');
      }
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  const MusicCard: React.FC<{ item: any; showStats?: boolean }> = ({ item, showStats = false }) => {
    const isCurrentTrack = state.currentTrack?.id === item.id;
    const isLiked = likedItems.has(item.id);
    const isApiTrack = !!item.apiTrack;
    const isDemoTrack = !isApiTrack;
    const isYouTubeTrack = item.apiTrack?.source === 'youtube';
    const isSpotifyTrack = item.apiTrack?.source === 'spotify';
    const isJamendoTrack = item.apiTrack?.source === 'jamendo';
    
    // Determine audio availability with better logic
    const hasSpotifyPreview = isSpotifyTrack && item.apiTrack.previewUrl;
    const hasSpotifyWebUrl = isSpotifyTrack && item.apiTrack.url && item.apiTrack.url.includes('open.spotify.com');
    const hasSpotifyAudio = hasSpotifyPreview || hasSpotifyWebUrl;
    const hasJamendoAudio = isJamendoTrack && item.apiTrack.url;
    const hasYouTubeAudio = isYouTubeTrack;
    const hasAnyAudio = hasSpotifyAudio || hasJamendoAudio || hasYouTubeAudio;
    
    // Get audio type for better user feedback
    const getAudioType = () => {
      if (isYouTubeTrack) return 'YouTube';
      if (isSpotifyTrack) {
        if (hasSpotifyPreview) return 'Preview';
        if (hasSpotifyWebUrl) return 'External';
        return 'Demo';
      }
      if (isJamendoTrack) {
        if (hasJamendoAudio) return 'Full';
        return 'Demo';
      }
      return 'Demo';
    };
    
    const audioType = getAudioType();
    
    return (
      <div className={`music-card ${isCurrentTrack ? 'current-track' : ''}`} onClick={() => handlePlayTrack(item)}>
      <div className="card-cover">
          <div 
            className="cover-image"
            style={{
              backgroundImage: `url(${item.apiTrack?.coverUrl || `https://picsum.photos/200/200?random=${item.id}`})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          <div className="card-overlay">
        <button className="play-button" aria-label={`Play ${item.title}`}>
              {isCurrentTrack && state.isPlaying ? <CardIcons.pause /> : <CardIcons.play />}
            </button>
            <div className="card-actions">
              <button
                className={`action-button like-button ${isLiked ? 'liked' : ''}`}
                onClick={(e) => handleLike(item.id, e)}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                title={isLiked ? 'Remove from liked' : 'Add to liked'}
              >
                {isLiked ? <CardIcons.liked /> : <CardIcons.like />}
              </button>
              {isYouTubeTrack && (
                <button
                  className="action-button preview-button"
                  onClick={(e) => handlePlayPreview(item, e)}
                  aria-label="YouTube track - plays in site"
                  title="YouTube track - plays directly in site"
                >
                  <CardIcons.youtube />
                </button>
              )}
              {isSpotifyTrack && hasSpotifyPreview && (
                <button
                  className="action-button preview-button"
                  onClick={(e) => handlePlayPreview(item, e)}
                  aria-label="Play Spotify preview"
                  title="Play 30s Spotify preview"
                >
                  <CardIcons.preview />
                </button>
              )}
              {isSpotifyTrack && hasSpotifyWebUrl && (
                <button
                  className="action-button preview-button"
                  onClick={(e) => handlePlayPreview(item, e)}
                  aria-label="Open in Spotify"
                  title="Open in Spotify app"
                >
                  🎵
                </button>
              )}
              {isApiTrack && item.apiTrack.previewUrl && !isYouTubeTrack && !isSpotifyTrack && (
                <button
                  className="action-button preview-button"
                  onClick={(e) => handlePlayPreview(item, e)}
                  aria-label="Play preview"
                  title="Play 30s preview"
                >
                  <CardIcons.preview />
                </button>
              )}
              <button
                className="action-button queue-button"
                onClick={(e) => handleAddToQueue(item, e)}
                aria-label="Add to queue"
                title="Add to queue"
              >
                <CardIcons.add />
        </button>
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="card-title" title={item.title}>{item.title}</div>
          <div className="card-subtitle" title={item.artist}>{item.artist}</div>
          {showStats && (
            <div className="card-stats">
              <span className="genre-tag">{item.genre}</span>
              {item.source && <span className="source-tag">{item.source}</span>}
              {/* Better audio availability indicators */}
              <span className={`audio-type-tag ${audioType.toLowerCase()}`}>
                {audioType}
              </span>
              {isDemoTrack && <span className="demo-tag">Demo</span>}
              <span className="plays">{formatPlays(item.plays)}</span>
              {item.tracks && <span className="track-count">{item.tracks} tracks</span>}
              <span className="duration">{formatDuration(item.duration)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ToastContainer: React.FC = () => (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            aria-label="Close notification"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );

  // Add helpful info about Spotify previews
  const SpotifyInfoPanel: React.FC = () => {
    const [isVisible, setIsVisible] = useState(() => {
      // Check if user has already dismissed the panel
      const hasSeenPanel = localStorage.getItem('spotify-info-panel-dismissed');
      return !hasSeenPanel;
    });
    
    const handleDismiss = () => {
      setIsVisible(false);
      // Remember that user has dismissed the panel
      localStorage.setItem('spotify-info-panel-dismissed', 'true');
    };
    
    if (!isVisible) return null;
    
    return (
      <div className="spotify-info-panel">
        <div className="spotify-info-content">
          <div className="spotify-info-header">
            <span className="spotify-info-icon">ℹ️</span>
            <span className="spotify-info-title">About Spotify Tracks</span>
            <button 
              className="spotify-info-close"
              onClick={handleDismiss}
              aria-label="Close info panel"
            >
              ✕
            </button>
          </div>
          <div className="spotify-info-body">
            <p><strong>Spotify tracks</strong> have different audio availability:</p>
            <p>• <strong>Preview</strong> - 30-second snippets (limited availability)</p>
            <p>• <strong>External</strong> - Opens in Spotify app for full playback</p>
            <p>• <strong>None</strong> - Metadata only (no audio available)</p>
            
            <div className="spotify-info-tips">
              <strong>💡 Tips:</strong>
              <ul>
                <li>Try YouTube tracks for working audio</li>
                <li>Connect Spotify for in-site playback</li>
                <li>Use Jamendo for Creative Commons music</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (state.isSearching) {
    return (
      <main className="main-content">
        <div className="content-header">
          <h1 className="page-title">Searching...</h1>
          <p className="page-subtitle">Finding music for "{searchQuery}"</p>
        </div>
        <div className="loading-spinner">🎵 Loading music...</div>
        <ToastContainer />
      </main>
    );
  }

  if (searchQuery && filteredContent.length === 0 && !state.isSearching) {
    return (
      <main className="main-content">
        <div className="search-no-results">
          <h2>No results found for "{searchQuery}"</h2>
          <p>Try searching for something else or browse our featured content.</p>
        </div>
        <ToastContainer />
      </main>
    );
  }

  return (
    <main className="main-content">
      <div className="content-header">
        <h1 className="page-title">
          {searchQuery ? `Search results for "${searchQuery}"` : getTimeOfDayGreeting()}
        </h1>
        <p className="page-subtitle">
          {searchQuery 
            ? `Found ${filteredContent.length} results` 
            : 'Discover new music and enjoy your favorites'
          }
        </p>
      </div>

      {/* Show trending tracks from APIs when not searching */}
      {!searchQuery && categorizedContent.trendingTracks.items.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">🔥 Trending Now</h2>
            {categorizedContent.trendingTracks.hasMore && (
              <button 
                className="section-link"
                onClick={() => toggleSection('trendingTracks')}
              >
                {expandedSections.trendingTracks ? 'Show less' : 'Show all'}
              </button>
            )}
          </div>
          <div className="music-grid">
            {categorizedContent.trendingTracks.visible.map((track) => (
              <MusicCard 
                key={track.id} 
                item={{
                  id: track.id,
                  title: track.title,
                  artist: track.artist,
                  type: 'Track',
                  genre: track.genres?.[0] || 'Music',
                  year: new Date(track.releaseDate || '2024').getFullYear(),
                  duration: track.duration,
                  plays: track.popularity ? track.popularity * 10000 : 0,
                  source: track.source,
                  apiTrack: track,
                }} 
                showStats={true} 
              />
            ))}
          </div>
        </section>
      )}

      {categorizedContent.featuredAlbums.visible.length > 0 && (
      <section className="section">
        <div className="section-header">
            <h2 className="section-title">
              {searchQuery ? 'Albums' : 'Featured Albums'}
            </h2>
            {categorizedContent.featuredAlbums.hasMore && !searchQuery && (
              <button 
                className="section-link"
                onClick={() => toggleSection('featuredAlbums')}
              >
                {expandedSections.featuredAlbums ? 'Show less' : 'Show all'}
              </button>
            )}
        </div>
        <div className="music-grid">
            {categorizedContent.featuredAlbums.visible.map((album) => (
              <MusicCard key={album.id} item={album} showStats={true} />
          ))}
        </div>
      </section>
      )}

      {categorizedContent.popularTracks.visible.length > 0 && (
      <section className="section">
        <div className="section-header">
            <h2 className="section-title">
              {searchQuery ? 'Tracks' : 'Popular Tracks'}
            </h2>
            {categorizedContent.popularTracks.hasMore && !searchQuery && (
              <button 
                className="section-link"
                onClick={() => toggleSection('popularTracks')}
              >
                {expandedSections.popularTracks ? 'Show less' : 'Show all'}
              </button>
            )}
        </div>
        <div className="music-grid">
            {categorizedContent.popularTracks.visible.map((track) => (
              <MusicCard key={track.id} item={track} showStats={true} />
          ))}
        </div>
      </section>
      )}

      {categorizedContent.curatedPlaylists.visible.length > 0 && (
      <section className="section">
        <div className="section-header">
            <h2 className="section-title">
              {searchQuery ? 'Playlists' : 'Curated Playlists'}
            </h2>
            {categorizedContent.curatedPlaylists.hasMore && !searchQuery && (
              <button 
                className="section-link"
                onClick={() => toggleSection('curatedPlaylists')}
              >
                {expandedSections.curatedPlaylists ? 'Show less' : 'Show all'}
              </button>
            )}
        </div>
        <div className="music-grid">
            {categorizedContent.curatedPlaylists.visible.map((playlist) => (
              <MusicCard key={playlist.id} item={playlist} showStats={true} />
          ))}
        </div>
      </section>
      )}

      <ToastContainer />
      <SpotifyInfoPanel />
    </main>
  );
};

export default MainContent; 