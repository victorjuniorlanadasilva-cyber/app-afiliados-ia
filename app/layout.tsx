import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DarianIA",
  description: "Sua IA para encontrar produtos e economizar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}