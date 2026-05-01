import type { Metadata, Viewport } from "next";
import { Instrument_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/app/providers";
import { SpatialBackground } from "@/components/spatial-background";
import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-body-family",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-family",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Steam Compass — Library intelligence",
    template: "%s · Steam Compass",
  },
  description:
    "Turn your Steam library into a calm decision engine: taste signals, backlog gems, and a next-play recommendation that explains itself.",
  applicationName: "Steam Compass",
  keywords: ["Steam", "library", "backlog", "recommendations", "gaming", "dashboard"],
  authors: [{ name: "Steam Compass" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Steam Compass — Library intelligence",
    description:
      "Turn your Steam library into a calm decision engine: taste signals, backlog gems, and a next-play recommendation that explains itself.",
    siteName: "Steam Compass",
  },
  twitter: {
    card: "summary_large_image",
    title: "Steam Compass — Library intelligence",
    description:
      "Turn your Steam library into a calm decision engine: taste signals, backlog gems, and a next-play recommendation that explains itself.",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07101a" },
    { media: "(prefers-color-scheme: light)", color: "#07101a" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${spaceGrotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SpatialBackground />
        <div className="aurora-field" aria-hidden="true" />
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
