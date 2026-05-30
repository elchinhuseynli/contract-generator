import { Badge } from "@/components/ui/badge";
import type { ContractStatus } from "@/lib/contract/types";
import { STATUS_LABELS } from "@/lib/db/types";

const STYLES: Record<ContractStatus, string> = {
  draft: "bg-status-draft/10 text-status-draft-fg border-status-draft/25",
  sent: "bg-status-sent/10 text-status-sent-fg border-status-sent/25",
  signed: "bg-status-signed/10 text-status-signed-fg border-status-signed/25",
  archived:
    "bg-status-archived/10 text-status-archived-fg border-status-archived/25",
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Badge variant="outline" className={STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
