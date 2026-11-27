import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";

const display = localFont({ src: "./fonts/unbounded.woff2", variable: "--font-display", weight: "200 900", display: "swap" });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const title = "VEIL — Private Finance. Onchain.";
const description = "Private payments, payroll and treasury on Solana. Amounts stay private.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: { title, description, type: "website", images: ["/og.jpg"] },
  twitter: { card: "summary_large_image", title, description, images: ["/og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#050403",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const heliusEnabled = Boolean(process.env.HELIUS_API_KEY);
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable} h-full antialiased`}>
      <body className="grain min-h-full bg-ink text-bone flex flex-col">
        <Providers heliusEnabled={heliusEnabled}>{children}</Providers>
      </body>
    </html>
  );
}
