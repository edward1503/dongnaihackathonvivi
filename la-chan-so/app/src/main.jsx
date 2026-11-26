import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './v3/theme.css'
import App from './App.jsx'
import { AppProvider } from './lib/state.jsx'
import { installAudioUnlock } from './lib/sound.js'

installAudioUnlock()

// Chạy trong app Android (có cầu LCSNative): luôn toàn màn hình, không vẽ khung điện thoại như trên máy tính
if (window.LCSNative) document.documentElement.classList.add('in-app')

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </React.StrictMode>,
)
