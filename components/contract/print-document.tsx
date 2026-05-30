"use client";

import * as React from "react";
import { Printer } from "lucide-react";

import { StyledContractDocument } from "@/lib/contract/document";
import type { ContractData, ContractorInfo } from "@/lib/contract/types";
import { Button } from "@/components/ui/button";

// Print-optimized contract: auto-opens the print dialog so the user can
// "Save as PDF". Toolbar is hidden when printing.
export function PrintDocument({
  data,
  contractor,
}: {
  data: ContractData;
  contractor: ContractorInfo;
}) {
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

      <div className="mx-auto max-w-[820px] bg-white p-12 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <StyledContractDocument data={data} contractor={contractor} />
      </div>
    </div>
  );
}
