import { z } from "zod";

export const DEFAULT_PROJECT_DESCRIPTION = `Návrh a implementace kompletních webových stránek. Tato část díla zahrnuje:
* Unikátní grafický návrh odpovídající vizuální identitě
* Responzivní design optimalizovaný pro různá zařízení (mobily, tablety, počítače)
* Implementace základní struktury stránek včetně navigačního menu
* Základní SEO optimalizace včetně nastavení meta tagů a vytvoření sitemap
* Zabezpečení webových stránek pomocí HTTPS protokolu
* Napojení na redakční systém WordPress včetně instalace a základní konfigurace
* Implementace správy cookies v souladu s GDPR
* Implementace kontaktního formuláře s ochranou proti spamu
* Optimalizace rychlosti načítání stránek`;

export const DEFAULT_ADDITIONAL_PROVISIONS = `Všechny části díla budou vytvořeny s ohledem na moderní trendy v designu a budou respektovat požadavky klienta na barevnost a celkový vizuální styl. Grafické návrhy budou optimalizovány pro různá zobrazovací zařízení, přičemž uspořádání obsahu a velikost prvků se budou přizpůsobovat šířce zobrazení.

Součástí díla je také konzultace s klientem ohledně jeho požadavků a preferencí, prezentace návrhů a případné revize až do finálního schválení.

Dílo nezahrnuje:

* Dodání fotografií, videí nebo jiných multimediálních materiálů
* Dlouhodobou správu webových stránek
* Dodatečné úpravy po schválení finálních verzí, pokud nejsou způsobeny chybou dodavatele

Veškeré potřebné podklady a informace pro tvorbu díla dodá objednatel.`;

const optionalEmail = z
  .string()
  .email("Neplatný e-mail")
  .optional()
  .or(z.literal(""));

export const timelinePhaseSchema = z.object({
  phase: z.string().min(1, "Zadejte název fáze"),
  start: z.string().min(1, "Vyberte datum"),
  end: z.string().min(1, "Vyberte datum"),
});

export const priceItemSchema = z.object({
  name: z.string().min(1, "Zadejte název položky"),
  price: z
    .number({ invalid_type_error: "Zadejte cenu" })
    .nonnegative("Cena nesmí být záporná"),
});

export const contractSchema = z.object({
  contractNumber: z.string().min(1, "Zadejte číslo smlouvy"),
  workName: z.string().min(1, "Zadejte název díla"),

  clientCompany: z.string().min(1, "Zadejte název firmy"),
  clientAddress: z.string().min(1, "Zadejte adresu"),
  clientICO: z.string().min(1, "Zadejte IČO"),
  clientDIC: z.string().optional(),
  clientRepresentative: z.string().min(1, "Zadejte jednatele"),
  clientEmail: optionalEmail,
  clientPhone: z.string().optional(),
  clientContactPerson: z.string().min(1, "Zadejte kontaktní osobu"),
  clientContactEmail: optionalEmail,
  clientDataBox: z.string().optional(),

  projectDescription: z.string().min(1, "Zadejte popis díla"),
  additionalProvisions: z.string(),
  priceItems: z
    .array(priceItemSchema)
    .min(1, "Přidejte alespoň jednu položku"),
  advancePercent: z
    .number({ invalid_type_error: "Zadejte zálohu" })
    .min(0, "0–100 %")
    .max(100, "0–100 %"),
  completionDate: z.string().min(1, "Vyberte datum dokončení"),
  warrantyMonths: z
    .number({ invalid_type_error: "Zadejte záruku" })
    .int()
    .min(1, "Min. 1 měsíc"),

  timeline: z.array(timelinePhaseSchema),

  contractLocation: z.string().min(1, "Zadejte místo"),
  contractDate: z.string().min(1, "Vyberte datum"),
});

// The resolved (output) type — numbers are coerced. Matches ContractData shape.
export type ContractFormValues = z.infer<typeof contractSchema>;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Sensible starting values for a new contract. Call at render time (client). */
export function makeDefaultValues(): ContractFormValues {
  const today = new Date();
  const inTwoMonths = new Date(today);
  inTwoMonths.setMonth(inTwoMonths.getMonth() + 2);

  return {
    contractNumber: `${today.getFullYear()}-001`,
    workName: "Tvorba webových stránek",
    clientCompany: "",
    clientAddress: "",
    clientICO: "",
    clientDIC: "",
    clientRepresentative: "",
    clientEmail: "",
    clientPhone: "",
    clientContactPerson: "",
    clientContactEmail: "",
    clientDataBox: "",
    projectDescription: DEFAULT_PROJECT_DESCRIPTION,
    additionalProvisions: DEFAULT_ADDITIONAL_PROVISIONS,
    priceItems: [{ name: "Tvorba webových stránek", price: 75000 }],
    advancePercent: 50,
    completionDate: isoDate(inTwoMonths),
    warrantyMonths: 6,
    timeline: [
      {
        phase: "Tvorba prototypů webu",
        start: isoDate(today),
        end: isoDate(inTwoMonths),
      },
    ],
    contractLocation: "Karlovy Vary",
    contractDate: isoDate(today),
  };
}
