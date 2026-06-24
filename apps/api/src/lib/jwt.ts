import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "./env.js";

export const generateAccessToken = (userId: string) =>
  jwt.sign({ userId, jti: crypto.randomUUID() }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });

export const generateRefreshToken = (userId: string) =>
  jwt.sign({ userId, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
