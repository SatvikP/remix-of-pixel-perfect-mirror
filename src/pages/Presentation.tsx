import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Radar,
  ArrowLeft,
  Target,
  Zap,
  Mail,
  Database,
  Server,
  Globe,
  Brain,
  TrendingUp,
  Users,
  FileText,
  Code,
  Layers,
  ArrowRight,
  Linkedin,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  BarChart3,
  Clock,
  Shield,
  Cpu,
  GitBranch,
  Workflow,
  MessageSquare,
  Rocket,
  Lightbulb,
  Network,
  Calendar,
} from "lucide-react";

const Presentation = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050414] via-[#0a0a1f] to-[#17155D]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Radar className="h-6 w-6 text-indigo-400" />
              <span className="text-white font-semibold">FundRadar</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/story">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  Our Story
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        {/* Section 1: Title Slide */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full" />
                <Radar className="h-20 w-20 text-indigo-400 relative z-10" />
              </div>
            </div>
            <Badge className="mb-4 border-indigo-400/50 text-indigo-300 bg-indigo-500/10">
              Project Presentation
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              Fund<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Radar</span>
            </h1>
            <p className="text-xl sm:text-2xl text-white/70 max-w-3xl mx-auto mb-8">
              AI-Powered Startup Trend Analysis for Venture Capital Investors
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge className="border-green-400/50 text-green-300 bg-green-500/10">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                Live at fundradar.lovable.app
              </Badge>
              <Badge className="border-purple-400/50 text-purple-300 bg-purple-500/10">
                22 EU News Sources
              </Badge>
              <Badge className="border-blue-400/50 text-blue-300 bg-blue-500/10">
                350+ Articles/Day
              </Badge>
            </div>
          </div>
        </section>

        {/* Section 2: The Problem */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-red-400/50 text-red-300 bg-red-500/10">The Problem</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              VCs Are Drowning in Data
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              The fundamental question every investor asks weekly:
            </p>
          </div>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8 mb-8">
            <p className="text-2xl sm:text-3xl text-center text-white/90 font-light italic">
              "Who should I reach out to this week — and <span className="text-indigo-400 font-medium">why</span>?"
            </p>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: Database, label: "Data Scattered", desc: "Multiple CRMs, spreadsheets" },
              { icon: Clock, label: "CRM Goes Stale", desc: "Outdated information" },
              { icon: FileText, label: "Manual Outreach", desc: "Time-consuming research" },
              { icon: Search, label: "Context Lost", desc: "Missing trend insights" },
              { icon: Users, label: "Late to the Party", desc: "Competitors reach first" },
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm p-4 text-center hover:bg-white/10 transition-colors">
                <item.icon className="h-8 w-8 text-red-400/80 mx-auto mb-2" />
                <h3 className="text-white font-medium text-sm mb-1">{item.label}</h3>
                <p className="text-white/50 text-xs">{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 3: Our Solution */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-green-400/50 text-green-300 bg-green-500/10">Our Solution</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Action Over Scores
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Three core capabilities that transform how VCs discover and engage startups
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Filter,
                title: "Focused Filtering",
                desc: "Sector-first approach. Filter by biotech, fintech, saas, deeptech, and more. See only what matters to your thesis.",
                color: "indigo",
              },
              {
                icon: Target,
                title: "Contextual View",
                desc: "Everything at a glance: trend alignment, market timing, sector fit, founder backgrounds, and funding signals.",
                color: "purple",
              },
              {
                icon: Mail,
                title: "One-Click Outreach",
                desc: "Pre-filled emails with relevant context. No more copy-pasting. Direct action from insight to outreach.",
                color: "blue",
              },
            ].map((item, i) => (
              <Card key={i} className={`bg-white/5 border-white/10 backdrop-blur-sm p-6 hover:bg-white/10 transition-all hover:scale-[1.02]`}>
                <div className={`w-12 h-12 rounded-lg bg-${item.color}-500/20 flex items-center justify-center mb-4`}>
                  <item.icon className={`h-6 w-6 text-${item.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/60">{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 4: Technology Stack */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-indigo-400/50 text-indigo-300 bg-indigo-500/10">Technology</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Scale
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Frontend */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Frontend</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "React 18", desc: "UI Framework" },
                  { name: "TypeScript", desc: "Type Safety" },
                  { name: "Vite", desc: "Build Tool" },
                  { name: "Tailwind CSS", desc: "Styling" },
                  { name: "shadcn/ui", desc: "Components" },
                  { name: "TanStack Query", desc: "Server State" },
                  { name: "Recharts", desc: "Visualizations" },
                ].map((tech, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-white font-medium">{tech.name}</span>
                    <span className="text-white/50 text-sm">{tech.desc}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Backend */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Server className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Backend</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Supabase", desc: "Backend Platform" },
                  { name: "PostgreSQL", desc: "Database" },
                  { name: "Row Level Security", desc: "Data Protection" },
                  { name: "Deno", desc: "Edge Runtime" },
                  { name: "Edge Functions", desc: "Serverless Logic" },
                  { name: "Lovable AI Gateway", desc: "AI Access" },
                  { name: "Google OAuth", desc: "Authentication" },
                ].map((tech, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-white font-medium">{tech.name}</span>
                    <span className="text-white/50 text-sm">{tech.desc}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Integrations */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Integrations</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Lightpanda", desc: "Primary Scraper" },
                  { name: "Firecrawl", desc: "Fallback Scraper" },
                  { name: "Dust AI", desc: "LinkedIn Analysis" },
                  { name: "Gemini 3 Flash", desc: "AI Clustering" },
                  { name: "Resend", desc: "Email Delivery" },
                  { name: "Google OAuth", desc: "Sign-in" },
                ].map((tech, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-white font-medium">{tech.name}</span>
                    <span className="text-white/50 text-sm">{tech.desc}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Section 5: Architecture */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-indigo-400/50 text-indigo-300 bg-indigo-500/10">Architecture</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              System Overview
            </h2>
          </div>

          <div className="relative">
            {/* Client Layer */}
            <Card className="bg-blue-500/10 border-blue-400/30 backdrop-blur-sm p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <Layers className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Client Layer</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {["React SPA", "TanStack Query", "React Router", "shadcn/ui"].map((item, i) => (
                  <Badge key={i} className="border-blue-400/30 text-blue-300 bg-blue-500/20">{item}</Badge>
                ))}
              </div>
            </Card>

            <div className="flex justify-center my-2">
              <ArrowRight className="h-6 w-6 text-white/30 rotate-90" />
            </div>

            {/* Lovable Cloud Layer */}
            <Card className="bg-green-500/10 border-green-400/30 backdrop-blur-sm p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <Server className="h-6 w-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Lovable Cloud (Supabase)</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <Database className="h-5 w-5 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">PostgreSQL</h4>
                  <p className="text-white/50 text-sm">articles, user_startups, user_profiles, user_roles</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <Shield className="h-5 w-5 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">Auth</h4>
                  <p className="text-white/50 text-sm">Google OAuth, Email/Password, RLS</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <Code className="h-5 w-5 text-green-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">Edge Functions</h4>
                  <p className="text-white/50 text-sm">6 Deno functions for AI & scraping</p>
                </div>
              </div>
            </Card>

            <div className="flex justify-center my-2">
              <ArrowRight className="h-6 w-6 text-white/30 rotate-90" />
            </div>

            {/* External Services */}
            <Card className="bg-purple-500/10 border-purple-400/30 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-6 w-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">External Services</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {["Lightpanda Cloud", "Firecrawl API", "Dust AI Agent", "Lovable AI Gateway", "Resend Email"].map((item, i) => (
                  <Badge key={i} className="border-purple-400/30 text-purple-300 bg-purple-500/20">{item}</Badge>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Section 6: AI Scoring System */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-amber-400/50 text-amber-300 bg-amber-500/10">Core Algorithm</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              AI-Powered Investment Scoring
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Two-phase calculation powered by Gemini 3 Flash
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Phase 1 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">1</div>
                <h3 className="text-xl font-semibold text-white">Cluster Identification</h3>
              </div>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Gemini 3 Flash analyzes <strong className="text-white">350+ daily articles</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Network className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Creates <strong className="text-white">~20 hierarchical clusters</strong> (e.g., Biotech → Gene Therapy)</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Assigns <strong className="text-white">trend scores (0-100)</strong> based on article velocity</span>
                </li>
              </ul>
            </Card>

            {/* Phase 2 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">2</div>
                <h3 className="text-xl font-semibold text-white">Startup Matching</h3>
              </div>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-2">
                  <Target className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Matches startups to <strong className="text-white">relevant clusters</strong> via keywords</span>
                </li>
                <li className="flex items-start gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Calculates <strong className="text-white">investment scores</strong> per startup</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Applies <strong className="text-white">business-type weights</strong> (DeepTech vs SaaS)</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Metrics Table */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h4 className="text-lg font-semibold text-white">Scoring Metrics</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/70">Metric</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/70">Range</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/70">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { metric: "Trend Alignment", range: "0-40", desc: "Keyword match strength with trending clusters" },
                    { metric: "Market Timing", range: "0-30", desc: "Market readiness and momentum signals" },
                    { metric: "Sector Fit", range: "0-30", desc: "Parent category match quality" },
                    { metric: "Market Momentum", range: "0-15", desc: "Derived from average cluster trend scores" },
                    { metric: "Funding Climate", range: "0-10", desc: "Sector activity and investment inference" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white font-medium">{row.metric}</td>
                      <td className="px-4 py-3">
                        <Badge className="border-indigo-400/30 text-indigo-300 bg-indigo-500/10">{row.range}</Badge>
                      </td>
                      <td className="px-4 py-3 text-white/60">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Formula */}
          <Card className="bg-indigo-500/10 border-indigo-400/30 backdrop-blur-sm p-6 mt-6">
            <h4 className="text-lg font-semibold text-white mb-3">Investment Score Formula</h4>
            <code className="block bg-black/30 rounded-lg p-4 text-sm text-indigo-300 overflow-x-auto">
              investmentScore = (trendAlignment × w1) + (marketTiming × w2) + (sectorFit × w3) + marketMomentum + fundingClimate
            </code>
            <p className="text-white/50 text-sm mt-3">
              Weights (w1, w2, w3) are configurable and adjust based on business type presets.
            </p>
          </Card>
        </section>

        {/* Section 7: Data Pipeline */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-indigo-400/50 text-indigo-300 bg-indigo-500/10">Data Pipeline</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              From News to Insights
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-purple-500/50 to-green-500/50 hidden lg:block" />
            
            <div className="space-y-6">
              {[
                { icon: Globe, title: "22 EU News Sources", desc: "Sifted, Tech.eu, TechCrunch, EU-Startups, and 18 more", color: "blue" },
                { icon: Cpu, title: "Lightpanda/Firecrawl Scraping", desc: "Puppeteer-based extraction via WebSocket connection", color: "indigo" },
                { icon: Database, title: "Article Storage", desc: "PostgreSQL with full-text indexing and metadata", color: "purple" },
                { icon: Brain, title: "AI Clustering", desc: "Gemini 3 Flash creates hierarchical trend clusters", color: "violet" },
                { icon: Target, title: "Startup Matching", desc: "Keywords and tags mapped to relevant clusters", color: "fuchsia" },
                { icon: BarChart3, title: "Investment Scores", desc: "Final scores calculated with configurable weights", color: "green" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-6">
                  <Card className={`flex-1 bg-white/5 border-white/10 backdrop-blur-sm p-4 hover:bg-white/10 transition-colors`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-${step.color}-500/20 flex items-center justify-center shrink-0`}>
                        <step.icon className={`h-6 w-6 text-${step.color}-400`} />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{step.title}</h4>
                        <p className="text-white/50 text-sm">{step.desc}</p>
                      </div>
                    </div>
                  </Card>
                  <div className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 hidden lg:block" />
                </div>
              ))}
            </div>
          </div>

          {/* News Sources */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 mt-8">
            <h4 className="text-lg font-semibold text-white mb-4">22 EU Startup News Sources</h4>
            <div className="flex flex-wrap gap-2">
              {[
                "Sifted", "Tech.eu", "TechCrunch", "EU-Startups", "The Next Web",
                "VentureBeat", "TechFundingNews", "Wired UK", "BusinessCloud",
                "Tech.co", "StartupNation", "BetaKit", "ArcticStartup",
                "Startups Magazine", "Silicon Canals", "NordicStartupBits",
                "TechRound", "UKTN", "StartupValley", "The Startup Magazine",
                "GründerSzene", "Les Echos Start"
              ].map((source, i) => (
                <Badge key={i} className="border-white/20 text-white/70 bg-white/5">{source}</Badge>
              ))}
            </div>
          </Card>
        </section>

        {/* Section 8: Edge Functions */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-indigo-400/50 text-indigo-300 bg-indigo-500/10">Edge Functions</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Serverless Backend Logic
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              6 Deno edge functions powering the AI and data pipeline
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "cluster-startups",
                desc: "Core AI analysis engine. Uses Gemini 3 Flash to create hierarchical clusters and calculate investment scores.",
                icon: Brain,
                color: "indigo",
              },
              {
                name: "scrape-lightpanda",
                desc: "Puppeteer-based scraping via Lightpanda Cloud WebSocket. Primary scraping provider.",
                icon: Globe,
                color: "blue",
              },
              {
                name: "scrape-sifted-daily",
                desc: "Daily scraper for 22 EU news sources. Batch processing with timeout management.",
                icon: Workflow,
                color: "purple",
              },
              {
                name: "scrape-articles",
                desc: "Firecrawl-based article scraping. Alternative provider for redundancy.",
                icon: FileText,
                color: "green",
              },
              {
                name: "analyze-linkedin-profiles",
                desc: "Dust AI agent integration for founder enrichment. Extracts experience, location, and tags.",
                icon: Users,
                color: "violet",
              },
              {
                name: "send-outreach-email",
                desc: "Email outreach functionality via Resend. Pre-filled templates with context.",
                icon: Mail,
                color: "rose",
              },
            ].map((fn, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm p-5 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${fn.color}-500/20 flex items-center justify-center shrink-0`}>
                    <fn.icon className={`h-5 w-5 text-${fn.color}-400`} />
                  </div>
                  <div>
                    <code className="text-indigo-300 text-sm font-mono">{fn.name}</code>
                    <p className="text-white/60 text-sm mt-1">{fn.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 9: Database Schema */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-indigo-400/50 text-indigo-300 bg-indigo-500/10">Database</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              PostgreSQL Schema
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                name: "articles",
                desc: "Scraped news articles with metadata",
                cols: ["id", "title", "url", "source", "excerpt", "authors[]", "tags[]", "published_date", "is_pro"],
              },
              {
                name: "user_startups",
                desc: "User portfolio with RLS protection",
                cols: ["id", "user_id", "name", "website", "linkedin", "blurb", "tags", "location", "business_type", "maturity", "amount_raised"],
              },
              {
                name: "user_profiles",
                desc: "User engagement and onboarding tracking",
                cols: ["id", "user_id", "email", "has_uploaded_csv", "has_tried_demo", "has_analyzed", "demo_loaded_at", "total_csv_uploads"],
              },
              {
                name: "user_roles",
                desc: "Role-based access control",
                cols: ["id", "user_id", "role (admin | user)"],
              },
            ].map((table, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="h-5 w-5 text-green-400" />
                  <code className="text-green-300 font-mono">{table.name}</code>
                </div>
                <p className="text-white/60 text-sm mb-3">{table.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {table.cols.map((col, j) => (
                    <Badge key={j} className="border-white/10 text-white/50 bg-white/5 text-xs">{col}</Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 10: The Journey Timeline */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-purple-400/50 text-purple-300 bg-purple-500/10">Our Journey</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              From Idea to Innovation Network
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                phase: "Sprint",
                time: "Days 0-3",
                title: "MVP & Validation",
                desc: "Built core scraping, AI clustering, and scoring in 72 hours with VC feedback loops.",
                icon: Rocket,
                color: "indigo",
              },
              {
                phase: "Growth",
                time: "Next Month",
                title: "Knowledge Graph",
                desc: "Relationship mapping between founders, investors, and trending sectors.",
                icon: Network,
                color: "purple",
              },
              {
                phase: "Growth",
                time: "6 Months",
                title: "Network Building",
                desc: "Platform for warm intros and collaborative deal flow.",
                icon: Users,
                color: "purple",
              },
              {
                phase: "Vision",
                time: "1 Year",
                title: "Innovation Network",
                desc: "Connecting the entire European startup ecosystem.",
                icon: Sparkles,
                color: "amber",
              },
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm p-5 hover:bg-white/10 transition-colors">
                <Badge className={`mb-3 border-${item.color}-400/50 text-${item.color}-300 bg-${item.color}-500/10`}>
                  {item.phase} • {item.time}
                </Badge>
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={`h-5 w-5 text-${item.color}-400`} />
                  <h4 className="text-white font-medium">{item.title}</h4>
                </div>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 11: Collaborators */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center mb-12">
            <Badge className="mb-4 border-indigo-400/50 text-indigo-300 bg-indigo-500/10">Collaborators</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built With Industry Experts
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: "Antoine Duchein",
                role: "Entrepreneurs First",
                quote: "Focus on action, not just scores",
                linkedin: "https://www.linkedin.com/in/antoineduchein/",
              },
              {
                name: "Gaëtan Lavigne",
                role: "Asterion Ventures",
                quote: "Sector-first filtering is key",
                linkedin: "https://www.linkedin.com/in/gaetan-lavigne/",
              },
              {
                name: "Pierina Camarena",
                role: "Aleph Studios / EWOR",
                quote: "Stealth mode founders matter",
                linkedin: "https://www.linkedin.com/in/pierinacamarena/",
              },
              {
                name: "Luphy",
                role: "VC Tech Solutions",
                quote: "Workflow integration is essential",
                linkedin: "https://www.linkedin.com/company/lphyco/",
              },
            ].map((person, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm p-5 hover:bg-white/10 transition-colors group">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">{person.name}</h4>
                  <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-indigo-400 transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-indigo-400 text-sm mb-2">{person.role}</p>
                <p className="text-white/50 text-sm italic">"{person.quote}"</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 12: CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-400/30 backdrop-blur-sm p-8 sm:p-12">
            <Radar className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Transform Your Deal Flow?
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              Join the VCs who are discovering startups before they hit traditional CRMs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://www.linkedin.com/in/satvikputi/" target="_blank" rel="noopener noreferrer">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Get in Touch
                </Button>
              </a>
              <Link to="/">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </Card>

          <p className="text-white/30 text-sm mt-8">
            © 2025 FundRadar. Built with Lovable.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Presentation;
