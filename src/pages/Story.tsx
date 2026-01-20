import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Quote,
  Target,
  Mail,
  Filter,
  Eye,
  Linkedin,
  MessageSquare,
  Database,
  Clock,
  Users,
  Zap,
  Rocket,
  Lightbulb,
  GitBranch,
  Network,
  Crown,
} from "lucide-react";

// Timeline data - easily editable
interface TimelineEvent {
  period: string;
  title: string;
  description: string;
  phase: 'sprint' | 'growth' | 'vision';
}

const timelineEvents: TimelineEvent[] = [
  { 
    period: "Day 0", 
    title: "Problem Discovery", 
    description: "VC friend reaches out and defines a problem...", 
    phase: "sprint" 
  },
  { 
    period: "Day 0", 
    title: "Validation", 
    description: "Confirm with other VCs that this is a problem and find adjacent problems.", 
    phase: "sprint" 
  },
  { 
    period: "Day 1", 
    title: "MVP Launch", 
    description: "Build MVP of Startup trend analyzer and incorporate auto email with current events/trends.", 
    phase: "sprint" 
  },
  { 
    period: "Day 1", 
    title: "Feedback Loop", 
    description: "Resend to VCs to understand how we can improve.", 
    phase: "sprint" 
  },
  { 
    period: "Day 2", 
    title: "CRM Integration", 
    description: "Link product with CRM flow, track changes from day to day, keep VCs up to date.", 
    phase: "sprint" 
  },
  { 
    period: "Day 2", 
    title: "Early Adopters", 
    description: "Get real VCs onboard as early adopters.", 
    phase: "sprint" 
  },
  { 
    period: "Day 3", 
    title: "Investor Pitch", 
    description: "Pitch to investors.", 
    phase: "sprint" 
  },
  { 
    period: "Next Month", 
    title: "Knowledge Graph", 
    description: "Restructure data building knowledge graph for better network connections.", 
    phase: "growth" 
  },
  { 
    period: "6 Months", 
    title: "Network Building", 
    description: "Build strong network of founders, builders and VCs to communicate and find one another.", 
    phase: "growth" 
  },
  { 
    period: "1 Year", 
    title: "Innovation Network", 
    description: "Fortified network of human innovation in the age of AI.", 
    phase: "vision" 
  },
];

const getPhaseStyles = (phase: TimelineEvent['phase']) => {
  switch (phase) {
    case 'sprint':
      return {
        badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
        node: 'from-indigo-500 to-blue-500',
        glow: 'shadow-indigo-500/20',
      };
    case 'growth':
      return {
        badge: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
        node: 'from-purple-500 to-pink-500',
        glow: 'shadow-purple-500/20',
      };
    case 'vision':
      return {
        badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        node: 'from-amber-500 to-orange-500',
        glow: 'shadow-amber-500/20',
      };
  }
};
interface Collaborator {
  name: string;
  role: string;
  organization: string;
  quote: string;
  linkedinUrl?: string;
}
const collaborators: Collaborator[] = [
  {
    name: "Antoine Duchein",
    role: "Operations",
    organization: "Entrepreneurs First",
    quote:
      "As a VC I'd like actionable ways to reach out to startups directly — WhatsApp if I have their numbers, or email + a draft of what I should send — within this kind of dashboard.",
    linkedinUrl: "https://www.linkedin.com/in/antoine-duchein/",
  },
  {
    name: "Gaëtan Lavigne",
    role: "VC Associate",
    organization: "Asterion Ventures",
    quote:
      "In pre-seed/seed, we want to see projects before there's a website. When they are in stealth mode the relationship must be established as early as possible.",
    linkedinUrl: "https://www.linkedin.com/in/gaetan-lavigne/",
  },
  {
    name: "Pierina Camarena",
    role: "AI Engineer & VC Scout",
    organization: "Aleph Studios / VC Scout - EWOR",
    quote:
      "Would love to see market growth of certain domains and ranking of quality of sources. VCs already know the basics of how their domain is doing.",
    linkedinUrl: "https://www.linkedin.com/in/pierinacamarena/",
  },
  {
    name: "Titouan Galpin & Tristan Camilli",
    role: "Founders",
    organization: "Luphy (Tech solutions for VCs)",
    quote: "Already send emails via CRM — need that integrated directly into the dashboard for seamless outreach.",
    linkedinUrl: "https://www.linkedin.com/company/luphy/",
  },
];
const vcInsights = [
  {
    quote: "Actionable outreach matters more than rankings",
    emphasis: "Action over scores",
  },
  {
    quote: "We want to see startups before they have a website",
    emphasis: "Stealth-stage access",
  },
  {
    quote: "Human context > quantitative scores at seed",
    emphasis: "Relationship-first",
  },
  {
    quote: "The rating system differs from one type of business to another",
    emphasis: "Context-aware scoring",
  },
];
const painPoints = [
  {
    icon: Database,
    text: "Data scattered across tools",
  },
  {
    icon: Clock,
    text: "CRM goes stale quickly",
  },
  {
    icon: Mail,
    text: "Outreach is manual and slow",
  },
  {
    icon: Users,
    text: "Context lost between platforms",
  },
  {
    icon: Zap,
    text: "Good startups contacted too late",
  },
];
const capabilities = [
  {
    icon: Filter,
    title: "Focused Filtering",
    description: "Sector-first approach — biotech, fintech, climate. Stage-aware filtering from stealth to Series A.",
    features: ["Domain-specific views", "Maturity filtering", "Location-based search"],
  },
  {
    icon: Eye,
    title: "Contextual Startup View",
    description: "Everything you need at a glance: blurb, maturity, location, founder LinkedIn, one-pager logic.",
    features: ["Founder profiles", "Key metrics", "Investment thesis fit"],
  },
  {
    icon: MessageSquare,
    title: "One-Click Outreach",
    description: "Email or WhatsApp with pre-filled drafts. Send directly from the dashboard, no context switching.",
    features: ["Pre-drafted messages", "Direct send", "Personalized context"],
  },
];
export default function Story() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(245,60%,6%)] via-[hsl(245,50%,10%)] to-[hsl(240,50%,15%)]">
      {/* Navigation */}
      <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <h1 className="text-xl font-bold text-white">FundRadar</h1>
          </div>
        </div>
      </header>

      <main className="container py-16 space-y-24">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge variant="outline" className="border-indigo-400/50 text-indigo-300 bg-indigo-500/10">
            Our Story
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Built{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              With VCs
            </span>
            ,
            <br />
            For VCs
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            It all started with a request from a VC friend and grew into a collaborative co-build with investors across
            Europe. This is how we're reshaping deal flow.
          </p>
        </section>

        {/* What VCs Told Us */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">What VCs Told Us</h2>
            <p className="text-white/50">We didn't invent this in isolation. We listened.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {vcInsights.map((insight, index) => (
              <Card
                key={index}
                className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              >
                <CardContent className="p-6 space-y-4">
                  <Quote className="h-8 w-8 text-indigo-400/50" />
                  <p className="text-white/90 text-lg italic">"{insight.quote}"</p>
                  <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-none">
                    {insight.emphasis}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* The Real Problem */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">The Real Problem</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              VCs don't struggle to find startups. They struggle to prioritize and act at the right moment.
            </p>
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm max-w-3xl mx-auto">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <p className="text-2xl text-white/80 font-medium">
                  "Who should I reach out to <span className="text-indigo-400">this week</span> — and why?"
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {painPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                    <point.icon className="h-5 w-5 text-red-400/80 shrink-0" />
                    <span className="text-white/70 text-sm">{point.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* What We Built Together */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">What We Built Together</h2>
            <p className="text-white/50">Three capabilities that matter most.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {capabilities.map((capability, index) => (
              <Card
                key={index}
                className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300 group"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 w-fit group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
                    <capability.icon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{capability.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{capability.description}</p>
                  <ul className="space-y-2">
                    {capability.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm text-white/50">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Collaborators Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">Our Collaborators</h2>
            <p className="text-white/50">The VCs who shaped this tool with us.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {collaborators.map((collaborator, index) => (
              <Card
                key={index}
                className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{collaborator.name}</h4>
                      <p className="text-sm text-indigo-400">{collaborator.role}</p>
                      <p className="text-sm text-white/50">@{collaborator.organization}</p>
                    </div>
                    {collaborator.linkedinUrl && (
                      <a
                        href={collaborator.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 transition-colors"
                      >
                        <Linkedin className="h-5 w-5 text-indigo-400" />
                      </a>
                    )}
                  </div>
                  <div className="relative pl-4 border-l-2 border-indigo-500/30">
                    <p className="text-white/70 text-sm italic leading-relaxed">"{collaborator.quote}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section className="space-y-12">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="border-indigo-400/50 text-indigo-300 bg-indigo-500/10 mb-4">
              Our Journey
            </Badge>
            <h2 className="text-3xl font-bold text-white">From Idea to Innovation Network</h2>
            <p className="text-white/50">Built at startup speed — here's how it happened.</p>
          </div>

          {/* Timeline */}
          <div className="relative max-w-4xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-amber-500 md:-translate-x-1/2" />

            <div className="space-y-8">
              {timelineEvents.map((event, index) => {
                const styles = getPhaseStyles(event.phase);
                const isEven = index % 2 === 0;
                
                return (
                  <div key={index} className="relative flex items-start gap-6 md:gap-0">
                    {/* Node */}
                    <div className={`absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-gradient-to-r ${styles.node} border-4 border-[hsl(245,60%,6%)] -translate-x-1/2 shadow-lg ${styles.glow} z-10`} />
                    
                    {/* Card - alternating sides on desktop */}
                    <div className={`ml-10 md:ml-0 md:w-[45%] ${isEven ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'}`}>
                      <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={`${styles.badge} text-xs font-medium`}>
                              {event.period}
                            </Badge>
                            {event.phase === 'vision' && (
                              <Crown className="h-4 w-4 text-amber-400" />
                            )}
                          </div>
                          <h4 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {event.title}
                          </h4>
                          <p className="text-white/60 text-sm leading-relaxed">
                            {event.description}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phase Legend */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" />
                <span className="text-white/50 text-sm">Sprint Phase (Days 0-3)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span className="text-white/50 text-sm">Growth Phase</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                <span className="text-white/50 text-sm">Vision</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white">Ready to Transform Your Deal Flow?</h2>
          <p className="text-white/60">
            Join the VCs who are already discovering and reaching out to the best startups faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-none"
            >
              <Link to="/">Try FundRadar</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-none"
            >
              <a href="https://www.linkedin.com/in/satvikputi/" target="_blank" rel="noopener noreferrer">Get in Touch</a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="container text-center text-white/40 text-sm">
          <p>© 2024 FundRadar. Built with ❤️ by VCs, for VCs.</p>
        </div>
      </footer>
    </div>
  );
}
