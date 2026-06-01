import { z } from "zod";
import { formatDate } from "./format";
import { toRichHtml, richTextToPlain } from "./richtext";
import type { StyledDoc, DocDetail } from "./document";
import { DEFAULT_CONTRACTOR, type ContractorInfo } from "./types";

// Předávací protokol — "Protokol o předání a převzetí díla".
// Mirrors ~/Downloads/protokol_predani_dila_2025-012.html (the original .cdoc
// design source), expressed via the shared StyledDoc model.

export type ProtokolData = {
  documentNumber: string; // e.g. "PD-2026-001"
  contractRef: string; // parent smlouva number, e.g. "2026-012"
  workName: string;
  handoverDate: string; // ISO
  place: string;

  // Objednatel
  clientCompany: string;
  clientAddress: string;
  clientICO: string;
  clientDIC?: string;
  clientRepresentative: string;
  clientDataBox?: string;

  // Oprávněné osoby
  handoverPerson: string; // za zhotovitele
  acceptancePerson: string; // za objednatele

  // Obsah (rich text / number)
  subject: string; // Předmět předání
  scope: string; // Rozsah předávaného díla
  warrantyMonths: number;
};

export const DEFAULT_PROTOKOL_SUBJECT =
  "<p>Zhotovitel tímto předává objednateli dílo zhotovené na základě výše uvedené smlouvy o dílo, a to v rozsahu sjednaném smlouvou a jejími přílohami.</p>";

export const DEFAULT_PROTOKOL_SCOPE =
  "<ul><li>návrh a implementace díla dle zadání</li><li>finální výstupy předané objednateli</li><li>podklady a dokumentace nezbytné k užití díla</li></ul>";

export const protokolSchema = z.object({
  documentNumber: z.string().min(1, "Zadejte číslo protokolu"),
  contractRef: z.string().min(1, "Zadejte číslo smlouvy"),
  workName: z.string().min(1, "Zadejte název díla"),
  handoverDate: z.string().min(1, "Vyberte datum předání"),
  place: z.string().min(1, "Zadejte místo předání"),
  clientCompany: z.string().min(1, "Zadejte název objednatele"),
  clientAddress: z.string().min(1, "Zadejte sídlo objednatele"),
  clientICO: z.string().min(1, "Zadejte IČO"),
  clientDIC: z.string().optional(),
  clientRepresentative: z.string().min(1, "Zadejte zástupce objednatele"),
  clientDataBox: z.string().optional(),
  handoverPerson: z.string().min(1, "Zadejte osobu předávající dílo"),
  acceptancePerson: z.string().min(1, "Zadejte osobu přebírající dílo"),
  subject: z
    .string()
    .refine((v) => richTextToPlain(v).length > 0, "Zadejte předmět předání"),
  scope: z.string(),
  warrantyMonths: z
    .number({ invalid_type_error: "Zadejte záruční dobu" })
    .min(0),
});

export type ProtokolFormValues = z.infer<typeof protokolSchema>;

export function makeProtokolDefaults(num?: string): ProtokolFormValues {
  return {
    documentNumber: num ?? "PD-2026-001",
    contractRef: "",
    workName: "",
    handoverDate: "",
    place: "Karlovy Vary",
    clientCompany: "",
    clientAddress: "",
    clientICO: "",
    clientDIC: "",
    clientRepresentative: "",
    clientDataBox: "",
    handoverPerson: DEFAULT_CONTRACTOR.representative,
    acceptancePerson: "",
    subject: DEFAULT_PROTOKOL_SUBJECT,
    scope: DEFAULT_PROTOKOL_SCOPE,
    warrantyMonths: 6,
  };
}

export function protokolToData(v: ProtokolFormValues): ProtokolData {
  return { ...v, warrantyMonths: Number(v.warrantyMonths) || 0 };
}

export function buildProtokolDoc(
  data: ProtokolData,
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

  return {
    brand: contractor.companyName,
    brandSub: "Digital · UI/UX · Web",
    docTag: "Předávací protokol",
    title: "Protokol o předání a převzetí díla",
    ref: `dle Smlouvy o dílo č. ${data.contractRef}`,
    meta: [
      { k: "Název díla", v: data.workName },
      { k: "Smlouva", v: `Smlouva o dílo č. ${data.contractRef}` },
      { k: "Datum předání a převzetí", v: formatDate(data.handoverDate) },
      { k: "Místo předání", v: `${data.place}, Česká republika` },
    ],
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
    sections: [
      {
        num: "1.",
        title: "Předání a převzetí",
        blocks: [
          {
            kind: "signers",
            items: [
              { label: "Osoba oprávněná k předání díla", who: data.handoverPerson },
              {
                label: "Osoba oprávněná k převzetí díla",
                who: data.acceptancePerson || data.clientRepresentative,
              },
            ],
          },
          { kind: "richtext", html: toRichHtml(data.subject) },
        ],
      },
      {
        num: "2.",
        title: "Rozsah předávaného díla",
        blocks: [{ kind: "richtext", html: toRichHtml(data.scope) }],
      },
      {
        num: "3.",
        title: "Prohlášení smluvních stran",
        blocks: [
          {
            kind: "statement",
            paras: [
              `Zhotovitel prohlašuje, že předávané dílo bylo provedeno v souladu se Smlouvou o dílo č. ${data.contractRef} a jejími přílohami.`,
              "Objednatel prohlašuje, že dílo ke dni podpisu tohoto protokolu přebírá.",
              "Dnem podpisu tohoto protokolu se dílo považuje za předané a převzaté.",
              `Záruční doba v délce ${data.warrantyMonths} měsíců začíná běžet dnem předání díla, není-li níže uvedeno jinak.`,
            ],
          },
        ],
      },
      {
        num: "4.",
        title: "Vady a nedodělky",
        blocks: [{ kind: "defects" }],
      },
      {
        num: "5.",
        title: "Licence a práva k užití",
        blocks: [
          {
            kind: "para",
            text: "V souladu s licenčním ujednáním smlouvy poskytuje zhotovitel objednateli oprávnění k užití díla v rozsahu uvedeném ve smlouvě. Cena licence je zahrnuta v ceně díla.",
          },
        ],
      },
      {
        num: "6.",
        title: "Závěrečné ustanovení",
        blocks: [
          {
            kind: "para",
            text: "Tento protokol je vyhotoven ve dvou stejnopisech, z nichž každá smluvní strana obdrží jedno vyhotovení. Smluvní strany potvrzují správnost výše uvedených údajů svými podpisy.",
          },
        ],
      },
    ],
    signature: {
      placeDate: `V ${data.place} dne ${formatDate(data.handoverDate)}`,
      columns: [
        {
          for: "Zhotovitel",
          name: data.handoverPerson || contractor.representative,
          pos: "jednatel",
          org: contractor.companyName,
        },
        {
          for: "Objednatel",
          name: data.acceptancePerson || data.clientRepresentative,
          org: data.clientCompany,
        },
      ],
    },
  };
}
