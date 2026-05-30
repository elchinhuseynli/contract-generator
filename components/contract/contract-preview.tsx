"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { stripHeadingAnchors } from "@/lib/contract/export";

type ContractPreviewProps = {
  markdown: string;
  className?: string;
};

/**
 * Renders the contract markdown as a styled, document-like preview.
 * Forwards a ref to the content node so the page can read innerHTML for HTML export.
 */
export const ContractPreview = React.forwardRef<
  HTMLDivElement,
  ContractPreviewProps
>(function ContractPreview({ markdown, className }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "prose prose-sm max-w-none font-serif dark:prose-invert",
        // Centered title, sober headings.
        "prose-h1:text-center prose-h1:text-2xl prose-h1:font-bold",
        "prose-h2:mt-8 prose-h2:border-b prose-h2:pb-1 prose-h2:text-lg",
        "prose-h3:text-base prose-headings:font-semibold",
        // Bordered tables for the timeline / pricing / signature blocks.
        "[&_table]:w-full [&_table]:border-collapse",
        "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left",
        "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {stripHeadingAnchors(markdown)}
      </ReactMarkdown>
    </div>
  );
});
