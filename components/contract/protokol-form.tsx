"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import type { ProtokolFormValues } from "@/lib/contract/protokol";
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

export function ProtokolForm({
  form,
}: {
  form: UseFormReturn<ProtokolFormValues>;
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
          <CardTitle>Údaje protokolu</CardTitle>
          <CardDescription>Identifikace předávaného díla a smlouvy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LinkSmlouvaField
            onPick={(c) => {
              const set = (n: keyof ProtokolFormValues, v: string) =>
                setValue(n, v, { shouldValidate: true, shouldDirty: true });
              set("contractRef", c.contractNumber);
              set("workName", c.workName);
              set("clientCompany", c.clientCompany);
              set("clientAddress", c.clientAddress);
              set("clientICO", c.clientICO);
              set("clientDIC", c.clientDIC);
              set("clientRepresentative", c.clientRepresentative);
              set("clientDataBox", c.clientDataBox);
              set("acceptancePerson", c.clientRepresentative);
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Číslo protokolu"
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
              label="Smlouva o dílo č."
              htmlFor="contractRef"
              error={errors.contractRef?.message}
              hint="Číslo navázané smlouvy o dílo"
            >
              <Input id="contractRef" className="font-mono" {...register("contractRef")} />
            </Field>
          </div>
          <Field label="Název díla" htmlFor="workName" error={errors.workName?.message}>
            <Input id="workName" {...register("workName")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Předání</CardTitle>
          <CardDescription>Datum, místo a oprávněné osoby</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Datum předání" error={errors.handoverDate?.message}>
              <Controller
                control={control}
                name="handoverDate"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field label="Místo předání" htmlFor="place" error={errors.place?.message}>
              <Input id="place" {...register("place")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Předává (za zhotovitele)"
              htmlFor="handoverPerson"
              error={errors.handoverPerson?.message}
            >
              <Input id="handoverPerson" {...register("handoverPerson")} />
            </Field>
            <Field
              label="Přebírá (za objednatele)"
              htmlFor="acceptancePerson"
              error={errors.acceptancePerson?.message}
            >
              <Input id="acceptancePerson" {...register("acceptancePerson")} />
            </Field>
          </div>
          <Field
            label="Záruční doba (měsíce)"
            htmlFor="warrantyMonths"
            error={errors.warrantyMonths?.message}
            className="sm:max-w-[12rem]"
          >
            <Input
              id="warrantyMonths"
              type="number"
              {...register("warrantyMonths", { valueAsNumber: true })}
            />
          </Field>
        </CardContent>
      </Card>

      <ClientPartyFields form={form} />

      <Card>
        <CardHeader>
          <CardTitle>Obsah předání</CardTitle>
          <CardDescription>Předmět a rozsah předávaného díla</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RichTextField form={form} name="subject" label="Předmět předání" />
          <RichTextField
            form={form}
            name="scope"
            label="Rozsah předávaného díla"
            hint="Seznam předávaných výstupů"
          />
        </CardContent>
      </Card>
    </div>
  );
}
