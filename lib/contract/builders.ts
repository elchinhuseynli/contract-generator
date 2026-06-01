/* eslint-disable @typescript-eslint/no-explicit-any */
// Server-safe document registry: builders, filenames, labels — NO React/form
// imports, so the PDF route and print page can use it without pulling client
// components (TipTap editors etc.) into the server bundle.

import type { ContractorInfo, DocType } from "./types";
import { sumPriceItems } from "./types";
import type { StyledDoc } from "./document";
import { buildContractDoc } from "./document";
import { buildProtokolDoc, protokolToData } from "./protokol";
import { buildNdaDoc, ndaToData } from "./nda";
import { buildDodatekDoc, dodatekToData } from "./dodatek";
import type { DocMeta } from "@/lib/db/actions";
import { contractFileBase, slug, docNum } from "./export";

export type DocBuilder = {
  key: DocType;
  label: string; // full title
  shortLabel: string; // list/badge label
  description: string; // editor page subheader
  priced: boolean; // shows a price column / total
  toData: (values: any) => any;
  buildDoc: (data: any, contractor: ContractorInfo) => StyledDoc;
  toSaveMeta: (data: any) => DocMeta;
  fileBase: (data: any) => string;
  htmlTitle: (data: any) => string;
};

export const DOC_BUILDERS: Partial<Record<DocType, DocBuilder>> = {
  smlouva: {
    key: "smlouva",
    label: "Smlouva o dílo",
    shortLabel: "Smlouva",
    description: "Smlouva o dílo · živý náhled vpravo",
    priced: true,
    toData: (v) => ({
      ...v,
      additionalProvisions: v.additionalProvisions ?? "",
      priceItems: (v.priceItems ?? []).map((i: any) => ({
        name: i.name,
        price: Number(i.price) || 0,
      })),
      advancePercent: Number(v.advancePercent) || 0,
      warrantyMonths: Number(v.warrantyMonths) || 0,
    }),
    buildDoc: buildContractDoc,
    toSaveMeta: (d) => ({
      contractNumber: d.contractNumber,
      clientName: d.clientCompany,
      totalPrice: sumPriceItems(d.priceItems ?? []),
      client: d.clientICO
        ? {
            company: d.clientCompany,
            address: d.clientAddress,
            ico: d.clientICO,
            dic: d.clientDIC ?? null,
            representative: d.clientRepresentative,
            email: d.clientEmail ?? null,
            phone: d.clientPhone ?? null,
            contact_person: d.clientContactPerson,
            contact_email: d.clientContactEmail ?? null,
            data_box: d.clientDataBox ?? null,
          }
        : null,
    }),
    fileBase: contractFileBase,
    htmlTitle: (d) => `Smlouva o dílo č. ${d.contractNumber}`,
  },

  protokol: {
    key: "protokol",
    label: "Předávací protokol",
    shortLabel: "Protokol",
    description: "Protokol o předání a převzetí díla · živý náhled vpravo",
    priced: false,
    toData: protokolToData,
    buildDoc: buildProtokolDoc,
    toSaveMeta: (d) => ({
      contractNumber: d.documentNumber,
      clientName: d.clientCompany,
      totalPrice: 0,
      client: d.clientICO
        ? {
            company: d.clientCompany,
            address: d.clientAddress,
            ico: d.clientICO,
            dic: d.clientDIC || null,
            representative: d.clientRepresentative,
            email: null,
            phone: null,
            contact_person: null,
            contact_email: null,
            data_box: d.clientDataBox || null,
          }
        : null,
    }),
    fileBase: (d) =>
      ["Protokol", docNum(d.documentNumber), slug(d.clientCompany), slug(d.workName)]
        .filter(Boolean)
        .join("_"),
    htmlTitle: (d) => `Protokol o předání a převzetí díla č. ${d.documentNumber}`,
  },

  nda: {
    key: "nda",
    label: "Dohoda o mlčenlivosti (NDA)",
    shortLabel: "NDA",
    description: "Dohoda o ochraně důvěrných informací · živý náhled vpravo",
    priced: false,
    toData: ndaToData,
    buildDoc: buildNdaDoc,
    toSaveMeta: (d) => ({
      contractNumber: d.documentNumber,
      clientName: d.clientCompany,
      totalPrice: 0,
      client: d.clientICO
        ? {
            company: d.clientCompany,
            address: d.clientAddress,
            ico: d.clientICO,
            dic: d.clientDIC || null,
            representative: d.clientRepresentative,
            email: null,
            phone: null,
            contact_person: null,
            contact_email: null,
            data_box: d.clientDataBox || null,
          }
        : null,
    }),
    fileBase: (d) =>
      ["NDA", docNum(d.documentNumber), slug(d.clientCompany)].filter(Boolean).join("_"),
    htmlTitle: (d) => `Dohoda o ochraně důvěrných informací č. ${d.documentNumber}`,
  },

  dodatek: {
    key: "dodatek",
    label: "Dodatek ke smlouvě",
    shortLabel: "Dodatek",
    description: "Dodatek ke smlouvě o dílo · živý náhled vpravo",
    priced: false,
    toData: dodatekToData,
    buildDoc: buildDodatekDoc,
    toSaveMeta: (d) => ({
      contractNumber: d.documentNumber,
      clientName: d.clientCompany,
      totalPrice: 0,
      client: d.clientICO
        ? {
            company: d.clientCompany,
            address: d.clientAddress,
            ico: d.clientICO,
            dic: d.clientDIC || null,
            representative: d.clientRepresentative,
            email: null,
            phone: null,
            contact_person: null,
            contact_email: null,
            data_box: d.clientDataBox || null,
          }
        : null,
    }),
    fileBase: (d) =>
      ["Dodatek", docNum(d.documentNumber), slug(d.clientCompany)]
        .filter(Boolean)
        .join("_"),
    htmlTitle: (d) =>
      `Dodatek ${d.dodatekOrder} ke Smlouvě o dílo č. ${d.parentContractNumber}`,
  },
};

export const DOC_BUILDER_LIST: DocBuilder[] = Object.values(DOC_BUILDERS).filter(
  Boolean
) as DocBuilder[];

export function getBuilder(type: DocType | string): DocBuilder {
  const b = DOC_BUILDERS[type as DocType];
  if (!b) throw new Error(`Neznámý typ dokumentu: ${type}`);
  return b;
}

export function isDocType(type: string | undefined | null): type is DocType {
  return !!type && !!DOC_BUILDERS[type as DocType];
}
