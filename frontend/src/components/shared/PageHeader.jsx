import { cn } from "@/lib/utils";

const PageHeader = ({ title, subtitle, action, className }) => (
  <div className={cn("flex items-start justify-between gap-4", className)}>
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
