import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ThemeProvider } from "./components/ThemeProvider";
import PageTracker from "./components/PageTracker";

const BASE_URL = "https://altdevtools.codingfrontend.in";
const TITLE = "ALT-DEV TOOLS — Sidebar DevTools for Chrome";
const DESCRIPTION =
  "A powerful sidebar DevTools alternative — Elements, Console, Network, Sources, Application & Performance panels right in your browser sidebar. No more switching to DevTools.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: TITLE,
    template: "%s | ALT-DEV TOOLS",
  },
  description: DESCRIPTION,
  keywords: [
    "Chrome DevTools",
    "browser devtools",
    "sidebar devtools",
    "elements inspector",
    "network monitor",
    "console panel",
    "Chrome extension",
    "web development",
    "developer tools",
    "performance profiler",
  ],
  authors: [{ name: "ALT-DEV TOOLS", url: BASE_URL }],
  creator: "ALT-DEV TOOLS",
  publisher: "ALT-DEV TOOLS",
  applicationName: "ALT-DEV TOOLS",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: "ALT-DEV TOOLS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ALT-DEV TOOLS — Sidebar DevTools for Chrome",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-128.png", sizes: "128x128", type: "image/png" },
    ],
    apple: [{ url: "/icon-128.png", sizes: "128x128", type: "image/png" }],
    shortcut: "/icon-32.png",
  },
  manifest: "/site.webmanifest",
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('altdevtools-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var theme=t||p;if(theme==='dark'){document.documentElement.classList.add('dark');}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-slate-800 dark:text-slate-200 antialiased flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <PageTracker />
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
