import { notFound } from "next/navigation";
import { getClient, listContractsForClient } from "@/lib/db/queries";
import { PageHeader } from "@/components/page-header";
import { ClientDetail } from "@/components/client/client-detail";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, contracts] = await Promise.all([
    getClient(id),
    listContractsForClient(id),
  ]);
  if (!client) notFound();

  return (
    <>
      <PageHeader title={client.company} description="Klient" />
      <div className="max-w-3xl p-4">
        <ClientDetail client={client} contracts={contracts} />
      </div>
    </>
  );
}
