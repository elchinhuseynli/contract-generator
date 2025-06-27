const express = require("express");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Format number to Czech currency format
function formatCZK(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ",- Kč";
}

// Convert number to Czech words
function numberToCzechWords(num) {
  const ones = [
    "",
    "jeden",
    "dva",
    "tři",
    "čtyři",
    "pět",
    "šest",
    "sedm",
    "osm",
    "devět",
  ];
  const teens = [
    "deset",
    "jedenáct",
    "dvanáct",
    "třináct",
    "čtrnáct",
    "patnáct",
    "šestnáct",
    "sedmnáct",
    "osmnáct",
    "devatenáct",
  ];
  const tens = [
    "",
    "",
    "dvacet",
    "třicet",
    "čtyřicet",
    "padesát",
    "šedesát",
    "sedmdesát",
    "osmdesát",
    "devadesát",
  ];
  const hundreds = [
    "",
    "sto",
    "dvěstě",
    "třista",
    "čtyřista",
    "pětset",
    "šestset",
    "sedmset",
    "osmset",
    "devětset",
  ];
  const thousands = ["", "tisíc", "tisíce", "tisíc"];

  if (num === 0) return "nula";
  if (num >= 1000000) return num.toString(); // fallback for very large numbers

  let result = "";

  // Thousands
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    if (thousand === 1) {
      result += "tisíc ";
    } else if (thousand < 5) {
      result += numberToCzechWords(thousand) + " tisíce ";
    } else {
      result += numberToCzechWords(thousand) + " tisíc ";
    }
    num = num % 1000;
  }

  // Hundreds
  if (num >= 100) {
    result += hundreds[Math.floor(num / 100)] + " ";
    num = num % 100;
  }

  // Tens and ones
  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    if (num % 10 !== 0) {
      result += " " + ones[num % 10];
    }
  } else if (num >= 10) {
    result += teens[num - 10];
  } else if (num > 0) {
    result += ones[num];
  }

  return result.trim();
}

// Format date to Czech format
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("cs-CZ");
}

// Generate complete contract content in markdown
function generateMarkdownContract(data) {
  const advanceAmount = Math.round(
    (data.projectPrice * data.advancePercent) / 100
  );
  const remainingAmount = data.projectPrice - advanceAmount;
  const priceInWords = numberToCzechWords(data.projectPrice);

  // Generate timeline table
  let timelineTable = "";
  if (data.timelinePhase && data.timelineStart && data.timelineEnd) {
    timelineTable =
      "| Fáze projektu | Datum zahájení | Datum ukončení |\n| :---- | ----- | ----- |\n";
    for (let i = 0; i < data.timelinePhase.length; i++) {
      timelineTable += `| ${data.timelinePhase[i]} | ${formatDate(
        data.timelineStart[i]
      )} | ${formatDate(data.timelineEnd[i])} |\n`;
    }
  }

  return `# **Smlouva o dílo č. ${data.contractNumber}**

## **Smluvní strany** {#smluvní-strany}

**Zhotovitel:** Flex Digital Agency, s.r.o.

* Sídlo: Mattoniho nábřeží 50, Karlovy Vary 360 01  
* IČO: 08894892  
* Jednatel: Elchin Huseynli  
* Bankovní spojení: Raiffeisenbank, a.s.  
* Číslo účtu: 2096701002/5500

**Objednatel:** ${data.clientCompany}

* Sídlo: ${data.clientAddress}  
* IČO: ${data.clientICO}  
${data.clientDIC ? `* DIČ (DPH): ${data.clientDIC}  ` : ""}
* Jednatel: ${data.clientRepresentative}
${data.clientEmail ? `* Email: ${data.clientEmail}  ` : ""}
${data.clientPhone ? `* Telefon: ${data.clientPhone}  ` : ""}

Uzavřely podle ust. § 2586 a násl. zákona č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů a s odkazem na ust. § 61 zák. č. 121/2000 Sb., autorský zákon, ve znění pozdějších předpisů níže uvedeného dne, měsíce a roku tuto smlouvu o dílo:

## **I. Předmět smlouvy** {#i.-předmět-smlouvy}

1. Předmětem této smlouvy je závazek zhotovitele k provedení díla specifikovaného v této smlouvě a v příloze č. 1, která je její nedílnou součástí na náklady a nebezpečí zhotovitele ve sjednaném čase (dále jen „dílo"), a závazek objednatele zaplatit zhotoviteli za řádné a včasné provedení díla sjednanou cenu díla.  
2. Zhotovitel se zavazuje k provedení díla pro objednatele, a to v kvalitě a v rozsahu tak, jak je podrobně specifikováno v příloze A této smlouvy.  
3. Zhotovitel potvrzuje, že se seznámil s rozsahem a povahou díla, že jsou mu známy veškeré technické, kvalitativní a jiné podmínky nezbytné k realizaci díla, že disponuje takovými kapacitami a odbornými znalostmi, které jsou k provedení díla nezbytné.

## **II. Doba plnění** {#ii.-doba-plnění}

1. Zhotovitel se zavazuje celé dílo popsané v této smlouvě a v příloze A provést nejpozději do ${formatDate(
    data.completionDate
  )}. Podrobný harmonogram je uveden v příloze C, která je nedílnou součástí této smlouvy.  
2. Lhůta splnění závazku zhotovitele se staví a neběží pro překážky, které nejsou na straně zhotovitele, a to po dobu trvání této překážky. Překážkou ve smyslu tohoto článku této smlouvy se rozumí zejména: a. neposkytnutí řádné součinnosti objednatele zhotoviteli k provádění díla, b. okolnosti vis maior.

## **III. Práva a povinnosti smluvních stran** {#iii.-práva-a-povinnosti-smluvních-stran}

1. Zhotovitel je povinen provést dílo dle pokynů objednatele, dokumentace předané objednatelem zhotoviteli a v souladu s obecně závaznými právními předpisy.  
2. Zhotovitel se zavazuje opatřit vše, co je zapotřebí k provedení díla podle této smlouvy.  
3. Zhotovitel se zavazuje spolupůsobit při výkonu finanční kontroly ve smyslu zákona č. 320/2001 Sb., o finanční kontrole ve veřejné správě a o změně některých zákonů, ve znění pozdějších předpisů, resp. zákona č. 255/2012 Sb., o kontrole.  
4. Objednatel se zavazuje poskytnout zhotoviteli veškerou součinnost potřebnou pro řádné plnění předmětu této smlouvy spočívající mj. v odsouhlasení grafických návrhů, poskytnutí technických požadavků na systém či součinnosti při předání díla. Objednatel je povinen poskytnout součinnost do 7 dnů ode dne doručení žádosti zhotovitele. Prodlení objednatele s poskytnutím uvedené součinnosti má za následek prodloužení termínu plnění díla o dobu, po kterou byl objednatel v prodlení s poskytnutím součinnosti.  
5. Zhotovitel je povinen upozornit objednatele bez zbytečného odkladu na nevhodnou povahu podkladů převzatých od objednatele nebo požadavků, připomínek a pokynů daných mu objednatelem k plnění předmětu této smlouvy.  
6. Smluvní strany navzájem jsou si povinny poskytnout veškerou součinnost potřebnou k provedení díla.  
7. Objednatel je oprávněn v průběhu provádění díla kontrolovat průběžný postup prací na díle. Zhotovitel je povinen na výzvu objednatele tuto součinnost umožnit.  
8. Účastníci této smlouvy výslovně prohlašují, že si navzájem sdělili všechny skutkové a právní okolnosti, o nichž k datu podpisu této smlouvy věděli nebo vědět museli, a které jsou relevantní ve vztahu k uzavření této smlouvy a naplnění jejího účelu.

## **IV. Převzetí a předání díla** {#iv.-převzetí-a-předání-díla}

1. Dnem řádného předání předmětu díla se rozumí den zveřejnění předmětu díla objednateli v kvalitě a rozsahu odpovídajícím této smlouvě.  
2. V případě řádně provedeného díla jsou smluvní strany povinny sepsat o předání a převzetí předmětu díla předávací protokol, který bude datován a podepsán oběma smluvními stranami.  
3. V případě zjištění vad díla je objednatel povinen tyto vady písemně vytknout v předávacím protokolu. Smluvní strany si v předávacím protokolu dohodnou termín pro odstranění vad. V případě, že objednatel nevytkne vady v době předání, dílo se považuje za řádně a včas předané bez vad a nedodělků.  
4. Osobou oprávněnou k převzetí díla za objednatele je ${data.clientContactPerson}${data.clientContactEmail ? ` (email: ${data.clientContactEmail})` : ''}  
5. Osobou oprávněnou k předání díla za zhotovitele je Elchin Huseynli.  
6. Místem převzetí díla jsou ${data.contractLocation}, Česká republika.

## **V. Vlastnické právo a nebezpečí škody na díle** {#v.-vlastnické-právo-a-nebezpečí-škody-na-díle}

1. Vlastníkem díla je až do okamžiku jeho předání objednateli zhotovitel.  
2. Nebezpečí škody na zhotoveném díle nese od uzavření smlouvy do doby předání řádně provedeného díla zhotovitel. Objednatel nese nebezpečí škody na zhotoveném díle ode dne, kdy převezme dílo, nebo ode dne, kdy je v prodlení s převzetím díla.

## **VI. Cena za dílo a platební podmínky** {#vi.-cena-za-dílo-a-platební-podmínky}

1. Objednatel se zavazuje za dílo zaplatit celkovou smluvní cenu ve výši ${formatCZK(
    data.projectPrice
  )} (slovy: ${priceInWords} korun českých). Zhotovitel není plátcem DPH.  
2. Cena dle předchozího odstavce obsahuje veškeré náklady pro realizaci díla včetně nákladů souvisejících. Kalkulace ceny je uvedena v příloze B, která je nedílnou součásti této smlouvy.  
3. Cena za dílo je pevná po celou dobu realizace díla a zahrnuje veškeré náklady zhotovitele související s realizací díla. Cena za dílo je stanovena jako nejvýše přípustná. Cena za dílo je překročitelná pouze v případě, dojde-li v průběhu realizace ke změně daňových předpisů s dopadem na cenu díla. Objednatel jiné překročení ceny díla nepřipouští.  
4. Objednatel je povinen zaplatit zálohu ve výši ${
    data.advancePercent
  } % z ceny díla, které je předmětem podle této smlouvy. Tuto zálohu uhradí na účet zhotovitele číslo 2096701002/5500 do tří dnů od podpisu této smlouvy.  
5. Zbývající část ceny díla, které je předmětem podle této smlouvy uhradí objednatel na účet zhotovitele číslo 2096701002/5500 při předání zhotoveného díla. Objednatel se zavazuje faktury zaplatit ve splatnosti dle specifikace na fakturách (obvykle do 10 pracovních dnů).  
6. Faktury musí obsahovat všechny náležitosti řádného daňového a účetního dokladu ve smyslu příslušných právních předpisů, zejména zákona č. 563/1991 Sb., o účetnictví, ve znění pozdějších předpisů. Faktura nesplňující předepsané náležitosti bude objednatelem vrácena do dne její splatnosti k doplnění či opravě, aniž se tak dostane do prodlení se splatností. Lhůta splatnosti počíná běžet znovu od opětovného doručení náležitě doplněné či opravené faktury objednateli.

## **VII. Odpovědnost za vady díla** {#vii.-odpovědnost-za-vady-díla}

1. Dílo má vady, pokud není zhotoveno v souladu s podmínkami stanovenými touto smlouvou a jejími přílohami.  
2. Objednatel je povinen uplatnit vady u zhotovitele, a to písemně na adresu uvedenou v záhlaví této smlouvy s uvedením vytýkaných vad. Lhůta k odstranění vady se stanovuje na 30 kalendářních dní od doručení oznámení o výskytu vady zhotoviteli, pokud nebude smluvními stranami dohodnuto jinak. Zhotovitel je povinen odstranit vytknuté vady na svůj náklad.  
3. Zhotovitel dává záruku za jakost díla. Záruční doba je stanovena na ${
    data.warrantyMonths
  } měsíců.  
4. Záruční doba počíná běžet dnem předání díla, případně dnem odstranění poslední vady a nedodělku vyplývajícího z protokolu o předání a převzetí díla. Po tuto dobu zhotovitel odpovídá za vady, které se na díle vyskytnou.

## **VIII. Odstoupení od smlouvy** {#viii.-odstoupení-od-smlouvy}

1. Tato smlouva může být ukončena písemnou dohodou smluvních stran anebo odstoupením od smlouvy z důvodů stanovených v této smlouvě nebo v zákoně.  
2. Od této smlouvy může smluvní strana odstoupit pro podstatné porušení smluvní povinnosti druhou smluvní stranou. Za podstatné porušení smluvní povinnosti se považuje zejména: a. na straně objednatele nezaplacení ceny díla podle této smlouvy ve lhůtě delší než 10 dní po dni splatnosti příslušné faktury, b. na straně zhotovitele, jestliže dílo (nebo jeho část), nebude řádně dodáno v dohodnutém termínu, c. na straně zhotovitele, jestliže dílo nebude mít vlastnosti deklarované zhotovitelem v této smlouvě či vlastnosti z této smlouvy vyplývající, d. na straně zhotovitele, jestliže je zhotovitel v prodlení s odstraněním vad dle čl. VII. této smlouvy.  
3. Odstoupení od této smlouvy musí být učiněno písemně a jako takové doručeno druhé straně na v záhlaví uvedenou adresu či do datové schránky.  
4. V případě odstoupení od této smlouvy jsou smluvní strany povinny vypořádat své vzájemné závazky a pohledávky stanovené v zákoně nebo v této smlouvě, a to do 30 dnů od právních účinků odstoupení, nebo v dohodnuté lhůtě.

## **IX. Ochrana informací** {#ix.-ochrana-informací}

1. Smluvní strany se vzájemně zavazují, že budou chránit a utajovat před třetími osobami chráněné informace, dokumenty a skutečnosti, tvořící obchodní tajemství, které byly vzájemně stranami poskytnuty v rámci tohoto obchodního případu. Obchodní tajemství tvoří konkurenčně významné, určitelné, ocenitelné a v příslušných obchodních kruzích běžně nedostupné skutečnosti, jejichž vlastník zajišťuje ve svém zájmu odpovídajícím způsobem jejich utajení.

## **X. Smluvní pokuty a náhrada škody** {#x.-smluvní-pokuty-a-náhrada-škody}

1. Jestliže zhotovitel bude v prodlení s provedením jím zhotovovaného díla, je objednatel oprávněn požadovat po zhotoviteli smluvní pokutu ve výši 0,05 % z celkové ceny díla za každý den prodlení.  
2. Bude-li objednatel v prodlení se zaplacením ceny díla, je zhotovitel oprávněn požadovat po objednateli smluvní pokutu ve výši 0,05 % z neuhrazené části peněžitého závazku, a to za každý den prodlení.  
3. Poruší-li smluvní strana povinnost uvedenou v ust. čl. IX. odst. 1) této smlouvy, je povinna zaplatit smluvní pokutu ve výši 3 000,- Kč za každé takové prokázané porušení.  
4. Ujednáním o smluvní pokutě není dotčeno právo objednatele nebo zhotovitele na náhradu škody způsobené porušením povinnosti, na kterou se smluvní pokuta vztahuje, a to ani v případě, že náhrada škody přesahuje smluvní pokutu.  
5. Smluvní pokuta je splatná do 30 dnů od data, kdy byla povinné straně doručena písemná výzva k jejímu zaplacení ze strany oprávněné, a to na účet oprávněné strany uvedený v písemné výzvě.  
6. Smluvní strany se dohodly, že se právo na náhradu škody, s výjimkou škody způsobené úmyslně, omezuje částkou rovnající se celkové dohodnuté ceně díla. Hradí se pouze přímé škody, žádná ze smluvních stran nemá nárok na náhradu za žádné jiné škody, včetně následných škod, ušlého zisku a zvláštních, nepřímých nebo náhodných škod.

**XI. Licenční ujednání**

1. Zhotovitel poskytuje objednateli licenci ke všem způsobům užití díla (rozmnožování díla, rozšiřování díla, pronájem díla, půjčování díla, vystavování díla a sdělování díla veřejnosti), v rozsahu neomezeném, a to jak ve hmotné, tak i v nehmotné podobě, zejména pak elektronicky.  
2. Objednatel není povinen licenci využít.  
3. Objednatel je oprávněn využívat dílo výdělečně nebo nevýdělečně.  
4. Objednatel je oprávněn oprávnění tvořící součást licence zcela nebo zčásti poskytnout či postoupit třetí osobě. Objednatel je oprávněn postoupit licenci kterékoli osobě. Objednatel není povinen zhotovitele, ani autora informovat o poskytnutí podlicence ani o postoupení licence.  
5. Smluvní strany výslovně sjednávají, že cena licence je již zahrnuta v ceně díla dle čl. VI. této smlouvy.  
6. Územní rozsah licence není omezen. Licence se poskytuje na dobu trvání majetkových práv k dílu. Množstevní rozsah licence je neomezený.  
7. Zhotovitel uděluje nabyvateli souhlas ke zveřejňování, úpravám, zpracování díla včetně jeho překladu, spojování s jiným dílem, jakož i užití takto zpracovaného díla, zařazení díla do díla souborného a užití tohoto souborného díla. Zhotovitel dále uděluje nabyvateli souhlas k úpravám či změně názvu díla.  
8. Zhotovitel prohlašuje, že je oprávněn poskytnout objednateli práva k dílu dle této smlouvy. Zhotovitel je povinen vypořádat veškeré nároky autora ve vztahu k dílu dle této smlouvy.  
9. Zhotovitel je oprávněn uvádět jméno objednatele a ukázky z díla, včetně jeho charakteristik, jako svoji referenci pro účely vlastní propagace. Zhotovitel má právo umístit na dílo svoje označení autorství, přičemž to bude zároveň sloužit jako odkaz na jeho webové stránky. Zhotovitel se zavazuje nenarušit tímto celkový vzhled díla.

## **XII. Závěrečná ustanovení** {#xii.-závěrečná-ustanovení}

1. Ustanovení této smlouvy lze doplňovat, měnit nebo rušit pouze písemnými, vzestupně číslovanými a datovanými dodatky podepsanými oprávněnými zástupci obou smluvních stran, a to na návrh kterékoli z nich.  
2. Pro vztahy touto smlouvou výslovně neupravené, včetně náhrady škody, platí příslušná ustanovení zákona č. 89/2012 Sb., občanský zákoník ve znění pozdějších předpisů.  
3. V případě, že některé ustanovení této smlouvy je nebo se stane neúčinným, zůstávají ostatní ustanovení této smlouvy účinná. Smluvní strany se zavazují nahradit neúčinné ustanovení této smlouvy ustanovením jiným, účinným, které svým obsahem a smyslem odpovídá nejlépe obsahu a smyslu ustanovení původního.  
4. Případné spory vzniklé z této smlouvy budou řešeny podle platné právní úpravy věcně a místně příslušnými orgány České republiky.  
5. Tato smlouva je vyhotovena ve dvou stejnopisech, z nichž každý má platnost originálu, přičemž každá smluvní strana obdrží jedno vyhotovení.  
6. Obě smluvní strany prohlašují, že si smlouvu přečetly a s jejím obsahem, který vyjadřuje jejich pravou vůli prostou omylů, souhlasí. Zároveň prohlašují, že tato smlouva není uzavírána v tísni nebo za nápadně nevýhodných podmínek, na důkaz čehož připojují své podpisy.  
7. Tato smlouva nabývá platnosti dnem jejího uzavření, tj. dnem podpisu smlouvy oprávněnými zástupci obou smluvních stran.

| V ${data.contractLocation}, dne |  |
| :---- | :---- |
| **Objednatel:** |  |
| V ${data.contractLocation}, dne | ${formatDate(data.contractDate)} |
| **Zhotovitel:** |  |

## **Příloha A – Popis díla** {#příloha-a-–-popis-díla}

${data.projectDescription}

Všechny části díla budou vytvořeny s ohledem na moderní trendy v designu a budou respektovat požadavky klienta na barevnost a celkový vizuální styl. Grafické návrhy budou optimalizovány pro různá zobrazovací zařízení, přičemž uspořádání obsahu a velikost prvků se budou přizpůsobovat šířce zobrazení.

Součástí díla je také konzultace s klientem ohledně jeho požadavků a preferencí, prezentace návrhů a případné revize až do finálního schválení.

Dílo nezahrnuje:

* Dodání fotografií, videí nebo jiných multimediálních materiálů  
* Dlouhodobou správu webových stránek  
* Dodatečné úpravy po schválení finálních verzí, pokud nejsou způsobeny chybou dodavatele

Veškeré potřebné podklady a informace pro tvorbu díla dodá objednatel. 

## **Příloha B – kalkulace ceny díla**  {#příloha-b-–-kalkulace-ceny-díla}


| Název položky | Cena |
| :---- | ----- |
| Tvorba webových stránek | ${formatCZK(data.projectPrice)} |
| **Cena celkem:** | ${formatCZK(data.projectPrice)} |

## 

## **Příloha C – časový harmonogram zhotovení díla** {#příloha-c-–-časový-harmonogram-zhotovení-díla}

${timelineTable}
`;
}

// API endpoint to fetch company data from ARES
app.get("/api/ares/:ico", async (req, res) => {
  try {
    const ico = req.params.ico;
    
    // First get basic info (including DIC) from main endpoint
    const basicUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;
    const basicResponse = await fetch(basicUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    let basicData = null;
    if (basicResponse.ok) {
      basicData = await basicResponse.json();
    }
    
    // Then get detailed VR data for statutory organ info
    const aresUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty-vr/${ico}`;
    
    const response = await fetch(aresUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`ARES API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Debug logging (can be removed in production)
    console.log('ARES Response for ICO:', ico);
    
    // Extract relevant company information from both sources
    const companyInfo = {
      ico: ico,
      name: '',
      address: '',
      dic: '',
      representative: ''
    };
    
    // Get basic info from basicData if available
    if (basicData) {
      companyInfo.name = basicData.obchodniJmeno || basicData.nazev || '';
      companyInfo.dic = basicData.dic || '';
      
      if (basicData.sidlo && basicData.sidlo.textovaAdresa) {
        companyInfo.address = basicData.sidlo.textovaAdresa;
      }
    }
    
    // Get additional data from VR record
    if (data.zaznamy && data.zaznamy.length > 0) {
      const primaryRecord = data.zaznamy.find(z => z.primarniZaznam) || data.zaznamy[0];
      
      // Use VR data if basic data didn't provide name
      if (!companyInfo.name && primaryRecord.obchodniJmeno && primaryRecord.obchodniJmeno.length > 0) {
        companyInfo.name = primaryRecord.obchodniJmeno[0].hodnota;
      }
      
      // Use VR data if basic data didn't provide address
      if (!companyInfo.address && primaryRecord.adresy && primaryRecord.adresy.length > 0) {
        const latestAddress = primaryRecord.adresy
          .filter(a => a.typAdresy === 'SIDLO' && !a.datumVymazu)
          .sort((a, b) => new Date(b.datumZapisu) - new Date(a.datumZapisu))[0];
          
        if (latestAddress && latestAddress.adresa) {
          companyInfo.address = latestAddress.adresa.textovaAdresa;
        }
      }
    }
    
    // Try to get representative from statutory bodies
    if (data.zaznamy && data.zaznamy.length > 0) {
      const primaryRecord = data.zaznamy.find(z => z.primarniZaznam) || data.zaznamy[0];
      
      if (primaryRecord.statutarniOrgany && Array.isArray(primaryRecord.statutarniOrgany)) {
        // Find the statutory organ
        const statutarniOrgan = primaryRecord.statutarniOrgany.find(org => 
          org.typOrganu === 'STATUTARNI_ORGAN'
        );
        
        if (statutarniOrgan && statutarniOrgan.clenoveOrganu) {
          // Find current active member with jednatel function
          const currentRepresentative = statutarniOrgan.clenoveOrganu.find(clen => {
            return !clen.datumVymazu && // not deleted
                   clen.clenstvi && 
                   clen.clenstvi.funkce && 
                   clen.clenstvi.funkce.nazev &&
                   clen.clenstvi.funkce.nazev.toLowerCase().includes('jednatel');
          });
          
          if (currentRepresentative && currentRepresentative.fyzickaOsoba) {
            const person = currentRepresentative.fyzickaOsoba;
            
            let fullName = '';
            if (person.titulPredJmenem) fullName += person.titulPredJmenem + ' ';
            if (person.jmeno) fullName += person.jmeno + ' ';
            if (person.prijmeni) fullName += person.prijmeni;
            if (person.titulZaJmenem) fullName += ' ' + person.titulZaJmenem;
            
            companyInfo.representative = fullName.trim();
          }
          
          // If no jednatel found, take any current active member
          if (!companyInfo.representative) {
            const anyActiveMember = statutarniOrgan.clenoveOrganu.find(clen => 
              !clen.datumVymazu && clen.fyzickaOsoba
            );
            
            if (anyActiveMember && anyActiveMember.fyzickaOsoba) {
              const person = anyActiveMember.fyzickaOsoba;
              
              let fullName = '';
              if (person.titulPredJmenem) fullName += person.titulPredJmenem + ' ';
              if (person.jmeno) fullName += person.jmeno + ' ';
              if (person.prijmeni) fullName += person.prijmeni;
              if (person.titulZaJmenem) fullName += ' ' + person.titulZaJmenem;
              
              companyInfo.representative = fullName.trim();
            }
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: companyInfo
    });
    
  } catch (error) {
    console.error('ARES API error:', error);
    res.status(500).json({
      success: false,
      error: 'Nepodařilo se načíst data ze systému ARES. Zkontrolujte IČO.'
    });
  }
});

// API endpoint to generate markdown contract
app.post("/api/generate-markdown", async (req, res) => {
  try {
    const markdownContent = generateMarkdownContract(req.body);

    res.json({
      success: true,
      content: markdownContent,
      filename: `Smlouva_${
        req.body.contractNumber
      }_${req.body.clientCompany.replace(/[^a-zA-Z0-9]/g, "_")}.md`,
    });
  } catch (error) {
    console.error("Error generating markdown:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
