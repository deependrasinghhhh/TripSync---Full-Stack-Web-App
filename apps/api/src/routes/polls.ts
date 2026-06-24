import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  tripId: z.string().uuid(),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  endsAt: z.string().datetime().optional(),
});

router.post("/", validate(createSchema), async (req: AuthRequest, res) => {
  const { tripId, question, options, endsAt } = req.body;
  const poll = await prisma.poll.create({
    data: {
      tripId, question, createdBy: req.userId!,
      endsAt: endsAt ? new Date(endsAt) : null,
      options: { create: options.map((text: string, i: number) => ({ text, order: i })) },
    },
    include: { options: { include: { _count: { select: { votes: true } } } } },
  });
  await prisma.activity.create({
    data: { tripId, type: "POLL_CREATED", description: `Created poll: "${question}"`, userId: req.userId! },
  });
  res.status(201).json(poll);
});

router.get("/trip/:tripId", async (req: AuthRequest, res) => {
  const polls = await prisma.poll.findMany({
    where: { tripId: req.params.tripId },
    include: { options: { include: { _count: { select: { votes: true } }, votes: { select: { userId: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(polls);
});

router.post("/:id/vote", async (req: AuthRequest, res) => {
  const { optionId } = req.body;
  try {
    const vote = await prisma.vote.create({
      data: { pollId: req.params.id, optionId, userId: req.userId! },
    });
    await prisma.activity.create({
      data: { tripId: (await prisma.poll.findUnique({ where: { id: req.params.id } }))!.tripId, type: "VOTE_CAST", description: "Someone voted in a poll", userId: req.userId! },
    });
    res.status(201).json(vote);
  } catch {
    res.status(409).json({ error: "You already voted in this poll" });
  }
});

export default router;
