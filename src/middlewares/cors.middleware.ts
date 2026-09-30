import cors from 'cors';

export const corsMiddleware = cors({
  origin: 'http://localhost:5173', // A exata URL do seu Front-End
  credentials: true, // Permite que a API receba/envie Cookies (HttpOnly)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'] // Cabeçalhos permitidos
});