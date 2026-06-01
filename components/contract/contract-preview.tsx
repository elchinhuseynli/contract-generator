"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { StyledDocument, type StyledDoc } from "@/lib/contract/document";

type ContractPreviewProps = {
  doc: StyledDoc;
  className?: string;
};

/**
 * Renders a StyledDoc as the styled, document-like preview (same component used
 * by the print/PDF view). Forwards a ref to the content node so the editor can
 * read innerHTML/innerText for HTML and text export.
 */
export const ContractPreview = React.forwardRef<
  HTMLDivElement,
  ContractPreviewProps
>(function ContractPreview({ doc, className }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "mx-auto max-w-[820px] rounded-lg bg-white p-10 text-zinc-900 shadow-sm",
        className
      )}
    >
      <StyledDocument doc={doc} />
    </div>
  );
});
