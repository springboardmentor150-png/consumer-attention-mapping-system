import type { Metadata } from "next";
import { Providers } from "../components/common/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAMS — Consumer Attention Mapping System",
  description: "AI-powered retail intelligence platform for shopper attention mapping, behavioral analytics and product engagement tracking.",
  keywords: ["retail analytics", "computer vision", "shopper intelligence", "attention mapping"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
