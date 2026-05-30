import { getNextContractNumber, getOrgSettings } from "@/lib/db/queries";
import { orgToContractor } from "@/lib/db/types";
import { PageHeader } from "@/components/page-header";
import { ContractEditor } from "@/components/contract/contract-editor";

export default async function NewContractPage() {
  const [org, suggestedNumber] = await Promise.all([
    getOrgSettings(),
    getNextContractNumber(),
  ]);

  return (
    <>
      <PageHeader
        title="Nová smlouva"
        description="Smlouva o dílo · živý náhled vpravo"
      />
      <ContractEditor
        contractor={orgToContractor(org)}
        suggestedNumber={suggestedNumber}
      />
    </>
  );
}
