"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

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

import { getDocConfig } from "@/lib/contract/doc-types";
import { renderDocToMarkdown } from "@/lib/contract/document";
import type { ContractorInfo, DocType } from "@/lib/contract/types";
import {
  buildStandaloneHtml,
  copyText,
  downloadTextFile,
} from "@/lib/contract/export";
import { saveDocument, updateDocument } from "@/lib/db/actions";
import { Button } from "@/components/ui/button";
import { ContractPreview } from "@/components/contract/contract-preview";

export function DocumentEditor({
  docType,
  contractor,
  initialValues,
  contractId,
  suggestedNumber,
}: {
  docType: DocType;
  contractor: ContractorInfo;
  initialValues?: any;
  contractId?: string;
  suggestedNumber?: string;
}) {
  const router = useRouter();
  const cfg = getDocConfig(docType);

  const form = useForm<any>({
    resolver: zodResolver(cfg.schema as any),
    defaultValues: initialValues ?? cfg.makeDefaults(suggestedNumber),
    mode: "onBlur",
  });
  const [saving, setSaving] = React.useState(false);

  const values = form.watch();
  const data = cfg.toData(values);
  const doc = cfg.buildDoc(data, contractor);
  const markdown = renderDocToMarkdown(doc);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const fileBase = cfg.fileBase(data);

  async function handleSave() {
    const ok = await form.trigger();
    if (!ok) {
      toast.error("Zkontrolujte vyplnění formuláře");
      return;
    }
    setSaving(true);
    try {
      const current = cfg.toData(form.getValues());
      const meta = cfg.toSaveMeta(current);
      if (contractId) {
        await updateDocument(contractId, current, meta);
        toast.success("Změny uloženy");
        router.refresh();
      } else {
        const id = await saveDocument(docType, current, meta);
        toast.success(`${cfg.label} uložena`);
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
    const html = buildStandaloneHtml(body, cfg.htmlTitle(data));
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
      toast.error("Nejprve uložte dokument");
      return;
    }
    window.open(`/api/contracts/${contractId}/pdf`, "_blank");
  }

  return (
    <div className="grid gap-6 p-4 lg:grid-cols-2">
      <form onSubmit={(e) => e.preventDefault()}>
        <cfg.Form form={form} />
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
              {contractId ? "Uložit změny" : "Uložit dokument"}
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
          <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
            <ContractPreview ref={previewRef} doc={doc} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Back-compat alias for the smlouva editor. */
export function ContractEditor(props: {
  contractor: ContractorInfo;
  initialValues?: any;
  contractId?: string;
  suggestedNumber?: string;
}) {
  return <DocumentEditor docType="smlouva" {...props} />;
}
