import type { Metadata } from "next";
import { Geist_Mono, Playfair_Display, Barlow_Condensed, Barlow, Special_Elite, Anton, Rye, Alfa_Slab_One, Stardos_Stencil, Caveat } from "next/font/google";
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

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const rye = Rye({
  variable: "--font-rye",
  subsets: ["latin"],
  weight: "400",
});

const alfaSlab = Alfa_Slab_One({
  variable: "--font-alfa",
  subsets: ["latin"],
  weight: "400",
});

const stardos = Stardos_Stencil({
  variable: "--font-stardos",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "700"],
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
      className={`${barlow.variable} ${geistMono.variable} ${playfair.variable} ${barlowCondensed.variable} ${specialElite.variable} ${anton.variable} ${rye.variable} ${alfaSlab.variable} ${stardos.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "#1a1512", color: "#f5f5f0" }}>
        <DesktopNav />
        {/* pb-16 prevents the fixed mobile bottom nav from covering content */}
        <div className="pb-16 md:pb-0 flex-1">{children}</div>
        <MobileNav />
      </body>
    </html>
  );
}
