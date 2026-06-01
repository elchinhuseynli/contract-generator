"use client";

import Link from "next/link";
import { ChevronDown, FilePlus } from "lucide-react";

import { DOC_BUILDER_LIST } from "@/lib/contract/builders";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Button + dropdown to start a new document of any type. */
export function NewDocumentMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" />}>
        <FilePlus className="size-4" />
        Nový dokument
        <ChevronDown className="size-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {DOC_BUILDER_LIST.map((d) => (
          <DropdownMenuItem
            key={d.key}
            render={<Link href={`/contracts/new?type=${d.key}`} />}
          >
            {d.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
