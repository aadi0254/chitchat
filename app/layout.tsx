import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChitChat | A Private, Real-Time Messaging Space 💜",
  description:
    "A private, pastel kawaii real-time messaging space for teams and friends with zero database storage and 6-digit room codes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sans.variable}>
      <body className={`${sans.className} antialiased selection:bg-purple-200 selection:text-purple-900`}>
        {children}
      </body>
    </html>
  );
}
