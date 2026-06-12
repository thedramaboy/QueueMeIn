const EmptyState = ({ message, isLoading }) => (
  <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
    {isLoading ? "กำลังโหลด..." : message}
  </div>
);

export default EmptyState;
