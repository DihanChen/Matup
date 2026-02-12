import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarShell from "@/components/NavbarShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "MatUp - Find Your Fitness Partner",
  description:
    "Connect with fitness partners in your area. Join running clubs, find tennis and pickleball partners, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <NavbarShell />
        {children}
      </body>
    </html>
  );
}
