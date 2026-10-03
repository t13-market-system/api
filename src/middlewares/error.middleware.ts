// Arquivo: src/middlewares/error.middleware.ts
import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (typeof error === 'object' && error !== null && 'sqlState' in error && error.sqlState === '23505') {
    res.status(409).json({ error: 'Este e-mail já está em uso.' });
    return;
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    if (error.status === 400) {
      res.status(400).json({ error: 'JSON inválido.' });
      return;
    }
    if (error.status === 413) {
      res.status(413).json({ error: 'Corpo da requisição muito grande.' });
      return;
    }
  }
  console.error('Erro interno na API:', error);
  res.status(500).json({ error: 'Erro interno do servidor.' });
};