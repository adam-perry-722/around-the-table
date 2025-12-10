import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Around The Table",
  description: "Pairing App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex-1 flex justify-center items-star`}
      >
        <div className="
          w-full
          text-white
          px-[10%] md:px-[25%] lg:px-[20%]
          py-[5%] md:py-[10%] lg:py-[5%]
        ">
          {children}
        </div>
      </body>
    </html>
  );
}
