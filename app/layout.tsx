import type { Metadata } from "next";
import { Geist_Mono, Playfair_Display, Barlow_Condensed, Barlow } from "next/font/google";
import { DesktopNav, MobileNav } from "@/components/Nav";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlow = Barlow({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "dArtwork",
    template: "%s · dArtwork",
  },
  description:
    "A directory of creative projects, collaborators, and events at Dartmouth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${geistMono.variable} ${playfair.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "#0a1f14", color: "#f5f5f0" }}>
        <DesktopNav />
        {/* pb-16 prevents the fixed mobile bottom nav from covering content */}
        <div className="pb-16 md:pb-0 flex-1">{children}</div>
        <MobileNav />
      </body>
    </html>
  );
}
