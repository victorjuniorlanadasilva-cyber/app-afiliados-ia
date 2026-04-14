import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "DarianIA",
  description: "Sua IA para encontrar produtos e economizar.",
  openGraph: {
    title: "DarianIA",
    description: "Sua IA para encontrar produtos e economizar.",
    url: "https://app-darian-ia.vercel.app",
    siteName: "DarianIA",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};