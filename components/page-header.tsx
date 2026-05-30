import { SidebarTrigger } from "@/components/ui/sidebar";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <div className="mr-auto min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </header>
  );
}
