import { listContracts } from "@/lib/db/queries";
import { PageHeader } from "@/components/page-header";
import { ContractsTable } from "@/components/contract/contracts-table";
import { NewDocumentMenu } from "@/components/contract/new-document-menu";

export default async function DashboardPage() {
  const contracts = await listContracts();

  return (
    <>
      <PageHeader
        title="Přehled dokumentů"
        description={`${contracts.length} ${
          contracts.length === 1 ? "dokument" : "dokumentů"
        }`}
      >
        <NewDocumentMenu />
      </PageHeader>
      <div className="p-4">
        <ContractsTable contracts={contracts} />
      </div>
    </>
  );
}
