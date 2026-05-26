import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { WalletProvider } from "@/context/WalletContext";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OneCard — One card. Maximum rewards.",
  description:
    "A single phantom payment card that routes every purchase to your best underlying credit card.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "OneCard — One card. Maximum rewards.",
    description:
      "Link your Amex and Big Six cards. OneCard routes every tap to the card that earns the most.",
    type: "website",
    locale: "en_CA",
    siteName: "OneCard",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneCard — One card. Maximum rewards.",
    description:
      "Link your Amex and Big Six cards. OneCard routes every tap to the card that earns the most.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
