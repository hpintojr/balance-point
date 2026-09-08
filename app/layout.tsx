import type { Metadata } from "next";
import "./globals.css";
import "./hero.css";
import "./icon-refine.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://balance-point-five.vercel.app"),
  title: "Balance Point Certified | Private Wheelie Training",
  description: "Private progressive motorcycle wheelie training focused on clutch-up technique, rear-brake control, balance-point development, and consistency.",
  openGraph: {
    title: "Balance Point Certified",
    description: "Find your balance point. Trust the process.",
    type: "website",
    images: [{
      url: "/desktop-view-hero.png",
      width: 1680,
      height: 945,
      alt: "Balance Point Certified motorcycle training",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Balance Point Certified",
    description: "Find your balance point. Trust the process.",
    images: ["/desktop-view-hero.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
