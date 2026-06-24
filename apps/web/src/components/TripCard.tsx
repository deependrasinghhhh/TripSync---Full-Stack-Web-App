import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { MapPin, Calendar, Users, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import type { Trip } from "@/types";

interface TripCardProps {
  trip: Trip;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "info" | "default" }> = {
  PLANNING: { label: "Planning", variant: "info" },
  UPCOMING: { label: "Upcoming", variant: "warning" },
  ACTIVE: { label: "Active", variant: "success" },
  COMPLETED: { label: "Completed", variant: "default" },
};

export function TripCard({ trip }: TripCardProps) {
  const navigate = useNavigate();
  const status = statusConfig[trip.status] || statusConfig.PLANNING;

  return (
    <div
      onClick={() => navigate(`/trip/${trip.id}`)}
      className="group relative rounded-xl border border-border/50 bg-card overflow-hidden cursor-pointer hover-lift"
    >
      {/* Gradient top accent */}
      <div className="h-32 bg-gradient-to-br from-violet-600/20 via-purple-600/20 to-indigo-600/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        <div className="absolute top-3 right-3">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-colors" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
      </div>

      <div className="p-5 space-y-3 -mt-8 relative">
        <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">{trip.name}</h3>

        {trip.destination && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{trip.destination}</span>
          </div>
        )}

        {(trip.startDate || trip.endDate) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>
              {trip.startDate && format(new Date(trip.startDate), "MMM d")}
              {trip.endDate && ` — ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
            </span>
          </div>
        )}

        {trip.budget && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IndianRupee className="h-3.5 w-3.5 text-primary" />
            <span>₹{trip.budget.toLocaleString()} budget</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex -space-x-2">
            {trip.members.slice(0, 4).map((member) => (
              <Avatar key={member.id} name={member.user.name} src={member.user.avatar} size="sm" />
            ))}
            {trip.members.length > 4 && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-background">
                +{trip.members.length - 4}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {trip.members.length}
          </div>
        </div>
      </div>
    </div>
  );
}
