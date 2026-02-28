import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BotWrapper from "@/components/BotWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HealthSync - Book Your Doctor",
  description: "Modern doctor appointment booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-vh-100 position-relative">
          {children}
          <BotWrapper />
          <div className="scanline" />
        </div>
      </body>
    </html>
  );
}



