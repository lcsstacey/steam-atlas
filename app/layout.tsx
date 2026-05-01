import type { Metadata } from "next";
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
  title: "Steam Compass — Library intelligence",
  description:
    "Turn your Steam library into a calm decision engine: taste signals, backlog gems, and a next-play recommendation that explains itself.",
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
        <SpatialBackground />
        <div className="aurora-field" aria-hidden="true" />
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
