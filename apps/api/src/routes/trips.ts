import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const createTripSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  currency: z.string().default("INR"),
});

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString(36).substring(4, 8).toUpperCase();
}

router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const trips = await prisma.trip.findMany({
    where: { members: { some: { userId: req.userId } } },
    include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(trips);
});

router.post("/", validate(createTripSchema), async (req: AuthRequest, res) => {
  const trip = await prisma.trip.create({
    data: {
      ...req.body,
      inviteCode: generateInviteCode(),
      members: { create: { userId: req.userId!, role: "OWNER" } },
    },
    include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
  });
  await prisma.activity.create({
    data: { tripId: trip.id, type: "TRIP_CREATED", description: `Trip "${trip.name}" was created`, userId: req.userId! },
  });
  res.status(201).json(trip);
});

router.get("/:id", async (req: AuthRequest, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, members: { some: { userId: req.userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      itinerary: { orderBy: { startTime: "asc" } },
      expenses: { include: { paidBy: { select: { id: true, name: true } }, shares: { include: { user: { select: { id: true, name: true } } } } } },
      polls: { include: { options: { include: { _count: { select: { votes: true } } } } } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  res.json(trip);
});

router.post("/join", async (req: AuthRequest, res) => {
  const { inviteCode } = req.body;
  const trip = await prisma.trip.findUnique({ where: { inviteCode: inviteCode.toUpperCase() } });
  if (!trip) return res.status(404).json({ error: "Invalid invite code" });
  const existing = await prisma.tripMember.findUnique({ where: { userId_tripId: { userId: req.userId!, tripId: trip.id } } });
  if (existing) return res.status(409).json({ error: "Already a member" });

  await prisma.tripMember.create({ data: { userId: req.userId!, tripId: trip.id, role: "MEMBER" } });
  await prisma.activity.create({
    data: { tripId: trip.id, type: "MEMBER_JOINED", description: "A new member joined the trip", userId: req.userId! },
  });
  res.json({ success: true, tripId: trip.id });
});

export default router;
