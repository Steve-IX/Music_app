import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import MusicPlayer from './components/MusicPlayer';
import { ThemeProvider } from './context/ThemeContext';
import { MusicProvider } from './context/MusicContext';
import SpotifyAuthService from './services/spotifyAuth';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize Spotify authentication on app start
  useEffect(() => {
    const initializeSpotifyAuth = async () => {
      const spotifyAuth = new SpotifyAuthService();
      try {
        await spotifyAuth.initialize();
        console.log('✅ Spotify authentication service initialized');
      } catch (error) {
        console.error('❌ Error initializing Spotify auth:', error);
      }
    };

    initializeSpotifyAuth();
  }, []);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ThemeProvider>
      <MusicProvider>
        <div className="app">
          <Header 
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onSearch={setSearchQuery}
          />
          <div className="app-body">
            <Sidebar isOpen={isSidebarOpen} />
            <MainContent searchQuery={searchQuery} />
          </div>
          <MusicPlayer />
          
          {/* Hidden YouTube Player Container */}
          <div 
            id="youtube-player" 
            style={{ 
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: '480px',
              height: '270px',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: -1
            }}
          />
        </div>
      </MusicProvider>
    </ThemeProvider>
  );
}

export default App; 