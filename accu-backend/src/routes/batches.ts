import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/batches
router.get('/', async (req, res) => {
  const batches = await prisma.aCCU.findMany();
  res.json(batches);
});

// GET /api/batches/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const batch = await prisma.aCCU.findUnique({
    where: { id },
  });
  res.json(batch);
});

// POST /api/batches
router.post('/', async (req, res) => {
  const { batchNumber, quantity, acquisitionCost, classification, acquisitionDate, entityId, userId } = req.body;
  const batch = await prisma.aCCU.create({
    data: {
      batchNumber,
      quantity,
      acquisitionCost,
      classification,
      acquisitionDate,
      entityId,
      userId,
    },
  });
  res.json(batch);
});

// PUT /api/batches/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { batchNumber, quantity, acquisitionCost, classification, acquisitionDate, entityId, userId } = req.body;
  const batch = await prisma.aCCU.update({
    where: { id },
    data: {
      batchNumber,
      quantity,
      acquisitionCost,
      classification,
      acquisitionDate,
      entityId,
      userId,
    },
  });
  res.json(batch);
});

// DELETE /api/batches/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.aCCU.delete({
    where: { id },
  });
  res.json({ message: 'Batch deleted successfully' });
});

export default router;