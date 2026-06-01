"use client";

import * as React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { lookupAres } from "@/lib/ares";
import {
  listLinkableSmlouvy,
  type LinkableContract,
} from "@/lib/db/actions";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Labeled field wrapper with error/hint text. Shared by the document forms. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** A rich-text form field wired through RHF Controller. */
export function RichTextField({
  form,
  name,
  label,
  hint,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  name: string;
  label: string;
  hint?: string;
}) {
  const err = form.formState.errors[name];
  return (
    <Field
      label={label}
      htmlFor={name}
      hint={hint}
      error={err?.message as string | undefined}
    >
      <Controller
        control={form.control}
        name={name}
        render={({ field, fieldState }) => (
          <RichTextEditor
            id={name}
            value={field.value ?? ""}
            onChange={field.onChange}
            ariaInvalid={!!fieldState.error}
          />
        )}
      />
    </Field>
  );
}

/**
 * Counterparty (Objednatel) card with ARES auto-fill. Operates on the standard
 * client.* field names shared by all document types: clientCompany,
 * clientAddress, clientICO, clientDIC, clientRepresentative, clientDataBox.
 */
export function ClientPartyFields({
  form,
  title = "Objednatel",
  description = "Údaje protistrany — vyplňte automaticky podle IČO z registru ARES",
  representativeLabel = "Zástupce",
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  title?: string;
  description?: string;
  representativeLabel?: string;
}) {
  const { register, setValue, getValues, formState } = form;
  const errors = formState.errors;
  const [aresLoading, setAresLoading] = React.useState(false);

  async function loadAres() {
    const ico = (getValues("clientICO") as string)?.trim();
    if (!ico) {
      toast.warning("Zadejte IČO");
      return;
    }
    setAresLoading(true);
    try {
      const res = await lookupAres(ico);
      if (res.success) {
        const d = res.data;
        if (d.name) setValue("clientCompany", d.name, { shouldValidate: true });
        if (d.address)
          setValue("clientAddress", d.address, { shouldValidate: true });
        if (d.dic) setValue("clientDIC", d.dic, { shouldValidate: true });
        toast.success("Údaje načteny z ARES");
      } else {
        toast.error(res.error ?? "ARES nenašel subjekt");
      }
    } catch {
      toast.error("Načtení z ARES se nezdařilo");
    } finally {
      setAresLoading(false);
    }
  }

  const err = (n: string) => errors[n]?.message as string | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="IČO" htmlFor="clientICO" error={err("clientICO")}>
          <div className="flex gap-2">
            <Input id="clientICO" {...register("clientICO")} placeholder="12345678" />
            <Button
              type="button"
              variant="outline"
              onClick={loadAres}
              disabled={aresLoading}
            >
              {aresLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Načíst z ARES
            </Button>
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Název firmy" htmlFor="clientCompany" error={err("clientCompany")}>
            <Input id="clientCompany" {...register("clientCompany")} />
          </Field>
          <Field label="DIČ" htmlFor="clientDIC" hint="Nepovinné">
            <Input id="clientDIC" {...register("clientDIC")} className="font-mono" />
          </Field>
        </div>

        <Field label="Sídlo / adresa" htmlFor="clientAddress" error={err("clientAddress")}>
          <Input id="clientAddress" {...register("clientAddress")} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={representativeLabel}
            htmlFor="clientRepresentative"
            error={err("clientRepresentative")}
          >
            <Input id="clientRepresentative" {...register("clientRepresentative")} />
          </Field>
          <Field label="Datová schránka" htmlFor="clientDataBox" hint="Nepovinné">
            <Input id="clientDataBox" {...register("clientDataBox")} className="font-mono" />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Optional picker that prefills fields from a saved Smlouva o dílo. Fetches the
 * list of smlouvy on mount; on selection calls onPick with the chosen contract.
 * Renders nothing if there are no saved smlouvy.
 */
export function LinkSmlouvaField({
  label = "Navázat na smlouvu",
  hint = "Volitelné — předvyplní číslo smlouvy, název díla a údaje objednatele",
  onPick,
}: {
  label?: string;
  hint?: string;
  onPick: (c: LinkableContract) => void;
}) {
  const [items, setItems] = React.useState<LinkableContract[]>([]);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    listLinkableSmlouvy()
      .then((r) => {
        if (alive) setItems(r);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!loading && items.length === 0) return null;

  const labels = Object.fromEntries(items.map((c) => [c.id, c.label]));

  return (
    <Field label={label} hint={hint}>
      <Select
        items={labels}
        value={picked}
        onValueChange={(v) => {
          setPicked(v);
          const c = items.find((i) => i.id === v);
          if (c) onPick(c);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={loading ? "Načítání smluv…" : "Vyberte uloženou smlouvu"}
          />
        </SelectTrigger>
        <SelectContent>
          {items.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
