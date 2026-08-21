import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/ThemeScript";

// Inter carries the interface; Plus Jakarta Sans is the display face for
// headings and the wordmark; JetBrains Mono is reserved for coordinates,
// ids and other machine values.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display-family",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CAMS — Consumer Attention Mapping System",
    template: "%s · CAMS",
  },
  description:
    "AI-powered retail intelligence: computer-vision attention mapping, dwell analytics, heatmaps and shelf optimisation.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0E14" },
  ],
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
      className={`${inter.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>

      <body className="min-h-screen bg-canvas text-ink">{children}</body>
    </html>
  );
}
