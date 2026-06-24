import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { generateItinerary, estimateBudget, suggestActivities } from "../lib/openai.js";

const router = Router();
router.use(requireAuth);

const itinerarySchema = z.object({
  destination: z.string().min(1),
  budget: z.number().positive(),
  groupSize: z.number().positive().int(),
  days: z.number().positive().int(),
});

const budgetSchema = z.object({
  destination: z.string().min(1),
  groupSize: z.number().positive().int(),
  days: z.number().positive().int(),
});

const activitiesSchema = z.object({
  destination: z.string().min(1),
});

router.post("/generate-itinerary", validate(itinerarySchema), async (req: AuthRequest, res) => {
  try {
    const result = await generateItinerary(req.body.destination, req.body.budget, req.body.groupSize, req.body.days);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/estimate-budget", validate(budgetSchema), async (req: AuthRequest, res) => {
  try {
    const result = await estimateBudget(req.body.destination, req.body.groupSize, req.body.days);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post("/suggest-activities", validate(activitiesSchema), async (req: AuthRequest, res) => {
  try {
    const result = await suggestActivities(req.body.destination);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
