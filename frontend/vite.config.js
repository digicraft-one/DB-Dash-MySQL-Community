import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// Load configuration
let fileConfig
try {
  fileConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'frontend-config.json'), 'utf8'))
} catch (error) {
  console.warn('Could not load frontend config file, using defaults.')
  fileConfig = { port: 3000, host: 'localhost', backendUrl: 'http://localhost:3001' } // Added default host
}

// Determine Actual Backend URL
// Prioritize environment variable set by Electron main process
const actualBackendUrl = process.env.ACTUAL_BACKEND_URL || fileConfig.backendUrl || 'http://localhost:3001'

// Frontend Server Settings
const frontendPort = fileConfig.port || 3000
// const frontendHost = fileConfig.host || 'localhost' // Less critical now with host:true

console.log(`[vite.config.js] Frontend Port: ${frontendPort}`)
console.log(`[vite.config.js] Actual Backend URL for Proxy: ${actualBackendUrl}`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: frontendPort,
    host: true, // Expose on network
    worker: {
      format: 'es',
      plugins: [],
    },
    proxy: {
      '/api': {
        target: actualBackendUrl, // Use the dynamically determined URL
        changeOrigin: true,
        secure: false, // Often needed for localhost targets
        ws: true, // Proxy websockets if needed
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[Vite Proxy Error]', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[Vite Proxy] Sending ${req.method} request to ${actualBackendUrl}${proxyReq.path}`)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`[Vite Proxy] Received ${proxyRes.statusCode} response from ${actualBackendUrl}${req.url}`)
          })
        },
      },
    },
  },
  // Define global constants for React app
  define: {
    // Keep the one from config file for display comparison
    'import.meta.env.VITE_CONFIG_BACKEND_URL': JSON.stringify(fileConfig.backendUrl),
    // Add the *actual* one being used by the proxy
    'import.meta.env.VITE_ACTUAL_BACKEND_URL': JSON.stringify(actualBackendUrl)
  }
})
