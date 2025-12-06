import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsent } from "@/components/CookieConsent";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Audiospective",
  description: "Your complete Spotify listening history, automatically archived every hour.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-audio-dark text-white selection:bg-brand-cyan/30`}
      >
        {/* Subtle purple glow background effect */}
        <div className="fixed inset-0 bg-subtle-glow pointer-events-none z-0" />

        <ErrorBoundary>
          <ThemeProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
