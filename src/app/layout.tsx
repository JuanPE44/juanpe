import type { Metadata } from "next";
import localFont from "next/font/local";
import { profile } from "@/content";
import "./globals.css";

// IBM Plex, self-hosted (latin subset, only the weights in use) so builds
// never hit the network. Files: src/app/fonts (from @fontsource, OFL-1.1).
const plexSans = localFont({
  variable: "--font-body",
  src: [
    { path: "./fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  fallback: ["system-ui", "sans-serif"],
});

const plexMono = localFont({
  variable: "--font-readout",
  src: "./fonts/ibm-plex-mono-latin-400-normal.woff2",
  weight: "400",
  style: "normal",
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: profile.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full bg-bg text-text">{children}</body>
    </html>
  );
}
