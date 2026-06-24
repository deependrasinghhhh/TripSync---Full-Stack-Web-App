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
  type: z.enum(["FLIGHT", "HOTEL", "ACTIVITY", "RESTAURANT", "TRANSPORT", "OTHER"]),
  location: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  cost: z.number().positive().optional(),
  bookingRef: z.string().optional(),
});

router.post("/", validate(createSchema), async (req: AuthRequest, res) => {
  const data = req.body;
  const item = await prisma.itineraryItem.create({
    data: { ...data, createdBy: req.userId! },
  });
  await prisma.activity.create({
    data: { tripId: data.tripId, type: "ITINERARY_ADDED", description: `Added "${data.title}" to itinerary`, userId: req.userId! },
  });
  res.status(201).json(item);
});

router.get("/trip/:tripId", async (req: AuthRequest, res) => {
  const items = await prisma.itineraryItem.findMany({
    where: { tripId: req.params.tripId },
    orderBy: { startTime: "asc" },
  });
  res.json(items);
});

router.put("/:id/reorder", async (req: AuthRequest, res) => {
  const { order } = req.body;
  const item = await prisma.itineraryItem.update({
    where: { id: req.params.id },
    data: { order },
  });
  res.json(item);
});

export default router;
