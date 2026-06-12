import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONFIG = {
  PENDING:     { label: "รอยืนยัน",   cls: "bg-amber-100 text-amber-800 border-amber-200" },
  CONFIRMED:   { label: "ยืนยันแล้ว", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  COMPLETED:   { label: "เสร็จแล้ว",  cls: "bg-green-100 text-green-800 border-green-200" },
  CANCELLED:   { label: "ยกเลิก",     cls: "bg-red-100 text-red-800 border-red-200" },
  NO_SHOW:     { label: "ไม่มา",      cls: "bg-muted text-muted-foreground border-border" },
  RESCHEDULED: { label: "เลื่อนนัด", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  ACTIVE:      { label: "ใช้งาน",    cls: "bg-green-100 text-green-800 border-green-200" },
  INACTIVE:    { label: "ปิดใช้งาน", cls: "bg-red-100 text-red-800 border-red-200" },
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
