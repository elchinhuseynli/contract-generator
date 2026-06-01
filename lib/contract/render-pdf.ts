import {
  buildContractDoc,
  renderDocToHtml,
  type StyledDoc,
} from "./document";
import type { ContractData, ContractorInfo } from "./types";

/** Full standalone HTML document for any StyledDoc — fed to Gotenberg (Chromium). */
export function renderHtmlDocument(doc: StyledDoc): string {
  const body = renderDocToHtml(doc);
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8" /></head><body style="margin:0">${body}</body></html>`;
}

/** Back-compat: render a Smlouva o dílo to standalone HTML. */
export function renderContractHtmlDocument(
  data: ContractData,
  contractor: ContractorInfo
): string {
  return renderHtmlDocument(buildContractDoc(data, contractor));
}

/** Chromium footer (Gotenberg): document title left, "Strana X / Y" right. */
export function contractFooterHtml(leftText: string): string {
  const safe = (leftText ?? "").replace(/[<>&]/g, "");
  return `<html><head><style>
    .ft { font-family: Arial, sans-serif; font-size: 8px; color: #9aa3ad; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between; }
  </style></head><body>
    <div class="ft">
      <span>${safe}</span>
      <span>Strana <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  </body></html>`;
}
