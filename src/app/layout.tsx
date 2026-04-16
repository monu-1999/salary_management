import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salary Management",
  description: "Salary management platform for HR teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
