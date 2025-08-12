import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
        className={`${montserrat.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
