import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  tripId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  category: z.enum(["ACCOMMODATION", "TRANSPORT", "FOOD", "ACTIVITIES", "SHOPPING", "OTHER"]),
  paidById: z.string().uuid(),
  splitType: z.enum(["EQUAL", "CUSTOM", "PERCENTAGE"]),
  splits: z.array(z.object({ userId: z.string().uuid(), amount: z.number() })).optional(),
});

router.post("/", validate(createSchema), async (req: AuthRequest, res) => {
  const { tripId, title, description, amount, currency, category, paidById, splitType, splits } = req.body;

  let shares: { userId: string; amount: number }[] = [];
  const members = await prisma.tripMember.findMany({ where: { tripId }, select: { userId: true } });
  const memberIds = members.map((m) => m.userId);

  if (splitType === "EQUAL") {
    const shareAmount = +(amount / memberIds.length).toFixed(2);
    shares = memberIds.map((userId) => ({ userId, amount: userId === paidById ? shareAmount - amount : shareAmount }));
  } else if (splits && splits.length > 0) {
    shares = splits.map((s: { userId: string; amount: number }) => ({ userId: s.userId, amount: s.userId === paidById ? s.amount - amount : s.amount }));
  } else {
    shares = memberIds.map((userId) => ({ userId, amount: userId === paidById ? -amount : 0 }));
  }

  const expense = await prisma.expense.create({
    data: { tripId, title, description, amount, currency, category, paidById, shares: { create: shares } },
    include: { paidBy: { select: { id: true, name: true } }, shares: { include: { user: { select: { id: true, name: true } } } } },
  });

  await prisma.activity.create({
    data: { tripId, type: "EXPENSE_ADDED", description: `Added expense "${title}" for ₹${amount}`, userId: req.userId! },
  });
  res.status(201).json(expense);
});

router.get("/trip/:tripId", async (req: AuthRequest, res) => {
  const expenses = await prisma.expense.findMany({
    where: { tripId: req.params.tripId },
    include: { paidBy: { select: { id: true, name: true } }, shares: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(expenses);
});

router.get("/trip/:tripId/balances", async (req: AuthRequest, res) => {
  const { tripId } = req.params;
  const shares = await prisma.expenseShare.findMany({
    where: { expense: { tripId } },
    include: { user: { select: { id: true, name: true } }, expense: { select: { paidById: true, amount: true } } },
  });

  const balances: Record<string, { name: string; net: number }> = {};
  for (const share of shares) {
    if (!balances[share.userId]) balances[share.userId] = { name: share.user.name, net: 0 };
    balances[share.userId].net += share.amount;
  }
  res.json(balances);
});

router.post("/:id/settle", async (req: AuthRequest, res) => {
  const { userId } = req.body;
  await prisma.expenseShare.updateMany({
    where: { expenseId: req.params.id, userId },
    data: { settled: true, settledAt: new Date() },
  });
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id }, select: { tripId: true } });
  if (expense) {
    await prisma.activity.create({
      data: { tripId: expense.tripId, type: "EXPENSE_SETTLED", description: "An expense was settled", userId: req.userId! },
    });
  }
  res.json({ success: true });
});

export default router;
