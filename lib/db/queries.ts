import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONTRACTOR } from "@/lib/contract/types";
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

/** Next sequential contract number for the current year, e.g. "2026-003". */
export async function getNextContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const supabase = await createClient();
  const { data } = await supabase.from("contracts").select("contract_number");

  const re = new RegExp(`^${year}-0*(\\d+)`);
  let max = 0;
  for (const row of data ?? []) {
    const m = (row.contract_number as string)?.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${year}-${String(max + 1).padStart(3, "0")}`;
}

export async function listClients(): Promise<ClientRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, company, ico, dic, representative, email, contact_person, created_at")
    .order("company");
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientRow[];
}

export async function listContracts(): Promise<ContractListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(
      "id, contract_number, client_id, client_name, status, total_price, current_version, created_by, created_at, updated_at"
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
      updated_at: "",
    }
  );
}
