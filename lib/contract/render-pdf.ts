import { buildContractDoc, renderDocToHtml } from "./document";
import type { ContractData, ContractorInfo } from "./types";

/** Full standalone HTML document for the contract — fed to Gotenberg (Chromium). */
export function renderContractHtmlDocument(
  data: ContractData,
  contractor: ContractorInfo
): string {
  const body = renderDocToHtml(buildContractDoc(data, contractor));
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8" /></head><body style="margin:0">${body}</body></html>`;
}

/** Chromium footer (Gotenberg): doc title left, "Strana X / Y" right. */
export function contractFooterHtml(contractNumber: string): string {
  const safe = contractNumber.replace(/[<>&]/g, "");
  return `<html><head><style>
    .ft { font-family: Arial, sans-serif; font-size: 8px; color: #9aa3ad; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between; }
  </style></head><body>
    <div class="ft">
      <span>Smlouva o dílo č. ${safe}</span>
      <span>Strana <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  </body></html>`;
}
