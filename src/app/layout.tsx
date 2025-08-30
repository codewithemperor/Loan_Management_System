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
        {/* Footer */}
        <footer className="bg-black/30 fixed bottom-0 start-0 end-0 text-gray-200 text-center text-xs py-2  z-10">
          Design and code by <span className="font-semibold">Sulaimon Yusuf Ayomide</span> —{" "}
          <span className="italic">codewithemperor</span>
        </footer>
      </body>
    </html>
  );
}
