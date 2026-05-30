"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Printer } from "lucide-react";

import { stripHeadingAnchors } from "@/lib/contract/export";
import { Button } from "@/components/ui/button";

// Forced-light, print-optimized rendering of a contract. Auto-opens the print
// dialog so the user can "Save as PDF". Toolbar is hidden when printing.
export function PrintDocument({ markdown }: { markdown: string }) {
  React.useEffect(() => {
    const t = setTimeout(() => window.print(), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[820px] items-center justify-between px-4 print:hidden">
        <span className="text-sm text-zinc-500">
          Tiskový náhled — v dialogu tisku zvolte „Uložit jako PDF".
        </span>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Vytisknout / PDF
        </Button>
      </div>

      <div className="mx-auto max-w-[820px] bg-white p-12 text-zinc-900 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div
          className={[
            "prose prose-zinc max-w-none font-serif",
            "prose-h1:text-center prose-h1:text-2xl",
            "prose-h2:mt-8 prose-h2:border-b prose-h2:border-zinc-300 prose-h2:pb-1 prose-h2:text-lg",
            "[&_table]:w-full [&_table]:border-collapse",
            "[&_th]:border [&_th]:border-zinc-300 [&_th]:bg-zinc-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left",
            "[&_td]:border [&_td]:border-zinc-300 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
          ].join(" ")}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {stripHeadingAnchors(markdown)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
