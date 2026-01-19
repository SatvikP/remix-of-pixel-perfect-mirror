import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Check } from "lucide-react";
import { z } from "zod";
import type { Session } from "@supabase/supabase-js";
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
const Auth = () => {
  const [showGetStarted, setShowGetStarted] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        navigate("/", {
          replace: true
        });
      }
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      if (session) {
        navigate("/", {
          replace: true
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const {
      error
    } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setGoogleLoading(false);
    }
  };
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = authSchema.safeParse({
      email,
      password
    });
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    if (isLogin) {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } else {
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account Exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Account Created",
          description: "You can now sign in with your credentials."
        });
        setIsLogin(true);
      }
    }
    setLoading(false);
  };
  const features = ["Works with your CRM.", "We track market trends in real-time", "Get weekly: \"Top 5 startups to talk to + why\""];

  // Get Started Landing Page
  if (showGetStarted) {
    return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{
      background: "linear-gradient(180deg, #050414 0%, #17155D 45%, #9b8ec7 100%)"
    }}>
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            
            <h1 className="text-4xl md:text-5xl font-bold text-white">FundRadar</h1>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Stop guessing which startups to call this week
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-white/80">
            Identify <em className="font-medium text-white">early signals</em> before trends hit mainstream
          </p>

          {/* Feature List */}
          <div className="space-y-4 text-left mx-auto max-w-sm pt-4">
            {features.map((feature, index) => <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <span className="text-white/90 text-base">{feature}</span>
              </div>)}
          </div>

          {/* Get Started Button */}
          <div className="pt-6">
            <Button onClick={() => setShowGetStarted(false)} className="h-12 px-8 rounded-full font-semibold text-base transition-all hover:opacity-90 hover:scale-105" style={{
            backgroundColor: "#FFFFFF",
            color: "#050414"
          }}>
              Get Started
            </Button>
          </div>

          {/* Footer Text */}
          <p className="text-base text-white/60 pt-4">
            Built for Seed-Series A VCs tracking 500+ startups.
          </p>

          {/* Story Link */}
          <Link 
            to="/story" 
            className="inline-block text-sm text-white/70 hover:text-white underline underline-offset-4 transition-colors"
          >
            Read our story →
          </Link>
        </div>
      </div>;
  }

  // Login/Signup Form
  return <div className="min-h-screen flex items-center justify-center p-4" style={{
    background: "radial-gradient(110% 85% at 55% 55%, rgba(107,99,204,0.95) 0%, rgba(23,21,93,0.92) 38%, rgba(5,4,20,1) 78%)"
  }}>
      <div className="w-full max-w-md rounded-2xl p-8 backdrop-blur-xl animate-fade-in" style={{
      background: "rgba(255, 255, 255, 0.08)",
      border: "1px solid rgba(255, 255, 255, 0.18)",
      boxShadow: "0 18px 60px rgba(5,4,20,0.4)"
    }}>
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-white" />
            <h1 className="text-2xl font-bold text-white">FundRadar</h1>
          </div>
          <p style={{
          color: "rgba(255,255,255,0.62)"
        }}>
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Google Sign In */}
          <Button variant="outline" className="w-full h-12 text-base font-medium rounded-full bg-transparent text-white hover:bg-white/10 transition-colors" style={{
          border: "1px solid rgba(255,255,255,0.18)"
        }} onClick={handleGoogleSignIn} disabled={googleLoading}>
            {googleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full" style={{
              borderTop: "1px solid rgba(255,255,255,0.18)"
            }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 text-xs" style={{
              backgroundColor: "rgba(23,21,93,0.5)",
              color: "rgba(255,255,255,0.62)"
            }}>
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 rounded-xl text-white placeholder:text-white/40 focus:ring-2 focus:ring-offset-0" style={{
              backgroundColor: "rgba(5,4,20,0.4)",
              border: "1px solid rgba(255,255,255,0.18)"
            }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 rounded-xl text-white placeholder:text-white/40 focus:ring-2 focus:ring-offset-0" style={{
              backgroundColor: "rgba(5,4,20,0.4)",
              border: "1px solid rgba(255,255,255,0.18)"
            }} />
            </div>
            <Button type="submit" className="w-full h-11 rounded-full font-medium text-base transition-all hover:opacity-90" style={{
            backgroundColor: "#FFFFFF",
            color: "#050414"
          }} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center text-sm">
            <span style={{
            color: "rgba(255,255,255,0.62)"
          }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button type="button" className="font-medium hover:underline transition-colors" style={{
            color: "#A49FE0"
          }} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

          {/* Back to Landing */}
          <div className="text-center">
            <button type="button" className="text-sm hover:underline transition-colors" style={{
            color: "rgba(255,255,255,0.5)"
          }} onClick={() => setShowGetStarted(true)}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;