import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multilingual Chatbot – English, Malay & Tamil",
  description:
    "AI chatbot that speaks English, Bahasa Melayu, Tamil, and Manglish with voice support.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
