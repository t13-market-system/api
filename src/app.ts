// Arquivo: src/app.ts
import express from 'express';

export const app = express();
app.use(express.json({ limit: '16kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));