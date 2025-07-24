import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import UserRouteGuard from "@/components/UserRouteGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Referral Waitlist System",
  description:
    "Join our exclusive waitlist and earn rewards by referring friends!",
  keywords: "waitlist, referral, early access, exclusive",
  authors: [{ name: "Referral System Demo" }],
  openGraph: {
    title: "Referral Waitlist System",
    description:
      "Join our exclusive waitlist and earn rewards by referring friends!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserRouteGuard>
          {children}
        </UserRouteGuard>
      </body>
    </html>
  );
}
