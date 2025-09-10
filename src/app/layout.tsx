import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Docker Manager - Manage Your Containers",
  description: "A modern web interface for managing Docker containers with real-time monitoring, logs, and control.",
  keywords: ["Docker", "containers", "management", "monitoring", "logs", "devops"],
  authors: [{ name: "Docker Manager Team" }],
  robots: "noindex, nofollow", // Since this is likely for internal use
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
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
        <SettingsProvider>
          <ErrorBoundaryWrapper>
            {children}
          </ErrorBoundaryWrapper>
        </SettingsProvider>
      </body>
    </html>
  );
}
