import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: {
    error: "Muitas requisições feitas a partir deste IP, por favor tente novamente mais tarde.",
    },
    standardHeaders: true, // Retorna informações de limite de taxa no cabeçalho `RateLimit-*`
    legacyHeaders: false, // Desabilita os cabeçalhos antigos `X-RateLimit-*`

  });