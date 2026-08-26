import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONFIG = {
  PENDING:     { label: "Pending",     cls: "bg-amber-100 text-amber-800 border-amber-200" },
  CONFIRMED:   { label: "Confirmed",   cls: "bg-blue-100 text-blue-800 border-blue-200" },
  COMPLETED:   { label: "Completed",   cls: "bg-green-100 text-green-800 border-green-200" },
  CANCELLED:   { label: "Cancelled",   cls: "bg-red-100 text-red-800 border-red-200" },
  NO_SHOW:     { label: "No-show",     cls: "bg-muted text-muted-foreground border-border" },
  RESCHEDULED: { label: "Rescheduled", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  ACTIVE:      { label: "Active",      cls: "bg-green-100 text-green-800 border-green-200" },
  INACTIVE:    { label: "Inactive",    cls: "bg-red-100 text-red-800 border-red-200" },
};

const StatusBadge = ({ status, label: labelOverride }) => {
  const { label, cls } = CONFIG[status] ?? {
    label: status,
    cls: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", cls)}>
      {labelOverride ?? label}
    </Badge>
  );
};

export default StatusBadge;
