import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playground | Innovation Monorepo",
  description: "Isolated sandbox for @repo/ui components",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
