import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listClients } from "@/lib/db/queries";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <>
      <PageHeader
        title="Klienti"
        description={`${clients.length} ${
          clients.length === 1 ? "klient" : "klientů"
        } · automaticky uloženo ze smluv`}
      />
      <div className="p-4">
        {clients.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Zatím žádní klienti. Uloží se automaticky při vytvoření smlouvy.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>IČO</TableHead>
                  <TableHead>Jednatel</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/clients/${c.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {c.company}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {c.ico}
                    </TableCell>
                    <TableCell>{c.representative}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.email}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/clients/${c.id}`}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Otevřít klienta"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
