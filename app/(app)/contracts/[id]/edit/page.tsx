import { notFound } from "next/navigation";
import {
  getContract,
  getOrgSettings,
  listDocumentFiles,
  listVersions,
} from "@/lib/db/queries";
import { orgToContractor } from "@/lib/db/types";
import { getBuilder } from "@/lib/contract/builders";
import { PageHeader } from "@/components/page-header";
import { DocumentEditor } from "@/components/contract/contract-editor";
import { ContractManageMenu } from "@/components/contract/contract-manage-menu";
import { VersionHistory } from "@/components/contract/version-history";
import { DocumentFiles } from "@/components/contract/document-files";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contract, org, versions, files] = await Promise.all([
    getContract(id),
    getOrgSettings(),
    listVersions(id),
    listDocumentFiles(id),
  ]);
  if (!contract) notFound();

  const docType = contract.doc_type ?? "smlouva";
  const cfg = getBuilder(docType);

  return (
    <>
      <PageHeader
        title={`${cfg.shortLabel} ${contract.contract_number}`}
        description={contract.client_name ?? cfg.label}
      >
        <DocumentFiles contractId={id} files={files} />
        <VersionHistory contractId={id} versions={versions} />
        <ContractManageMenu contractId={id} status={contract.status} />
      </PageHeader>
      <DocumentEditor
        key={contract.current_version}
        docType={docType}
        contractId={id}
        contractor={orgToContractor(org)}
        initialValues={contract.data}
      />
    </>
  );
}
