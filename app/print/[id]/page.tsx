import { notFound } from "next/navigation";
import { getContract, getOrgSettings } from "@/lib/db/queries";
import { orgToContractor } from "@/lib/db/types";
import { generateContractMarkdown } from "@/lib/contract/template";
import { PrintDocument } from "@/components/contract/print-document";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contract, org] = await Promise.all([
    getContract(id),
    getOrgSettings(),
  ]);
  if (!contract) notFound();

  const markdown = generateContractMarkdown(
    contract.data,
    orgToContractor(org)
  );
  return <PrintDocument markdown={markdown} />;
}
