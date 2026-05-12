/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { DUMMY_VENDORS } from './src/dummyData';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
  });

  console.log('--- Server Starting ---');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Working Directory:', process.cwd());

  const SCRIPT_URL = process.env.VITE_GOOGLE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL;

  // Helper to interact with GAS
  async function callScript(action: string, data: any = {}) {
    if (!SCRIPT_URL) {
      throw new Error('GOOGLE_SCRIPT_URL is not configured');
    }
    
    const response = await axios.post(SCRIPT_URL, {
      action,
      ...data
    });
    
    return response.data;
  }

  // API Routes
  const apiRouter = express.Router();

  apiRouter.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
  });

  apiRouter.get('/vendors', async (req, res) => {
    console.log('GET /api/vendors');
    try {
      if (!SCRIPT_URL) {
        console.log('No SCRIPT_URL, returning DUMMY_VENDORS');
        return res.json(DUMMY_VENDORS);
      }
      const data = await callScript('list');
      res.json(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      res.json(DUMMY_VENDORS);
    }
  });

  apiRouter.post('/vendors', async (req, res) => {
    console.log('POST /api/vendors');
    try {
      const result = await callScript('add', { vendor: req.body });
      res.status(201).json(result);
    } catch (error) {
      console.error('Error adding vendor:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  apiRouter.get('/health', async (req, res) => {
    console.log('GET /api/health');
    try {
      if (!SCRIPT_URL) {
        return res.json({ status: 'configured_pending', db: 'disconnected', message: 'GOOGLE_SCRIPT_URL not set' });
      }
      const result = await axios.get(`${SCRIPT_URL}?action=health`).catch(err => ({ data: { error: err.message } }));
      res.json({ status: 'ok', db: 'connected', script: result.data });
    } catch (error) {
      console.error('Health check failed:', error);
      res.json({ status: 'error', db: 'disconnected', message: (error as Error).message });
    }
  });

  app.use('/api', apiRouter);

  app.get('/health-check', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log('Running in DEVELOPMENT mode with Vite middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
