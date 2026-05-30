import { getOrgSettings } from "@/lib/db/queries";
import { PageHeader } from "@/components/page-header";
import { OrgSettingsForm } from "@/components/settings/org-settings-form";

export default async function SettingsPage() {
  const org = await getOrgSettings();

  return (
    <>
      <PageHeader
        title="Nastavení"
        description="Údaje zhotovitele použité ve smlouvách"
      />
      <div className="max-w-2xl p-4">
        <OrgSettingsForm org={org} />
      </div>
    </>
  );
}
