"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { StyledContractDocument } from "@/lib/contract/document";
import type { ContractData, ContractorInfo } from "@/lib/contract/types";

type ContractPreviewProps = {
  data: ContractData;
  contractor: ContractorInfo;
  className?: string;
};

/**
 * Renders the contract as the styled, document-like preview (the same component
 * used by the print/PDF view). Forwards a ref to the content node so the page
 * can read innerHTML/innerText for HTML and text export.
 */
export const ContractPreview = React.forwardRef<
  HTMLDivElement,
  ContractPreviewProps
>(function ContractPreview({ data, contractor, className }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "mx-auto max-w-[820px] rounded-lg bg-white p-10 text-zinc-900 shadow-sm",
        className
      )}
    >
      <StyledContractDocument data={data} contractor={contractor} />
    </div>
  );
});
