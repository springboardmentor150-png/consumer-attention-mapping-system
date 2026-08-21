import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Video,
  Grid3X3,
  Store,
  Eye,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
} from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#07090e] text-slate-100 overflow-hidden">
      {/* Background Ambient Gradient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-cyan-500/15 via-purple-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/15 blur-[140px] pointer-events-none" />

      {/* Top Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">
                AURA VISION
              </span>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Retail Attention Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-all"
          >
            Operator Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
          >
            <span>Live Mission Control</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold mb-6 shadow-lg shadow-cyan-500/10 animate-pulse-slow">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>YOLOv8 + ByteTrack + MediaPipe Face Mesh Pipeline</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] font-heading max-w-4xl">
          Real-Time Consumer{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            Attention & Gaze
          </span>{" "}
          Mapping
        </h1>

        <p className="mt-6 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          Transform ordinary retail security CCTV cameras into an AI-powered shopper intelligence network. Measure precise shelf dwell time, track human trajectories, and map customer eye gaze direction in real time.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-600 to-cyan-500 bg-[length:200%_auto] hover:bg-right transition-all duration-300 text-sm font-bold text-white shadow-xl shadow-cyan-500/30 flex items-center gap-2"
          >
            <span>Launch Analytics Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/cctv"
            className="px-6 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-cyan-500/30 hover:border-cyan-400 text-sm font-semibold text-cyan-300 transition-all flex items-center gap-2"
          >
            <Video className="w-4 h-4 text-cyan-400" />
            <span>View Live YOLO Stream</span>
          </Link>
        </div>

        {/* Main Flow Roadmap Banner */}
        <div className="mt-16 w-full max-w-4xl rounded-3xl glass-panel-glow border border-white/10 p-6 sm:p-8 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>End-to-End Retail Intelligence Architecture</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              30 FPS Real-Time
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
                01
              </div>
              <h4 className="text-sm font-bold text-white">YOLOv8 Detection</h4>
              <p className="text-xs text-slate-400">
                Multi-person bounding box recognition from video feeds.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-mono font-bold">
                02
              </div>
              <h4 className="text-sm font-bold text-white">ByteTrack Tracking</h4>
              <p className="text-xs text-slate-400">
                Maintains continuous shopper trajectory and ID identity across frames.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-mono font-bold">
                03
              </div>
              <h4 className="text-sm font-bold text-white">MediaPipe Gaze</h4>
              <p className="text-xs text-slate-400">
                468-point 3D head pose estimation to map eye gaze rays.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">
                04
              </div>
              <h4 className="text-sm font-bold text-white">Shelf Heat Analytics</h4>
              <p className="text-xs text-slate-400">
                Dwell times, conversion indices, and spatial shelf hotspot maps.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
