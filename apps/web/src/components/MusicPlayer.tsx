import React, { useEffect, useRef } from 'react';
import { useMusic } from '../context/MusicContext';
import audioPlayer from '../services/audioPlayer';
import toast from 'react-hot-toast';

// Professional SVG Icons
const Icons = {
  play: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
  ),
  pause: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  ),
  previous: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
    </svg>
  ),
  next: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
    </svg>
  ),
  shuffle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.04 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
    </svg>
  ),
  repeat: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
    </svg>
  ),
  repeatOne: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
      <path d="M13 15V9h-1l-2 1v1h1.5v4H13z"/>
    </svg>
  ),
  queue: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
    </svg>
  ),
  volume: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  ),
  volumeMute: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>
  ),
  volumeLow: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
    </svg>
  ),
  fullscreen: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>
  ),
  quality: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  ),
  more: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
  ),
  loading: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="animate-spin">
      <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
    </svg>
  )
};

const MusicPlayer: React.FC = () => {
  const { state, dispatch, getQueueInfo } = useMusic();
  const { currentTrack, isPlaying, currentTime, volume, repeat, shuffle, loading, error } = state;
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (loading) return; // Prevent action while loading
    
    if (isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  };

  const handlePrevious = () => {
    if (loading) return;
    dispatch({ type: 'PREVIOUS_TRACK' });
  };

  const handleNext = () => {
    if (loading) return;
    dispatch({ type: 'NEXT_TRACK' });
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack || loading) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * currentTrack.duration;
    
    // Use audio player seek for accurate positioning
    audioPlayer.seek(newTime);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, clickPosition));
    
    // Use audio player volume setter
    audioPlayer.setVolume(newVolume);
  };

  const handleShuffle = () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
    showToast(
      state.shuffle ? 'Shuffle disabled' : 'Shuffle enabled',
      'info'
    );
  };

  const handleRepeat = () => {
    dispatch({ type: 'TOGGLE_REPEAT' });
    const repeatMode = state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none';
    const messages = {
      none: 'Repeat disabled',
      all: 'Repeat all enabled',
      one: 'Repeat one enabled'
    };
    showToast(messages[repeatMode], 'info');
  };

  const handleQueueToggle = () => {
    // Toggle queue visibility or show queue modal
    const queueInfo = getQueueInfo();
    showToast(`Queue: ${queueInfo.current} of ${queueInfo.total} tracks`, 'info');
  };

  const handleMoreOptions = () => {
    // Show more options menu
    const options = [
      'Add to playlist',
      'Share track',
      'View lyrics',
      'Show credits',
      'Report issue'
    ];
    showToast('More options menu (coming soon)', 'info');
  };

  const handleVolumeMute = () => {
    const newVolume = state.volume > 0 ? 0 : 0.5;
    dispatch({ type: 'SET_VOLUME', payload: newVolume });
    showToast(
      newVolume === 0 ? 'Volume muted' : 'Volume unmuted',
      'info'
    );
  };

  const handleFullscreen = () => {
    // Toggle fullscreen mode for video tracks
    if (state.currentTrack?.source === 'youtube') {
      showToast('Fullscreen mode (coming soon)', 'info');
    } else {
      showToast('Fullscreen available for video tracks only', 'info');
    }
  };

  const handleQualityToggle = () => {
    // Toggle audio quality
    showToast('Audio quality toggle (coming soon)', 'info');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toast(message, {
      duration: 2000,
      position: 'bottom-center',
      className: `toast-${type}`
    });
  };

  // Sync with audio player state
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (isPlaying && currentTrack) {
        const playerTime = audioPlayer.getCurrentTime();
        const playerDuration = audioPlayer.getDuration();
        
        // Only update if there's a significant difference to avoid unnecessary re-renders
        if (Math.abs(playerTime - currentTime) > 0.5) {
          dispatch({ type: 'SET_CURRENT_TIME', payload: playerTime });
        }
        
        // Update track duration if it changed (especially for YouTube)
        if (playerDuration > 0 && Math.abs(playerDuration - currentTrack.duration) > 1) {
          // Update the current track with new duration
          const updatedTrack = { ...currentTrack, duration: playerDuration };
          dispatch({ type: 'PLAY_TRACK', payload: updatedTrack });
        }
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [isPlaying, currentTrack, currentTime, dispatch]);

  if (!currentTrack) return null;

  const progressPercentage = currentTrack.duration > 0 ? (currentTime / currentTrack.duration) * 100 : 0;
  const volumePercentage = volume * 100;

  const getVolumeIcon = () => {
    if (volume === 0) return <Icons.volumeMute />;
    if (volume < 0.5) return <Icons.volumeLow />;
    return <Icons.volume />;
  };

  return (
    <div className="music-player">
      {/* Hidden YouTube player container */}
      <div id="youtube-player" style={{ display: 'none' }}></div>
      
      {/* Error display */}
      {error && (
        <div className="player-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {error}
        </div>
      )}

      {/* Left section - Current track info */}
      <div className="player-left">
        <div className="now-playing-cover">
          {currentTrack.coverUrl && (
            <img 
              src={currentTrack.coverUrl} 
              alt={`${currentTrack.title} cover`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
        <div className="now-playing-info">
          <div className="now-playing-title" title={currentTrack.title}>
            {currentTrack.title}
          </div>
          <div className="now-playing-artist" title={currentTrack.artist}>
            {currentTrack.artist}
            {currentTrack.source && currentTrack.source !== 'demo' && (
              <span className="source-indicator"> • {currentTrack.source}</span>
            )}
          </div>
        </div>
      </div>

      {/* Center section - Controls and progress */}
      <div className="player-center">
        <div className="player-controls">
          <button
            className={`control-button ${shuffle ? 'active' : ''}`}
            onClick={handleShuffle}
            aria-label="Toggle shuffle"
            title={`Shuffle ${shuffle ? 'on' : 'off'}`}
          >
            <Icons.shuffle />
          </button>
          <button
            className="control-button"
            onClick={handlePrevious}
            aria-label="Previous track"
            title="Previous track"
            disabled={loading}
          >
            <Icons.previous />
          </button>
          <button
            className={`control-button play ${loading ? 'loading' : ''}`}
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
            disabled={loading}
          >
            {loading ? <Icons.loading /> : isPlaying ? <Icons.pause /> : <Icons.play />}
          </button>
          <button
            className="control-button"
            onClick={handleNext}
            aria-label="Next track"
            title="Next track"
            disabled={loading}
          >
            <Icons.next />
          </button>
          <button
            className={`control-button ${repeat !== 'none' ? 'active' : ''}`}
            onClick={handleRepeat}
            aria-label={`Repeat: ${repeat}`}
            title={`Repeat ${repeat === 'none' ? 'off' : repeat === 'one' ? 'one' : 'all'}`}
          >
            {repeat === 'one' ? <Icons.repeatOne /> : <Icons.repeat />}
          </button>
        </div>
        
        <div className="progress-container">
          <span className="time-display">{formatTime(currentTime)}</span>
          <div 
            ref={progressBarRef}
            className="progress-bar" 
            onClick={handleProgressClick}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={currentTrack.duration}
            aria-valuenow={currentTime}
            title={`Seek to ${formatTime(currentTime)}`}
          >
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="progress-handle"></div>
            </div>
          </div>
          <span className="time-display">{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Right section - Volume and additional controls */}
      <div className="player-right">
        <button 
          className="control-button" 
          onClick={handleQueueToggle}
          aria-label="Queue"
          title="Queue"
        >
          <Icons.queue />
        </button>
        <div className="volume-container">
          <button 
            className="control-button" 
            onClick={handleVolumeMute}
            aria-label="Mute/Unmute"
            title={`Volume ${Math.round(volume * 100)}%`}
          >
            {getVolumeIcon()}
          </button>
          <div 
            ref={volumeBarRef}
            className="volume-bar"
            onClick={handleVolumeChange}
            role="slider"
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volume * 100)}
            title={`Volume ${Math.round(volume * 100)}%`}
          >
            <div 
              className="volume-fill"
              style={{ width: `${volumePercentage}%` }}
            ></div>
          </div>
        </div>
        {currentTrack.source === 'youtube' && (
          <button 
            className="control-button" 
            onClick={handleFullscreen}
            aria-label="Fullscreen"
            title="Fullscreen"
          >
            <Icons.fullscreen />
          </button>
        )}
        <button 
          className="control-button" 
          onClick={handleQualityToggle}
          aria-label="Audio quality"
          title="Audio quality"
        >
          <Icons.quality />
        </button>
        <button 
          className="control-button" 
          onClick={handleMoreOptions}
          aria-label="More options"
          title="More options"
        >
          <Icons.more />
        </button>
      </div>
    </div>
  );
};

export default MusicPlayer; 