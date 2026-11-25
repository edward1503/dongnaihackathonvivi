import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import '../../ds.css'
import './app.css'
import App from './App.jsx'
import { AppProvider } from './lib/state.jsx'
import { installAudioUnlock } from './lib/sound.js'

installAudioUnlock()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </React.StrictMode>,
)
