import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { MusicProvider } from './context/MusicContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MusicProvider>
        <App />
      </MusicProvider>
    </ThemeProvider>
  </React.StrictMode>
) 