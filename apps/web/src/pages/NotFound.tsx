import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Compass, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/3 left-1/3 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="text-center space-y-6 max-w-md animate-scale-in">
        <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 items-center justify-center shadow-lg shadow-purple-500/25 mb-4">
          <Compass className="h-8 w-8 text-white animate-spin-slow" />
        </div>

        <h1 className="text-6xl font-extrabold tracking-tight gradient-text">404</h1>
        <h2 className="text-2xl font-bold">Lost in Translation?</h2>
        <p className="text-muted-foreground">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button variant="outline" className="w-full sm:w-auto gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button className="w-full sm:w-auto gap-2" onClick={() => navigate("/")}>
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
