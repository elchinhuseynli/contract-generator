"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { toast } from "sonner";

import { lookupAres } from "@/lib/ares";
import { checkDph, type DphResult } from "@/lib/dph";
import { updateClient, type ClientInput } from "@/lib/db/actions";
import { formatCZK } from "@/lib/contract/format";
import type { ClientRow, ContractListItem } from "@/lib/db/types";
import { StatusBadge } from "@/components/contract/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-2">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ClientDetail({
  client,
  contracts,
}: {
  client: ClientRow;
  contracts: ContractListItem[];
}) {
  const router = useRouter();
  const [v, setV] = React.useState<ClientInput>({
    company: client.company,
    address: client.address ?? "",
    ico: client.ico ?? "",
    dic: client.dic ?? "",
    representative: client.representative ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    contact_person: client.contact_person ?? "",
    contact_email: client.contact_email ?? "",
    data_box: client.data_box ?? "",
  });
  const [saving, setSaving] = React.useState(false);
  const [aresLoading, setAresLoading] = React.useState(false);
  const [dph, setDph] = React.useState<DphResult | null>(null);
  const [dphLoading, setDphLoading] = React.useState(false);

  function set<K extends keyof ClientInput>(k: K, val: string) {
    setV((p) => ({ ...p, [k]: val }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateClient(client.id, v);
      toast.success("Klient uložen");
      router.refresh();
    } catch {
      toast.error("Uložení se nezdařilo");
    } finally {
      setSaving(false);
    }
  }

  async function reAres() {
    if (!v.ico) {
      toast.warning("Klient nemá IČO");
      return;
    }
    setAresLoading(true);
    try {
      const r = await lookupAres(v.ico);
      if (r.success) {
        setV((p) => ({
          ...p,
          company: r.data.name || p.company,
          address: r.data.address || p.address,
          dic: r.data.dic || p.dic,
          representative: r.data.representative || p.representative,
        }));
        toast.success("Aktualizováno z ARES — nezapomeňte uložit");
      } else {
        toast.error(r.error || "Nepodařilo se načíst z ARES");
      }
    } catch {
      toast.error("Chyba při načítání z ARES");
    } finally {
      setAresLoading(false);
    }
  }

  async function verifyDph() {
    if (!v.dic) {
      toast.warning("Klient nemá DIČ");
      return;
    }
    setDphLoading(true);
    try {
      setDph(await checkDph(v.dic));
    } catch {
      setDph({ status: "error", message: "Služba nedostupná" });
    } finally {
      setDphLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Údaje klienta</CardTitle>
            <CardDescription>Upravte a uložte údaje klienta</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reAres}
            disabled={aresLoading}
          >
            {aresLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Načíst z ARES
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <Field label="Firma">
              <Input
                value={v.company}
                onChange={(e) => set("company", e.target.value)}
                required
              />
            </Field>
            <Field label="Sídlo / adresa">
              <Input
                value={v.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="IČO">
                <Input
                  className="font-mono"
                  value={v.ico ?? ""}
                  onChange={(e) => set("ico", e.target.value)}
                />
              </Field>
              <Field label="DIČ">
                <Input
                  className="font-mono"
                  value={v.dic ?? ""}
                  onChange={(e) => set("dic", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Jednatel">
              <Input
                value={v.representative ?? ""}
                onChange={(e) => set("representative", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail">
                <Input
                  type="email"
                  value={v.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Telefon">
                <Input
                  value={v.phone ?? ""}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kontaktní osoba">
                <Input
                  value={v.contact_person ?? ""}
                  onChange={(e) => set("contact_person", e.target.value)}
                />
              </Field>
              <Field label="E-mail kontaktní osoby">
                <Input
                  type="email"
                  value={v.contact_email ?? ""}
                  onChange={(e) => set("contact_email", e.target.value)}
                />
              </Field>
            </div>
            <Field
              label="ID datové schránky"
              hint="Zadejte ručně — není dostupné přes ARES"
            >
              <Input
                className="font-mono"
                value={v.data_box ?? ""}
                onChange={(e) => set("data_box", e.target.value)}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Uložit změny
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={verifyDph}
                disabled={dphLoading}
              >
                {dphLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldQuestion className="size-4" />
                )}
                Ověřit spolehlivost DPH
              </Button>
              <DphBadge result={dph} />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Smlouvy klienta</CardTitle>
          <CardDescription>
            {contracts.length === 0
              ? "Žádné smlouvy"
              : `${contracts.length} smluv`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pro tohoto klienta zatím nejsou žádné smlouvy.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Číslo</TableHead>
                    <TableHead className="text-right">Cena</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Upraveno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/contracts/${c.id}/edit`)}
                    >
                      <TableCell className="font-mono font-medium">
                        {c.contract_number}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DphBadge({ result }: { result: DphResult | null }) {
  if (!result) return null;
  if (result.status === "reliable")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-status-signed/10 px-2.5 py-1 text-sm text-status-signed-fg">
        <ShieldCheck className="size-4" />
        Spolehlivý plátce DPH
      </span>
    );
  if (result.status === "unreliable")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1 text-sm text-destructive">
        <ShieldAlert className="size-4" />
        Nespolehlivý plátce{result.since ? ` (od ${result.since})` : ""}
      </span>
    );
  if (result.status === "notfound")
    return (
      <span className="text-sm text-muted-foreground">
        Plátce nenalezen v registru DPH
      </span>
    );
  return <span className="text-sm text-muted-foreground">{result.message}</span>;
}
