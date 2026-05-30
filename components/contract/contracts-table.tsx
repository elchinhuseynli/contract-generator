"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  MoreHorizontal,
  SquarePen,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { formatCZK } from "@/lib/contract/template";
import { CONTRACT_STATUSES, type ContractStatus } from "@/lib/contract/types";
import { STATUS_LABELS, type ContractListItem } from "@/lib/db/types";
import { deleteContract, duplicateContract } from "@/lib/db/actions";
import { StatusBadge } from "@/components/contract/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ContractsTable({
  contracts,
}: {
  contracts: ContractListItem[];
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    ContractStatus | "all"
  >("all");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const filtered = contracts.filter((c) => {
    const needle = q.toLowerCase();
    const matchesQ =
      !needle ||
      c.contract_number.toLowerCase().includes(needle) ||
      (c.client_name ?? "").toLowerCase().includes(needle);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  async function onDuplicate(id: string) {
    try {
      const nid = await duplicateContract(id);
      toast.success("Smlouva duplikována");
      router.push(`/contracts/${nid}/edit`);
    } catch {
      toast.error("Duplikace se nezdařila");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteContract(deleteId);
      toast.success("Smlouva smazána");
      setDeleteId(null);
      router.refresh();
    } catch {
      toast.error("Smazání se nezdařilo");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat číslo nebo klienta"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "secondary" : "ghost"}
            onClick={() => setStatusFilter("all")}
          >
            Vše
          </Button>
          {CONTRACT_STATUSES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "secondary" : "ghost"}
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {contracts.length === 0
            ? "Zatím žádné smlouvy. Vytvořte první."
            : "Nic neodpovídá filtru."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Číslo</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead className="text-right">Cena</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead>Upraveno</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/contracts/${c.id}/edit`)}
                >
                  <TableCell className="font-mono font-medium">
                    {c.contract_number}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate">
                    {c.client_name}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCZK(c.total_price)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(c.updated_at).toLocaleDateString("cs-CZ")}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Akce"
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={<Link href={`/contracts/${c.id}/edit`} />}
                        >
                          <SquarePen className="size-4" />
                          Otevřít
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(c.id)}>
                          <Copy className="size-4" />
                          Duplikovat
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(c.id)}
                          variant="destructive"
                        >
                          <Trash2 className="size-4" />
                          Smazat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat smlouvu?</AlertDialogTitle>
            <AlertDialogDescription>
              Tuto akci nelze vrátit. Smlouva i historie jejích verzí budou
              trvale odstraněny.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
