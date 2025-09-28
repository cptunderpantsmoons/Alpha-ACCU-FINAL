import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import batchesRouter from './routes/batches';
import loansRouter from './routes/loans';
import marketDataRouter from './routes/marketdata';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use('/api/batches', batchesRouter);
app.use('/api/loans', loansRouter);
app.use('/api/marketdata', marketDataRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});