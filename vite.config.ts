import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DEFAULT_API_BASE = 'https://optyshop-frontend.hmstech.org/api'

/** Strip trailing /api for proxy target (e.g. https://host/api → https://host) */
function proxyOriginFromApiBase(apiBase: string): string {
  const trimmed = apiBase.trim().replace(/\/+$/, '')
  const origin = trimmed.replace(/\/api\/?$/, '')
  return origin || 'http://localhost:5000'
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiBase = (env.VITE_API_BASE_URL || DEFAULT_API_BASE).trim().replace(/\/+$/, '')
  const proxyTarget = proxyOriginFromApiBase(apiBase)

  if (mode === 'development') {
    console.info(`[vite] VITE_API_BASE_URL → ${apiBase}`)
    console.info(`[vite] proxy /api and /uploads → ${proxyTarget}`)
  }

  return {
  plugins: [react(), tailwindcss(),],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/external-images': {
        target: 'https://optyshop-frontend.hmstech.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/external-images/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    },
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: false,
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
  }
  }
})
