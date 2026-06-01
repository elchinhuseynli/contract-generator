"use client";

import { Controller, type UseFormReturn } from "react-hook-form";

import type { NdaFormValues } from "@/lib/contract/nda";
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
} from "@/components/contract/doc-fields";

export function NdaForm({ form }: { form: UseFormReturn<NdaFormValues> }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Údaje dohody</CardTitle>
          <CardDescription>Identifikace a doba mlčenlivosti</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Číslo dohody"
              htmlFor="documentNumber"
              error={errors.documentNumber?.message}
            >
              <Input
                id="documentNumber"
                className="font-mono"
                {...register("documentNumber")}
              />
            </Field>
            <Field label="Datum uzavření" error={errors.effectiveDate?.message}>
              <Controller
                control={control}
                name="effectiveDate"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Místo uzavření" htmlFor="place" error={errors.place?.message}>
              <Input id="place" {...register("place")} />
            </Field>
            <Field
              label="Doba mlčenlivosti"
              htmlFor="durationText"
              error={errors.durationText?.message}
              hint="Např. „3 roky od ukončení spolupráce“ nebo „na dobu neurčitou“"
            >
              <Input id="durationText" {...register("durationText")} />
            </Field>
          </div>
          <Field
            label="Účel spolupráce"
            htmlFor="purpose"
            error={errors.purpose?.message}
            hint="Objeví se v úvodu dohody"
          >
            <Input id="purpose" {...register("purpose")} />
          </Field>
        </CardContent>
      </Card>

      <ClientPartyFields
        form={form}
        title="Smluvní strana 2 (protistrana)"
        description="Druhá strana dohody — vyplňte podle IČO z registru ARES"
      />

      <Card>
        <CardHeader>
          <CardTitle>Doplňující ujednání</CardTitle>
          <CardDescription>Nepovinný text nad rámec standardních ustanovení</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextField
            form={form}
            name="additionalProvisions"
            label="Doplňující ujednání (nepovinné)"
          />
        </CardContent>
      </Card>
    </div>
  );
}
