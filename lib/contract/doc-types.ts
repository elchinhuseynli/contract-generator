/* eslint-disable @typescript-eslint/no-explicit-any */
// Client document registry: each builder (from builders.ts) plus its zod schema,
// default-value factory, and React form. Used by the editor. Importing this
// pulls in the client form components, so server code should use builders.ts.

import type { ComponentType } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ZodTypeAny } from "zod";

import type { DocType } from "./types";
import { DOC_BUILDERS, type DocBuilder } from "./builders";

import { contractSchema, makeDefaultValues } from "./schema";
import { ContractForm } from "@/components/contract/contract-form";

import { protokolSchema, makeProtokolDefaults } from "./protokol";
import { ProtokolForm } from "@/components/contract/protokol-form";

import { ndaSchema, makeNdaDefaults } from "./nda";
import { NdaForm } from "@/components/contract/nda-form";

import { dodatekSchema, makeDodatekDefaults } from "./dodatek";
import { DodatekForm } from "@/components/contract/dodatek-form";

export type DocTypeConfig = DocBuilder & {
  schema: ZodTypeAny;
  makeDefaults: (num?: string) => any;
  Form: ComponentType<{ form: UseFormReturn<any> }>;
};

const FORM_PARTS: Record<
  DocType,
  Pick<DocTypeConfig, "schema" | "makeDefaults" | "Form"> | undefined
> = {
  smlouva: {
    schema: contractSchema,
    makeDefaults: (num) => ({
      ...makeDefaultValues(),
      ...(num ? { contractNumber: num } : {}),
    }),
    Form: ContractForm,
  },
  protokol: {
    schema: protokolSchema,
    makeDefaults: (num) => makeProtokolDefaults(num),
    Form: ProtokolForm,
  },
  nda: {
    schema: ndaSchema,
    makeDefaults: (num) => makeNdaDefaults(num),
    Form: NdaForm,
  },
  dodatek: {
    schema: dodatekSchema,
    makeDefaults: (num) => makeDodatekDefaults(num),
    Form: DodatekForm,
  },
};

export function getDocConfig(type: DocType | string): DocTypeConfig {
  const builder = DOC_BUILDERS[type as DocType];
  const parts = FORM_PARTS[type as DocType];
  if (!builder || !parts) throw new Error(`Neznámý typ dokumentu: ${type}`);
  return { ...builder, ...parts };
}
