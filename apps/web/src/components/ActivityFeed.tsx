import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import {
  PlaneTakeoff, Users, CalendarPlus, Receipt, CheckCircle2, Vote, Sparkles, Edit, MapPin
} from "lucide-react";
import type { Activity } from "@/types";

interface ActivityFeedProps {
  activities: Activity[];
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  TRIP_CREATED: <MapPin className="h-4 w-4 text-violet-400" />,
  MEMBER_JOINED: <Users className="h-4 w-4 text-blue-400" />,
  ITINERARY_ADDED: <CalendarPlus className="h-4 w-4 text-emerald-400" />,
  EXPENSE_ADDED: <Receipt className="h-4 w-4 text-amber-400" />,
  EXPENSE_SETTLED: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  POLL_CREATED: <Vote className="h-4 w-4 text-pink-400" />,
  VOTE_CAST: <Vote className="h-4 w-4 text-purple-400" />,
  AI_USED: <Sparkles className="h-4 w-4 text-cyan-400" />,
  TRIP_UPDATED: <Edit className="h-4 w-4 text-orange-400" />,
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <PlaneTakeoff className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">No activity yet</p>
        <p className="text-xs mt-1">Start planning to see updates here</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-1">
      {/* Timeline line */}
      <div className="absolute left-5 top-3 bottom-3 w-px bg-border/50" />

      {activities.map((activity, i) => (
        <div
          key={activity.id}
          className="relative flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="relative z-10 flex-shrink-0 h-10 w-10 rounded-full bg-muted/80 border border-border/50 flex items-center justify-center group-hover:border-primary/30 transition-colors">
            {ACTIVITY_ICONS[activity.type] || <Edit className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm">
              <span className="font-medium">{activity.user.name}</span>{" "}
              <span className="text-muted-foreground">{activity.description.replace(/^(Trip|A new member|Added|Created|Someone|An expense)/, (m) => m.toLowerCase())}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
