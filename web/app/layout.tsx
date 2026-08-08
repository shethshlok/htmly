import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const TITLE = "Htmly — Let your AI render real web pages";
const DESCRIPTION =
  "Htmly pairs a hosted MCP renderer with an installable agent skill, turning plans, reviews, diagrams, and complex answers into polished live HTML pages.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: "%s · Htmly",
  },
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  applicationName: "Htmly",
  keywords: [
    "Htmly",
    "MCP server",
    "Model Context Protocol",
    "HTML visualization",
    "Claude MCP",
    "AI HTML preview",
    "agent skill",
    "Codex skill",
    "render HTML AI",
    "Claude Desktop MCP",
    "Cursor MCP server",
    "remote MCP server",
  ],
  authors: [{ name: "Shlok Sheth", url: "https://github.com/shethshlok" }],
  creator: "Shlok Sheth",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Htmly",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@shethshlok",
  },
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
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Instrument+Serif:ital@1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
