// frontend/src/app/layout.tsx
import "./globals.css";
import AppProviders from "@/components/AppProviders";
import type { Metadata, Viewport } from "next";

// ✅ Update once if you ever change domain
const SITE_URL = "https://mombasaunited.com";
const SITE_NAME = "Mombasa United FC";

const TITLE =
  "Mombasa United FC — Official Football Club of Mombasa";
const DESCRIPTION =
  "Official website of Mombasa United FC. Get the latest news, fixtures, results, squad updates, tickets, and official merchandise.";

// ✅ Prefer a real 1200x630 image in /public/og-image.jpeg
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,

  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  generator: "Next.js",

  // Indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // Canonical (Next will output canonical for routes; this sets the base)
  alternates: {
    canonical: "/",
  },

  // Favicons / app icons (ensure these exist in /public)
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
  },

  manifest: "/site.webmanifest",

  // Open Graph
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Mombasa United FC",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },

  // Extra meta tags (matching your HTML sample)
  referrer: "strict-origin-when-cross-origin",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: SITE_NAME,
    sport: "Football",
    url: SITE_URL,
    description: DESCRIPTION,
    // Optional: add these if you want (safe to leave out)
    // location: "Mombasa, Kenya",
    // logo: `${SITE_URL}/club-media/logos/club.png`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <JsonLd />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}