import { getNextDocumentNumber, getOrgSettings } from "@/lib/db/queries";
import { orgToContractor } from "@/lib/db/types";
import { getBuilder, isDocType } from "@/lib/contract/builders";
import type { DocType } from "@/lib/contract/types";
import { PageHeader } from "@/components/page-header";
import { DocumentEditor } from "@/components/contract/contract-editor";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const docType: DocType = isDocType(type) ? type : "smlouva";
  const cfg = getBuilder(docType);

  const [org, suggestedNumber] = await Promise.all([
    getOrgSettings(),
    getNextDocumentNumber(docType),
  ]);

  return (
    <>
      <PageHeader title={`Nový dokument — ${cfg.label}`} description={cfg.description} />
      <DocumentEditor
        docType={docType}
        contractor={orgToContractor(org)}
        suggestedNumber={suggestedNumber}
      />
    </>
  );
}
