import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_CONTRACTOR,
  DOC_NUMBER_PREFIX,
  type DocType,
} from "@/lib/contract/types";
import type {
  ClientRow,
  ContractListItem,
  ContractRow,
  OrgSettingsRow,
  VersionRow,
} from "./types";

export async function listVersions(contractId: string): Promise<VersionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contract_versions")
    .select("id, version, created_at, data")
    .eq("contract_id", contractId)
    .order("version", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VersionRow[];
}

/**
 * Next sequential document number for the current year, scoped to a doc type.
 * smlouva → "2026-003"; other types are prefixed, e.g. "NDA-2026-003".
 */
export async function getNextDocumentNumber(
  docType: DocType = "smlouva"
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = DOC_NUMBER_PREFIX[docType] ?? "";
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("contract_number")
    .eq("doc_type", docType);

  const re = prefix
    ? new RegExp(`^${prefix}-${year}-0*(\\d+)`)
    : new RegExp(`^${year}-0*(\\d+)`);
  let max = 0;
  for (const row of data ?? []) {
    const m = (row.contract_number as string)?.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const seq = String(max + 1).padStart(3, "0");
  return prefix ? `${prefix}-${year}-${seq}` : `${year}-${seq}`;
}

/** Back-compat alias — smlouva numbering. */
export function getNextContractNumber(): Promise<string> {
  return getNextDocumentNumber("smlouva");
}

export async function listClients(): Promise<ClientRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("company");
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientRow[];
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ClientRow) ?? null;
}

export async function listContractsForClient(
  clientId: string
): Promise<ContractListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(
      "id, doc_type, contract_number, client_id, client_name, status, total_price, current_version, created_by, created_at, updated_at"
    )
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContractListItem[];
}

export async function listContracts(): Promise<ContractListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(
      "id, doc_type, contract_number, client_id, client_name, status, total_price, current_version, created_by, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContractListItem[];
}

export async function getContract(id: string): Promise<ContractRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ContractRow) ?? null;
}

export async function getOrgSettings(): Promise<OrgSettingsRow> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return (
    (data as OrgSettingsRow) ?? {
      id: 1,
      company_name: DEFAULT_CONTRACTOR.companyName,
      address: DEFAULT_CONTRACTOR.address,
      ico: DEFAULT_CONTRACTOR.ico,
      representative: DEFAULT_CONTRACTOR.representative,
      bank_name: DEFAULT_CONTRACTOR.bankName,
      account_number: DEFAULT_CONTRACTOR.accountNumber,
      vat_mode: DEFAULT_CONTRACTOR.vatMode,
      data_box: DEFAULT_CONTRACTOR.dataBox,
      updated_at: "",
    }
  );
}
