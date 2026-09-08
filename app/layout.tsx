import type { Metadata } from "next";
import "./globals.css";
import "./hero.css";

export const metadata: Metadata = {
  title: "Balance Point Certified | Private Wheelie Training",
  description: "Private progressive motorcycle wheelie training focused on clutch-up technique, rear-brake control, balance-point development, and consistency.",
  openGraph: {
    title: "Balance Point Certified",
    description: "Find your balance point. Trust the process.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
