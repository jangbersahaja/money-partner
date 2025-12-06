import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileContainer } from "@/components/layout/mobile-container";
import { QuickAddFAB } from "@/components/transactions/quick-add-fab";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Money Partner - Malaysian Financial Co-Pilot",
  description: "Smart money management for Malaysian households",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Money Partner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MobileContainer>
          <main className="min-h-screen pb-16">{children}</main>
          <QuickAddFAB />
          <BottomNav />
        </MobileContainer>
      </body>
    </html>
  );
}
