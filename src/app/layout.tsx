import type { Metadata, Viewport } from "next";
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
  // Only the small corner readout uses it: not worth competing with the first paint.
  preload: false,
});

const title = `${profile.name} — ${profile.role}`;
const description = `${profile.tagline} ${profile.bio[0]}`;

// Absolute base for OG/Twitter image URLs. Set SITE_URL at build time
// (e.g. SITE_URL=https://example.com npm run build) for production.
const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

// Committed PNGs (public/) so static hosts serve them with an image type.
const ogImage = { url: "/og.png", width: 1200, height: 630, alt: title };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: profile.name,
  authors: [{ name: profile.name }],
  creator: profile.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: profile.name,
    title,
    description,
    locale: "en_US",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
  icons: { icon: { url: "/icon.svg", type: "image/svg+xml" }, apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#fbfaff",
  colorScheme: "light",
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
