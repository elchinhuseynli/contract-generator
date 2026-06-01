import { requireUser } from "@/lib/supabase/auth";
import { getContract, getOrgSettings } from "@/lib/db/queries";
import { orgToContractor } from "@/lib/db/types";
import {
  contractFooterHtml,
  renderContractHtmlDocument,
} from "@/lib/contract/render-pdf";
import { contractFileBase } from "@/lib/contract/export";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();
  const { id } = await params;

  const gotenberg = process.env.GOTENBERG_URL;
  if (!gotenberg) {
    return new Response("PDF služba není nakonfigurována", { status: 500 });
  }

  const [contract, org] = await Promise.all([
    getContract(id),
    getOrgSettings(),
  ]);
  if (!contract) return new Response("Smlouva nenalezena", { status: 404 });

  const html = renderContractHtmlDocument(
    contract.data,
    orgToContractor(org)
  );
  const footer = contractFooterHtml(contract.contract_number);

  const form = new FormData();
  form.append("files", new Blob([html], { type: "text/html" }), "index.html");
  form.append("files", new Blob([footer], { type: "text/html" }), "footer.html");
  // A4 with the same margins as the document; footer fits in the bottom margin.
  form.append("paperWidth", "8.27");
  form.append("paperHeight", "11.69");
  form.append("marginTop", "0.7");
  form.append("marginBottom", "0.7");
  form.append("marginLeft", "0.63");
  form.append("marginRight", "0.63");
  form.append("printBackground", "true");

  // Basic auth for the locked-down Gotenberg endpoint (sent only when both
  // credentials are configured; harmless if the server doesn't require them).
  const headers: Record<string, string> = {};
  const gUser = process.env.GOTENBERG_BASIC_AUTH_USER;
  const gPass = process.env.GOTENBERG_BASIC_AUTH_PASS;
  if (gUser && gPass) {
    headers.Authorization =
      "Basic " + Buffer.from(`${gUser}:${gPass}`).toString("base64");
  }

  let res: Response;
  try {
    res = await fetch(`${gotenberg}/forms/chromium/convert/html`, {
      method: "POST",
      body: form,
      headers,
    });
  } catch {
    return new Response("PDF služba je nedostupná", { status: 502 });
  }
  if (!res.ok) {
    return new Response("Generování PDF se nezdařilo", { status: 502 });
  }

  const pdf = await res.arrayBuffer();
  const filename = `${contractFileBase(contract.data)}.pdf`;
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
