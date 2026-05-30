import { NextResponse } from "next/server";
import { AresCompany, formatName } from "@/lib/ares";

// Proxy + parser for the Czech ARES registry. Ported from the v1 server.js.
// Combines the basic "ekonomické subjekty" record (name, DIČ, address) with the
// VR record (statutory representative / jednatel).

const ARES_BASE =
  "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty";
const ARES_VR =
  "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty-vr";

const JSON_HEADERS = { Accept: "application/json" };

function personFullName(person: {
  titulPredJmenem?: string;
  jmeno?: string;
  prijmeni?: string;
  titulZaJmenem?: string;
}): string {
  return [
    person.titulPredJmenem,
    person.jmeno,
    person.prijmeni,
    person.titulZaJmenem,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ico: string }> }
) {
  const { ico } = await params;

  try {
    // 1) Basic record — name, DIČ, address.
    const basicRes = await fetch(`${ARES_BASE}/${ico}`, {
      headers: JSON_HEADERS,
    });
    const basic = basicRes.ok ? await basicRes.json() : null;

    // 2) VR record — statutory organ (jednatel).
    const vrRes = await fetch(`${ARES_VR}/${ico}`, { headers: JSON_HEADERS });
    if (!vrRes.ok) {
      throw new Error(`ARES API error: ${vrRes.status}`);
    }
    const vr = await vrRes.json();

    const info: AresCompany = {
      ico,
      name: "",
      address: "",
      dic: "",
      representative: "",
      vatRegistration: "unknown",
    };

    if (basic) {
      info.name = basic.obchodniJmeno || basic.nazev || "";
      info.dic = basic.dic || "";
      if (basic.sidlo?.textovaAdresa) info.address = basic.sidlo.textovaAdresa;
      // DPH registration from ARES. stavZdrojeDph: "AKTIVNI" (registered — could
      // be plátce OR identifikovaná osoba), "NEEXISTUJICI" (not registered),
      // "ZANIKLY"/"ZANIKLE" (former).
      const dph: unknown = basic.seznamRegistraci?.stavZdrojeDph;
      info.vatRegistration =
        dph === "AKTIVNI"
          ? "registered"
          : dph === "NEEXISTUJICI"
            ? "none"
            : typeof dph === "string" && dph.startsWith("ZANIK")
              ? "former"
              : "unknown";
    }

    const primary =
      vr?.zaznamy?.find((z: { primarniZaznam?: boolean }) => z.primarniZaznam) ??
      vr?.zaznamy?.[0];

    if (primary) {
      if (!info.name && primary.obchodniJmeno?.length) {
        info.name = primary.obchodniJmeno[0].hodnota;
      }
      if (!info.address && primary.adresy?.length) {
        const latest = primary.adresy
          .filter(
            (a: { typAdresy?: string; datumVymazu?: string }) =>
              a.typAdresy === "SIDLO" && !a.datumVymazu
          )
          .sort(
            (a: { datumZapisu: string }, b: { datumZapisu: string }) =>
              new Date(b.datumZapisu).getTime() -
              new Date(a.datumZapisu).getTime()
          )[0];
        if (latest?.adresa?.textovaAdresa) {
          info.address = latest.adresa.textovaAdresa;
        }
      }

      // Statutory organ → current jednatel (or any active member).
      const organ = primary.statutarniOrgany?.find(
        (o: { typOrganu?: string }) => o.typOrganu === "STATUTARNI_ORGAN"
      );
      const members: Array<{
        datumVymazu?: string;
        clenstvi?: { funkce?: { nazev?: string } };
        fyzickaOsoba?: Parameters<typeof personFullName>[0];
      }> = organ?.clenoveOrganu ?? [];

      const jednatel = members.find(
        (m) =>
          !m.datumVymazu &&
          m.clenstvi?.funkce?.nazev?.toLowerCase().includes("jednatel")
      );
      const fallback = members.find((m) => !m.datumVymazu && m.fyzickaOsoba);
      const chosen = jednatel ?? fallback;

      if (chosen?.fyzickaOsoba) {
        info.representative = formatName(personFullName(chosen.fyzickaOsoba));
      }
    }

    return NextResponse.json({ success: true, data: info });
  } catch (error) {
    console.error("ARES lookup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Nepodařilo se načíst data ze systému ARES. Zkontrolujte IČO.",
      },
      { status: 502 }
    );
  }
}
