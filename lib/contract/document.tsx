import {
  ContractData,
  ContractorInfo,
  DEFAULT_CONTRACTOR,
  sumPriceItems,
} from "./types";
import { formatCZK, formatDate, numberToCzechWords } from "./format";

// ---------------------------------------------------------------------------
// Structured document model — the single source of truth. Renders to both
// markdown (export) and the styled React document (preview / print / PDF).
// Reusable for other document types (protokol, NDA, dodatek).
// ---------------------------------------------------------------------------

export type DocDetail = { label?: string; value: string };
export type DocParty = { role: string; name: string; lines: DocDetail[] };

export type DocBlock =
  | { kind: "para"; text: string }
  | { kind: "clauses"; items: string[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][]; totalRow?: string[] }
  | { kind: "statement"; paras: string[] };

export type DocSection = { num?: string; title: string; blocks: DocBlock[] };
export type DocSignColumn = { for: string; name: string; pos?: string; org?: string };

export type StyledDoc = {
  brand: string;
  brandSub: string;
  docTag: string;
  title: string;
  ref?: string;
  meta: { k: string; v: string }[];
  parties: DocParty[];
  preamble?: string;
  sections: DocSection[];
  signature?: { placeDate?: string; columns: DocSignColumn[] };
};

/** Split markdown-ish free text into paragraph + bullet blocks. */
function textToBlocks(text: string): DocBlock[] {
  const blocks: DocBlock[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push({ kind: "bullets", items: bullets });
      bullets = [];
    }
  };
  for (const raw of (text ?? "").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^[*-]\s+/.test(line)) bullets.push(line.replace(/^[*-]\s+/, ""));
    else {
      flush();
      blocks.push({ kind: "para", text: line });
    }
  }
  flush();
  return blocks;
}

export function buildContractDoc(
  data: ContractData,
  contractor: ContractorInfo = DEFAULT_CONTRACTOR
): StyledDoc {
  const total = sumPriceItems(data.priceItems);
  const words = numberToCzechWords(total);

  const vatSentence =
    contractor.vatMode === "payer"
      ? "Uvedená cena je bez DPH; k ceně bude připočtena daň z přidané hodnoty v zákonné sazbě."
      : contractor.vatMode === "identified"
        ? "Zhotovitel není plátcem DPH; je identifikovanou osobou ve smyslu § 6g a násl. zákona č. 235/2004 Sb., o dani z přidané hodnoty, ve znění pozdějších předpisů."
        : "Zhotovitel není plátcem DPH.";

  const objednatelLines: DocDetail[] = [
    { label: "Sídlo", value: data.clientAddress },
    { label: "IČO", value: data.clientICO },
  ];
  if (data.clientDIC) objednatelLines.push({ label: "DIČ", value: data.clientDIC });
  objednatelLines.push({ label: "Jednatel", value: data.clientRepresentative });
  if (data.clientEmail) objednatelLines.push({ label: "Email", value: data.clientEmail });
  if (data.clientPhone) objednatelLines.push({ label: "Telefon", value: data.clientPhone });

  const prilohaC: DocSection = {
    num: "Příloha C",
    title: "Časový harmonogram zhotovení díla",
    blocks: data.timeline?.length
      ? [
          {
            kind: "table",
            head: ["Fáze projektu", "Datum zahájení", "Datum ukončení"],
            rows: data.timeline.map((t) => [
              t.phase,
              formatDate(t.start),
              formatDate(t.end),
            ]),
          },
        ]
      : [{ kind: "para", text: "—" }],
  };

  return {
    brand: contractor.companyName,
    brandSub: "Digital · UI/UX · Web",
    docTag: "Smlouva o dílo",
    title: "Smlouva o dílo",
    ref: `č. ${data.contractNumber}`,
    meta: [
      { k: "Číslo smlouvy", v: data.contractNumber },
      { k: "Objednatel", v: data.clientCompany },
      { k: "Termín dokončení", v: formatDate(data.completionDate) },
      {
        k: "Místo a datum uzavření",
        v: `${data.contractLocation}, ${formatDate(data.contractDate)}`,
      },
      { k: "Celková cena", v: formatCZK(total) },
    ],
    parties: [
      {
        role: "Zhotovitel",
        name: contractor.companyName,
        lines: [
          { label: "Sídlo", value: contractor.address },
          { label: "IČO", value: contractor.ico },
          { label: "Jednatel", value: contractor.representative },
          { label: "Bankovní spojení", value: contractor.bankName },
          { label: "Číslo účtu", value: contractor.accountNumber },
        ],
      },
      { role: "Objednatel", name: data.clientCompany, lines: objednatelLines },
    ],
    preamble:
      "Uzavřely podle ust. § 2586 a násl. zákona č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů a s odkazem na ust. § 61 zák. č. 121/2000 Sb., autorský zákon, ve znění pozdějších předpisů níže uvedeného dne, měsíce a roku tuto smlouvu o dílo:",
    sections: [
      {
        num: "I.",
        title: "Předmět smlouvy",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Předmětem této smlouvy je závazek zhotovitele k provedení díla specifikovaného v této smlouvě a v příloze č. 1, která je její nedílnou součástí na náklady a nebezpečí zhotovitele ve sjednaném čase (dále jen „dílo“), a závazek objednatele zaplatit zhotoviteli za řádné a včasné provedení díla sjednanou cenu díla.",
              "Zhotovitel se zavazuje k provedení díla pro objednatele, a to v kvalitě a v rozsahu tak, jak je podrobně specifikováno v příloze A této smlouvy.",
              "Zhotovitel potvrzuje, že se seznámil s rozsahem a povahou díla, že jsou mu známy veškeré technické, kvalitativní a jiné podmínky nezbytné k realizaci díla, že disponuje takovými kapacitami a odbornými znalostmi, které jsou k provedení díla nezbytné.",
            ],
          },
        ],
      },
      {
        num: "II.",
        title: "Doba plnění",
        blocks: [
          {
            kind: "clauses",
            items: [
              `Zhotovitel se zavazuje celé dílo popsané v této smlouvě a v příloze A provést nejpozději do ${formatDate(data.completionDate)}. Podrobný harmonogram je uveden v příloze C, která je nedílnou součástí této smlouvy.`,
              "Lhůta splnění závazku zhotovitele se staví a neběží pro překážky, které nejsou na straně zhotovitele, a to po dobu trvání této překážky. Překážkou ve smyslu tohoto článku této smlouvy se rozumí zejména: a. neposkytnutí řádné součinnosti objednatele zhotoviteli k provádění díla, b. okolnosti vis maior.",
            ],
          },
        ],
      },
      {
        num: "III.",
        title: "Práva a povinnosti smluvních stran",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Zhotovitel je povinen provést dílo dle pokynů objednatele, dokumentace předané objednatelem zhotoviteli a v souladu s obecně závaznými právními předpisy.",
              "Zhotovitel se zavazuje opatřit vše, co je zapotřebí k provedení díla podle této smlouvy.",
              "Zhotovitel se zavazuje spolupůsobit při výkonu finanční kontroly ve smyslu zákona č. 320/2001 Sb., o finanční kontrole ve veřejné správě a o změně některých zákonů, ve znění pozdějších předpisů, resp. zákona č. 255/2012 Sb., o kontrole.",
              "Objednatel se zavazuje poskytnout zhotoviteli veškerou součinnost potřebnou pro řádné plnění předmětu této smlouvy spočívající mj. v odsouhlasení grafických návrhů, poskytnutí technických požadavků na systém či součinnosti při předání díla. Objednatel je povinen poskytnout součinnost do 7 dnů ode dne doručení žádosti zhotovitele. Prodlení objednatele s poskytnutím uvedené součinnosti má za následek prodloužení termínu plnění díla o dobu, po kterou byl objednatel v prodlení s poskytnutím součinnosti.",
              "Zhotovitel je povinen upozornit objednatele bez zbytečného odkladu na nevhodnou povahu podkladů převzatých od objednatele nebo požadavků, připomínek a pokynů daných mu objednatelem k plnění předmětu této smlouvy.",
              "Smluvní strany navzájem jsou si povinny poskytnout veškerou součinnost potřebnou k provedení díla.",
              "Objednatel je oprávněn v průběhu provádění díla kontrolovat průběžný postup prací na díle. Zhotovitel je povinen na výzvu objednatele tuto součinnost umožnit.",
              "Účastníci této smlouvy výslovně prohlašují, že si navzájem sdělili všechny skutkové a právní okolnosti, o nichž k datu podpisu této smlouvy věděli nebo vědět museli, a které jsou relevantní ve vztahu k uzavření této smlouvy a naplnění jejího účelu.",
            ],
          },
        ],
      },
      {
        num: "IV.",
        title: "Převzetí a předání díla",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Dnem řádného předání předmětu díla se rozumí den zveřejnění předmětu díla objednateli v kvalitě a rozsahu odpovídajícím této smlouvě.",
              "V případě řádně provedeného díla jsou smluvní strany povinny sepsat o předání a převzetí předmětu díla předávací protokol, který bude datován a podepsán oběma smluvními stranami.",
              "V případě zjištění vad díla je objednatel povinen tyto vady písemně vytknout v předávacím protokolu. Smluvní strany si v předávacím protokolu dohodnou termín pro odstranění vad. V případě, že objednatel nevytkne vady v době předání, dílo se považuje za řádně a včas předané bez vad a nedodělků.",
              `Osobou oprávněnou k převzetí díla za objednatele je ${data.clientContactPerson}${data.clientContactEmail ? ` (email: ${data.clientContactEmail})` : ""}.`,
              `Osobou oprávněnou k předání díla za zhotovitele je ${contractor.representative}.`,
              `Místem převzetí díla jsou ${data.contractLocation}, Česká republika.`,
            ],
          },
        ],
      },
      {
        num: "V.",
        title: "Vlastnické právo a nebezpečí škody na díle",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Vlastníkem díla je až do okamžiku jeho předání objednateli zhotovitel.",
              "Nebezpečí škody na zhotoveném díle nese od uzavření smlouvy do doby předání řádně provedeného díla zhotovitel. Objednatel nese nebezpečí škody na zhotoveném díle ode dne, kdy převezme dílo, nebo ode dne, kdy je v prodlení s převzetím díla.",
            ],
          },
        ],
      },
      {
        num: "VI.",
        title: "Cena za dílo a platební podmínky",
        blocks: [
          {
            kind: "clauses",
            items: [
              `Objednatel se zavazuje za dílo zaplatit celkovou smluvní cenu ve výši ${formatCZK(total)} (slovy: ${words} korun českých). ${vatSentence}`,
              "Cena dle předchozího odstavce obsahuje veškeré náklady pro realizaci díla včetně nákladů souvisejících. Kalkulace ceny je uvedena v příloze B, která je nedílnou součásti této smlouvy.",
              "Cena za dílo je pevná po celou dobu realizace díla a zahrnuje veškeré náklady zhotovitele související s realizací díla. Cena za dílo je stanovena jako nejvýše přípustná. Cena za dílo je překročitelná pouze v případě, dojde-li v průběhu realizace ke změně daňových předpisů s dopadem na cenu díla. Objednatel jiné překročení ceny díla nepřipouští.",
              `Objednatel je povinen zaplatit zálohu ve výši ${data.advancePercent} % z ceny díla, které je předmětem podle této smlouvy. Tuto zálohu uhradí na účet zhotovitele číslo ${contractor.accountNumber} do tří dnů od podpisu této smlouvy.`,
              `Zbývající část ceny díla, které je předmětem podle této smlouvy uhradí objednatel na účet zhotovitele číslo ${contractor.accountNumber} při předání zhotoveného díla. Objednatel se zavazuje faktury zaplatit ve splatnosti dle specifikace na fakturách (obvykle do 10 pracovních dnů).`,
              "Faktury musí obsahovat všechny náležitosti řádného daňového a účetního dokladu ve smyslu příslušných právních předpisů, zejména zákona č. 563/1991 Sb., o účetnictví, ve znění pozdějších předpisů. Faktura nesplňující předepsané náležitosti bude objednatelem vrácena do dne její splatnosti k doplnění či opravě, aniž se tak dostane do prodlení se splatností. Lhůta splatnosti počíná běžet znovu od opětovného doručení náležitě doplněné či opravené faktury objednateli.",
            ],
          },
        ],
      },
      {
        num: "VII.",
        title: "Odpovědnost za vady díla",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Dílo má vady, pokud není zhotoveno v souladu s podmínkami stanovenými touto smlouvou a jejími přílohami.",
              "Objednatel je povinen uplatnit vady u zhotovitele, a to písemně na adresu uvedenou v záhlaví této smlouvy s uvedením vytýkaných vad. Lhůta k odstranění vady se stanovuje na 30 kalendářních dní od doručení oznámení o výskytu vady zhotoviteli, pokud nebude smluvními stranami dohodnuto jinak. Zhotovitel je povinen odstranit vytknuté vady na svůj náklad.",
              `Zhotovitel dává záruku za jakost díla. Záruční doba je stanovena na ${data.warrantyMonths} měsíců.`,
              "Záruční doba počíná běžet dnem předání díla, případně dnem odstranění poslední vady a nedodělku vyplývajícího z protokolu o předání a převzetí díla. Po tuto dobu zhotovitel odpovídá za vady, které se na díle vyskytnou.",
            ],
          },
        ],
      },
      {
        num: "VIII.",
        title: "Odstoupení od smlouvy",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Tato smlouva může být ukončena písemnou dohodou smluvních stran anebo odstoupením od smlouvy z důvodů stanovených v této smlouvě nebo v zákoně.",
              "Od této smlouvy může smluvní strana odstoupit pro podstatné porušení smluvní povinnosti druhou smluvní stranou. Za podstatné porušení smluvní povinnosti se považuje zejména: a. na straně objednatele nezaplacení ceny díla podle této smlouvy ve lhůtě delší než 10 dní po dni splatnosti příslušné faktury, b. na straně zhotovitele, jestliže dílo (nebo jeho část), nebude řádně dodáno v dohodnutém termínu, c. na straně zhotovitele, jestliže dílo nebude mít vlastnosti deklarované zhotovitelem v této smlouvě či vlastnosti z této smlouvy vyplývající, d. na straně zhotovitele, jestliže je zhotovitel v prodlení s odstraněním vad dle čl. VII. této smlouvy.",
              "Odstoupení od této smlouvy musí být učiněno písemně a jako takové doručeno druhé straně na v záhlaví uvedenou adresu či do datové schránky.",
              "V případě odstoupení od této smlouvy jsou smluvní strany povinny vypořádat své vzájemné závazky a pohledávky stanovené v zákoně nebo v této smlouvě, a to do 30 dnů od právních účinků odstoupení, nebo v dohodnuté lhůtě.",
            ],
          },
        ],
      },
      {
        num: "IX.",
        title: "Ochrana informací",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Smluvní strany se vzájemně zavazují, že budou chránit a utajovat před třetími osobami chráněné informace, dokumenty a skutečnosti, tvořící obchodní tajemství, které byly vzájemně stranami poskytnuty v rámci tohoto obchodního případu. Obchodní tajemství tvoří konkurenčně významné, určitelné, ocenitelné a v příslušných obchodních kruzích běžně nedostupné skutečnosti, jejichž vlastník zajišťuje ve svém zájmu odpovídajícím způsobem jejich utajení.",
            ],
          },
        ],
      },
      {
        num: "X.",
        title: "Smluvní pokuty a náhrada škody",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Jestliže zhotovitel bude v prodlení s provedením jím zhotovovaného díla, je objednatel oprávněn požadovat po zhotoviteli smluvní pokutu ve výši 0,05 % z celkové ceny díla za každý den prodlení.",
              "Bude-li objednatel v prodlení se zaplacením ceny díla, je zhotovitel oprávněn požadovat po objednateli smluvní pokutu ve výši 0,05 % z neuhrazené části peněžitého závazku, a to za každý den prodlení.",
              "Poruší-li smluvní strana povinnost uvedenou v ust. čl. IX. odst. 1) této smlouvy, je povinna zaplatit smluvní pokutu ve výši 3 000,- Kč za každé takové prokázané porušení.",
              "Ujednáním o smluvní pokutě není dotčeno právo objednatele nebo zhotovitele na náhradu škody způsobené porušením povinnosti, na kterou se smluvní pokuta vztahuje, a to ani v případě, že náhrada škody přesahuje smluvní pokutu.",
              "Smluvní pokuta je splatná do 30 dnů od data, kdy byla povinné straně doručena písemná výzva k jejímu zaplacení ze strany oprávněné, a to na účet oprávněné strany uvedený v písemné výzvě.",
              "Smluvní strany se dohodly, že se právo na náhradu škody, s výjimkou škody způsobené úmyslně, omezuje částkou rovnající se celkové dohodnuté ceně díla. Hradí se pouze přímé škody, žádná ze smluvních stran nemá nárok na náhradu za žádné jiné škody, včetně následných škod, ušlého zisku a zvláštních, nepřímých nebo náhodných škod.",
            ],
          },
        ],
      },
      {
        num: "XI.",
        title: "Licenční ujednání",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Zhotovitel poskytuje objednateli licenci ke všem způsobům užití díla (rozmnožování díla, rozšiřování díla, pronájem díla, půjčování díla, vystavování díla a sdělování díla veřejnosti), v rozsahu neomezeném, a to jak ve hmotné, tak i v nehmotné podobě, zejména pak elektronicky.",
              "Objednatel není povinen licenci využít.",
              "Objednatel je oprávněn využívat dílo výdělečně nebo nevýdělečně.",
              "Objednatel je oprávněn oprávnění tvořící součást licence zcela nebo zčásti poskytnout či postoupit třetí osobě. Objednatel je oprávněn postoupit licenci kterékoli osobě. Objednatel není povinen zhotovitele, ani autora informovat o poskytnutí podlicence ani o postoupení licence.",
              "Smluvní strany výslovně sjednávají, že cena licence je již zahrnuta v ceně díla dle čl. VI. této smlouvy.",
              "Územní rozsah licence není omezen. Licence se poskytuje na dobu trvání majetkových práv k dílu. Množstevní rozsah licence je neomezený.",
              "Zhotovitel uděluje nabyvateli souhlas ke zveřejňování, úpravám, zpracování díla včetně jeho překladu, spojování s jiným dílem, jakož i užití takto zpracovaného díla, zařazení díla do díla souborného a užití tohoto souborného díla. Zhotovitel dále uděluje nabyvateli souhlas k úpravám či změně názvu díla.",
              "Zhotovitel prohlašuje, že je oprávněn poskytnout objednateli práva k dílu dle této smlouvy. Zhotovitel je povinen vypořádat veškeré nároky autora ve vztahu k dílu dle této smlouvy.",
              "Zhotovitel je oprávněn uvádět jméno objednatele a ukázky z díla, včetně jeho charakteristik, jako svoji referenci pro účely vlastní propagace. Zhotovitel má právo umístit na dílo svoje označení autorství, přičemž to bude zároveň sloužit jako odkaz na jeho webové stránky. Zhotovitel se zavazuje nenarušit tímto celkový vzhled díla.",
            ],
          },
        ],
      },
      {
        num: "XII.",
        title: "Závěrečná ustanovení",
        blocks: [
          {
            kind: "clauses",
            items: [
              "Ustanovení této smlouvy lze doplňovat, měnit nebo rušit pouze písemnými, vzestupně číslovanými a datovanými dodatky podepsanými oprávněnými zástupci obou smluvních stran, a to na návrh kterékoli z nich.",
              "Pro vztahy touto smlouvou výslovně neupravené, včetně náhrady škody, platí příslušná ustanovení zákona č. 89/2012 Sb., občanský zákoník ve znění pozdějších předpisů.",
              "V případě, že některé ustanovení této smlouvy je nebo se stane neúčinným, zůstávají ostatní ustanovení této smlouvy účinná. Smluvní strany se zavazují nahradit neúčinné ustanovení této smlouvy ustanovením jiným, účinným, které svým obsahem a smyslem odpovídá nejlépe obsahu a smyslu ustanovení původního.",
              "Případné spory vzniklé z této smlouvy budou řešeny podle platné právní úpravy věcně a místně příslušnými orgány České republiky.",
              "Tato smlouva je vyhotovena ve dvou stejnopisech, z nichž každý má platnost originálu, přičemž každá smluvní strana obdrží jedno vyhotovení.",
              "Obě smluvní strany prohlašují, že si smlouvu přečetly a s jejím obsahem, který vyjadřuje jejich pravou vůli prostou omylů, souhlasí. Zároveň prohlašují, že tato smlouva není uzavírána v tísni nebo za nápadně nevýhodných podmínek, na důkaz čehož připojují své podpisy.",
              "Tato smlouva nabývá platnosti dnem jejího uzavření, tj. dnem podpisu smlouvy oprávněnými zástupci obou smluvních stran.",
            ],
          },
        ],
      },
      {
        num: "Příloha A",
        title: "Popis díla",
        blocks: textToBlocks(
          [data.projectDescription, data.additionalProvisions]
            .filter(Boolean)
            .join("\n\n")
        ),
      },
      {
        num: "Příloha B",
        title: "Kalkulace ceny díla",
        blocks: [
          {
            kind: "table",
            head: ["Název položky", "Cena"],
            rows: data.priceItems.map((i) => [
              i.name,
              formatCZK(Number(i.price) || 0),
            ]),
            totalRow: ["Cena celkem", formatCZK(total)],
          },
        ],
      },
      prilohaC,
    ],
    signature: {
      placeDate: `V ${data.contractLocation}, dne ${formatDate(data.contractDate)}`,
      columns: [
        { for: "Objednatel", name: data.clientRepresentative, org: data.clientCompany },
        {
          for: "Zhotovitel",
          name: contractor.representative,
          pos: "jednatel",
          org: contractor.companyName,
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function blockToMd(block: DocBlock): string {
  switch (block.kind) {
    case "para":
      return block.text + "\n";
    case "clauses":
      return block.items.map((it, i) => `${i + 1}. ${it}`).join("\n") + "\n";
    case "bullets":
      return block.items.map((it) => `* ${it}`).join("\n") + "\n";
    case "statement":
      return block.paras.map((p) => `> ${p}`).join("\n>\n") + "\n";
    case "table": {
      const sep = block.head.map(() => "----").join(" | ");
      let md = `| ${block.head.join(" | ")} |\n| ${sep} |\n`;
      for (const row of block.rows) md += `| ${row.join(" | ")} |\n`;
      if (block.totalRow) md += `| **${block.totalRow[0]}** | ${block.totalRow[1]} |\n`;
      return md;
    }
  }
}

export function renderDocToMarkdown(doc: StyledDoc): string {
  let md = `# ${doc.title}${doc.ref ? ` ${doc.ref}` : ""}\n\n`;
  md += `## Smluvní strany\n\n`;
  for (const p of doc.parties) {
    md += `**${p.role}:** ${p.name}\n\n`;
    for (const l of p.lines) md += `* ${l.label ? `${l.label}: ` : ""}${l.value}\n`;
    md += "\n";
  }
  if (doc.preamble) md += `${doc.preamble}\n\n`;

  const sectionMd = (s: DocSection) => {
    let out = `## ${s.num ? `${s.num} ` : ""}${s.title}\n\n`;
    for (const b of s.blocks) out += blockToMd(b) + "\n";
    return out;
  };
  const isAttachment = (s: DocSection) => s.num?.startsWith("Příloha");

  // Order: articles → signatures → attachments (přílohy).
  for (const s of doc.sections.filter((x) => !isAttachment(x))) md += sectionMd(s);

  if (doc.signature) {
    md += `## Podpisy\n\n`;
    if (doc.signature.placeDate) md += `${doc.signature.placeDate}\n\n`;
    for (const c of doc.signature.columns) {
      md += `**${c.for}:** ${c.name}${c.pos ? `, ${c.pos}` : ""}${c.org ? `, ${c.org}` : ""}\n\n`;
    }
  }

  for (const s of doc.sections.filter(isAttachment)) md += sectionMd(s);

  return md.trimEnd() + "\n";
}

// ---------------------------------------------------------------------------
// Styled document — adapted from the Flex předávací-protokol design.
// Scoped under .cdoc; forced-light so it prints/exports consistently.
// ---------------------------------------------------------------------------

export const CONTRACT_DOC_CSS = `
.cdoc {
  --ink: #1c2530; --muted: #5e6975; --faint: #8b95a1;
  --line: #d9dee4; --line-soft: #e8ebef;
  --accent: #1f4e6b; --accent-soft: #eef3f6; --panel: #f7f8fa;
  font-family: "Carlito", "Inter", "Liberation Sans", system-ui, sans-serif;
  color: var(--ink); font-size: 10.5pt; line-height: 1.5; text-rendering: optimizeLegibility;
}
.cdoc * { box-sizing: border-box; }
.cdoc .masthead { display: flex; justify-content: space-between; align-items: flex-end;
  border-bottom: 2.4pt solid var(--accent); padding-bottom: 8pt; margin-bottom: 4pt; }
.cdoc .brand { font-size: 13pt; font-weight: 700; letter-spacing: .2pt; color: var(--ink); }
.cdoc .brand .sub { display: block; font-size: 7.8pt; font-weight: 400; letter-spacing: 1.6pt;
  text-transform: uppercase; color: var(--faint); margin-top: 1pt; }
.cdoc .doc-tag { text-align: right; font-size: 7.8pt; letter-spacing: 1.4pt; text-transform: uppercase;
  color: var(--accent); font-weight: 700; }
.cdoc .title-block { margin: 18pt 0 6pt; }
.cdoc h1 { font-size: 18pt; font-weight: 700; line-height: 1.18; margin: 0; color: var(--ink); }
.cdoc .ref { margin-top: 5pt; font-size: 9.5pt; color: var(--muted); }
.cdoc .meta { margin-top: 12pt; border: .6pt solid var(--line); border-radius: 3pt; overflow: hidden; }
.cdoc .meta-row { display: flex; border-bottom: .6pt solid var(--line-soft); }
.cdoc .meta-row:last-child { border-bottom: 0; }
.cdoc .meta-row .k { width: 38%; background: var(--panel); padding: 6pt 10pt; font-size: 8.6pt;
  color: var(--muted); font-weight: 600; border-right: .6pt solid var(--line-soft); }
.cdoc .meta-row .v { width: 62%; padding: 6pt 10pt; font-size: 9.4pt; }
.cdoc section { margin-top: 16pt; }
.cdoc h2 { font-size: 10.5pt; font-weight: 700; color: var(--accent); margin: 0 0 7pt; padding-bottom: 3pt;
  border-bottom: .6pt solid var(--line); letter-spacing: .2pt; }
.cdoc h2 .num { display: inline-block; min-width: 26pt; padding-right: 6pt; color: var(--ink); }
.cdoc p { margin: 0 0 7pt; text-align: justify; }
.cdoc .preamble { margin-top: 12pt; }
.cdoc ol.clauses { margin: 0; padding: 0; list-style: none; counter-reset: c; }
.cdoc ol.clauses li { counter-increment: c; position: relative; padding: 0 0 6pt 22pt; text-align: justify; }
.cdoc ol.clauses li:last-child { padding-bottom: 0; }
.cdoc ol.clauses li::before { content: counter(c) "."; position: absolute; left: 0; top: 0;
  font-weight: 700; color: var(--accent); font-size: 9.4pt; }
.cdoc ul.bullets { list-style: none; margin: 0; padding: 0; }
.cdoc ul.bullets li { position: relative; padding: 3pt 0 3pt 16pt; border-bottom: .5pt solid var(--line-soft); }
.cdoc ul.bullets li:last-child { border-bottom: 0; }
.cdoc ul.bullets li::before { content: ""; position: absolute; left: 2pt; top: 8pt; width: 4.5pt; height: 4.5pt;
  border-radius: 50%; background: var(--accent); }
.cdoc .parties { margin-top: 14pt; }
.cdoc .party { border: .6pt solid var(--line); border-radius: 3pt; margin-bottom: 8pt; overflow: hidden; }
.cdoc .party .role { background: var(--accent-soft); color: var(--accent); font-weight: 700; font-size: 8.4pt;
  letter-spacing: .8pt; text-transform: uppercase; padding: 4pt 10pt; border-bottom: .6pt solid var(--line); }
.cdoc .party .pbody { padding: 7pt 10pt; }
.cdoc .party .name { font-weight: 700; font-size: 10.5pt; }
.cdoc .party .detail { font-size: 9pt; color: var(--muted); margin-top: 1pt; }
.cdoc .party .detail b { color: var(--ink); font-weight: 600; }
.cdoc table { width: 100%; border-collapse: collapse; margin: 2pt 0; }
.cdoc thead th { background: var(--panel); color: var(--muted); font-size: 8.6pt; font-weight: 600;
  text-transform: uppercase; letter-spacing: .4pt; text-align: left; padding: 6pt 10pt; border: .6pt solid var(--line); }
.cdoc tbody td { font-size: 9.4pt; padding: 6pt 10pt; border: .6pt solid var(--line); vertical-align: top; }
.cdoc tbody tr.total td { font-weight: 700; background: var(--accent-soft); color: var(--ink); }
.cdoc tbody td:last-child { text-align: right; white-space: nowrap; }
.cdoc thead th:last-child { text-align: right; }
.cdoc .sign-section { margin-top: 24pt; }
.cdoc .place-date { font-size: 9.6pt; margin-bottom: 26pt; }
.cdoc .sign-grid { display: flex; gap: 26pt; }
.cdoc .sign-col { flex: 1; }
.cdoc .sign-col .for { font-size: 8.6pt; color: var(--muted); text-transform: uppercase; letter-spacing: .8pt; margin-bottom: 34pt; }
.cdoc .sign-line { border-top: .8pt solid var(--ink); padding-top: 4pt; }
.cdoc .sign-line .nm { font-weight: 700; font-size: 9.6pt; }
.cdoc .sign-line .pos, .cdoc .sign-line .org { font-size: 8.8pt; color: var(--muted); }
.cdoc .party, .cdoc .meta { page-break-inside: avoid; }
.cdoc h2 { break-after: avoid; }
/* Attachments and the signature block each start on a fresh page. */
.cdoc .attachment { break-before: page; page-break-before: always; }
.cdoc .sign-section { break-before: page; page-break-before: always; }
@media print { @page { size: A4; margin: 18mm 16mm; } }
`;

// ---------------------------------------------------------------------------
// HTML string renderer (server-side, for Gotenberg PDF). Mirrors the React
// component but as a string, so no react-dom/server dependency.
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function blockToHtml(b: DocBlock): string {
  switch (b.kind) {
    case "para":
      return `<p>${esc(b.text)}</p>`;
    case "clauses":
      return `<ol class="clauses">${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ol>`;
    case "bullets":
      return `<ul class="bullets">${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    case "statement":
      return `<div class="statement">${b.paras.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`;
    case "table": {
      const head = `<thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`;
      const rows = b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
        .join("");
      const total = b.totalRow
        ? `<tr class="total">${b.totalRow.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`
        : "";
      return `<table>${head}<tbody>${rows}${total}</tbody></table>`;
    }
  }
}

function sectionToHtml(s: DocSection, cls = ""): string {
  const h2 = `<h2>${s.num ? `<span class="num">${esc(s.num)}</span>` : ""}${esc(s.title)}</h2>`;
  return `<section${cls ? ` class="${cls}"` : ""}>${h2}${s.blocks.map(blockToHtml).join("")}</section>`;
}

export function renderDocToHtml(doc: StyledDoc): string {
  const isAtt = (s: DocSection) => s.num?.startsWith("Příloha");
  const articles = doc.sections.filter((s) => !isAtt(s));
  const attachments = doc.sections.filter(isAtt);

  const meta = doc.meta
    .map((r) => `<div class="meta-row"><div class="k">${esc(r.k)}</div><div class="v">${esc(r.v)}</div></div>`)
    .join("");
  const parties = doc.parties
    .map(
      (p) =>
        `<div class="party"><div class="role">${esc(p.role)}</div><div class="pbody"><div class="name">${esc(p.name)}</div>${p.lines
          .map((l) => `<div class="detail">${l.label ? `<b>${esc(l.label)}:</b> ` : ""}${esc(l.value)}</div>`)
          .join("")}</div></div>`
    )
    .join("");
  const sig = doc.signature
    ? `<div class="sign-section">${doc.signature.placeDate ? `<div class="place-date">${esc(doc.signature.placeDate)}</div>` : ""}<div class="sign-grid">${doc.signature.columns
        .map((c) => {
          const forG =
            c.for === "Objednatel" ? "objednatele" : c.for === "Zhotovitel" ? "zhotovitele" : c.for.toLowerCase();
          return `<div class="sign-col"><div class="for">Za ${esc(forG)}</div><div class="sign-line"><div class="nm">${esc(c.name)}</div>${c.pos ? `<div class="pos">${esc(c.pos)}</div>` : ""}${c.org ? `<div class="org">${esc(c.org)}</div>` : ""}</div></div>`;
        })
        .join("")}</div></div>`
    : "";

  return (
    `<div class="cdoc"><style>${CONTRACT_DOC_CSS}</style>` +
    `<div class="masthead"><div class="brand">${esc(doc.brand)}<span class="sub">${esc(doc.brandSub)}</span></div><div class="doc-tag">${esc(doc.docTag)}</div></div>` +
    `<div class="title-block"><h1>${esc(doc.title)}</h1>${doc.ref ? `<div class="ref">${esc(doc.ref)}</div>` : ""}</div>` +
    `<div class="meta">${meta}</div>` +
    `<div class="parties">${parties}</div>` +
    (doc.preamble ? `<p class="preamble">${esc(doc.preamble)}</p>` : "") +
    articles.map((s) => sectionToHtml(s)).join("") +
    sig +
    attachments.map((s) => sectionToHtml(s, "attachment")).join("") +
    `</div>`
  );
}

function Blocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "para") return <p key={i}>{b.text}</p>;
        if (b.kind === "clauses")
          return (
            <ol className="clauses" key={i}>
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ol>
          );
        if (b.kind === "bullets")
          return (
            <ul className="bullets" key={i}>
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        if (b.kind === "statement")
          return (
            <div className="statement" key={i}>
              {b.paras.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          );
        // table
        return (
          <table key={i}>
            <thead>
              <tr>
                {b.head.map((h, j) => (
                  <th key={j}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k}>{cell}</td>
                  ))}
                </tr>
              ))}
              {b.totalRow && (
                <tr className="total">
                  {b.totalRow.map((cell, k) => (
                    <td key={k}>{cell}</td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        );
      })}
    </>
  );
}

export function StyledContractDocument({
  data,
  contractor = DEFAULT_CONTRACTOR,
}: {
  data: ContractData;
  contractor?: ContractorInfo;
}) {
  const doc = buildContractDoc(data, contractor);
  const isAttachment = (s: DocSection) => s.num?.startsWith("Příloha");
  const articles = doc.sections.filter((s) => !isAttachment(s));
  const attachments = doc.sections.filter(isAttachment);
  return (
    <div className="cdoc">
      <style>{CONTRACT_DOC_CSS}</style>

      <div className="masthead">
        <div className="brand">
          {doc.brand}
          <span className="sub">{doc.brandSub}</span>
        </div>
        <div className="doc-tag">{doc.docTag}</div>
      </div>

      <div className="title-block">
        <h1>{doc.title}</h1>
        {doc.ref && <div className="ref">{doc.ref}</div>}
      </div>

      <div className="meta">
        {doc.meta.map((row, i) => (
          <div className="meta-row" key={i}>
            <div className="k">{row.k}</div>
            <div className="v">{row.v}</div>
          </div>
        ))}
      </div>

      <div className="parties">
        {doc.parties.map((p, i) => (
          <div className="party" key={i}>
            <div className="role">{p.role}</div>
            <div className="pbody">
              <div className="name">{p.name}</div>
              {p.lines.map((l, j) => (
                <div className="detail" key={j}>
                  {l.label ? <b>{l.label}:</b> : null} {l.value}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {doc.preamble && <p className="preamble">{doc.preamble}</p>}

      {articles.map((s, i) => (
        <section key={i}>
          <h2>
            {s.num && <span className="num">{s.num}</span>}
            {s.title}
          </h2>
          <Blocks blocks={s.blocks} />
        </section>
      ))}

      {doc.signature && (
        <div className="sign-section">
          {doc.signature.placeDate && (
            <div className="place-date">{doc.signature.placeDate}</div>
          )}
          <div className="sign-grid">
            {doc.signature.columns.map((c, i) => (
              <div className="sign-col" key={i}>
                <div className="for">
                  Za{" "}
                  {c.for === "Objednatel"
                    ? "objednatele"
                    : c.for === "Zhotovitel"
                      ? "zhotovitele"
                      : c.for.toLowerCase()}
                </div>
                <div className="sign-line">
                  <div className="nm">{c.name}</div>
                  {c.pos && <div className="pos">{c.pos}</div>}
                  {c.org && <div className="org">{c.org}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {attachments.map((s, i) => (
        <section className="attachment" key={i}>
          <h2>
            {s.num && <span className="num">{s.num}</span>}
            {s.title}
          </h2>
          <Blocks blocks={s.blocks} />
        </section>
      ))}
    </div>
  );
}
