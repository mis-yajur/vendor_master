/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import axios from 'axios';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

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
  app.get('/api/vendors', async (req, res) => {
    try {
      const data = await callScript('list');
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/vendors', async (req, res) => {
    try {
      const result = await callScript('add', { vendor: req.body });
      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/api/health', async (req, res) => {
    try {
      if (!SCRIPT_URL) throw new Error('Not Configured');
      const result = await axios.get(`${SCRIPT_URL}?action=health`);
      res.json({ status: 'ok', db: 'connected', script: result.data });
    } catch (error) {
      res.status(200).json({ status: 'error', db: 'disconnected', message: (error as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
