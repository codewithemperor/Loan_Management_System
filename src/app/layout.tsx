import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AOPE Credit - Loan Management System",
  description: "Comprehensive loan management system for AOPE Credit, Eruwa, Oyo State Nigeria",
  keywords: ["AOPE Credit", "Loan Management", "Financial Services", "Nigeria", "Eruwa"],
  authors: [{ name: "AOPE Credit Team" }],
  openGraph: {
    title: "AOPE Credit - Loan Management System",
    description: "Comprehensive loan management system for AOPE Credit, Eruwa, Oyo State Nigeria",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AOPE Credit - Loan Management System",
    description: "Comprehensive loan management system for AOPE Credit, Eruwa, Oyo State Nigeria",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
