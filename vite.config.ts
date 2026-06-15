import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const SYNC_ENTITIES: Record<string, string> = {
  users: 'users.json',
  plants: 'plants.json',
  silos: 'silos.json',
  cereales: 'cereales.json',
};

// Writes CRUD data from the UI back to the seed JSON files on disk (dev only).
const syncPlugin = () => ({
  name: 'json-sync',
  configureServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
    server.middlewares.use((req, res, next) => {
      const match = (req.url as string)?.match(/^\/api\/sync\/([\w]+)$/);
      if (!match || req.method !== 'POST') { next(); return; }
      const entity = match[1];
      const fileName = SYNC_ENTITIES[entity];
      if (!fileName) { next(); return; }

      let body = '';
      req.on('data', (chunk: string) => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const filePath = path.resolve(__dirname, 'src', 'data', 'json', fileName);
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: (error as Error).message }));
        }
      });
    });
  },
});

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
  plugins: [react(), syncPlugin(), reportsPlugin()],
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