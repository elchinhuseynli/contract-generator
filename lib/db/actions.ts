"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import {
  sumPriceItems,
  type ContractData,
  type ContractStatus,
  type VatMode,
} from "@/lib/contract/types";

async function clientFromData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: ContractData,
  userId: string
): Promise<string | null> {
  if (!data.clientICO) return null;
  const payload = {
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
  };

  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("ico", data.clientICO)
    .maybeSingle();

  if (existing) {
    await supabase.from("clients").update(payload).eq("id", existing.id);
    return existing.id as string;
  }
  const { data: created } = await supabase
    .from("clients")
    .insert({ ...payload, created_by: userId })
    .select("id")
    .single();
  return (created?.id as string) ?? null;
}

export async function saveContract(data: ContractData): Promise<string> {
  const user = await requireUser();
  const supabase = await createClient();

  const clientId = await clientFromData(supabase, data, user.id);

  const { data: row, error } = await supabase
    .from("contracts")
    .insert({
      contract_number: data.contractNumber,
      client_id: clientId,
      client_name: data.clientCompany,
      status: "draft",
      total_price: sumPriceItems(data.priceItems),
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

export async function updateContract(id: string, data: ContractData) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: cur } = await supabase
    .from("contracts")
    .select("current_version")
    .eq("id", id)
    .single();
  const nextVersion = (cur?.current_version ?? 1) + 1;

  await clientFromData(supabase, data, user.id);

  const { error } = await supabase
    .from("contracts")
    .update({
      contract_number: data.contractNumber,
      client_name: data.clientCompany,
      total_price: sumPriceItems(data.priceItems),
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

export async function duplicateContract(id: string): Promise<string> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: src, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !src) throw new Error("Smlouva nenalezena");

  const data = src.data as ContractData;
  const { data: row, error: insErr } = await supabase
    .from("contracts")
    .insert({
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

  const data = ver.data as ContractData;
  const { data: cur } = await supabase
    .from("contracts")
    .select("current_version")
    .eq("id", contractId)
    .single();
  const nextVersion = (cur?.current_version ?? 1) + 1;

  await supabase
    .from("contracts")
    .update({
      contract_number: data.contractNumber,
      client_name: data.clientCompany,
      total_price: sumPriceItems(data.priceItems),
      data,
      current_version: nextVersion,
    })
    .eq("id", contractId);

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
