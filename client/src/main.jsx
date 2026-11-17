import React, { useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

function BootComplete() {
  useLayoutEffect(() => {
    window.dispatchEvent(new Event('budexpert:mounted'))
  }, [])
  return null
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <BootComplete />
    </BrowserRouter>
  </React.StrictMode>
)
