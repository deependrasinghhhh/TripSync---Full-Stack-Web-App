import { OpenAI } from "openai";
import { env } from "./env.js";

export const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

export async function generateItinerary(destination: string, budget: number, groupSize: number, days: number) {
  if (!openai) throw new Error("OpenAI not configured");
  const prompt = `Plan a ${days}-day trip to ${destination} for ${groupSize} people with a budget of ₹${budget}. Return ONLY valid JSON in this format: {"days": [{"day": 1, "activities": [{"title": "string", "description": "string", "estimatedCost": number, "type": "ACTIVITY"|"RESTAURANT"|"FLIGHT"|"HOTEL"|"TRANSPORT"}]}]}.`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0]?.message?.content || "{}");
}

export async function estimateBudget(destination: string, groupSize: number, days: number) {
  if (!openai) throw new Error("OpenAI not configured");
  const prompt = `Estimate a total budget for a ${days}-day trip to ${destination} for ${groupSize} people. Return ONLY valid JSON: {"totalEstimated": number, "breakdown": {"accommodation": number, "transport": number, "food": number, "activities": number, "misc": number}}.`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0]?.message?.content || "{}");
}

export async function suggestActivities(destination: string) {
  if (!openai) throw new Error("OpenAI not configured");
  const prompt = `Suggest 5 must-do activities in ${destination}. Return ONLY valid JSON: {"activities": [{"title": "string", "description": "string", "estimatedCost": number, "type": "ACTIVITY"|"RESTAURANT"|"OTHER"}]}.`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0]?.message?.content || "{}");
}
