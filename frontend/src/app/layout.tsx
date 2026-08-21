import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AURA Retail AI | Consumer Attention Mapping System",
  description: "Next-Gen Retail Intelligence, Shelf Mapping & YOLOv8 Gaze Analytics Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable} dark h-full antialiased`}
    >
      <head>
        <script src="/suppress-extension-errors.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function isExtErr(msg) {
                  if (!msg) return false;
                  var s = typeof msg === 'object' ? (msg.stack || msg.message || JSON.stringify(msg)) : String(msg);
                  return s.indexOf('extension://') !== -1 ||
                         s.indexOf('nimlmejbmnecnaghgmbahmbaddhjbecg') !== -1 ||
                         s.indexOf('M_ID') !== -1 ||
                         s.indexOf('bis_skin_checked') !== -1 ||
                         s.indexOf('bis_register') !== -1 ||
                         (s.indexOf('hydrated but some attributes') !== -1 && s.indexOf('bis_') !== -1);
                }
                var origError = console.error;
                console.error = function() {
                  for (var i = 0; i < arguments.length; i++) {
                    if (isExtErr(arguments[i])) return;
                  }
                  origError.apply(console, arguments);
                };
                var origWarn = console.warn;
                console.warn = function() {
                  for (var i = 0; i < arguments.length; i++) {
                    if (isExtErr(arguments[i])) return;
                  }
                  origWarn.apply(console, arguments);
                };
                window.addEventListener('unhandledrejection', function(e) {
                  if (isExtErr(e.reason)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                  }
                }, true);
                window.addEventListener('error', function(e) {
                  if (isExtErr(e.filename) || isExtErr(e.message) || isExtErr(e.error)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200"
      >
        {/* Ambient Dark Gradient Background Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[130px] animate-pulse-slow" />
          <div className="absolute top-[30%] -right-[15%] w-[700px] h-[700px] rounded-full bg-cyan-900/15 blur-[150px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
          <div className="absolute -bottom-[20%] left-[20%] w-[800px] h-[800px] rounded-full bg-blue-900/15 blur-[160px]" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
        </div>

        {children}
      </body>
    </html>
  );
}