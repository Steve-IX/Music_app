import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { state } = useMusic();
  const [activeSection, setActiveSection] = useState('home');
  const [expandedPlaylists, setExpandedPlaylists] = useState(false);

  const handleNavClick = (section: string) => {
    setActiveSection(section);
    // Add smooth scroll to section if needed
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const togglePlaylists = () => {
    setExpandedPlaylists(!expandedPlaylists);
  };

  const getQueueInfo = () => {
    const current = state.currentIndex + 1;
    const total = state.queue.length;
    return { current, total };
  };

  const { current, total } = getQueueInfo();

  return (
    <div className={`sidebar ${!isOpen ? 'closed' : ''}`}>
      {/* Main Navigation */}
      <div className="nav-section">
        <div className="nav-title">Navigation</div>
        <button
          className={`nav-item ${activeSection === 'home' ? 'active' : ''}`}
          onClick={() => handleNavClick('home')}
        >
          <span>🏠</span>
          <span>Home</span>
        </button>
        <button
          className={`nav-item ${activeSection === 'search' ? 'active' : ''}`}
          onClick={() => handleNavClick('search')}
        >
          <span>🔍</span>
          <span>Search</span>
        </button>
        <button
          className={`nav-item ${activeSection === 'library' ? 'active' : ''}`}
          onClick={() => handleNavClick('library')}
        >
          <span>📚</span>
          <span>Your Library</span>
        </button>
        <button
          className={`nav-item ${activeSection === 'trending' ? 'active' : ''}`}
          onClick={() => handleNavClick('trending')}
        >
          <span>📈</span>
          <span>Trending</span>
        </button>
      </div>

      {/* Playback */}
      <div className="nav-section">
        <div className="nav-title">Playback</div>
        <button
          className={`nav-item ${activeSection === 'queue' ? 'active' : ''}`}
          onClick={() => handleNavClick('queue')}
        >
          <span>📋</span>
          <span>Queue</span>
          {total > 0 && (
            <span className="queue-count">{current}/{total}</span>
          )}
        </button>
        <button
          className={`nav-item ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => handleNavClick('history')}
        >
          <span>⏰</span>
          <span>Recently Played</span>
          {state.history.length > 0 && (
            <span className="history-count">{state.history.length}</span>
          )}
        </button>
        <button
          className={`nav-item ${activeSection === 'liked' ? 'active' : ''}`}
          onClick={() => handleNavClick('liked')}
        >
          <span>❤️</span>
          <span>Liked Songs</span>
        </button>
      </div>

      {/* Playlists */}
      <div className="nav-section">
        <div className="nav-title">
          <button 
            className="playlist-toggle"
            onClick={togglePlaylists}
            aria-label={expandedPlaylists ? 'Collapse playlists' : 'Expand playlists'}
          >
            <span>📝</span>
            <span>Playlists</span>
            <span className={`toggle-icon ${expandedPlaylists ? 'expanded' : ''}`}>
              {expandedPlaylists ? '▼' : '▶'}
            </span>
          </button>
        </div>
        
        {expandedPlaylists && (
          <div className="playlist-list">
            <button className="playlist-item">
              <div className="playlist-cover">🎵</div>
              <span>My Playlist #1</span>
            </button>
            <button className="playlist-item">
              <div className="playlist-cover">🎵</div>
              <span>Workout Mix</span>
            </button>
            <button className="playlist-item">
              <div className="playlist-cover">🎵</div>
              <span>Chill Vibes</span>
            </button>
            <button className="playlist-item">
              <div className="playlist-cover">🎵</div>
              <span>Party Hits</span>
            </button>
            <button className="playlist-item create-playlist">
              <div className="playlist-cover">➕</div>
              <span>Create Playlist</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="nav-section">
        <div className="nav-title">Quick Actions</div>
        <button
          className="nav-item"
          onClick={() => {
            // Trigger file upload dialog
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*';
            input.multiple = true;
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) {
                console.log('Files selected:', files.length);
                // Handle file upload logic here
              }
            };
            input.click();
          }}
        >
          <span>📁</span>
          <span>Upload Music</span>
        </button>
        <button
          className="nav-item"
          onClick={() => {
            // Open settings or preferences
            console.log('Opening settings...');
          }}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>
        <button
          className="nav-item"
          onClick={() => {
            // Show help or about
            console.log('Opening help...');
          }}
        >
          <span>❓</span>
          <span>Help</span>
        </button>
      </div>

      {/* Current Track Info */}
      {state.currentTrack && (
        <div className="nav-section current-track-section">
          <div className="nav-title">Now Playing</div>
          <div className="current-track-info">
            <div className="current-track-cover">
              {state.currentTrack.coverUrl ? (
                <img src={state.currentTrack.coverUrl} alt="Album cover" />
              ) : (
                <div className="current-track-placeholder">🎵</div>
              )}
            </div>
            <div className="current-track-details">
              <div className="current-track-title">{state.currentTrack.title}</div>
              <div className="current-track-artist">{state.currentTrack.artist}</div>
              <div className="current-track-source">{state.currentTrack.source}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 