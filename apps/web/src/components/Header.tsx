import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import SpotifyPlayerService from '../services/spotifyPlayer';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onToggleSidebar, onSearch }) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [spotifyPlayer] = useState(() => new SpotifyPlayerService());
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);

  // Check Spotify connection status
  useEffect(() => {
    const checkSpotifyStatus = () => {
      const connected = spotifyPlayer.isAuthenticated();
      setIsSpotifyConnected(connected);
    };

    checkSpotifyStatus();
    
    // Check periodically
    const interval = setInterval(checkSpotifyStatus, 5000);
    return () => clearInterval(interval);
  }, [spotifyPlayer]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleSpotifyAuth = () => {
    if (isSpotifyConnected) {
      // Show confirmation before disconnecting
      if (confirm('Disconnect from Spotify? You will need to reconnect to play Spotify tracks in-site.')) {
      spotifyPlayer.destroy();
      setIsSpotifyConnected(false);
        console.log('🔐 Spotify disconnected by user');
      }
    } else {
      // Connect
      console.log('🔐 Starting Spotify authentication...');
      spotifyPlayer.startAuth();
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <a href="/" className="header-logo">
          <span>🎵</span>
          <span>MusicStream</span>
        </a>
      </div>
      
      <form className="search-container" onSubmit={handleSearchSubmit}>
        <div className="search-icon">🔍</div>
        <input
          type="text"
          className="search-input"
          placeholder="Search for songs, artists, albums..."
          aria-label="Search music"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear"
            onClick={() => {
              setSearchQuery('');
              onSearch?.('');
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </form>
      
      <div className="header-right">
        <button
          className={`spotify-auth-button ${isSpotifyConnected ? 'connected' : ''}`}
          onClick={handleSpotifyAuth}
          aria-label={isSpotifyConnected ? 'Disconnect Spotify' : 'Connect Spotify'}
          title={isSpotifyConnected ? 'Spotify Connected - Click to disconnect' : 'Connect Spotify for in-site playback'}
        >
          <span className="spotify-icon">🎵</span>
          <span className="spotify-text">
            {isSpotifyConnected ? 'Connected' : 'Connect Spotify'}
          </span>
        </button>
        
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="user-profile" aria-label="User profile">
          U
        </div>
      </div>
    </header>
  );
};

export default Header; 