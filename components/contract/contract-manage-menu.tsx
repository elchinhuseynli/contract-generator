"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CONTRACT_STATUSES, type ContractStatus } from "@/lib/contract/types";
import { STATUS_LABELS } from "@/lib/db/types";
import {
  deleteContract,
  duplicateContract,
  setContractStatus,
} from "@/lib/db/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ContractManageMenu({
  contractId,
  status: initialStatus,
}: {
  contractId: string;
  status: ContractStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<ContractStatus>(initialStatus);
  const [busy, setBusy] = React.useState(false);

  async function changeStatus(next: ContractStatus) {
    const prev = status;
    setStatus(next);
    try {
      await setContractStatus(contractId, next);
      toast.success("Stav změněn");
    } catch {
      setStatus(prev);
      toast.error("Změna stavu se nezdařila");
    }
  }

  async function onDuplicate() {
    setBusy(true);
    try {
      const id = await duplicateContract(contractId);
      toast.success("Smlouva duplikována");
      router.push(`/contracts/${id}/edit`);
    } catch {
      toast.error("Duplikace se nezdařila");
      setBusy(false);
    }
  }

  async function onDelete() {
    setBusy(true);
    try {
      await deleteContract(contractId);
      toast.success("Smlouva smazána");
      router.push("/dashboard");
    } catch {
      toast.error("Smazání se nezdařilo");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        items={STATUS_LABELS}
        value={status}
        onValueChange={(v) => changeStatus(v as ContractStatus)}
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONTRACT_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={onDuplicate}
        disabled={busy}
      >
        <Copy className="size-4" />
        <span className="hidden sm:inline">Duplikovat</span>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="outline" size="icon" disabled={busy} aria-label="Smazat" />
          }
        >
          <Trash2 className="size-4 text-destructive" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat smlouvu?</AlertDialogTitle>
            <AlertDialogDescription>
              Tuto akci nelze vrátit. Smlouva i historie jejích verzí budou
              trvale odstraněny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Smazat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
