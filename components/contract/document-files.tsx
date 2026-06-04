"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Download,
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  recordDocumentFile,
  setDocumentFileSigned,
  deleteDocumentFile,
} from "@/lib/db/actions";
import { DOCUMENT_FILES_BUCKET, type DocumentFileRow } from "@/lib/db/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ACCEPT = ".pdf,application/pdf,image/*";

function formatSize(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitize(name: string): string {
  return name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").slice(-120);
}

export function DocumentFiles({
  contractId,
  files,
}: {
  contractId: string;
  files: DocumentFileRow[];
}) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [markSigned, setMarkSigned] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [rowBusy, setRowBusy] = React.useState<string | null>(null);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    try {
      const items = Array.from(list);
      for (let i = 0; i < items.length; i++) {
        const file = items[i];
        const path = `${contractId}/${crypto.randomUUID()}_${sanitize(file.name)}`;
        const { error } = await supabase.storage
          .from(DOCUMENT_FILES_BUCKET)
          .upload(path, file, { contentType: file.type || undefined });
        if (error) throw error;
        // If "signed original" is checked, only the first file in the batch
        // becomes the signed original; the rest are plain attachments.
        await recordDocumentFile({
          contractId,
          storagePath: path,
          fileName: file.name,
          mimeType: file.type || null,
          sizeBytes: file.size,
          isSigned: markSigned && i === 0,
        });
      }
      toast.success(
        markSigned ? "Podepsaný originál nahrán" : "Soubor(y) nahrány"
      );
      setMarkSigned(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nahrání se nezdařilo");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function download(f: DocumentFileRow) {
    setRowBusy(f.id);
    try {
      const { data, error } = await supabase.storage
        .from(DOCUMENT_FILES_BUCKET)
        .createSignedUrl(f.storage_path, 60);
      if (error || !data) throw error ?? new Error("no url");
      window.open(data.signedUrl, "_blank", "noopener");
    } catch {
      toast.error("Nepodařilo se vytvořit odkaz ke stažení");
    } finally {
      setRowBusy(null);
    }
  }

  async function markAsSigned(f: DocumentFileRow) {
    setRowBusy(f.id);
    try {
      await setDocumentFileSigned(f.id, true);
      toast.success("Označeno jako podepsaný originál — stav: Podepsáno");
      router.refresh();
    } catch {
      toast.error("Akce se nezdařila");
    } finally {
      setRowBusy(null);
    }
  }

  async function remove(f: DocumentFileRow) {
    setRowBusy(f.id);
    try {
      await deleteDocumentFile(f.id);
      toast.success("Soubor smazán");
      setConfirmId(null);
      router.refresh();
    } catch {
      toast.error("Smazání se nezdařilo");
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Paperclip className="size-4" />
        <span className="hidden sm:inline">Přílohy</span>
        {files.length > 0 && (
          <Badge variant="secondary" className="ml-1 font-normal">
            {files.length}
          </Badge>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Přílohy a podepsané dokumenty</SheetTitle>
          <SheetDescription>
            Nahrajte sken podepsané smlouvy nebo související soubory. Označený
            podepsaný originál nastaví stav dokumentu na „Podepsáno".
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-4">
          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={markSigned}
                onCheckedChange={(v) => setMarkSigned(Boolean(v))}
              />
              Nahrávám podepsaný originál
            </label>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              className="w-full"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Nahrát soubor
            </Button>
            <p className="text-xs text-muted-foreground">
              PDF nebo obrázek (JPG, PNG). Více souborů najednou.
            </p>
          </div>

          {files.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">
              Zatím žádné soubory.
            </p>
          ) : (
            <ul className="space-y-2">
              {files.map((f) => {
                const isImage = (f.mime_type ?? "").startsWith("image/");
                return (
                  <li
                    key={f.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    {isImage ? (
                      <FileImage className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {f.file_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatSize(f.size_bytes)}
                        {f.size_bytes ? " · " : ""}
                        {new Date(f.created_at).toLocaleDateString("cs-CZ")}
                      </div>
                      {f.is_signed && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-status-signed/10 px-2 py-0.5 text-xs text-status-signed-fg">
                          <BadgeCheck className="size-3.5" />
                          Podepsaný originál
                        </span>
                      )}
                      {!f.is_signed && (
                        <button
                          type="button"
                          className="mt-1 block text-xs text-muted-foreground hover:text-foreground hover:underline"
                          disabled={rowBusy === f.id}
                          onClick={() => markAsSigned(f)}
                        >
                          Označit jako podepsaný originál
                        </button>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Stáhnout"
                        disabled={rowBusy === f.id}
                        onClick={() => download(f)}
                      >
                        {rowBusy === f.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Download className="size-4" />
                        )}
                      </Button>
                      {confirmId === f.id ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={rowBusy === f.id}
                          onClick={() => remove(f)}
                        >
                          Smazat?
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Smazat"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setConfirmId(f.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
