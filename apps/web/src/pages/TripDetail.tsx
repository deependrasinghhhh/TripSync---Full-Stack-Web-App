import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import {
  Compass, Calendar, IndianRupee, MapPin, Plus, Users, Sparkles, Receipt, Vote,
  History, Copy, Check, Trash2, Wallet, CheckSquare, BarChart3, Loader2, Info,
  Plane, Hotel, Star, Utensils, Car, MoreHorizontal, AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ExpenseChart } from "@/components/ExpenseChart";
import type { Trip, ItineraryItem, Expense, Poll } from "@/types";

const ITINERARY_TYPE_ICONS: Record<string, any> = {
  FLIGHT: Plane,
  HOTEL: Hotel,
  ACTIVITY: Star,
  RESTAURANT: Utensils,
  TRANSPORT: Car,
  OTHER: MoreHorizontal,
};

const ITINERARY_TYPE_COLORS: Record<string, string> = {
  FLIGHT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  HOTEL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ACTIVITY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  RESTAURANT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  TRANSPORT: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  OTHER: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  // Modal states
  const [isAddItineraryOpen, setIsAddItineraryOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddPollOpen, setIsAddPollOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Form states - Itinerary
  const [itiTitle, setItiTitle] = useState("");
  const [itiDescription, setItiDescription] = useState("");
  const [itiType, setItiType] = useState("ACTIVITY");
  const [itiLocation, setItiLocation] = useState("");
  const [itiStartTime, setItiStartTime] = useState("");
  const [itiEndTime, setItiEndTime] = useState("");
  const [itiCost, setItiCost] = useState("");
  const [itiBookingRef, setItiBookingRef] = useState("");

  // Form states - Expense
  const [expTitle, setExpTitle] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("FOOD");
  const [expPaidBy, setExpPaidBy] = useState("");
  const [expSplitType, setExpSplitType] = useState<"EQUAL" | "CUSTOM" | "PERCENTAGE">("EQUAL");
  const [expCustomSplits, setExpCustomSplits] = useState<Record<string, number>>({});

  // Form states - Poll
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Form states - AI Assistant
  const [aiPromptType, setAiPromptType] = useState<"itinerary" | "budget" | "activities">("itinerary");
  const [aiDays, setAiDays] = useState("3");
  const [aiBudget, setAiBudget] = useState("20000");
  const [aiGroupSize, setAiGroupSize] = useState("2");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Fetch Trip Details
  const { data: trip, isLoading, error } = useQuery<Trip>({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data } = await api.get(`/trips/${id}`);
      return data;
    },
  });

  // Fetch Member Net Balances
  const { data: balances } = useQuery<Record<string, { name: string; net: number }>>({
    queryKey: ["balances", id],
    queryFn: async () => {
      const { data } = await api.get(`/expenses/trip/${id}/balances`);
      return data;
    },
    enabled: !!id,
  });

  // Setup WebSocket connection
  useEffect(() => {
    if (!id) return;

    socket.connect();
    socket.emit("join-trip", id);

    const handleTripMutated = () => {
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      queryClient.invalidateQueries({ queryKey: ["balances", id] });
    };

    socket.on("trip-mutated", handleTripMutated);

    return () => {
      socket.emit("leave-trip", id);
      socket.off("trip-mutated", handleTripMutated);
      socket.disconnect();
    };
  }, [id, queryClient]);

  // Set default paidBy when trip details load
  useEffect(() => {
    if (trip && trip.members.length > 0 && !expPaidBy) {
      setExpPaidBy(trip.members[0].userId);
    }
  }, [trip, expPaidBy]);

  // Mutations
  const addItineraryMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/itinerary", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      socket.emit("trip-mutation", id);
      setIsAddItineraryOpen(false);
      resetItineraryForm();
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/expenses", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      queryClient.invalidateQueries({ queryKey: ["balances", id] });
      socket.emit("trip-mutation", id);
      setIsAddExpenseOpen(false);
      resetExpenseForm();
    },
  });

  const addPollMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/polls", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      socket.emit("trip-mutation", id);
      setIsAddPollOpen(false);
      resetPollForm();
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      const { data } = await api.post(`/polls/${pollId}/vote`, { optionId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      socket.emit("trip-mutation", id);
    },
  });

  const settleMutation = useMutation({
    mutationFn: async ({ expenseId, userId }: { expenseId: string; userId: string }) => {
      const { data } = await api.post(`/expenses/${expenseId}/settle`, { userId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      queryClient.invalidateQueries({ queryKey: ["balances", id] });
      socket.emit("trip-mutation", id);
    },
  });

  const resetItineraryForm = () => {
    setItiTitle("");
    setItiDescription("");
    setItiType("ACTIVITY");
    setItiLocation("");
    setItiStartTime("");
    setItiEndTime("");
    setItiCost("");
    setItiBookingRef("");
  };

  const resetExpenseForm = () => {
    setExpTitle("");
    setExpDescription("");
    setExpAmount("");
    setExpCategory("FOOD");
    setExpSplitType("EQUAL");
    setExpCustomSplits({});
  };

  const resetPollForm = () => {
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  const copyInviteCode = () => {
    if (!trip) return;
    navigator.clipboard.writeText(trip.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleItinerarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itiTitle.trim() || !itiStartTime) return;

    addItineraryMutation.mutate({
      tripId: id,
      title: itiTitle,
      description: itiDescription || undefined,
      type: itiType,
      location: itiLocation || undefined,
      startTime: new Date(itiStartTime).toISOString(),
      endTime: itiEndTime ? new Date(itiEndTime).toISOString() : undefined,
      cost: itiCost ? Number(itiCost) : undefined,
      bookingRef: itiBookingRef || undefined,
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(expAmount);
    if (!expTitle.trim() || isNaN(amount) || amount <= 0 || !expPaidBy) return;

    const payload: any = {
      tripId: id,
      title: expTitle,
      description: expDescription || undefined,
      amount,
      category: expCategory,
      paidById: expPaidBy,
      splitType: expSplitType,
    };

    if (expSplitType !== "EQUAL") {
      const splitsArray = Object.entries(expCustomSplits).map(([memberId, val]) => ({
        userId: memberId,
        amount: Number(val),
      }));
      payload.splits = splitsArray;
    }

    addExpenseMutation.mutate(payload);
  };

  const handlePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = pollOptions.filter((o) => o.trim() !== "");
    if (!pollQuestion.trim() || validOptions.length < 2) return;

    addPollMutation.mutate({
      tripId: id,
      question: pollQuestion,
      options: validOptions,
    });
  };

  // AI Actions
  const runAIAssistant = async () => {
    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    try {
      if (aiPromptType === "itinerary") {
        const { data } = await api.post("/ai/generate-itinerary", {
          destination: trip?.destination || trip?.name || "",
          budget: Number(aiBudget),
          groupSize: Number(aiGroupSize),
          days: Number(aiDays),
        });
        setAiResult(data);
      } else if (aiPromptType === "budget") {
        const { data } = await api.post("/ai/estimate-budget", {
          destination: trip?.destination || trip?.name || "",
          groupSize: Number(aiGroupSize),
          days: Number(aiDays),
        });
        setAiResult(data);
      } else if (aiPromptType === "activities") {
        const { data } = await api.post("/ai/suggest-activities", {
          destination: trip?.destination || trip?.name || "",
        });
        setAiResult(data);
      }
    } catch (err: any) {
      setAiError(err.response?.data?.error || "AI Generation failed. Ensure OpenAI API Key is configured.");
    } finally {
      setAiLoading(false);
    }
  };

  // Apply AI suggestions to DB Itinerary
  const applyAIItinerary = async () => {
    if (!aiResult || !aiResult.days) return;
    setAiLoading(true);

    try {
      // Loop and create each activity
      const tripStartDate = trip?.startDate ? new Date(trip.startDate) : new Date();
      for (const dayItem of aiResult.days) {
        const dayOffset = dayItem.day - 1;
        const targetDate = new Date(tripStartDate);
        targetDate.setDate(targetDate.getDate() + dayOffset);

        for (const act of dayItem.activities) {
          // Set a default hour depending on item type or index to separate times
          const actTime = new Date(targetDate);
          actTime.setHours(9 + dayItem.activities.indexOf(act) * 2, 0, 0, 0);

          await api.post("/itinerary", {
            tripId: id,
            title: act.title,
            description: act.description,
            type: act.type || "ACTIVITY",
            cost: act.estimatedCost || undefined,
            startTime: actTime.toISOString(),
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      socket.emit("trip-mutation", id);
      setIsAIOpen(false);
      setAiResult(null);
    } catch (err) {
      setAiError("Failed to apply itinerary items.");
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-3" />
        <h2 className="text-xl font-bold">Failed to load trip details</h2>
        <p className="text-muted-foreground text-sm mt-1">This trip may not exist or you might not have access.</p>
        <Button className="mt-4" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  // Calculate day-wise itinerary
  const itineraryItems = trip.itinerary || [];
  const groupedItinerary: Record<string, ItineraryItem[]> = {};

  itineraryItems.forEach((item: ItineraryItem) => {
    const dateStr = format(new Date(item.startTime), "yyyy-MM-dd");
    if (!groupedItinerary[dateStr]) groupedItinerary[dateStr] = [];
    groupedItinerary[dateStr].push(item);
  });

  const sortedDays = Object.keys(groupedItinerary).sort();

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-8 max-w-7xl mx-auto space-y-8 relative">
      {/* Cover Backdrop */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-purple-600/10 via-violet-600/5 to-transparent -z-10 blur-xl" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">{trip.name}</h1>
            <Badge variant="outline" className="text-xs uppercase tracking-wider">{trip.status}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {trip.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-primary" /> {trip.destination}
              </span>
            )}
            {(trip.startDate || trip.endDate) && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-primary" />
                {trip.startDate && format(new Date(trip.startDate), "MMM d")}
                {trip.endDate && ` — ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
              </span>
            )}
            {trip.budget && (
              <span className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4 text-primary" /> ₹{trip.budget.toLocaleString()} budget
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 shrink-0" onClick={copyInviteCode}>
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : `Code: ${trip.inviteCode}`}
          </Button>

          <Button className="gap-2 shadow-lg shadow-purple-500/20 glow shrink-0" onClick={() => setIsAIOpen(true)}>
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center border-b border-border/40">
          <TabsList className="bg-transparent h-auto p-0 border-none justify-start overflow-x-auto whitespace-nowrap w-full">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 h-auto">Overview</TabsTrigger>
            <TabsTrigger value="itinerary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 h-auto">Itinerary</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 h-auto">Expenses</TabsTrigger>
            <TabsTrigger value="polls" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 h-auto">Polls</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 h-auto">Activity Feed</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-card md:col-span-2">
              <CardHeader>
                <CardTitle>About Trip</CardTitle>
                <CardDescription>Basic trip details and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {trip.description || "No description provided for this trip yet. Click edit trip to add a description and outline for your friends."}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Destination</div>
                    <div className="text-sm font-semibold mt-0.5">{trip.destination || "Not set"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Budget Limit</div>
                    <div className="text-sm font-semibold mt-0.5">₹{trip.budget?.toLocaleString() || "No budget"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Invite Code</div>
                    <div className="text-sm font-semibold mt-0.5">{trip.inviteCode}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Total Days</div>
                    <div className="text-sm font-semibold mt-0.5">
                      {trip.startDate && trip.endDate
                        ? differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>{trip.members.length} friends collaborating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {trip.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.user.name} src={member.user.avatar} size="sm" />
                      <div>
                        <div className="text-sm font-medium">{member.user.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Itinerary */}
        <TabsContent value="itinerary" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Schedule</h2>
              <p className="text-sm text-muted-foreground">Day-by-day plan of flights, hotels, and activities</p>
            </div>
            <Button className="gap-2" onClick={() => setIsAddItineraryOpen(true)}>
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>

          {sortedDays.length === 0 ? (
            <Card className="glass-card py-12 text-center max-w-md mx-auto border-dashed">
              <CardContent className="space-y-4">
                <Calendar className="h-10 w-10 text-primary mx-auto" />
                <CardTitle className="text-lg">Itinerary is empty</CardTitle>
                <CardDescription>
                  Start adding events manually or click the AI Assistant button to auto-generate a custom itinerary.
                </CardDescription>
                <Button variant="outline" size="sm" onClick={() => setIsAddItineraryOpen(true)}>Add First Item</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {sortedDays.map((dateStr) => {
                const dayItems = groupedItinerary[dateStr];
                const dayNum = trip.startDate
                  ? differenceInDays(new Date(dateStr), new Date(trip.startDate)) + 1
                  : null;

                return (
                  <div key={dateStr} className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                      <h3 className="text-lg font-bold">Day {dayNum}</h3>
                      <span className="text-sm text-muted-foreground">— {format(new Date(dateStr), "EEEE, MMM d, yyyy")}</span>
                    </div>

                    <div className="space-y-3 pl-2">
                      {dayItems.map((item) => {
                        const Icon = ITINERARY_TYPE_ICONS[item.type] || MoreHorizontal;
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 transition-all duration-200"
                          >
                            <div className={`p-2.5 rounded-lg border ${ITINERARY_TYPE_COLORS[item.type] || "bg-muted text-muted-foreground"}`}>
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold text-sm sm:text-base leading-snug">{item.title}</h4>
                                  {item.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <MapPin className="h-3 w-3 text-primary" /> {item.location}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-semibold px-2 py-1 rounded bg-muted">
                                    {format(new Date(item.startTime), "h:mm a")}
                                  </span>
                                  {item.cost && (
                                    <div className="text-sm font-semibold mt-1">₹{item.cost.toLocaleString()}</div>
                                  )}
                                </div>
                              </div>

                              {item.description && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-2 border-t border-border/20 pt-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}

                              {item.bookingRef && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  Ref: <span className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">{item.bookingRef}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Expenses */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Split Expenses</h2>
              <p className="text-sm text-muted-foreground">Keep track of spending and who owes what</p>
            </div>
            <Button className="gap-2" onClick={() => setIsAddExpenseOpen(true)}>
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* Balances summary */}
              {balances && Object.keys(balances).length > 0 && (
                <Card className="glass-card">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" /> Settlement Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0">
                    {Object.entries(balances).map(([userId, bal]) => (
                      <div key={userId} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
                        <span className="text-sm font-medium">{bal.name}</span>
                        <span className={`text-sm font-bold ${bal.net < 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {bal.net < 0 ? `Owes ₹${Math.abs(bal.net).toLocaleString()}` : `Owed ₹${bal.net.toLocaleString()}`}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Expense list */}
              <div className="space-y-3">
                <h3 className="font-bold text-base">Expense History</h3>
                {trip.expenses && trip.expenses.length > 0 ? (
                  trip.expenses.map((expense: Expense) => {
                    return (
                      <div
                        key={expense.id}
                        className="p-4 rounded-xl border border-border/50 bg-card/40 flex items-center justify-between gap-4 hover:bg-card/70 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base truncate">{expense.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            Paid by <span className="text-foreground font-medium">{expense.paidBy.name}</span> • {format(new Date(expense.date), "MMM d")}
                          </p>
                          {expense.description && (
                            <p className="text-xs text-muted-foreground italic truncate">{expense.description}</p>
                          )}
                          <div className="flex gap-1.5 flex-wrap pt-1.5">
                            <Badge variant="outline" className="text-[10px] py-0">{expense.category}</Badge>
                            {expense.shares.filter((s: any) => !s.settled && s.amount > 0).map((s: any) => (
                              <button
                                key={s.id}
                                onClick={() => settleMutation.mutate({ expenseId: expense.id, userId: s.userId })}
                                className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all"
                                title="Click to Settle share"
                              >
                                Settle {s.user.name}: ₹{s.amount}
                              </button>
                            ))}
                            {expense.shares.every((s: any) => s.settled) && (
                              <Badge variant="success" className="text-[10px] py-0">Fully Settled</Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-base sm:text-lg">₹{expense.amount.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <Card className="glass-card py-12 text-center max-w-sm mx-auto border-dashed">
                    <CardContent className="space-y-3">
                      <Receipt className="h-8 w-8 text-primary mx-auto" />
                      <CardTitle className="text-sm font-semibold">No expenses recorded</CardTitle>
                      <CardDescription>Track food, transport, lodging cost and split equally.</CardDescription>
                      <Button variant="outline" size="sm" onClick={() => setIsAddExpenseOpen(true)}>Add Expense</Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <Card className="glass-card h-fit">
              <CardHeader>
                <CardTitle>Spending Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseChart expenses={trip.expenses || []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Polls */}
        <TabsContent value="polls" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Group Polls</h2>
              <p className="text-sm text-muted-foreground">Vote on details with group consensus</p>
            </div>
            <Button className="gap-2" onClick={() => setIsAddPollOpen(true)}>
              <Plus className="h-4 w-4" /> Create Poll
            </Button>
          </div>

          {trip.polls && trip.polls.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {trip.polls.map((poll: Poll) => {
                const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt._count.votes, 0);

                return (
                  <Card key={poll.id} className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg leading-snug">{poll.question}</CardTitle>
                      <CardDescription>Total votes: {totalVotes}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {poll.options.map((option: any) => {
                        const pct = totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0;
                        const hasVoted = option.votes?.some((v: any) => v.userId === socket.id) || false; // Or checking current user id

                        return (
                          <div key={option.id} className="space-y-1.5">
                            <button
                              onClick={() => voteMutation.mutate({ pollId: poll.id, optionId: option.id })}
                              className="w-full flex items-center justify-between text-left p-3 rounded-lg border border-border/50 bg-card/20 hover:bg-primary/5 hover:border-primary/30 transition-all relative overflow-hidden group"
                            >
                              {/* Background progress indicator */}
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500 -z-10"
                                style={{ width: `${pct}%` }}
                              />
                              <span className="text-sm font-medium pr-4">{option.text}</span>
                              <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                {pct}% ({option._count.votes})
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="glass-card py-12 text-center max-w-md mx-auto border-dashed">
              <CardContent className="space-y-4">
                <Vote className="h-10 w-10 text-primary mx-auto" />
                <CardTitle className="text-lg">No active polls</CardTitle>
                <CardDescription>
                  Need to make group decisions on lodging, dates or restaurants? Open a vote.
                </CardDescription>
                <Button variant="outline" size="sm" onClick={() => setIsAddPollOpen(true)}>Create Poll</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 5: Activity Feed */}
        <TabsContent value="activity">
          <Card className="glass-card max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary animate-spin-slow" /> Action Log
              </CardTitle>
              <CardDescription>Latest collaborative activities of your trip</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={trip.activities || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Itinerary Dialog */}
      <Dialog open={isAddItineraryOpen} onOpenChange={setIsAddItineraryOpen}>
        <DialogContent className="max-w-md" onClose={() => setIsAddItineraryOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Itinerary Item</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleItinerarySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
              <select
                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={itiType}
                onChange={(e) => setItiType(e.target.value)}
              >
                <option value="FLIGHT">Flight</option>
                <option value="HOTEL">Hotel</option>
                <option value="ACTIVITY">Activity</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="TRANSPORT">Transport</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title *</label>
              <Input
                placeholder="e.g. Flight to Leh, Dinner at Chopsticks"
                value={itiTitle}
                onChange={(e) => setItiTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</label>
              <Input
                placeholder="e.g. Indira Gandhi International Airport"
                value={itiLocation}
                onChange={(e) => setItiLocation(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <Input
                placeholder="Details like seat numbers, reservation info"
                value={itiDescription}
                onChange={(e) => setItiDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Time *</label>
                <Input
                  type="datetime-local"
                  value={itiStartTime}
                  onChange={(e) => setItiStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Time</label>
                <Input
                  type="datetime-local"
                  value={itiEndTime}
                  onChange={(e) => setItiEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimated Cost (INR)</label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={itiCost}
                  onChange={(e) => setItiCost(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking Reference</label>
                <Input
                  placeholder="e.g. PNR-12345"
                  value={itiBookingRef}
                  onChange={(e) => setItiBookingRef(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddItineraryOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addItineraryMutation.isPending}>
                {addItineraryMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="max-w-md" onClose={() => setIsAddExpenseOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title *</label>
              <Input
                placeholder="e.g. Cab fare to Pangong Lake"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <Input
                placeholder="Cab booking info, tips paid, details"
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount (INR) *</label>
                <Input
                  type="number"
                  placeholder="e.g. 1500"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                >
                  <option value="ACCOMMODATION">Accommodation</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="FOOD">Food</option>
                  <option value="ACTIVITIES">Activities</option>
                  <option value="SHOPPING">Shopping</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid By</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={expPaidBy}
                  onChange={(e) => setExpPaidBy(e.target.value)}
                >
                  {trip.members.map((m) => (
                    <option key={m.id} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Split Type</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={expSplitType}
                  onChange={(e) => setExpSplitType(e.target.value as any)}
                >
                  <option value="EQUAL">Split Equally</option>
                  <option value="CUSTOM">Custom Amount</option>
                </select>
              </div>
            </div>

            {/* Custom Split Inputs */}
            {expSplitType === "CUSTOM" && (
              <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Custom splits:</div>
                {trip.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium truncate">{m.user.name}</span>
                    <div className="relative w-32">
                      <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-7 h-8 text-xs"
                        value={expCustomSplits[m.userId] || ""}
                        onChange={(e) => setExpCustomSplits({
                          ...expCustomSplits,
                          [m.userId]: Number(e.target.value),
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addExpenseMutation.isPending}>
                {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Poll Dialog */}
      <Dialog open={isAddPollOpen} onOpenChange={setIsAddPollOpen}>
        <DialogContent className="max-w-md" onClose={() => setIsAddPollOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Group Poll</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePollSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Question *</label>
              <Input
                placeholder="e.g. Which dates work best? Where should we have lunch?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Options *</label>
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const copy = [...pollOptions];
                      copy[i] = e.target.value;
                      setPollOptions(copy);
                    }}
                    required={i < 2}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        const copy = [...pollOptions];
                        copy.splice(i, 1);
                        setPollOptions(copy);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1 mt-2 text-xs"
                onClick={() => setPollOptions([...pollOptions, ""])}
              >
                <Plus className="h-3 w-3" /> Add Option
              </Button>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddPollOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addPollMutation.isPending}>
                {addPollMutation.isPending ? "Create Poll" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto" onClose={() => setIsAIOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" /> AI Planning Assistant
            </DialogTitle>
            <DialogDescription>
              Leverage AI to estimate budgets, suggest activities, or generate full schedules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex border-b border-border">
              <button
                className={`flex-1 pb-2 font-semibold text-sm ${aiPromptType === "itinerary" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                onClick={() => { setAiPromptType("itinerary"); setAiResult(null); }}
              >
                Generate Itinerary
              </button>
              <button
                className={`flex-1 pb-2 font-semibold text-sm ${aiPromptType === "budget" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                onClick={() => { setAiPromptType("budget"); setAiResult(null); }}
              >
                Estimate Budget
              </button>
              <button
                className={`flex-1 pb-2 font-semibold text-sm ${aiPromptType === "activities" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                onClick={() => { setAiPromptType("activities"); setAiResult(null); }}
              >
                Suggest Activities
              </button>
            </div>

            {/* Inputs based on type */}
            <div className="grid grid-cols-3 gap-3">
              {aiPromptType !== "activities" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Days</label>
                    <Input type="number" value={aiDays} onChange={(e) => setAiDays(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Group Size</label>
                    <Input type="number" value={aiGroupSize} onChange={(e) => setAiGroupSize(e.target.value)} />
                  </div>
                </>
              )}
              {aiPromptType === "itinerary" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Budget (INR)</label>
                  <Input type="number" value={aiBudget} onChange={(e) => setAiBudget(e.target.value)} />
                </div>
              )}
            </div>

            {aiError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-red-400 text-sm flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0" />
                {aiError}
              </div>
            )}

            <Button className="w-full gap-2" onClick={runAIAssistant} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiLoading ? "Thinking..." : `Generate AI ${aiPromptType}`}
            </Button>

            {/* Result display */}
            {aiResult && (
              <div className="mt-4 p-4 rounded-xl border border-border bg-card/50 space-y-4">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">AI Suggestions</h4>

                {/* Itinerary result */}
                {aiPromptType === "itinerary" && aiResult.days && (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {aiResult.days.map((d: any) => (
                      <div key={d.day} className="space-y-2 border-l-2 border-purple-500/30 pl-3">
                        <div className="font-semibold text-xs text-purple-400">Day {d.day}</div>
                        {d.activities.map((a: any, j: number) => (
                          <div key={j} className="text-xs sm:text-sm">
                            <span className="font-semibold">{a.title}</span> ({a.type})
                            <p className="text-xs text-muted-foreground">{a.description}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                    <Button className="w-full gap-1 mt-4" size="sm" onClick={applyAIItinerary} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                      Apply and Write to Itinerary
                    </Button>
                  </div>
                )}

                {/* Budget result */}
                {aiPromptType === "budget" && aiResult.totalEstimated && (
                  <div className="space-y-2 text-sm">
                    <div className="text-lg font-bold">Total Estimated: ₹{aiResult.totalEstimated.toLocaleString()}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-2 mt-2">
                      <div>Accommodation: ₹{aiResult.breakdown.accommodation.toLocaleString()}</div>
                      <div>Transport: ₹{aiResult.breakdown.transport.toLocaleString()}</div>
                      <div>Food: ₹{aiResult.breakdown.food.toLocaleString()}</div>
                      <div>Activities: ₹{aiResult.breakdown.activities.toLocaleString()}</div>
                      <div>Misc: ₹{aiResult.breakdown.misc.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* Activities result */}
                {aiPromptType === "activities" && aiResult.activities && (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {aiResult.activities.map((a: any, j: number) => (
                      <div key={j} className="p-3 rounded border border-border bg-muted/20">
                        <div className="font-semibold text-sm">{a.title}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                        {a.estimatedCost && <div className="text-xs font-semibold mt-1">Est: ₹{a.estimatedCost}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
