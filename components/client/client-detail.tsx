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

import { lookupAres, type VatRegistration } from "@/lib/ares";
import { updateClient, type ClientInput } from "@/lib/db/actions";
import { formatCZK } from "@/lib/contract/format";
import { VAT_MODE_LABELS, type VatMode } from "@/lib/contract/types";
import type { ClientRow, ContractListItem } from "@/lib/db/types";
import { StatusBadge } from "@/components/contract/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    vat_mode: client.vat_mode ?? null,
  });
  const [saving, setSaving] = React.useState(false);
  const [aresLoading, setAresLoading] = React.useState(false);
  const [vat, setVat] = React.useState<VatRegistration | null>(null);
  const [vatLoading, setVatLoading] = React.useState(false);

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
        setVat(r.data.vatRegistration);
        if (r.data.vatRegistration === "none") {
          setV((p) => ({ ...p, vat_mode: "nonpayer" }));
        }
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

  async function verifyVat() {
    if (!v.ico) {
      toast.warning("Klient nemá IČO");
      return;
    }
    setVatLoading(true);
    try {
      const r = await lookupAres(v.ico);
      if (r.success) {
        setVat(r.data.vatRegistration);
        if (r.data.vatRegistration === "none") {
          setV((p) => ({ ...p, vat_mode: "nonpayer" }));
        }
      } else {
        toast.error(r.error || "Nepodařilo se ověřit");
      }
    } catch {
      toast.error("Chyba při ověření");
    } finally {
      setVatLoading(false);
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

            <Field
              label="Status DPH"
              hint="ARES rozliší jen registrováno/neregistrováno — plátce vs. identifikovaná osoba vyberte ručně."
            >
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  items={VAT_MODE_LABELS}
                  value={v.vat_mode ?? undefined}
                  onValueChange={(val) =>
                    setV((p) => ({ ...p, vat_mode: val as VatMode }))
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Neuvedeno" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(VAT_MODE_LABELS) as VatMode[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {VAT_MODE_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={verifyVat}
                  disabled={vatLoading}
                >
                  {vatLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShieldQuestion className="size-4" />
                  )}
                  Zjistit z ARES
                </Button>
                <VatBadge status={vat} />
              </div>
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

function VatBadge({ status }: { status: VatRegistration | null }) {
  if (!status) return null;
  if (status === "registered")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-status-sent/10 px-2.5 py-1 text-sm text-status-sent-fg">
        <ShieldCheck className="size-4" />
        ARES: registrováno k DPH (plátce / IO)
      </span>
    );
  if (status === "former")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-status-draft/10 px-2.5 py-1 text-sm text-status-draft-fg">
        <ShieldAlert className="size-4" />
        ARES: bývalá registrace DPH
      </span>
    );
  if (status === "none")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-sm text-muted-foreground">
        <ShieldQuestion className="size-4" />
        ARES: neregistrováno (neplátce)
      </span>
    );
  return <span className="text-sm text-muted-foreground">Stav neznámý</span>;
}
