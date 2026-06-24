import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      email: "demo@tripsync.com",
      password: hashedPassword,
      name: "Demo User",
    },
  });
  const trip = await prisma.trip.create({
    data: {
      name: "Goa Trip 2026",
      description: "Beach vacation with the squad",
      destination: "Goa, India",
      startDate: new Date("2026-07-15"),
      endDate: new Date("2026-07-18"),
      budget: 30000,
      currency: "INR",
      inviteCode: "GOA-2026-XYZ",
      status: "PLANNING",
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  console.log("Seeded demo user and trip:", { userId: user.id, tripId: trip.id });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
