"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import type { DodatekFormValues } from "@/lib/contract/dodatek";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/contract/date-picker";
import {
  Field,
  RichTextField,
  ClientPartyFields,
  LinkSmlouvaField,
} from "@/components/contract/doc-fields";

export function DodatekForm({
  form,
}: {
  form: UseFormReturn<DodatekFormValues>;
}) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Údaje dodatku</CardTitle>
          <CardDescription>Identifikace dodatku a navázané smlouvy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LinkSmlouvaField
            onPick={(c) => {
              const set = (n: keyof DodatekFormValues, v: string) =>
                setValue(n, v, { shouldValidate: true, shouldDirty: true });
              set("parentContractNumber", c.contractNumber);
              set("parentContractDate", c.contractDate);
              set("workName", c.workName);
              set("clientCompany", c.clientCompany);
              set("clientAddress", c.clientAddress);
              set("clientICO", c.clientICO);
              set("clientDIC", c.clientDIC);
              set("clientRepresentative", c.clientRepresentative);
              set("clientDataBox", c.clientDataBox);
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Číslo dodatku"
              htmlFor="documentNumber"
              error={errors.documentNumber?.message}
            >
              <Input
                id="documentNumber"
                className="font-mono"
                {...register("documentNumber")}
              />
            </Field>
            <Field
              label="Pořadí dodatku"
              htmlFor="dodatekOrder"
              error={errors.dodatekOrder?.message}
              hint="Např. „č. 1“"
            >
              <Input id="dodatekOrder" {...register("dodatekOrder")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Smlouva o dílo č."
              htmlFor="parentContractNumber"
              error={errors.parentContractNumber?.message}
            >
              <Input
                id="parentContractNumber"
                className="font-mono"
                {...register("parentContractNumber")}
              />
            </Field>
            <Field label="Datum uzavření smlouvy" hint="Nepovinné">
              <Controller
                control={control}
                name="parentContractDate"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
          </div>
          <Field label="Název díla" htmlFor="workName" hint="Nepovinné — pro přehled">
            <Input id="workName" {...register("workName")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Datum účinnosti dodatku" error={errors.effectiveDate?.message}>
              <Controller
                control={control}
                name="effectiveDate"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field label="Místo uzavření" htmlFor="place" error={errors.place?.message}>
              <Input id="place" {...register("place")} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <ClientPartyFields form={form} />

      <Card>
        <CardHeader>
          <CardTitle>Změny smlouvy</CardTitle>
          <CardDescription>Co se dodatkem mění — formátujte odstavce a seznamy</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextField form={form} name="changes" label="Předmět dodatku" />
        </CardContent>
      </Card>
    </div>
  );
}
