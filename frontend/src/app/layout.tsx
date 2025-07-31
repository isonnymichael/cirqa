import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { lufgaFont } from "./fonts";
import "./globals.css";
import { Web3Provider } from "./ThirdwebProvider";
import { ToastProvider } from "@/components/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cirqa - Decentralized Borrowing and Lending",
  description: "A decentralized borrowing and lending application built on the KiiChain network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lufgaFont.variable} antialiased`}
      >
        <Web3Provider><ToastProvider>{children}</ToastProvider></Web3Provider>
      </body>
    </html>
  );
}
