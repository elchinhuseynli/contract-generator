// Single source of truth for the shape of a contract.
// The v1 app spread these fields across hidden inputs and array-indexed form
// fields in server.js + script.js; here they are one typed object.

export type TimelinePhase = {
  /** e.g. "Tvorba prototypů webu" */
  phase: string;
  /** ISO date string (yyyy-mm-dd) */
  start: string;
  /** ISO date string (yyyy-mm-dd) */
  end: string;
};

/** A single line in the price calculation (Příloha B). */
export type PriceItem = {
  name: string;
  price: number;
};

/** Total contract price = sum of all line items. */
export function sumPriceItems(items: PriceItem[]): number {
  return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
}

export type ContractData = {
  contractNumber: string;
  /** Short name / subject of the work, e.g. "Tvorba webových stránek". */
  workName: string;

  // Objednatel (client)
  clientCompany: string;
  clientAddress: string;
  clientICO: string;
  clientDIC?: string;
  clientRepresentative: string;
  clientEmail?: string;
  clientPhone?: string;
  clientContactPerson: string;
  clientContactEmail?: string;
  clientDataBox?: string;

  // Předmět / cena
  projectDescription: string;
  /** Standard terms appended under Příloha A (exclusions, deliverable rules…). */
  additionalProvisions: string;
  priceItems: PriceItem[];
  advancePercent: number;
  completionDate: string; // ISO date
  warrantyMonths: number;

  // Harmonogram
  timeline: TimelinePhase[];

  // Podpis
  contractLocation: string;
  contractDate: string; // ISO date
};

/**
 * DPH status. "identified" = identifikovaná osoba (has a DIČ for EU
 * transactions but is NOT a domestic VAT payer — distinct from both
 * plátce and neplátce). ARES cannot distinguish payer from identified.
 */
export type VatMode = "payer" | "identified" | "nonpayer";

export const VAT_MODE_LABELS: Record<VatMode, string> = {
  payer: "Plátce DPH",
  identified: "Identifikovaná osoba",
  nonpayer: "Neplátce DPH",
};

/** Zhotovitel — the supplier side (Flex Digital). Editable via org_settings. */
export type ContractorInfo = {
  companyName: string;
  address: string;
  ico: string;
  representative: string;
  bankName: string;
  accountNumber: string;
  vatMode: VatMode;
  dataBox: string;
};

export const DEFAULT_CONTRACTOR: ContractorInfo = {
  companyName: "Flex Digital Agency, s.r.o.",
  address: "Mattoniho nábřeží 50, Karlovy Vary 360 01",
  ico: "08894892",
  representative: "Elchin Huseynli",
  bankName: "Raiffeisenbank, a.s.",
  accountNumber: "2096701002/5500",
  vatMode: "identified",
  dataBox: "354pnxf",
};

export const CONTRACT_STATUSES = [
  "draft",
  "sent",
  "signed",
  "archived",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
