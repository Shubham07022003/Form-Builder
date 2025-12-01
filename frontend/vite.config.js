import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Make environment variables available in the client
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:5001')
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
          ws: true,
          withCredentials: true,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Forward cookies properly
              if (req.headers.cookie) {
                proxyReq.setHeader('cookie', req.headers.cookie);
              }
              console.log('Proxy Request:', req.method, req.url, 'Origin:', req.headers.origin, 'Cookies:', req.headers.cookie);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              // Forward Set-Cookie headers properly for tunnels
              const cookies = proxyRes.headers['set-cookie'];
              if (cookies) {
                // For tunnel mode, we need to modify cookies to work cross-origin
                const modifiedCookies = cookies.map(cookie => {
                  let modifiedCookie = cookie;
                  
                  // Remove domain attribute for tunnels
                  modifiedCookie = modifiedCookie.replace(/; domain=[^;]+/i, '');
                  
                  // Remove secure attribute for HTTP tunnels
                  if (req.headers.origin && req.headers.origin.includes('devtunnels.ms')) {
                    modifiedCookie = modifiedCookie.replace(/; secure/i, '');
                  }
                  
                  // Set SameSite=None for cross-origin tunnels
                  if (req.headers.origin && req.headers.origin.includes('devtunnels.ms')) {
                    modifiedCookie = modifiedCookie.replace(/; SameSite=[^;]+/i, '; SameSite=None');
                  }
                  
                  return modifiedCookie;
                });
                proxyRes.headers['set-cookie'] = modifiedCookies;
                console.log('Modified cookies for tunnel:', modifiedCookies);
              }
              console.log('Proxy Response:', proxyRes.statusCode, req.url, 'Origin:', req.headers.origin);
            });
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
          }
        }
      }
    }
  };
});
