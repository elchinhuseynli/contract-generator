"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Copy,
  Download,
  FileCode,
  FileText,
  Loader2,
  Printer,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import {
  contractSchema,
  makeDefaultValues,
  type ContractFormValues,
} from "@/lib/contract/schema";
import { generateContractMarkdown } from "@/lib/contract/template";
import type { ContractData, ContractorInfo } from "@/lib/contract/types";
import {
  buildStandaloneHtml,
  contractFileBase,
  copyText,
  downloadTextFile,
} from "@/lib/contract/export";
import { saveContract, updateContract } from "@/lib/db/actions";
import { Button } from "@/components/ui/button";
import { ContractForm } from "@/components/contract/contract-form";
import { ContractPreview } from "@/components/contract/contract-preview";

function toContractData(values: ContractFormValues): ContractData {
  return {
    ...values,
    additionalProvisions: values.additionalProvisions ?? "",
    priceItems: values.priceItems.map((i) => ({
      name: i.name,
      price: Number(i.price) || 0,
    })),
    advancePercent: Number(values.advancePercent) || 0,
    warrantyMonths: Number(values.warrantyMonths) || 0,
  };
}

export function ContractEditor({
  contractor,
  initialValues,
  contractId,
}: {
  contractor: ContractorInfo;
  initialValues?: ContractFormValues;
  contractId?: string;
}) {
  const router = useRouter();
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: initialValues ?? makeDefaultValues(),
    mode: "onBlur",
  });
  const [saving, setSaving] = React.useState(false);

  const values = form.watch();
  const data = toContractData(values);
  const markdown = generateContractMarkdown(data, contractor);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const fileBase = contractFileBase(data);

  async function handleSave() {
    const ok = await form.trigger();
    if (!ok) {
      toast.error("Zkontrolujte vyplnění formuláře");
      return;
    }
    setSaving(true);
    try {
      const current = toContractData(form.getValues());
      if (contractId) {
        await updateContract(contractId, current);
        toast.success("Změny uloženy");
        router.refresh();
      } else {
        const id = await saveContract(current);
        toast.success("Smlouva uložena");
        router.push(`/contracts/${id}/edit`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Uložení se nezdařilo");
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadMarkdown() {
    downloadTextFile(`${fileBase}.md`, markdown, "text/markdown");
    toast.success("Markdown stažen");
  }
  async function handleCopyMarkdown() {
    try {
      await copyText(markdown);
      toast.success("Markdown zkopírován");
    } catch {
      toast.error("Kopírování se nezdařilo");
    }
  }
  function handleDownloadHtml() {
    const body = previewRef.current?.innerHTML ?? "";
    const html = buildStandaloneHtml(
      body,
      `Smlouva o dílo č. ${data.contractNumber}`
    );
    downloadTextFile(`${fileBase}.html`, html, "text/html");
    toast.success("HTML staženo");
  }
  async function handleCopyText() {
    try {
      await copyText(previewRef.current?.innerText ?? "");
      toast.success("Text zkopírován");
    } catch {
      toast.error("Kopírování se nezdařilo");
    }
  }

  function handlePdf() {
    if (!contractId) {
      toast.error("Nejprve uložte smlouvu");
      return;
    }
    window.open(`/print/${contractId}`, "_blank");
  }

  return (
    <div className="grid gap-6 p-4 lg:grid-cols-2">
      <form onSubmit={(e) => e.preventDefault()}>
        <ContractForm form={form} />
      </form>

      <div className="lg:sticky lg:top-[4.75rem] lg:h-[calc(100vh-6rem)]">
        <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <Button onClick={handleSave} disabled={saving} className="mr-auto">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {contractId ? "Uložit změny" : "Uložit smlouvu"}
            </Button>
            <Button size="sm" variant="outline" onClick={handlePdf}>
              <Printer className="size-4" />
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadMarkdown}>
              <Download className="size-4" />
              MD
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyMarkdown}>
              <Copy className="size-4" />
              Kopírovat
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadHtml}>
              <FileCode className="size-4" />
              HTML
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyText}>
              <FileText className="size-4" />
              Text
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-background p-6">
            <ContractPreview ref={previewRef} markdown={markdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
