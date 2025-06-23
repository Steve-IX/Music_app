// Suppress unload event listener deprecation warnings
// This polyfill replaces 'unload' events with 'beforeunload' to avoid deprecation warnings
// from third-party libraries like YouTube IFrame API and Spotify Web Playback SDK
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
  if (type === 'unload') {
    // Replace unload with beforeunload to avoid deprecation warning
    return originalAddEventListener.call(this, 'beforeunload', listener as EventListener, options);
  }
  return originalAddEventListener.call(this, type, listener, options);
} as typeof window.addEventListener;

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 