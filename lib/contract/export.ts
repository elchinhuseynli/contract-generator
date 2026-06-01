import { ContractData } from "./types";

/** Remove Pandoc/Google-Docs heading anchors like " {#smluvní-strany}" for display/HTML. */
export function stripHeadingAnchors(markdown: string): string {
  return markdown.replace(/\s*\{#[^}]+\}/g, "");
}

/** Keep only filename-safe number chars (letters, digits, hyphen). */
export function docNum(s: string | undefined): string {
  return (s || "").replace(/[^a-zA-Z0-9-]/g, "");
}

/** Transliterate diacritics to ASCII (č→c, ř→r, …) and slugify for filenames. */
export function slug(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

/** Clean ASCII base name, e.g. Smlouva_2026-001_Alza_Tvorba_webovych_stranek. */
export function contractFileBase(
  data: Pick<ContractData, "contractNumber" | "clientCompany" | "workName">
): string {
  const num = (data.contractNumber || "smlouva").replace(/[^a-zA-Z0-9-]/g, "");
  return ["Smlouva", num, slug(data.clientCompany), slug(data.workName)]
    .filter(Boolean)
    .join("_");
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Wrap rendered contract HTML in a standalone, print-ready document. The body
 * HTML already carries the document's own scoped <style> (.cdoc), so this only
 * adds minimal page chrome.
 */
export function buildStandaloneHtml(bodyHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body { margin: 0; background: #fff; padding: 24px; }
  .cdoc { max-width: 820px; margin: 0 auto; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
