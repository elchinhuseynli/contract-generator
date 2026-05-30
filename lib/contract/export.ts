import { ContractData } from "./types";

/** Remove Pandoc/Google-Docs heading anchors like " {#smluvní-strany}" for display/HTML. */
export function stripHeadingAnchors(markdown: string): string {
  return markdown.replace(/\s*\{#[^}]+\}/g, "");
}

/** Filesystem-safe base name, e.g. Smlouva_2026-001_Firma_s_r_o. */
export function contractFileBase(data: Pick<ContractData, "contractNumber" | "clientCompany">): string {
  const company = (data.clientCompany || "klient").replace(/[^a-zA-Z0-9]/g, "_");
  return `Smlouva_${data.contractNumber}_${company}`;
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

/** Wrap rendered contract HTML in a standalone, print-ready document. */
export function buildStandaloneHtml(bodyHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  body {
    font-family: "Lora", Georgia, "Times New Roman", serif;
    color: #1a1a1a; line-height: 1.6; max-width: 800px; margin: 2rem auto; padding: 0 1.25rem;
  }
  h1 { font-size: 1.6rem; text-align: center; margin: 0 0 1.5rem; }
  h2 { font-size: 1.15rem; margin: 2rem 0 0.75rem; border-bottom: 1px solid #ddd; padding-bottom: 0.25rem; }
  h3 { font-size: 1rem; margin: 1.5rem 0 0.5rem; }
  p, li { font-size: 0.95rem; }
  ol, ul { padding-left: 1.5rem; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
  th, td { border: 1px solid #ccc; padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  strong { font-weight: 600; }
  @media print { body { margin: 0; max-width: none; } }
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
