import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Get all market prices
router.get('/', async (req, res) => {
  const marketPrices = await prisma.marketPrice.findMany();
  res.json(marketPrices);
});

// Create a new market price
router.post('/', async (req, res) => {
  const newMarketPrice = await prisma.marketPrice.create({
    data: req.body,
  });
  res.json(newMarketPrice);
});

export default router;