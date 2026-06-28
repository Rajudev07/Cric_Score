import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "@/components/providers/ClientProviders";
import PosthogInit from "@/components/analytics/PosthogInit";
import StructuredData from "@/components/seo/StructuredData";
import { getSiteMetadataBase } from "@/lib/seo/canonical";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/structuredData";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  title: "CricScore — Live Cricket Scores",
  description: "Live scores, fixtures, and results for cricket matches.",
  applicationName: "CricScore",
  appleWebApp: {
    capable: true,
    title: "CricScore",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  (function() {
    try {
      var stored = localStorage.getItem('cricscore-theme');
      var resolved = stored === 'dark' ? 'dark'
        : stored === 'light' ? 'light'
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark' : 'light';
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })();
`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <StructuredData id="ld-organization" data={buildOrganizationJsonLd()} />
        <StructuredData id="ld-website" data={buildWebSiteJsonLd()} />
        <PosthogInit />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
