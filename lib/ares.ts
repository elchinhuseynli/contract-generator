// ARES = Czech business registry. We look up a company by IČO and pre-fill
// the client fields. Shared types + helpers for both the route and the form.

/** DPH (VAT) registration status, derived from ARES seznamRegistraci.stavZdrojeDph. */
export type VatStatus = "payer" | "former" | "nonpayer" | "unknown";

export type AresCompany = {
  ico: string;
  name: string;
  address: string;
  dic: string;
  representative: string;
  vatStatus: VatStatus;
};

export type AresResult =
  | { success: true; data: AresCompany }
  | { success: false; error: string };

/**
 * Title-case a person's name (ARES often returns ALL CAPS), preserving Czech
 * name particles and ordinal suffixes. Ported from the v1 app.
 */
export function formatName(name: string): string {
  if (!name) return "";

  const lowerCaseWords = ["von", "van", "de", "da", "du", "el", "la"];
  const upperCaseWords = ["jr", "sr", "ii", "iii", "iv"];

  return name
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (lowerCaseWords.includes(word)) return word;
      if (upperCaseWords.includes(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/** Client-side: call our own ARES proxy route. */
export async function lookupAres(ico: string): Promise<AresResult> {
  const res = await fetch(`/api/ares/${encodeURIComponent(ico.trim())}`);
  return (await res.json()) as AresResult;
}
