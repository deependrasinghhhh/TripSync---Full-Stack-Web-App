import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Compass, Users, Calendar, Receipt, Vote, Sparkles, ArrowRight, Globe2, Shield, Zap } from "lucide-react";

const features = [
  { icon: Calendar, title: "Smart Itineraries", description: "Plan day-by-day schedules with flights, hotels, activities, and more. AI-powered suggestions included.", color: "from-violet-500 to-purple-600" },
  { icon: Receipt, title: "Expense Splitting", description: "Track expenses, split bills equally or custom, and settle debts with our smart simplification algorithm.", color: "from-blue-500 to-cyan-500" },
  { icon: Vote, title: "Group Voting", description: "Can't decide? Create polls and let your group vote on destinations, activities, or restaurants.", color: "from-emerald-500 to-teal-500" },
  { icon: Users, title: "Real-Time Sync", description: "Every change syncs instantly. See updates from your group in real-time via WebSockets.", color: "from-orange-500 to-red-500" },
  { icon: Sparkles, title: "AI Assistant", description: "Generate full itineraries, estimate budgets, and get activity suggestions powered by AI.", color: "from-pink-500 to-rose-500" },
  { icon: Shield, title: "Secure & Private", description: "JWT authentication, encrypted data, and invite-only trips keep your plans private.", color: "from-indigo-500 to-blue-600" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-purple-600/5 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground mb-8 animate-fade-in">
            <Globe2 className="h-4 w-4 text-primary" />
            <span>Collaborative Travel Planning for Groups</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Plan Trips{" "}
            <span className="gradient-text">Together</span>
            <br />
            <span className="text-muted-foreground text-4xl sm:text-5xl lg:text-6xl font-bold">Like Never Before</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            TripSync brings your group together — plan itineraries, split expenses, vote on activities, and stay synced in real-time. All powered by AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button size="xl" onClick={() => navigate("/register")} className="group gap-2">
              Start Planning Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {[
              { value: "100%", label: "Free to Use" },
              { value: "Real-Time", label: "Sync" },
              { value: "AI", label: "Powered" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Plan Together</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From itinerary planning to expense splitting, TripSync has every tool your group needs for a seamless travel experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-border/50 bg-card/50 hover-lift cursor-default"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center glass-card p-12">
          <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to Plan Your Next Trip?</h2>
          <p className="text-muted-foreground mb-8">
            Create your first trip in under a minute. Invite friends with a simple code.
          </p>
          <Button size="xl" onClick={() => navigate("/register")} className="gap-2">
            Get Started — It's Free
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <span className="font-medium">TripSync</span>
          </div>
          <p>© {new Date().getFullYear()} TripSync. Plan together, travel better.</p>
        </div>
      </footer>
    </div>
  );
}
