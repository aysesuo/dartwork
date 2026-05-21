import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { DesktopNav, MobileNav } from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "#F9F6D2" }}>
        <DesktopNav />
        {/* pb-16 prevents the fixed mobile bottom nav from covering content */}
        <div className="pb-16 md:pb-0 flex-1">{children}</div>
        <MobileNav />
      </body>
    </html>
  );
}
