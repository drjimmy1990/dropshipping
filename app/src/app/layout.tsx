import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DropLinker — Automate Your Dropshipping Business",
  description:
    "Connect your Salla or Zid store, import trending products from AliExpress and CJDropshipping, and auto-fulfill orders — all hands-free.",
  keywords: [
    "dropshipping",
    "salla",
    "zid",
    "aliexpress",
    "cjdropshipping",
    "automation",
    "saudi arabia",
    "ecommerce",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
