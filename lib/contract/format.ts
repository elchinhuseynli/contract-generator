// Formatting helpers shared by the markdown renderer, the styled document,
// and the form. Kept dependency-free to avoid import cycles.

/** "75000" -> "75 000,- Kč" */
export function formatCZK(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ",- Kč";
}

/** ISO date -> Czech locale ("30. 5. 2026"). Empty input returns "". */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("cs-CZ");
}

const ONES = ["", "jeden", "dva", "tři", "čtyři", "pět", "šest", "sedm", "osm", "devět"];
const TEENS = [
  "deset", "jedenáct", "dvanáct", "třináct", "čtrnáct",
  "patnáct", "šestnáct", "sedmnáct", "osmnáct", "devatenáct",
];
const TENS = [
  "", "", "dvacet", "třicet", "čtyřicet",
  "padesát", "šedesát", "sedmdesát", "osmdesát", "devadesát",
];
const HUNDREDS = [
  "", "sto", "dvěstě", "třista", "čtyřista",
  "pětset", "šestset", "sedmset", "osmset", "devětset",
];

/** Czech words for an integer amount, e.g. 75000 -> "sedmdesát pět tisíc". */
export function numberToCzechWords(num: number): string {
  if (num === 0) return "nula";
  if (num >= 1_000_000) return num.toString();

  let result = "";
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    if (thousand === 1) result += "tisíc ";
    else if (thousand < 5) result += numberToCzechWords(thousand) + " tisíce ";
    else result += numberToCzechWords(thousand) + " tisíc ";
    num = num % 1000;
  }
  if (num >= 100) {
    result += HUNDREDS[Math.floor(num / 100)] + " ";
    num = num % 100;
  }
  if (num >= 20) {
    result += TENS[Math.floor(num / 10)];
    if (num % 10 !== 0) result += " " + ONES[num % 10];
  } else if (num >= 10) {
    result += TEENS[num - 10];
  } else if (num > 0) {
    result += ONES[num];
  }
  return result.trim();
}
