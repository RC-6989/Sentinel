import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./marketing.css";

const plexSans = localFont({
  src: "./fonts/ibm-plex-sans-latin.woff2",
  variable: "--font-plex-sans",
  weight: "400 600",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-400-latin.woff2", weight: "400" },
    { path: "./fonts/ibm-plex-mono-500-latin.woff2", weight: "500" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

const syne = localFont({
  src: "./fonts/syne-latin.woff2",
  variable: "--font-syne",
  weight: "600 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://trysentinelapp.vercel.app"),
  title: "Sentinel — Set the rules before AI agents act",
  description:
    "Sentinel is building a checkpoint for AI agent tool calls: allow routine work, block disallowed actions, and hold sensitive requests for approval. Join the early-access waitlist.",
  openGraph: {
    title: "Sentinel — Set the rules before AI agents act",
    description: "A checkpoint for AI agent tool calls. Early access in development.",
    siteName: "Sentinel",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plexSans.variable} ${plexMono.variable} ${syne.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
