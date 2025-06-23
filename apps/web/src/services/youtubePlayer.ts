// YouTube IFrame API Player Service
// Handles YouTube video playback directly within the site

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loading: boolean;
  error: string | null;
  videoId: string | null;
}

export interface YouTubePlayerCallbacks {
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onLoad?: () => void;
  onLoadError?: (error: any) => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onStateChange?: (state: number) => void;
}

class YouTubePlayerService {
  private player: any = null;
  private callbacks: YouTubePlayerCallbacks = {};
  private updateInterval: NodeJS.Timeout | null = null;
  private state: YouTubePlayerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    loading: false,
    error: null,
    videoId: null
  };
  private isApiReady = false;
  private pendingLoad: string | null = null;

  constructor() {
    this.loadYouTubeAPI();
  }

  // Load YouTube IFrame API
  private loadYouTubeAPI(): void {
    if (window.YT) {
      console.log('✅ YouTube IFrame API already loaded');
      this.isApiReady = true;
      this.initializePlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    
    // Add error handling for script load
    tag.onerror = () => {
      console.error('❌ Failed to load YouTube IFrame API');
      this.setState({
        error: 'Failed to load YouTube player',
        loading: false
      });
    };

    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log('✅ YouTube IFrame API ready');
      this.isApiReady = true;
      this.initializePlayer();
    };
  }

  // Initialize YouTube player
  private initializePlayer(): void {
    if (!this.isApiReady) {
      console.warn('⚠️ YouTube API not ready');
      return;
    }

    // Check if player is already initialized
    if (this.player) {
      console.log('✅ YouTube player already initialized');
      return;
    }

    try {
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player';
      playerDiv.style.display = 'none';
      document.body.appendChild(playerDiv);

      this.player = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: this.onPlayerReady.bind(this),
          onStateChange: this.onPlayerStateChange.bind(this),
          onError: this.onPlayerError.bind(this),
          onPlaybackQualityChange: (event: any) => {
            console.log('🎥 YouTube quality changed:', event.data);
          }
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize YouTube player:', error);
      this.setState({
        error: 'Failed to initialize YouTube player',
        loading: false
      });
    }
  }

  // Set callbacks for player events
  setCallbacks(callbacks: YouTubePlayerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Load a YouTube video by ID
  async loadVideo(videoId: string): Promise<void> {
    console.log('Loading YouTube video:', videoId);
    
    if (!this.isApiReady) {
      console.log('YouTube API not ready, queuing video load');
      this.pendingLoad = videoId;
      return;
    }

    if (!this.player) {
      console.warn('YouTube player not initialized');
      this.setState({ error: 'YouTube player not initialized' });
      return;
    }

    this.setState({ 
      loading: true, 
      error: null, 
      videoId,
      currentTime: 0,
      duration: 0 
    });

    try {
      this.player.loadVideoById({
        videoId: videoId,
        suggestedQuality: 'medium'
      });
    } catch (error) {
      console.error('Failed to load YouTube video:', error);
      this.setState({ 
        loading: false, 
        error: 'Failed to load video' 
      });
    }
  }

  // Extract video ID from YouTube URL
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Load video from URL
  async loadVideoFromUrl(url: string): Promise<void> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      console.error('Invalid YouTube URL:', url);
      this.setState({ error: 'Invalid YouTube URL' });
      return;
    }

    await this.loadVideo(videoId);
  }

  // Play the current video
  play(): void {
    if (this.player && this.state.videoId) {
      console.log('Playing YouTube video');
      this.player.playVideo();
    }
  }

  // Pause the current video
  pause(): void {
    if (this.player && this.state.videoId) {
      console.log('Pausing YouTube video');
      this.player.pauseVideo();
    }
  }

  // Stop the current video
  stop(): void {
    if (this.player && this.state.videoId) {
      console.log('Stopping YouTube video');
      this.player.stopVideo();
    }
  }

  // Seek to a specific time
  seek(time: number): void {
    if (this.player && this.state.videoId) {
      console.log('Seeking to:', time);
      this.player.seekTo(time, true);
    }
  }

  // Set volume (0-100)
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume * 100));
    if (this.player && this.state.videoId) {
      console.log('Setting volume to:', clampedVolume);
      this.player.setVolume(clampedVolume);
    }
    this.setState({ volume: volume });
    this.callbacks.onVolumeChange?.(volume);
  }

  // Get current playback state
  getState(): YouTubePlayerState {
    return { ...this.state };
  }

  // Check if a video is loaded
  isLoaded(): boolean {
    return this.player && this.state.videoId !== null;
  }

  // Check if currently playing
  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  // Get current time
  getCurrentTime(): number {
    return this.state.currentTime;
  }

  // Get duration
  getDuration(): number {
    return this.state.duration;
  }

  // Get video ID
  getVideoId(): string | null {
    return this.state.videoId;
  }

  // Private event handlers
  private onPlayerReady(event: any): void {
    console.log('✅ YouTube player ready');
    this.setState({ loading: false, error: null });
    this.callbacks.onLoad?.();

    // Load any pending video
    if (this.pendingLoad) {
      this.loadVideo(this.pendingLoad);
      this.pendingLoad = null;
    }
  }

  private onPlayerStateChange(event: any): void {
    const states = window.YT.PlayerState;
    const newState = {
      isPlaying: event.data === states.PLAYING,
      loading: event.data === states.BUFFERING,
      error: null
    };

    // Update state without triggering reloads
    this.setState(newState);

    switch (event.data) {
      case states.PLAYING:
        this.startTimeUpdate();
        this.callbacks.onPlay?.();
        break;
      case states.PAUSED:
        this.stopTimeUpdate();
        this.callbacks.onPause?.();
        break;
      case states.ENDED:
        this.stopTimeUpdate();
        this.callbacks.onEnd?.();
        break;
      case states.BUFFERING:
        // Don't trigger loading state for short buffers
        setTimeout(() => {
          if (this.state.loading) {
            this.setState({ loading: false });
          }
        }, 1000);
        break;
    }

    this.callbacks.onStateChange?.(event.data);
  }

  private onPlayerError(event: any): void {
    const errorCodes = {
      2: 'Invalid video ID',
      5: 'HTML5 player error',
      100: 'Video not found or removed',
      101: 'Video playback not allowed',
      150: 'Video playback not allowed'
    };

    const errorMessage = errorCodes[event.data] || 'Unknown error occurred';
    console.error(`❌ YouTube player error (${event.data}):`, errorMessage);

    this.setState({
      error: `YouTube playback error: ${errorMessage}`,
      loading: false,
      isPlaying: false
    });

    this.stopTimeUpdate();
    this.callbacks.onLoadError?.(event);
  }

  // Start time update interval
  private startTimeUpdate(): void {
    this.stopTimeUpdate();
    this.updateInterval = setInterval(() => {
      if (this.player && this.state.isPlaying) {
        try {
          // Get current time from YouTube player
          const currentTime = this.player.getCurrentTime();
          const duration = this.player.getDuration();
          
          if (currentTime !== undefined && !isNaN(currentTime)) {
            this.setState({ currentTime: Math.floor(currentTime) });
            this.callbacks.onTimeUpdate?.(currentTime);
          }
          
          // Update duration if it changed (YouTube sometimes loads duration after video starts)
          if (duration !== undefined && !isNaN(duration) && duration > 0) {
            if (Math.abs(duration - this.state.duration) > 1) {
              this.setState({ duration: Math.floor(duration) });
            }
          }
        } catch (error) {
          console.warn('Error getting YouTube player time:', error);
        }
      }
    }, 1000); // Update every second for smooth progress
  }

  // Stop time update interval
  private stopTimeUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Private state setter
  private setState(updates: Partial<YouTubePlayerState>): void {
    this.state = { ...this.state, ...updates };
  }

  // Cleanup
  destroy(): void {
    this.stopTimeUpdate();
    if (this.player) {
      try {
        this.player.destroy();
      } catch (error) {
        console.warn('Error destroying YouTube player:', error);
      }
      this.player = null;
    }
    this.callbacks = {};
    this.setState({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      loading: false,
      error: null,
      videoId: null,
    });
  }
}

// Export a singleton instance
const youtubePlayer = new YouTubePlayerService();
export default youtubePlayer; 