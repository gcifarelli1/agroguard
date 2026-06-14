import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const reportsPlugin = () => ({
  name: 'reports-generator',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/reports' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const reportData = JSON.parse(body);
            const reportsDir = path.resolve(__dirname, './reports');
            if (!fs.existsSync(reportsDir)) {
              fs.mkdirSync(reportsDir, { recursive: true });
            }
            const fileName = `report-${reportData.alertId}-${Date.now()}.json`;
            const filePath = path.join(reportsDir, fileName);
            fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2), 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, fileName }));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: (error as Error).message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

export default defineConfig({
  plugins: [react(), reportsPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})