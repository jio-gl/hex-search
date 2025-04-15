import cors from 'cors';
import { Express } from 'express';

export const configureCors = (app: Express) => {
  const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
  };

  app.use(cors(corsOptions));
}; 