import { OpenAI } from "openai";
import { env } from "./env.js";

export const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

// Fallback Generators to support running the app without an OpenAI key
function getFallbackItinerary(destination: string, budget: number, groupSize: number, days: number) {
  const destLower = destination.toLowerCase();
  
  // Custom activities depending on destination keyword
  let activitiesPool = [
    { title: "Explore City Center", description: "Walk around the city center, visit local cafes and historical landmarks.", costPercent: 0.05, type: "ACTIVITY" },
    { title: "Local Dinner Experience", description: "Taste local authentic cuisine at a top-rated traditional restaurant.", costPercent: 0.08, type: "RESTAURANT" },
    { title: "Museum & Art Gallery Tour", description: "Explore the most famous museums and galleries in the city.", costPercent: 0.06, type: "ACTIVITY" },
    { title: "Scenic City View Point", description: "Visit a scenic lookout point, rooftop bar, or deck to see the city skyline.", costPercent: 0.04, type: "ACTIVITY" },
    { title: "Guided Historic Walking Tour", description: "Learn about the rich history of the area from a certified local guide.", costPercent: 0.05, type: "ACTIVITY" },
    { title: "Shopping at Local Markets", description: "Find unique souvenirs, handmade crafts, and local treats at the bustling markets.", costPercent: 0.07, type: "ACTIVITY" },
    { title: "Relaxing Park/Beach Picnic", description: "Spend a relaxing afternoon in a beautiful local park or beach with snacks.", costPercent: 0.03, type: "ACTIVITY" },
    { title: "Traditional Cultural Show", description: "Watch a live cultural performance, dance, or music show.", costPercent: 0.07, type: "ACTIVITY" },
    { title: "Fancy Fine Dining", description: "Enjoy an upscale dinner celebrating the local culinary heritage.", costPercent: 0.12, type: "RESTAURANT" },
    { title: "Nature Trails & Hiking", description: "Explore scenic nature paths, waterfalls, or mountain trails nearby.", costPercent: 0.04, type: "ACTIVITY" }
  ];

  if (destLower.includes("goa") || destLower.includes("beach") || destLower.includes("bali") || destLower.includes("phuket") || destLower.includes("maldives")) {
    activitiesPool = [
      { title: "Beach Sunrise & Breakfast", description: "Enjoy a fresh breakfast by the ocean side as the sun rises.", costPercent: 0.05, type: "RESTAURANT" },
      { title: "Water Sports Adventure", description: "Try jet skiing, parasailing, or scuba diving with certified instructors.", costPercent: 0.15, type: "ACTIVITY" },
      { title: "Sunset Beach Walk & Drinks", description: "Stroll along the white sands and grab tropical cocktails/mocktails.", costPercent: 0.06, type: "RESTAURANT" },
      { title: "Island/Coastal Boat Tour", description: "Take a scenic boat cruise around beautiful cliffs and hidden caves.", costPercent: 0.12, type: "ACTIVITY" },
      { title: "Seafront Seafood Feast", description: "Savor freshly caught grilled fish and local coastal delicacies.", costPercent: 0.09, type: "RESTAURANT" },
      { title: "Historic Coastal Fort Visit", description: "Explore the ancient fort ruins overlooking the vast ocean.", costPercent: 0.03, type: "ACTIVITY" },
      { title: "Beach Shack Nightlife", description: "Experience the local beach party vibe, live music, and fire shows.", costPercent: 0.08, type: "ACTIVITY" },
      { title: "Spa & Wellness Massage", description: "Relax with a traditional full-body massage using local aromatic oils.", costPercent: 0.10, type: "ACTIVITY" }
    ];
  } else if (destLower.includes("tokyo") || destLower.includes("japan") || destLower.includes("kyoto")) {
    activitiesPool = [
      { title: "Shibuya Crossing & Hachiko", description: "Experience the world's busiest pedestrian crossing and historic landmarks.", costPercent: 0.02, type: "ACTIVITY" },
      { title: "Ramen Street Lunch", description: "Slurp delicious hot ramen at a highly rated traditional shop.", costPercent: 0.04, type: "RESTAURANT" },
      { title: "Ancient Temple Exploration", description: "Visit peaceful shrines and temples, experiencing serene gardens.", costPercent: 0.03, type: "ACTIVITY" },
      { title: "Electronics & Anime Hub", description: "Explore Akihabara's neon streets, gaming centers, and shops.", costPercent: 0.05, type: "ACTIVITY" },
      { title: "Sushi Conveyor Belt Feast", description: "Enjoy fresh, high-quality sushi in a high-tech conveyor belt setting.", costPercent: 0.08, type: "RESTAURANT" },
      { title: "Futuristic View from Skytree", description: "See breathtaking panoramic views of Tokyo and Mt. Fuji from the deck.", costPercent: 0.08, type: "ACTIVITY" },
      { title: "Traditional Tea Ceremony", description: "Learn the Zen art of matcha tea preparation from a tea master.", costPercent: 0.07, type: "ACTIVITY" },
      { title: "Scenic Garden Stroll", description: "Walk through imperial gardens filled with cherry blossoms or autumn leaves.", costPercent: 0.03, type: "ACTIVITY" }
    ];
  } else if (destLower.includes("paris") || destLower.includes("france")) {
    activitiesPool = [
      { title: "Eiffel Tower Viewpoint", description: "Visit the iconic Eiffel Tower and climb up to the summit for a stunning city view.", costPercent: 0.10, type: "ACTIVITY" },
      { title: "Croissant & Coffee Break", description: "Relax at a classic Parisian corner cafe with freshly baked pastries.", costPercent: 0.03, type: "RESTAURANT" },
      { title: "Louvre Museum Tour", description: "See world-famous art including the Mona Lisa and Venus de Milo.", costPercent: 0.08, type: "ACTIVITY" },
      { title: "Seine River Cruise", description: "Cruise past historic monuments like Notre-Dame and Musee d'Orsay.", costPercent: 0.06, type: "ACTIVITY" },
      { title: "French Bistro Dinner", description: "Indulge in French classics like escargots, confit de canard, and fine cheese.", costPercent: 0.09, type: "RESTAURANT" },
      { title: "Champs-Elysees Walk", description: "Stroll along the world's most beautiful avenue towards the Arc de Triomphe.", costPercent: 0.02, type: "ACTIVITY" },
      { title: "Palace of Versailles Visit", description: "Take a short day trip to explore the opulent palace and pristine gardens.", costPercent: 0.12, type: "ACTIVITY" }
    ];
  } else if (destLower.includes("london") || destLower.includes("uk") || destLower.includes("england")) {
    activitiesPool = [
      { title: "British Museum Exploration", description: "Browse millions of historical artifacts from around the globe (free entry!).", costPercent: 0.01, type: "ACTIVITY" },
      { title: "Traditional Pub Lunch", description: "Savor classic fish & chips paired with a local craft beer or cider.", costPercent: 0.04, type: "RESTAURANT" },
      { title: "Tower of London & Tower Bridge", description: "Discover the Crown Jewels and walk across the famous glass-floor bridge.", costPercent: 0.09, type: "ACTIVITY" },
      { title: "West End Musical Show", description: "Watch an award-winning theater performance in the heart of London.", costPercent: 0.12, type: "ACTIVITY" },
      { title: "High Afternoon Tea", description: "Experience an elegant afternoon tea with scones, sandwiches, and premium tea.", costPercent: 0.08, type: "RESTAURANT" },
      { title: "London Eye Flight", description: "Take a slow-moving flight in a glass pod to view the Parliament and Big Ben.", costPercent: 0.08, type: "ACTIVITY" },
      { title: "Hyde Park & Buckingham Palace", description: "Stroll through the royal park and watch the Changing of the Guard.", costPercent: 0.02, type: "ACTIVITY" }
    ];
  } else if (destLower.includes("new york") || destLower.includes("nyc") || destLower.includes("america") || destLower.includes("usa")) {
    activitiesPool = [
      { title: "Central Park Walk & Rowboat", description: "Explore the green lung of Manhattan, watch street artists, or rent a boat.", costPercent: 0.04, type: "ACTIVITY" },
      { title: "NY Pizza Slice & Coffee", description: "Grab a legendary thin-crust pizza slice at a corner joint.", costPercent: 0.02, type: "RESTAURANT" },
      { title: "Times Square & Broadway Show", description: "Marvel at the neon billboards and watch a stellar live performance.", costPercent: 0.15, type: "ACTIVITY" },
      { title: "Empire State Building Deck", description: "Look down at the glittering city from the iconic 86th-floor observatory.", costPercent: 0.09, type: "ACTIVITY" },
      { title: "Brooklyn Bridge Sunset Walk", description: "Walk across the historic bridge from Manhattan to DUMBO for sunset views.", costPercent: 0.02, type: "ACTIVITY" },
      { title: "Statue of Liberty & Ellis Island", description: "Take the ferry to visit Lady Liberty and learn about immigrant history.", costPercent: 0.07, type: "ACTIVITY" },
      { title: "Rooftop Lounge Dining", description: "Have a delicious modern American dinner overlooking the Manhattan skyline.", costPercent: 0.12, type: "RESTAURANT" }
    ];
  }

  // Generate days
  const perPersonBudget = budget / groupSize;
  const dailyBudget = perPersonBudget / days;
  const daysList = [];

  for (let d = 1; d <= days; d++) {
    const activities = [];
    
    // Select 3 items from the pool based on day index
    for (let i = 0; i < 3; i++) {
      const poolIndex = ((d - 1) * 3 + i) % activitiesPool.length;
      const baseItem = activitiesPool[poolIndex];
      
      const estimatedCost = Math.round(dailyBudget * baseItem.costPercent * groupSize);
      
      activities.push({
        title: baseItem.title,
        description: baseItem.description,
        estimatedCost: estimatedCost > 0 ? estimatedCost : 500,
        type: baseItem.type as any
      });
    }
    
    if (d === 1) {
      activities.unshift({
        title: "Check-in to Hotel",
        description: `Check-in and settle down at your accommodation in ${destination}.`,
        estimatedCost: Math.round(dailyBudget * 0.4 * groupSize),
        type: "HOTEL"
      });
      activities.unshift({
        title: `Arrival at ${destination}`,
        description: "Arrive at the destination airport/station and take a cab to your hotel.",
        estimatedCost: Math.round(dailyBudget * 0.2 * groupSize),
        type: "TRANSPORT"
      });
    }

    daysList.push({
      day: d,
      activities
    });
  }

  return { days: daysList };
}

function getFallbackBudget(destination: string, groupSize: number, days: number) {
  const perPersonDaily = 8000;
  const total = perPersonDaily * groupSize * days;
  
  return {
    totalEstimated: total,
    breakdown: {
      accommodation: Math.round(total * 0.35),
      transport: Math.round(total * 0.25),
      food: Math.round(total * 0.20),
      activities: Math.round(total * 0.15),
      misc: Math.round(total * 0.05)
    }
  };
}

function getFallbackActivities(destination: string) {
  const destLower = destination.toLowerCase();
  let activities = [
    { title: "Walking tour of the historic quarter", description: "Discover the architectural wonders, landmarks, and street food vendors.", estimatedCost: 500, type: "ACTIVITY" },
    { title: "Local Cuisine Tasting Session", description: "Taste the most famous local dishes in a traditional tavern.", estimatedCost: 1200, type: "RESTAURANT" },
    { title: "Visit the City Museum", description: "Learn about the heritage, history, and culture of the region.", estimatedCost: 400, type: "ACTIVITY" },
    { title: "Sunset Panoramic Viewing Deck", description: "Get the best bird's eye view of the city at twilight.", estimatedCost: 800, type: "ACTIVITY" },
    { title: "Handicrafts & Souvenir Market", description: "Shop for unique local crafts, spices, and souvenirs.", estimatedCost: 600, type: "OTHER" }
  ];

  if (destLower.includes("goa") || destLower.includes("beach") || destLower.includes("bali") || destLower.includes("phuket") || destLower.includes("maldives")) {
    activities = [
      { title: "Parasailing & Scuba Diving", description: "Experience high-flying thrills and explore vibrant underwater marine life.", estimatedCost: 2500, type: "ACTIVITY" },
      { title: "Seafood dinner on the beach", description: "Dine with your toes in the sand under the stars with fresh catch of the day.", estimatedCost: 1500, type: "RESTAURANT" },
      { title: "Historic Coastal Fort Exploration", description: "Visit 17th-century ramparts with sweeping vistas of the ocean.", estimatedCost: 200, type: "ACTIVITY" },
      { title: "Ocean Sunset Boat Cruise", description: "Cruise into the sunset with music, dancing, and dolphin watching.", estimatedCost: 1000, type: "ACTIVITY" },
      { title: "Traditional Spa Therapy", description: "Rejuvenate with a relaxing massage and herbal steam bath.", estimatedCost: 1800, type: "OTHER" }
    ];
  } else if (destLower.includes("tokyo") || destLower.includes("japan") || destLower.includes("kyoto")) {
    activities = [
      { title: "Shibuya Crossing & Meiji Shrine", description: "Observe the organized chaos of Shibuya and the tranquil shrine nearby.", estimatedCost: 300, type: "ACTIVITY" },
      { title: "Authentic Omakase Sushi Dinner", description: "Indulge in a premium chef-curated sushi-tasting dinner.", estimatedCost: 5000, type: "RESTAURANT" },
      { title: "Senso-ji Temple & Nakamise Shopping", description: "Explore Tokyo's oldest Buddhist temple and its bustling market stalls.", estimatedCost: 200, type: "ACTIVITY" },
      { title: "Tokyo Skytree Observatory Deck", description: "View the vast neon-lit metropolis from 450 meters above ground.", estimatedCost: 1800, type: "ACTIVITY" },
      { title: "Traditional Tea Ceremony Experience", description: "Learn structural tea etiquette and sample authentic matcha.", estimatedCost: 2000, type: "OTHER" }
    ];
  }
  
  return { activities };
}

export async function generateItinerary(destination: string, budget: number, groupSize: number, days: number) {
  if (!openai) {
    console.warn("OpenAI API Key not set. Using local mock generator for itinerary.");
    return getFallbackItinerary(destination, budget, groupSize, days);
  }
  const prompt = `Plan a ${days}-day trip to ${destination} for ${groupSize} people with a budget of ₹${budget}. Return ONLY valid JSON in this format: {"days": [{"day": 1, "activities": [{"title": "string", "description": "string", "estimatedCost": number, "type": "ACTIVITY"|"RESTAURANT"|"FLIGHT"|"HOTEL"|"TRANSPORT"}]}]}.`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0]?.message?.content || "{}");
}

export async function estimateBudget(destination: string, groupSize: number, days: number) {
  if (!openai) {
    console.warn("OpenAI API Key not set. Using local mock generator for budget estimation.");
    return getFallbackBudget(destination, groupSize, days);
  }
  const prompt = `Estimate a total budget for a ${days}-day trip to ${destination} for ${groupSize} people. Return ONLY valid JSON: {"totalEstimated": number, "breakdown": {"accommodation": number, "transport": number, "food": number, "activities": number, "misc": number}}.`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0]?.message?.content || "{}");
}

export async function suggestActivities(destination: string) {
  if (!openai) {
    console.warn("OpenAI API Key not set. Using local mock generator for activity suggestions.");
    return getFallbackActivities(destination);
  }
  const prompt = `Suggest 5 must-do activities in ${destination}. Return ONLY valid JSON: {"activities": [{"title": "string", "description": "string", "estimatedCost": number, "type": "ACTIVITY"|"RESTAURANT"|"OTHER"}]}.`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0]?.message?.content || "{}");
}
