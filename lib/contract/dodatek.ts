import { z } from "zod";
import { formatDate } from "./format";
import { toRichHtml, richTextToPlain } from "./richtext";
import type { StyledDoc, DocDetail } from "./document";
import { DEFAULT_CONTRACTOR, type ContractorInfo } from "./types";

// Dodatek — "Dodatek ke smlouvě o dílo" (amendment to a parent contract).

export type DodatekData = {
  documentNumber: string; // DOD-2026-001
  dodatekOrder: string; // "č. 1"
  parentContractNumber: string;
  parentContractDate?: string; // ISO (optional)
  workName: string;
  effectiveDate: string; // ISO
  place: string;

  // Objednatel
  clientCompany: string;
  clientAddress: string;
  clientICO: string;
  clientDIC?: string;
  clientRepresentative: string;
  clientDataBox?: string;

  changes: string; // rich text — the amendments
};

export const DEFAULT_DODATEK_CHANGES =
  "<p>Smluvní strany se dohodly na změně smlouvy takto:</p><ul><li>Článek …, odst. … smlouvy nově zní: …</li></ul>";

export const dodatekSchema = z.object({
  documentNumber: z.string().min(1, "Zadejte číslo dodatku"),
  dodatekOrder: z.string().min(1, "Zadejte pořadové číslo dodatku"),
  parentContractNumber: z.string().min(1, "Zadejte číslo smlouvy"),
  parentContractDate: z.string().optional(),
  workName: z.string(),
  effectiveDate: z.string().min(1, "Vyberte datum účinnosti"),
  place: z.string().min(1, "Zadejte místo uzavření"),
  clientCompany: z.string().min(1, "Zadejte název objednatele"),
  clientAddress: z.string().min(1, "Zadejte sídlo objednatele"),
  clientICO: z.string().min(1, "Zadejte IČO"),
  clientDIC: z.string().optional(),
  clientRepresentative: z.string().min(1, "Zadejte zástupce objednatele"),
  clientDataBox: z.string().optional(),
  changes: z
    .string()
    .refine((v) => richTextToPlain(v).length > 0, "Popište změny smlouvy"),
});

export type DodatekFormValues = z.infer<typeof dodatekSchema>;

export function makeDodatekDefaults(num?: string): DodatekFormValues {
  return {
    documentNumber: num ?? "DOD-2026-001",
    dodatekOrder: "č. 1",
    parentContractNumber: "",
    parentContractDate: "",
    workName: "",
    effectiveDate: "",
    place: "Karlovy Vary",
    clientCompany: "",
    clientAddress: "",
    clientICO: "",
    clientDIC: "",
    clientRepresentative: "",
    clientDataBox: "",
    changes: DEFAULT_DODATEK_CHANGES,
  };
}

export function dodatekToData(v: DodatekFormValues): DodatekData {
  return { ...v };
}

export function buildDodatekDoc(
  data: DodatekData,
  contractor: ContractorInfo = DEFAULT_CONTRACTOR
): StyledDoc {
  const objednatelLines: DocDetail[] = [
    { label: "Sídlo", value: data.clientAddress },
    { label: "IČO", value: data.clientICO },
    ...(data.clientDIC ? [{ label: "DIČ", value: data.clientDIC }] : []),
    { label: "Zástupce", value: data.clientRepresentative },
    ...(data.clientDataBox
      ? [{ label: "Datová schránka", value: data.clientDataBox }]
      : []),
  ];

  const meta = [
    { k: "Dodatek", v: data.dodatekOrder },
    { k: "Smlouva", v: `Smlouva o dílo č. ${data.parentContractNumber}` },
    ...(data.workName ? [{ k: "Název díla", v: data.workName }] : []),
    {
      k: "Místo a datum",
      v: `${data.place}, ${formatDate(data.effectiveDate)}`,
    },
  ];

  const datePart = data.parentContractDate
    ? `dne ${formatDate(data.parentContractDate)} `
    : "";

  return {
    brand: contractor.companyName,
    brandSub: "Digital · UI/UX · Web",
    docTag: "Dodatek ke smlouvě",
    title: `Dodatek ${data.dodatekOrder} ke Smlouvě o dílo`,
    ref: `ke Smlouvě o dílo č. ${data.parentContractNumber}`,
    meta,
    parties: [
      {
        role: "Zhotovitel",
        name: contractor.companyName,
        lines: [
          { label: "Sídlo", value: contractor.address },
          { label: "IČO", value: contractor.ico },
          { label: "Jednatel", value: contractor.representative },
          ...(contractor.dataBox
            ? [{ label: "Datová schránka", value: contractor.dataBox }]
            : []),
        ],
      },
      { role: "Objednatel", name: data.clientCompany, lines: objednatelLines },
    ],
    preamble: `Smluvní strany uzavřely ${datePart}Smlouvu o dílo č. ${data.parentContractNumber} (dále jen „smlouva"). Na základě vzájemné dohody uzavírají tento dodatek ${data.dodatekOrder}:`,
    sections: [
      {
        num: "I.",
        title: "Předmět dodatku",
        blocks: [
          {
            kind: "para",
            text: "Smluvní strany se dohodly na následujících změnách smlouvy:",
          },
          { kind: "richtext", html: toRichHtml(data.changes) },
        ],
      },
      {
        num: "II.",
        title: "Ostatní ujednání",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Ostatní ustanovení smlouvy zůstávají tímto dodatkem nedotčena a nadále platí v plném rozsahu.",
              "Tento dodatek je nedílnou součástí smlouvy.",
            ],
          },
        ],
      },
      {
        num: "III.",
        title: "Závěrečná ustanovení",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Tento dodatek je vyhotoven ve dvou stejnopisech, z nichž každá smluvní strana obdrží jedno vyhotovení.",
              "Tento dodatek nabývá platnosti a účinnosti dnem jeho podpisu oběma smluvními stranami.",
              "Smluvní strany prohlašují, že si dodatek přečetly, s jeho obsahem souhlasí, na důkaz čehož připojují své podpisy.",
            ],
          },
        ],
      },
    ],
    signature: {
      placeDate: `V ${data.place}, dne ${formatDate(data.effectiveDate)}`,
      columns: [
        {
          for: "Zhotovitel",
          name: contractor.representative,
          pos: "jednatel",
          org: contractor.companyName,
        },
        {
          for: "Objednatel",
          name: data.clientRepresentative,
          org: data.clientCompany,
        },
      ],
    },
  };
}
