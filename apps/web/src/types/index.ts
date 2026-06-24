export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface Trip {
  id: string;
  name: string;
  description?: string | null;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  currency: string;
  coverImage?: string | null;
  status: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  members: TripMember[];
  _count?: { members: number };
  itinerary?: ItineraryItem[];
  expenses?: Expense[];
  polls?: Poll[];
  activities?: Activity[];
}

export interface TripMember {
  id: string;
  userId: string;
  tripId: string;
  role: string;
  joinedAt: string;
  user: User;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  description?: string | null;
  type: string;
  location?: string | null;
  startTime: string;
  endTime?: string | null;
  cost?: number | null;
  bookingRef?: string | null;
  order: number;
  createdBy: string;
}

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  category: string;
  paidById: string;
  paidBy: User;
  date: string;
  shares: ExpenseShare[];
}

export interface ExpenseShare {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  settled: boolean;
  settledAt?: string | null;
  user: User;
}

export interface Poll {
  id: string;
  tripId: string;
  question: string;
  status: string;
  createdBy: string;
  createdAt: string;
  endsAt?: string | null;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  order: number;
  _count: { votes: number };
  votes?: { userId: string }[];
}

export interface Activity {
  id: string;
  tripId: string;
  type: string;
  description: string;
  userId: string;
  metadata?: unknown;
  createdAt: string;
  user: User;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
