import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import SwRegister from "./sw-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "LoxiHub",
  description: "Seu universo narrativo compartilhado",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LoxiHub",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E0510",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`min-h-screen antialiased ${inter.variable} ${dmSerif.variable}`}>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
