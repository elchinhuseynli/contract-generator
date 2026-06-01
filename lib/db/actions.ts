"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import {
  sumPriceItems,
  type ContractData,
  type ContractStatus,
  type DocType,
  type VatMode,
} from "@/lib/contract/types";

/** Counterparty fields persisted to the `clients` table (any doc type). */
export type ClientUpsert = {
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
};

/** Persistence metadata the caller computes (client-side, via the doc-type registry). */
export type DocMeta = {
  contractNumber: string;
  clientName: string | null;
  totalPrice: number;
  client: ClientUpsert | null;
};

async function upsertClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  client: ClientUpsert | null,
  userId: string
): Promise<string | null> {
  if (!client || !client.ico) return null;

  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("ico", client.ico)
    .maybeSingle();

  if (existing) {
    await supabase.from("clients").update(client).eq("id", existing.id);
    return existing.id as string;
  }
  const { data: created } = await supabase
    .from("clients")
    .insert({ ...client, created_by: userId })
    .select("id")
    .single();
  return (created?.id as string) ?? null;
}

/** Create any document type. `data` shape depends on docType (opaque here). */
export async function saveDocument(
  docType: DocType,
  data: unknown,
  meta: DocMeta
): Promise<string> {
  const user = await requireUser();
  const supabase = await createClient();

  const clientId = await upsertClient(supabase, meta.client, user.id);

  const { data: row, error } = await supabase
    .from("contracts")
    .insert({
      doc_type: docType,
      contract_number: meta.contractNumber,
      client_id: clientId,
      client_name: meta.clientName,
      status: "draft",
      total_price: meta.totalPrice,
      data,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("contract_versions").insert({
    contract_id: row.id,
    version: 1,
    data,
    created_by: user.id,
  });

  revalidatePath("/dashboard");
  return row.id as string;
}

export async function updateDocument(
  id: string,
  data: unknown,
  meta: DocMeta
): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: cur } = await supabase
    .from("contracts")
    .select("current_version")
    .eq("id", id)
    .single();
  const nextVersion = (cur?.current_version ?? 1) + 1;

  await upsertClient(supabase, meta.client, user.id);

  const { error } = await supabase
    .from("contracts")
    .update({
      contract_number: meta.contractNumber,
      client_name: meta.clientName,
      total_price: meta.totalPrice,
      data,
      current_version: nextVersion,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("contract_versions").insert({
    contract_id: id,
    version: nextVersion,
    data,
    created_by: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/contracts/${id}`);
}

/** Persistence meta for a Smlouva o dílo (back-compat helper). */
function contractMeta(data: ContractData): DocMeta {
  return {
    contractNumber: data.contractNumber,
    clientName: data.clientCompany,
    totalPrice: sumPriceItems(data.priceItems),
    client: data.clientICO
      ? {
          company: data.clientCompany,
          address: data.clientAddress,
          ico: data.clientICO,
          dic: data.clientDIC ?? null,
          representative: data.clientRepresentative,
          email: data.clientEmail ?? null,
          phone: data.clientPhone ?? null,
          contact_person: data.clientContactPerson,
          contact_email: data.clientContactEmail ?? null,
          data_box: data.clientDataBox ?? null,
        }
      : null,
  };
}

export async function saveContract(data: ContractData): Promise<string> {
  return saveDocument("smlouva", data, contractMeta(data));
}

export async function updateContract(id: string, data: ContractData): Promise<void> {
  await updateDocument(id, data, contractMeta(data));
}

export async function setContractStatus(id: string, status: ContractStatus) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath(`/contracts/${id}`);
}

export async function deleteContract(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

/** A saved Smlouva o dílo that a dodatek/protokol can be linked to (prefill). */
export type LinkableContract = {
  id: string;
  contractNumber: string;
  workName: string;
  contractDate: string;
  clientCompany: string;
  clientAddress: string;
  clientICO: string;
  clientDIC: string;
  clientRepresentative: string;
  clientDataBox: string;
  label: string;
};

/** List saved smlouvy (newest first) for the "Navázat na smlouvu" picker. */
export async function listLinkableSmlouvy(): Promise<LinkableContract[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_number, client_name, data")
    .eq("doc_type", "smlouva")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const d = (row.data ?? {}) as ContractData;
    const number = d.contractNumber ?? (row.contract_number as string);
    const company = d.clientCompany ?? (row.client_name as string) ?? "";
    return {
      id: row.id as string,
      contractNumber: number,
      workName: d.workName ?? "",
      contractDate: d.contractDate ?? "",
      clientCompany: company,
      clientAddress: d.clientAddress ?? "",
      clientICO: d.clientICO ?? "",
      clientDIC: d.clientDIC ?? "",
      clientRepresentative: d.clientRepresentative ?? "",
      clientDataBox: d.clientDataBox ?? "",
      label: `${number} · ${company || "—"}`,
    };
  });
}

export async function duplicateContract(id: string): Promise<string> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: src, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !src) throw new Error("Smlouva nenalezena");

  const data = src.data;
  const { data: row, error: insErr } = await supabase
    .from("contracts")
    .insert({
      doc_type: src.doc_type,
      contract_number: `${src.contract_number}-kopie`,
      client_id: src.client_id,
      client_name: src.client_name,
      status: "draft",
      total_price: src.total_price,
      data,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(insErr.message);

  await supabase.from("contract_versions").insert({
    contract_id: row.id,
    version: 1,
    data,
    created_by: user.id,
  });

  revalidatePath("/dashboard");
  return row.id as string;
}

export async function restoreVersion(contractId: string, version: number) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: ver, error } = await supabase
    .from("contract_versions")
    .select("data")
    .eq("contract_id", contractId)
    .eq("version", version)
    .single();
  if (error || !ver) throw new Error("Verze nenalezena");

  const data = ver.data;
  const { data: cur } = await supabase
    .from("contracts")
    .select("doc_type, current_version")
    .eq("id", contractId)
    .single();
  const nextVersion = (cur?.current_version ?? 1) + 1;

  // For smlouva, keep the denormalized columns in sync with the restored data;
  // for other doc types, restore the data blob and keep existing columns.
  const cols: Record<string, unknown> = { data, current_version: nextVersion };
  if (cur?.doc_type === "smlouva") {
    const cd = data as ContractData;
    cols.contract_number = cd.contractNumber;
    cols.client_name = cd.clientCompany;
    cols.total_price = sumPriceItems(cd.priceItems);
  }
  await supabase.from("contracts").update(cols).eq("id", contractId);

  await supabase.from("contract_versions").insert({
    contract_id: contractId,
    version: nextVersion,
    data,
    created_by: user.id,
  });

  revalidatePath(`/contracts/${contractId}/edit`);
}

export type OrgSettingsInput = {
  company_name: string;
  address: string;
  ico: string;
  representative: string;
  bank_name: string;
  account_number: string;
  vat_mode: VatMode;
  data_box: string | null;
};

export async function updateOrgSettings(values: OrgSettingsInput) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("org_settings")
    .update(values)
    .eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export type ClientInput = {
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
};

export async function updateClient(id: string, values: ClientInput) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(values).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}
