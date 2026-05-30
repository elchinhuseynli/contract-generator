import Link from "next/link";
import { FilePlus } from "lucide-react";

import { listContracts } from "@/lib/db/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ContractsTable } from "@/components/contract/contracts-table";

export default async function DashboardPage() {
  const contracts = await listContracts();

  return (
    <>
      <PageHeader
        title="Přehled smluv"
        description={`${contracts.length} ${
          contracts.length === 1 ? "smlouva" : "smluv"
        }`}
      >
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/contracts/new" />}
        >
          <FilePlus className="size-4" />
          Nová smlouva
        </Button>
      </PageHeader>
      <div className="p-4">
        <ContractsTable contracts={contracts} />
      </div>
    </>
  );
}
