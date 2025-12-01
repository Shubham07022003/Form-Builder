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
          cookieDomainRewrite: "",
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Forward cookies properly
              if (req.headers.cookie) {
                proxyReq.setHeader('cookie', req.headers.cookie);
              }
              console.log('Proxy Request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              // Forward Set-Cookie headers properly
              const cookies = proxyRes.headers['set-cookie'];
              if (cookies) {
                // Remove domain and secure attributes for localhost
                const modifiedCookies = cookies.map(cookie => 
                  cookie
                    .replace(/; domain=[^;]+/i, '')
                    .replace(/; secure/i, '')
                    .replace(/; SameSite=None/i, '; SameSite=Lax')
                );
                proxyRes.headers['set-cookie'] = modifiedCookies;
                console.log('Modified cookies for localhost:', modifiedCookies);
              }
              console.log('Proxy Response:', proxyRes.statusCode, req.url);
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

