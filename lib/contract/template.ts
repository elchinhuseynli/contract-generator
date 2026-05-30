import { ContractData, ContractorInfo, DEFAULT_CONTRACTOR } from "./types";
import { buildContractDoc, renderDocToMarkdown } from "./document";

// Re-export formatting helpers from their new home so existing importers
// (form, tables, version history) keep working unchanged.
export { formatCZK, formatDate, numberToCzechWords } from "./format";

/**
 * Canonical markdown representation of a contract. Now derived from the single
 * structured document model in document.tsx (which also powers the styled
 * preview/PDF), so the two can never drift.
 */
export function generateContractMarkdown(
  data: ContractData,
  contractor: ContractorInfo = DEFAULT_CONTRACTOR
): string {
  return renderDocToMarkdown(buildContractDoc(data, contractor));
}
