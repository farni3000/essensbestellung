import type { Metadata, Viewport } from "next";
import { Baloo_2, DM_Sans } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Essensbestellung",
  description: "Rezepte sammeln, Zutaten kopieren und per gewichtetem Zufall entscheiden, was gekocht wird.",
};

export const viewport: Viewport = {
  themeColor: "#FFF8EC",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      className={`${baloo.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-dvh font-sans text-ink">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-tomato/10 blur-3xl" />
          <div className="absolute top-1/3 -left-40 h-[28rem] w-[28rem] rounded-full bg-olive/10 blur-3xl" />
          <div className="absolute -bottom-48 left-1/3 h-[30rem] w-[30rem] rounded-full bg-mustard/10 blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  );
}
