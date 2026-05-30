import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// App UI font — matches the Flex Agency Help Desk design system.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Mono — IDs, dates, contract numbers, monetary figures.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
});

// Serif used only for the rendered contract document — gives legal text a printed feel.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Contract DMS — Flex Digital Agency",
  description:
    "Generate, manage, and store Czech work contracts (Smlouva o dílo) with ARES integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
