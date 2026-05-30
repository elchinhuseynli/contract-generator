"use client";

import * as React from "react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type UseFormReturn,
} from "react-hook-form";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { lookupAres } from "@/lib/ares";
import { sumPriceItems } from "@/lib/contract/types";
import { formatCZK } from "@/lib/contract/template";
import type { ContractFormValues } from "@/lib/contract/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { DatePicker, DateRangePicker } from "@/components/contract/date-picker";

function Field({
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

export function ContractForm({
  form,
}: {
  form: UseFormReturn<ContractFormValues>;
}) {
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "timeline" });
  const priceArray = useFieldArray({ control, name: "priceItems" });
  const watchedPrices = useWatch({ control, name: "priceItems" });
  const total = sumPriceItems(watchedPrices ?? []);
  const [aresLoading, setAresLoading] = React.useState(false);

  async function loadAres() {
    const ico = getValues("clientICO")?.trim();
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
        if (d.dic) setValue("clientDIC", d.dic);
        if (d.representative) {
          setValue("clientRepresentative", d.representative, {
            shouldValidate: true,
          });
          if (!getValues("clientContactPerson")) {
            setValue("clientContactPerson", d.representative, {
              shouldValidate: true,
            });
          }
        }
        toast.success("Údaje načteny z ARES");
      } else {
        toast.error(res.error || "Nepodařilo se načíst data z ARES");
      }
    } catch {
      toast.error("Chyba při načítání z ARES");
    } finally {
      setAresLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Contract details */}
      <Card>
        <CardHeader>
          <CardTitle>Údaje smlouvy</CardTitle>
          <CardDescription>Základní informace a číslování</CardDescription>
        </CardHeader>
        <CardContent>
          <Field
            label="Číslo smlouvy"
            htmlFor="contractNumber"
            error={errors.contractNumber?.message}
            className="sm:max-w-xs"
          >
            <Input
              id="contractNumber"
              placeholder="2026-001"
              {...register("contractNumber")}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Client */}
      <Card>
        <CardHeader>
          <CardTitle>Objednatel</CardTitle>
          <CardDescription>
            Údaje klienta — vyplňte automaticky podle IČO z registru ARES
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="IČO" htmlFor="clientICO" error={errors.clientICO?.message}>
            <div className="flex gap-2">
              <Input
                id="clientICO"
                placeholder="12345678"
                className="font-mono"
                {...register("clientICO")}
              />
              <Button
                type="button"
                variant="secondary"
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
            <Field
              label="Název firmy"
              htmlFor="clientCompany"
              error={errors.clientCompany?.message}
            >
              <Input id="clientCompany" {...register("clientCompany")} />
            </Field>
            <Field label="DIČ" htmlFor="clientDIC" hint="Nepovinné">
              <Input
                id="clientDIC"
                placeholder="CZ12345678"
                className="font-mono"
                {...register("clientDIC")}
              />
            </Field>
          </div>

          <Field
            label="Sídlo / adresa"
            htmlFor="clientAddress"
            error={errors.clientAddress?.message}
          >
            <Input id="clientAddress" {...register("clientAddress")} />
          </Field>

          <Field
            label="Jednatel"
            htmlFor="clientRepresentative"
            error={errors.clientRepresentative?.message}
          >
            <Input
              id="clientRepresentative"
              {...register("clientRepresentative")}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
          <CardDescription>Komunikace a osoba pro předání díla</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="E-mail firmy"
              htmlFor="clientEmail"
              error={errors.clientEmail?.message}
              hint="Nepovinné"
            >
              <Input
                id="clientEmail"
                type="email"
                placeholder="firma@example.cz"
                {...register("clientEmail")}
              />
            </Field>
            <Field label="Telefon firmy" htmlFor="clientPhone" hint="Nepovinné">
              <Input
                id="clientPhone"
                type="tel"
                placeholder="+420 123 456 789"
                {...register("clientPhone")}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Kontaktní osoba pro předání"
              htmlFor="clientContactPerson"
              error={errors.clientContactPerson?.message}
            >
              <Input
                id="clientContactPerson"
                {...register("clientContactPerson")}
              />
            </Field>
            <Field
              label="E-mail kontaktní osoby"
              htmlFor="clientContactEmail"
              error={errors.clientContactEmail?.message}
              hint="Nepovinné"
            >
              <Input
                id="clientContactEmail"
                type="email"
                {...register("clientContactEmail")}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Project */}
      <Card>
        <CardHeader>
          <CardTitle>Dílo</CardTitle>
          <CardDescription>Rozsah a termíny</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Popis díla"
            htmlFor="projectDescription"
            error={errors.projectDescription?.message}
            hint="Rozsah konkrétního projektu"
          >
            <Textarea
              id="projectDescription"
              rows={10}
              {...register("projectDescription")}
            />
          </Field>

          <Field
            label="Doplňující ustanovení (Příloha A)"
            htmlFor="additionalProvisions"
            error={errors.additionalProvisions?.message}
            hint="Standardní text pod popisem díla — výluky, dodání podkladů apod."
          >
            <Textarea
              id="additionalProvisions"
              rows={10}
              {...register("additionalProvisions")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Termín dokončení"
              error={errors.completionDate?.message}
            >
              <Controller
                control={control}
                name="completionDate"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field
              label="Záruční doba (měsíce)"
              htmlFor="warrantyMonths"
              error={errors.warrantyMonths?.message}
            >
              <Input
                id="warrantyMonths"
                type="number"
                min={1}
                max={60}
                {...register("warrantyMonths", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Price calculation — Příloha B */}
      <Card>
        <CardHeader>
          <CardTitle>Kalkulace ceny</CardTitle>
          <CardDescription>
            Položky přílohy B — cena celkem se počítá automaticky
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {priceArray.fields.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_10rem_auto]"
            >
              <Field
                label="Položka"
                error={errors.priceItems?.[index]?.name?.message}
              >
                <Input
                  placeholder="Tvorba webových stránek"
                  {...register(`priceItems.${index}.name` as const)}
                />
              </Field>
              <Field
                label="Cena (Kč)"
                error={errors.priceItems?.[index]?.price?.message}
              >
                <Input
                  type="number"
                  inputMode="numeric"
                  className="font-mono"
                  {...register(`priceItems.${index}.price` as const, {
                    valueAsNumber: true,
                  })}
                />
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Odebrat položku"
                  onClick={() => priceArray.remove(index)}
                  disabled={priceArray.fields.length === 1}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => priceArray.append({ name: "", price: 0 })}
            >
              <Plus className="size-4" />
              Přidat položku
            </Button>
            <div className="text-sm">
              <span className="text-muted-foreground">Cena celkem: </span>
              <span className="font-mono font-semibold">{formatCZK(total)}</span>
            </div>
          </div>

          <Field
            label="Záloha (%)"
            htmlFor="advancePercent"
            error={errors.advancePercent?.message}
            hint="Procento z celkové ceny placené předem"
            className="sm:max-w-[14rem]"
          >
            <Input
              id="advancePercent"
              type="number"
              min={0}
              max={100}
              {...register("advancePercent", { valueAsNumber: true })}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Harmonogram</CardTitle>
          <CardDescription>Fáze projektu s termíny</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Field label="Název fáze" error={errors.timeline?.[index]?.phase?.message}>
                <Input
                  placeholder="Tvorba prototypů webu"
                  {...register(`timeline.${index}.phase` as const)}
                />
              </Field>
              <Field
                label="Období"
                error={
                  errors.timeline?.[index]?.start?.message ||
                  errors.timeline?.[index]?.end?.message
                }
              >
                <Controller
                  control={control}
                  name={`timeline.${index}` as const}
                  render={({ field }) => (
                    <DateRangePicker
                      start={field.value?.start}
                      end={field.value?.end}
                      onChange={({ start, end }) =>
                        field.onChange({ ...field.value, start, end })
                      }
                    />
                  )}
                />
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Odebrat fázi"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ phase: "", start: "", end: "" })}
          >
            <Plus className="size-4" />
            Přidat fázi
          </Button>
        </CardContent>
      </Card>

      {/* Signing */}
      <Card>
        <CardHeader>
          <CardTitle>Podpis</CardTitle>
          <CardDescription>Místo a datum uzavření smlouvy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Místo uzavření"
              htmlFor="contractLocation"
              error={errors.contractLocation?.message}
            >
              <Input id="contractLocation" {...register("contractLocation")} />
            </Field>
            <Field label="Datum podpisu" error={errors.contractDate?.message}>
              <Controller
                control={control}
                name="contractDate"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
