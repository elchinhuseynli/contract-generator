import { notFound } from "next/navigation";
import { getContract, getOrgSettings, listVersions } from "@/lib/db/queries";
import { orgToContractor } from "@/lib/db/types";
import { PageHeader } from "@/components/page-header";
import { ContractEditor } from "@/components/contract/contract-editor";
import { ContractManageMenu } from "@/components/contract/contract-manage-menu";
import { VersionHistory } from "@/components/contract/version-history";
import type { ContractFormValues } from "@/lib/contract/schema";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contract, org, versions] = await Promise.all([
    getContract(id),
    getOrgSettings(),
    listVersions(id),
  ]);
  if (!contract) notFound();

  return (
    <>
      <PageHeader
        title={`Smlouva ${contract.contract_number}`}
        description={contract.client_name ?? "Smlouva o dílo"}
      >
        <VersionHistory contractId={id} versions={versions} />
        <ContractManageMenu contractId={id} status={contract.status} />
      </PageHeader>
      <ContractEditor
        key={contract.current_version}
        contractId={id}
        contractor={orgToContractor(org)}
        initialValues={contract.data as unknown as ContractFormValues}
      />
    </>
  );
}
