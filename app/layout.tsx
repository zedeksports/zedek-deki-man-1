import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZEDEK SPORTS SCORE",
  description: "The home of local football in Ghana and Oti."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
