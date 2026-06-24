import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Compass, Loader2, IndianRupee, Globe2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { TripCard } from "@/components/TripCard";
import { useAuth } from "@/context/AuthContext";
import type { Trip } from "@/types";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // Join Trip form state
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");

  // Create Trip form state
  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [createError, setCreateError] = useState("");

  // Fetch Trips
  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data } = await api.get("/trips");
      return data;
    },
  });

  // Create Trip Mutation
  const createMutation = useMutation({
    mutationFn: async (newTrip: any) => {
      const { data } = await api.post("/trips", newTrip);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.error || "Failed to create trip.");
    },
  });

  // Join Trip Mutation
  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post("/trips/join", { inviteCode: code });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setIsJoinOpen(false);
      setInviteCode("");
      setJoinError("");
    },
    onError: (err: any) => {
      setJoinError(err.response?.data?.error || "Failed to join trip. Please check your code.");
    },
  });

  const resetCreateForm = () => {
    setTripName("");
    setDestination("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setBudget("");
    setCreateError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!tripName.trim()) {
      setCreateError("Trip name is required");
      return;
    }

    const payload: any = {
      name: tripName,
      currency: "INR",
    };

    if (destination.trim()) payload.destination = destination;
    if (description.trim()) payload.description = description;
    if (startDate) payload.startDate = new Date(startDate).toISOString();
    if (endDate) payload.endDate = new Date(endDate).toISOString();
    if (budget) payload.budget = Number(budget);

    createMutation.mutate(payload);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");

    if (!inviteCode.trim()) {
      setJoinError("Invite code is required");
      return;
    }

    joinMutation.mutate(inviteCode);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 md:p-8 max-w-7xl mx-auto space-y-8 relative">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-violet-600/5 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/3 h-72 w-72 rounded-full bg-indigo-600/5 blur-3xl -z-10" />

      {/* Greeting and Quick CTAs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Where to next, <span className="gradient-text">{user?.name}</span>?
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your group trips, collaborate on itineraries, and share expenses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setIsJoinOpen(true)}>
            <Compass className="h-4 w-4" />
            Join Trip
          </Button>
          <Button className="gap-2 shadow-lg shadow-purple-500/20" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Trip
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your trips...</p>
        </div>
      ) : trips && trips.length > 0 ? (
        /* Trips Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="glass-card py-16 text-center max-w-2xl mx-auto border-dashed border-2">
          <CardContent className="space-y-6">
            <div className="h-16 w-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-purple-500/10 animate-bounce-slow">
              <Compass className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">No trips planned yet</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Create a new trip to start planning with friends, or enter an invite code to join a trip that's already in progress.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setIsCreateOpen(true)}>
                Create a New Trip
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setIsJoinOpen(true)}>
                Join Existing Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Trip Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md" onClose={() => setIsCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create a New Trip</DialogTitle>
            <DialogDescription>Set up details for your next adventure.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {createError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-red-400 text-sm">
                {createError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="create-trip-name">Trip Name *</label>
              <Input
                id="create-trip-name"
                placeholder="e.g. Summer in Ladakh"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="create-trip-destination">Destination</label>
              <Input
                id="create-trip-destination"
                placeholder="e.g. Leh, Ladakh, India"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="create-trip-description">Description</label>
              <Input
                id="create-trip-description"
                placeholder="What is this trip about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="create-trip-start">Start Date</label>
                <Input
                  id="create-trip-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="create-trip-end">End Date</label>
                <Input
                  id="create-trip-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="create-trip-budget">Budget (INR)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="create-trip-budget"
                  type="number"
                  placeholder="e.g. 50000"
                  className="pl-10"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="shadow-lg shadow-purple-500/20" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Trip"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Trip Dialog */}
      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent className="max-w-md" onClose={() => setIsJoinOpen(false)}>
          <DialogHeader>
            <DialogTitle>Join a Trip</DialogTitle>
            <DialogDescription>Enter the trip invite code shared by your friends.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            {joinError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-red-400 text-sm">
                {joinError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="join-invite-code">Invite Code</label>
              <div className="relative">
                <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="join-invite-code"
                  placeholder="e.g. ABCD-EFGH"
                  className="pl-10 uppercase"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsJoinOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={joinMutation.isPending}>
                {joinMutation.isPending ? "Joining..." : "Join"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
