import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import pino from "pino";

import { env } from "./lib/env.js";
import authRoutes from "./routes/auth.js";
import tripRoutes from "./routes/trips.js";
import itineraryRoutes from "./routes/itinerary.js";
import expenseRoutes from "./routes/expenses.js";
import pollRoutes from "./routes/polls.js";
import aiRoutes from "./routes/ai.js";
import activityRoutes from "./routes/activities.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: env.FRONTEND_URL, credentials: true } });
const logger = pino({ transport: { target: "pino-pretty", options: { colorize: true } } });

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use((req, _res, next) => { logger.info(`${req.method} ${req.path}`); next(); });

app.use("/auth", authRoutes);
app.use("/trips", tripRoutes);
app.use("/itinerary", itineraryRoutes);
app.use("/expenses", expenseRoutes);
app.use("/polls", pollRoutes);
app.use("/ai", aiRoutes);
app.use("/activities", activityRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on("join-trip", (tripId: string) => { socket.join(tripId); });
  socket.on("leave-trip", (tripId: string) => { socket.leave(tripId); });
  socket.on("trip-mutation", (tripId: string) => {
    socket.to(tripId).emit("trip-mutated");
  });
  socket.on("disconnect", () => { logger.info(`Socket disconnected: ${socket.id}`); });
});

export { io };

const PORT = parseInt(env.PORT, 10);
server.listen(PORT, () => { logger.info(`Server running on http://localhost:${PORT}`); });
