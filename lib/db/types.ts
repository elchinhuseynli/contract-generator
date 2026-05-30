import type { ContractData, ContractorInfo, ContractStatus } from "@/lib/contract/types";

export type ContractRow = {
  id: string;
  contract_number: string;
  client_id: string | null;
  client_name: string | null;
  status: ContractStatus;
  total_price: number;
  data: ContractData;
  current_version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** List view doesn't need the full JSONB snapshot. */
export type ContractListItem = Omit<ContractRow, "data">;

export type VersionRow = {
  id: string;
  version: number;
  created_at: string;
  data: ContractData;
};

export type ClientRow = {
  id: string;
  company: string;
  ico: string | null;
  dic: string | null;
  representative: string | null;
  email: string | null;
  contact_person: string | null;
  created_at: string;
};

export type OrgSettingsRow = {
  id: number;
  company_name: string;
  address: string;
  ico: string;
  representative: string;
  bank_name: string;
  account_number: string;
  updated_at: string;
};

export function orgToContractor(o: OrgSettingsRow): ContractorInfo {
  return {
    companyName: o.company_name,
    address: o.address,
    ico: o.ico,
    representative: o.representative,
    bankName: o.bank_name,
    accountNumber: o.account_number,
  };
}

export const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Koncept",
  sent: "Odesláno",
  signed: "Podepsáno",
  archived: "Archivováno",
};
