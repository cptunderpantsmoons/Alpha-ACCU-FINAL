import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Get all loans
router.get('/', async (req, res) => {
  const loans = await prisma.loan.findMany();
  res.json(loans);
});

// Get a loan by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const loan = await prisma.loan.findUnique({
    where: { id: id },
  });
  res.json(loan);
});

// Create a new loan
router.post('/', async (req, res) => {
  const newLoan = await prisma.loan.create({
    data: req.body,
  });
  res.json(newLoan);
});

// Update a loan
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedLoan = await prisma.loan.update({
    where: { id: id },
    data: req.body,
  });
  res.json(updatedLoan);
});

// Delete a loan
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.loan.delete({
    where: { id: id },
  });
  res.json({ message: 'Loan deleted successfully' });
});

export default router;