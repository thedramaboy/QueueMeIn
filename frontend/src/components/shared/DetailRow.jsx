import { cn } from "@/lib/utils";

const DetailRow = ({ label, value, valueClassName }) => (
  <div className="flex items-center justify-between py-2.5 gap-4">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <span className={cn("text-sm font-medium text-right", valueClassName)}>
      {value}
    </span>
  </div>
);

export default DetailRow;
