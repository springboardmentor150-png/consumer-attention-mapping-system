import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Camera,
  ChevronRight,
  Eye,
  FileBarChart,
  Flame,
  Gauge,
  LayoutGrid,
  LineChart,
  Lock,
  type LucideIcon,
  Route,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Timer,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { HeatmapPreview } from "@/components/landing/HeatmapPreview";
import { AttentionScene } from "@/components/auth/AttentionScene";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tone";

/* ═══════════════════════════════════════════════════════════════════════
   Marketing page.

   A server component: it is entirely static, so nothing here needs to ship
   as client JavaScript beyond the header, which owns the theme toggle and
   the mobile sheet.
   ═══════════════════════════════════════════════════════════════════════ */

const CAPABILITIES: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  body: string;
}[] = [
  {
    icon: Eye,
    tone: "brand",
    title: "Gaze & attention mapping",
    body: "Detect where shoppers look, for how long, and which shelf zone holds their focus — frame by frame, from ordinary store footage.",
  },
  {
    icon: Timer,
    tone: "behavior",
    title: "Dwell time analytics",
    body: "Measure how long each shopper lingers in every zone, and see the full distribution rather than a single blunt average.",
  },
  {
    icon: Route,
    tone: "analytics",
    title: "Movement & path tracking",
    body: "Reconstruct shopper journeys across the floor: entry, route, shelf visits and the aisles that quietly get skipped.",
  },
  {
    icon: Flame,
    tone: "critical",
    title: "Traffic heatmaps",
    body: "Render dwell density straight onto the store layout, so the hot and cold areas of the floor are obvious at a glance.",
  },
  {
    icon: Gauge,
    tone: "healthy",
    title: "Shelf attractiveness scoring",
    body: "Score every shelf 0–100 from measured attention, interaction and conversion signals — no manual data entry anywhere.",
  },
  {
    icon: Brain,
    tone: "ai",
    title: "AI recommendations",
    body: "Turn the scores into ranked, specific actions: what to move, what to promote, and which shelf needs attention first.",
  },
  {
    icon: Users,
    tone: "behavior",
    title: "Behavioural segmentation",
    body: "Cluster shoppers into Explorers, Quick Buyers and Comparison Shoppers using K-Means over their session behaviour.",
  },
  {
    icon: FileBarChart,
    tone: "analytics",
    title: "Reports & export",
    body: "Generate a per-store attention report with alerts and segment breakdowns, exportable as PDF or CSV in one click.",
  },
];

const STEPS: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone: Tone;
}[] = [
  {
    icon: Store,
    tone: "analytics",
    title: "Register stores & shelves",
    body: "Add each location, then draw the shelf zones as polygons in camera-frame coordinates. This is the map the pipeline attributes attention to.",
  },
  {
    icon: Upload,
    tone: "brand",
    title: "Process footage",
    body: "Upload a clip and map each frame region to a shelf. The vision pipeline runs end to end and writes one analytics row per shopper session.",
  },
  {
    icon: LineChart,
    tone: "behavior",
    title: "Read the analytics",
    body: "Attention, dwell, gaze shifts, paths, heatmaps and segments land on the dashboard, scoped to a single store or the whole estate.",
  },
  {
    icon: Sparkles,
    tone: "ai",
    title: "Act on the recommendations",
    body: "Shelves are scored and ranked, alerts are raised on the weakest zones, and every finding exports as a shareable report.",
  },
];

const BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Target,
    title: "Place products where they get seen",
    body: "Stop guessing at planograms. Move stock based on where attention measurably lands.",
  },
  {
    icon: Zap,
    title: "Find the dead zones fast",
    body: "Low-attention shelves surface as alerts the moment footage is processed, not at the next quarterly review.",
  },
  {
    icon: BarChart3,
    title: "Give every team its own view",
    body: "One dataset, four dashboards — Administrator, Store Manager, Analyst and Marketing each see it framed for their decisions.",
  },
  {
    icon: ShieldCheck,
    title: "Keep access tight",
    body: "JWT authentication with role-based permissions enforced at the API, not just hidden in the interface.",
  },
];

const METRICS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "5", label: "Vision signals per session", icon: Camera },
  { value: "0–100", label: "Shelf attractiveness scale", icon: Gauge },
  { value: "3", label: "Behavioural segments", icon: Users },
  { value: "4", label: "Role-tailored dashboards", icon: LayoutGrid },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas">
      <LandingNav />

      {/* ══ Hero ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
          <div className="animate-aurora absolute -left-32 -top-24 h-[30rem] w-[30rem] rounded-full bg-brand-base/20 blur-3xl" />
          <div className="animate-aurora absolute -right-24 top-16 h-[26rem] w-[26rem] rounded-full bg-analytics-base/18 blur-3xl [animation-delay:-9s]" />
          <div className="animate-aurora absolute left-1/3 top-64 h-72 w-72 rounded-full bg-teal-base/15 blur-3xl [animation-delay:-15s]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-rise-in flex justify-center">
              <StatusBadge variant="brand" dot pulse>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                AI analysing customer behaviour in real time
              </StatusBadge>
            </div>

            <h1 className="animate-rise-in stagger mt-7 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink text-balance sm:text-5xl lg:text-6xl [--delay:80ms]">
              Retail intelligence that sees{" "}
              <span className="text-gradient-brand">what shoppers see.</span>
            </h1>

            <p className="animate-rise-in stagger mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-muted text-pretty sm:text-lg [--delay:160ms]">
              CAMS turns ordinary store camera footage into attention maps —
              gaze direction, dwell time, movement paths and shelf-level
              engagement — then scores every shelf and tells you exactly what
              to change.
            </p>

            <div className="animate-rise-in stagger mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row [--delay:240ms]">
              <Button
                render={<Link href="/register" />}
                size="xl"
                className="group/hero w-full sm:w-auto"
              >
                Start analysing
                <ArrowRight className="transition-transform duration-200 group-hover/hero:translate-x-1" />
              </Button>

              <Button
                render={<Link href="/login" />}
                variant="outline"
                size="xl"
                className="w-full sm:w-auto"
              >
                Sign in to dashboard
              </Button>
            </div>

            <p className="animate-rise-in stagger mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink-subtle [--delay:320ms]">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                JWT secured
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Role-based access
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                Computer-vision pipeline
              </span>
            </p>
          </div>

          {/* Product shot */}
          <div className="animate-rise-in stagger relative mt-16 [--delay:400ms]">
            <div
              aria-hidden="true"
              className="absolute inset-x-8 -top-6 h-24 rounded-full bg-brand-base/20 blur-3xl"
            />

            <DashboardPreview className="relative mx-auto max-w-5xl" />
          </div>
        </div>
      </section>

      {/* ══ Metric band ═══════════════════════════════════════════════ */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {METRICS.map((metric) => {
              const Icon = metric.icon;

              return (
                <div key={metric.label} className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0">
                    <dt className="font-display text-xl font-bold tracking-tight text-ink tabular-nums">
                      {metric.value}
                    </dt>
                    <dd className="mt-0.5 text-xs leading-snug text-ink-muted">
                      {metric.label}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* ══ Platform ══════════════════════════════════════════════════ */}
      <section id="platform" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Platform"
            title="Everything the pipeline measures, in one workspace"
            body="Eight capabilities, one dataset. Each panel is built from the same session rows the vision pipeline writes, so no two views of your store can disagree."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((capability, index) => (
              <Card
                key={capability.title}
                glow={capability.tone}
                interactive
                className="animate-rise-in stagger flex flex-col p-6"
                style={{ ["--delay" as string]: `${index * 60}ms` }}
              >
                <AccentIcon
                  icon={capability.icon}
                  variant={capability.tone}
                  size="lg"
                  solid
                />

                <h3 className="mt-5 font-display text-[0.9375rem] font-semibold tracking-tight text-ink">
                  {capability.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">
                  {capability.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Heatmaps ══════════════════════════════════════════════════ */}
      <section className="border-y border-line bg-surface py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <StatusBadge variant="critical" dot>
                Heatmaps
              </StatusBadge>

              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink text-balance sm:text-4xl">
                The floor, coloured by attention.
              </h2>

              <p className="mt-4 text-base leading-relaxed text-ink-muted text-pretty">
                Every processed clip renders a dwell-density map over your store
                layout. Warm areas are where shoppers actually stop; cold areas
                are the aisles your planogram assumed would work.
              </p>

              <ul className="mt-7 space-y-4">
                {[
                  {
                    icon: Flame,
                    title: "Dwell density, not footfall",
                    body: "Weighted by how long shoppers stayed, so a busy pass-through doesn't read like an engaged zone.",
                  },
                  {
                    icon: LayoutGrid,
                    title: "Mapped to your shelf zones",
                    body: "Each region resolves to a shelf record, so hotspots tie back to a specific fixture.",
                  },
                  {
                    icon: Activity,
                    title: "Regenerated on every run",
                    body: "Upload new footage and the map refreshes alongside the rest of the analytics.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.title} className="flex gap-3.5">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-critical-soft text-critical-strong">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-ink-muted text-pretty">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <HeatmapPreview />
          </div>
        </div>
      </section>

      {/* ══ How it works ══════════════════════════════════════════════ */}
      <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="From raw footage to a ranked action list"
            body="Four steps, and only the first two need a human."
          />

          <ol className="relative mt-14 grid gap-6 lg:grid-cols-4">
            {/* Connector, drawn behind the cards on wide screens. */}
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-line-strong to-transparent lg:block"
            />

            {STEPS.map((step, index) => {
              const Icon = step.icon;

              return (
                <li
                  key={step.title}
                  className="animate-rise-in stagger relative"
                  style={{ ["--delay" as string]: `${index * 90}ms` }}
                >
                  <Card className="h-full p-6">
                    <div className="flex items-center justify-between">
                      <AccentIcon
                        icon={Icon}
                        variant={step.tone}
                        size="lg"
                        solid
                      />

                      <span className="font-display text-3xl font-extrabold leading-none text-line-strong tabular-nums">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-base font-semibold tracking-tight text-ink">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">
                      {step.body}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ══ AI insights ═══════════════════════════════════════════════ */}
      <section
        id="insights"
        className="scroll-mt-20 border-y border-line bg-surface py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <AttentionScene />
            </div>

            <div className="order-1 lg:order-2">
              <StatusBadge variant="ai" dot pulse>
                <Brain className="h-3.5 w-3.5" aria-hidden="true" />
                AI insights
              </StatusBadge>

              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink text-balance sm:text-4xl">
                Scores you can act on, not just admire.
              </h2>

              <p className="mt-4 text-base leading-relaxed text-ink-muted text-pretty">
                The scoring engine resolves five inputs per shelf — attention
                duration, interaction frequency, pickup rate, conversion and
                repeat engagement — into a single 0–100 figure, then the rule
                engine turns that figure into ranked, specific advice.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  {
                    priority: "High",
                    shelf: "Endcap — Aisle 4",
                    tone: "critical" as Tone,
                    action:
                      "Attention well below store average. Reposition to eye level and refresh facing.",
                  },
                  {
                    priority: "Medium",
                    shelf: "Shelf B — Beverages",
                    tone: "warning" as Tone,
                    action:
                      "Strong dwell, weak conversion. Test clearer pricing at the shelf edge.",
                  },
                  {
                    priority: "Excellent",
                    shelf: "Shelf A — Snacks",
                    tone: "healthy" as Tone,
                    action:
                      "Highest gaze retention this period. Hold the current planogram.",
                  },
                ].map((item) => (
                  <div
                    key={item.shelf}
                    className="rounded-xl border border-line bg-canvas p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {item.shelf}
                      </p>

                      <StatusBadge variant={item.tone} size="sm">
                        {item.priority} priority
                      </StatusBadge>
                    </div>

                    <p className="mt-2 flex gap-2 text-sm leading-relaxed text-ink-muted text-pretty">
                      <ChevronRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-ai-base"
                        aria-hidden="true"
                      />
                      {item.action}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-ink-subtle">
                Sample output. In the product, every recommendation carries the
                shelf&apos;s score and the timestamp of the analytics behind it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Benefits ══════════════════════════════════════════════════ */}
      <section id="benefits" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Benefits"
            title="Why teams put cameras to work"
            body="The pipeline answers questions a till receipt never can."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <Card
                  key={benefit.title}
                  className="animate-rise-in stagger flex gap-5 p-6"
                  style={{ ["--delay" as string]: `${index * 70}ms` }}
                >
                  <AccentIcon icon={Icon} variant="brand" size="xl" />

                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold tracking-tight text-ink">
                      {benefit.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">
                      {benefit.body}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════════ */}
      <section className="px-5 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-line bg-surface p-10 text-center shadow-card-hover sm:p-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-dots opacity-40" />
            <div className="animate-aurora absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-base/25 blur-3xl" />
            <div className="animate-aurora absolute -right-16 -bottom-24 h-72 w-72 rounded-full bg-analytics-base/20 blur-3xl [animation-delay:-11s]" />
          </div>

          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-ink text-balance sm:text-4xl">
              Put your store footage to work.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted text-pretty">
              Register a workspace, upload a clip, and see your first attention
              map and shelf scores in a single session.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                render={<Link href="/register" />}
                size="xl"
                className="group/cta w-full sm:w-auto"
              >
                Create your account
                <ArrowRight className="transition-transform duration-200 group-hover/cta:translate-x-1" />
              </Button>

              <Button
                render={<Link href="/login" />}
                variant="outline"
                size="xl"
                className="w-full sm:w-auto"
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Footer ════════════════════════════════════════════════════ */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo />

              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted text-pretty">
                Computer-vision retail intelligence: attention mapping, dwell
                analytics, heatmaps and AI-scored shelf optimisation.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <StatusBadge variant="healthy" dot size="sm">
                  Pipeline ready
                </StatusBadge>
                <StatusBadge variant="analytics" outline size="sm">
                  JWT secured
                </StatusBadge>
              </div>
            </div>

            <FooterColumn
              title="Platform"
              links={[
                { label: "Capabilities", href: "#platform" },
                { label: "How it works", href: "#how-it-works" },
                { label: "AI insights", href: "#insights" },
                { label: "Benefits", href: "#benefits" },
              ]}
            />

            <FooterColumn
              title="Workspace"
              links={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Stores", href: "/stores" },
                { label: "Shelves", href: "/shelves" },
              ]}
            />

            <FooterColumn
              title="Account"
              links={[
                { label: "Sign in", href: "/login" },
                { label: "Create account", href: "/register" },
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-line pt-7 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Consumer Attention Mapping System.
            </p>

            <p className="font-mono">
              Analytics refresh when footage is processed.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Section pieces ───────────────────────────────────────────────────── */

function SectionHeading({
  eyebrow,
  title,
  body,
  className,
}: {
  eyebrow: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-brand-deep">
        {eyebrow}
      </p>

      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink text-balance sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 text-base leading-relaxed text-ink-muted text-pretty">
        {body}
      </p>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
        {title}
      </p>

      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="rounded text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
