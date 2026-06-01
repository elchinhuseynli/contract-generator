import { z } from "zod";
import { formatDate } from "./format";
import { toRichHtml } from "./richtext";
import type { StyledDoc, DocBlock, DocDetail } from "./document";
import { DEFAULT_CONTRACTOR, type ContractorInfo } from "./types";

// NDA — "Dohoda o ochraně důvěrných informací" (mutual confidentiality).

export type NdaData = {
  documentNumber: string; // NDA-2026-001
  effectiveDate: string; // ISO
  place: string;
  purpose: string;
  durationText: string;

  // Counterparty (Strana 2)
  clientCompany: string;
  clientAddress: string;
  clientICO: string;
  clientDIC?: string;
  clientRepresentative: string;
  clientDataBox?: string;

  additionalProvisions: string; // optional rich text
};

export const ndaSchema = z.object({
  documentNumber: z.string().min(1, "Zadejte číslo dohody"),
  effectiveDate: z.string().min(1, "Vyberte datum uzavření"),
  place: z.string().min(1, "Zadejte místo uzavření"),
  purpose: z.string().min(1, "Zadejte účel dohody"),
  durationText: z.string().min(1, "Zadejte dobu mlčenlivosti"),
  clientCompany: z.string().min(1, "Zadejte název protistrany"),
  clientAddress: z.string().min(1, "Zadejte sídlo protistrany"),
  clientICO: z.string().min(1, "Zadejte IČO"),
  clientDIC: z.string().optional(),
  clientRepresentative: z.string().min(1, "Zadejte zástupce protistrany"),
  clientDataBox: z.string().optional(),
  additionalProvisions: z.string(),
});

export type NdaFormValues = z.infer<typeof ndaSchema>;

export function makeNdaDefaults(num?: string): NdaFormValues {
  return {
    documentNumber: num ?? "NDA-2026-001",
    effectiveDate: "",
    place: "Karlovy Vary",
    purpose: "vzájemná spolupráce v oblasti tvorby a provozu webových řešení",
    durationText: "3 roky od ukončení spolupráce smluvních stran",
    clientCompany: "",
    clientAddress: "",
    clientICO: "",
    clientDIC: "",
    clientRepresentative: "",
    clientDataBox: "",
    additionalProvisions: "",
  };
}

export function ndaToData(v: NdaFormValues): NdaData {
  return { ...v };
}

export function buildNdaDoc(
  data: NdaData,
  contractor: ContractorInfo = DEFAULT_CONTRACTOR
): StyledDoc {
  const party2Lines: DocDetail[] = [
    { label: "Sídlo", value: data.clientAddress },
    { label: "IČO", value: data.clientICO },
    ...(data.clientDIC ? [{ label: "DIČ", value: data.clientDIC }] : []),
    { label: "Zástupce", value: data.clientRepresentative },
    ...(data.clientDataBox
      ? [{ label: "Datová schránka", value: data.clientDataBox }]
      : []),
  ];

  const sections: StyledDoc["sections"] = [
    {
      num: "I.",
      title: "Předmět a účel dohody",
      blocks: [
        {
          kind: "clauses",
          items: [
            `Účelem této dohody je ochrana důvěrných informací, které si smluvní strany vzájemně poskytnou v souvislosti s ${data.purpose}.`,
            "Tato dohoda upravuje práva a povinnosti smluvních stran při nakládání s důvěrnými informacemi.",
          ],
        },
      ],
    },
    {
      num: "II.",
      title: "Důvěrné informace",
      blocks: [
        {
          kind: "clauses",
          items: [
            "Za důvěrné informace se považují veškeré informace obchodní, technické, ekonomické, organizační či jiné povahy, které jedna smluvní strana poskytne druhé v písemné, ústní, elektronické nebo jiné podobě a které nejsou veřejně dostupné.",
            "Za důvěrné se považují zejména know-how, zdrojové kódy, návrhy, grafické podklady, přístupové údaje, obchodní a marketingové plány, údaje o klientech a cenotvorbě.",
          ],
        },
      ],
    },
    {
      num: "III.",
      title: "Závazky smluvních stran",
      blocks: [
        {
          kind: "clauses",
          items: [
            "Přijímající strana se zavazuje zachovávat o důvěrných informacích mlčenlivost a chránit je nejméně se stejnou péčí jako vlastní důvěrné informace.",
            "Přijímající strana nesmí důvěrné informace zpřístupnit třetí osobě bez předchozího písemného souhlasu předávající strany ani je použít k jinému účelu než k naplnění účelu této dohody.",
            "Přijímající strana zpřístupní důvěrné informace pouze svým zaměstnancům a spolupracovníkům, kteří je nezbytně potřebují, a zaváže je k mlčenlivosti ve stejném rozsahu.",
          ],
        },
      ],
    },
    {
      num: "IV.",
      title: "Výjimky z povinnosti mlčenlivosti",
      blocks: [
        {
          kind: "clauses",
          items: [
            "Za porušení povinnosti mlčenlivosti se nepovažuje zpřístupnění informací, které: a) jsou nebo se staly veřejně známými bez porušení této dohody; b) byly přijímající straně prokazatelně známy před jejich poskytnutím; c) byly vyvinuty nezávisle bez použití důvěrných informací; d) musí být zpřístupněny na základě zákona nebo rozhodnutí orgánu veřejné moci, a to v nezbytném rozsahu.",
          ],
        },
      ],
    },
    {
      num: "V.",
      title: "Doba trvání",
      blocks: [
        {
          kind: "clauses",
          items: [
            `Závazek mlčenlivosti trvá ${data.durationText}.`,
            "Ukončení spolupráce smluvních stran nemá vliv na trvání závazku mlčenlivosti dle této dohody.",
          ],
        },
      ],
    },
    {
      num: "VI.",
      title: "Smluvní pokuta a náhrada škody",
      blocks: [
        {
          kind: "clauses",
          items: [
            "V případě porušení povinnosti dle této dohody je porušující strana povinna zaplatit druhé straně smluvní pokutu ve výši 50 000,- Kč za každé jednotlivé porušení.",
            "Zaplacením smluvní pokuty není dotčen nárok na náhradu škody v plné výši.",
          ],
        },
      ],
    },
    {
      num: "VII.",
      title: "Závěrečná ustanovení",
      blocks: [
        {
          kind: "clauses",
          items: [
            "Tato dohoda se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů.",
            "Tato dohoda je vyhotovena ve dvou stejnopisech, z nichž každá smluvní strana obdrží jedno vyhotovení.",
            "Tato dohoda nabývá platnosti a účinnosti dnem jejího podpisu oběma smluvními stranami.",
          ],
        },
      ],
    },
  ];

  if (data.additionalProvisions && data.additionalProvisions.trim()) {
    sections.push({
      num: "VIII.",
      title: "Doplňující ujednání",
      blocks: [
        { kind: "richtext", html: toRichHtml(data.additionalProvisions) } as DocBlock,
      ],
    });
  }

  return {
    brand: contractor.companyName,
    brandSub: "Digital · UI/UX · Web",
    docTag: "Dohoda o mlčenlivosti",
    title: "Dohoda o ochraně důvěrných informací",
    ref: `č. ${data.documentNumber}`,
    meta: [
      { k: "Číslo dohody", v: data.documentNumber },
      { k: "Účel", v: data.purpose },
      { k: "Doba mlčenlivosti", v: data.durationText },
      {
        k: "Místo a datum uzavření",
        v: `${data.place}, ${formatDate(data.effectiveDate)}`,
      },
    ],
    parties: [
      {
        role: "Smluvní strana 1",
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
      { role: "Smluvní strana 2", name: data.clientCompany, lines: party2Lines },
    ],
    preamble:
      "Níže uvedeného dne, měsíce a roku uzavřely smluvní strany tuto dohodu o ochraně důvěrných informací:",
    sections,
    signature: {
      placeDate: `V ${data.place}, dne ${formatDate(data.effectiveDate)}`,
      columns: [
        {
          for: "smluvní stranu 1",
          name: contractor.representative,
          pos: "jednatel",
          org: contractor.companyName,
        },
        {
          for: "smluvní stranu 2",
          name: data.clientRepresentative,
          org: data.clientCompany,
        },
      ],
    },
  };
}
