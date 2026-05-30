"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { updateOrgSettings, type OrgSettingsInput } from "@/lib/db/actions";
import type { OrgSettingsRow } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS: { key: keyof OrgSettingsInput; label: string }[] = [
  { key: "company_name", label: "Název společnosti" },
  { key: "ico", label: "IČO" },
  { key: "representative", label: "Jednatel" },
  { key: "address", label: "Sídlo" },
  { key: "bank_name", label: "Banka" },
  { key: "account_number", label: "Číslo účtu" },
];

export function OrgSettingsForm({ org }: { org: OrgSettingsRow }) {
  const router = useRouter();
  const [values, setValues] = React.useState<OrgSettingsInput>({
    company_name: org.company_name,
    address: org.address,
    ico: org.ico,
    representative: org.representative,
    bank_name: org.bank_name,
    account_number: org.account_number,
  });
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateOrgSettings(values);
      toast.success("Nastavení uloženo");
      router.refresh();
    } catch {
      toast.error("Uložení se nezdařilo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zhotovitel</CardTitle>
        <CardDescription>
          Tyto údaje se automaticky doplní do každé smlouvy (strana zhotovitele).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  value={values[f.key]}
                  onChange={(e) =>
                    setValues((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Uložit nastavení
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
