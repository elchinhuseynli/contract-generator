import type {
  ContractData,
  ContractorInfo,
  ContractStatus,
  DocType,
  VatMode,
} from "@/lib/contract/types";

export type ContractRow = {
  id: string;
  doc_type: DocType;
  contract_number: string;
  client_id: string | null;
  client_name: string | null;
  status: ContractStatus;
  total_price: number;
  // Shape depends on doc_type; ContractData for smlouva, other shapes otherwise.
  data: ContractData;
  current_version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * List view doesn't need the full JSONB snapshot — but it does carry the work
 * name (extracted from `data->>workName` in the query) so the table can show
 * what the document is about, not just the client. Null for types without a
 * work name (e.g. NDA).
 */
export type ContractListItem = Omit<ContractRow, "data"> & {
  work_name: string | null;
};

export type VersionRow = {
  id: string;
  version: number;
  created_at: string;
  data: ContractData;
};

export type ClientRow = {
  id: string;
  company: string;
  address: string | null;
  ico: string | null;
  dic: string | null;
  representative: string | null;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  contact_email: string | null;
  data_box: string | null;
  vat_mode: VatMode | null;
  created_at: string;
  updated_at: string | null;
};

export type OrgSettingsRow = {
  id: number;
  company_name: string;
  address: string;
  ico: string;
  representative: string;
  bank_name: string;
  account_number: string;
  vat_mode: VatMode;
  data_box: string | null;
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
    vatMode: o.vat_mode ?? "nonpayer",
    dataBox: o.data_box ?? "",
  };
}

export const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Koncept",
  sent: "Odesláno",
  signed: "Podepsáno",
  archived: "Archivováno",
};
