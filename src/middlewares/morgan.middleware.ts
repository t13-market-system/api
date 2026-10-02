import morgan, { StreamOptions } from 'morgan';
import { logger } from '../config/logger';

const stream: StreamOptions = {
    write: (message) => logger.http(message.trim()),
};

export const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    { stream }
);


