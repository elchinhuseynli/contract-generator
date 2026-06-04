"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { formatCZK } from "@/lib/contract/template";
import { sumPriceItems } from "@/lib/contract/types";
import { restoreVersion } from "@/lib/db/actions";
import type { VersionRow } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Document number across types: smlouva uses contractNumber, others documentNumber. */
function docNumber(data: VersionRow["data"]): string {
  const d = data as { contractNumber?: string; documentNumber?: string };
  return d.contractNumber ?? d.documentNumber ?? "";
}

export function VersionHistory({
  contractId,
  versions,
}: {
  contractId: string;
  versions: VersionRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<number | null>(null);

  async function restore(version: number) {
    setBusy(version);
    try {
      await restoreVersion(contractId, version);
      toast.success(`Obnovena verze ${version}`);
      router.refresh();
    } catch {
      toast.error("Obnovení se nezdařilo");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <History className="size-4" />
        <span className="hidden sm:inline">Historie</span>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Historie verzí</SheetTitle>
          <SheetDescription>
            Každé uložení vytvoří verzi. Můžete se vrátit k libovolné předchozí.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-2 overflow-y-auto px-4 pb-4">
          {versions.map((v, idx) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 text-sm">
                <div className="font-medium">
                  Verze {v.version}
                  {idx === 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      · aktuální
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleString("cs-CZ")}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {docNumber(v.data)}
                  {Array.isArray(v.data.priceItems) &&
                    v.data.priceItems.length > 0 && (
                      <> · {formatCZK(sumPriceItems(v.data.priceItems))}</>
                    )}
                </div>
              </div>
              {idx !== 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => restore(v.version)}
                >
                  {busy === v.version ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RotateCcw className="size-4" />
                  )}
                  Obnovit
                </Button>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
