import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecondLook — Uncertainty-Aware Patient Attention",
  description:
    "SecondLook replaces falsely precise patient rankings with transparent placement ranges and directs human attention to cases where one missing or uncertain fact could materially change the queue.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#F4F7F6] text-[#132824]">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased text-[#132824] bg-[#F4F7F6]">
        {children}
      </body>
    </html>
  );
}
