import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  rows?: number;
}

export function LoadingState({ className, rows = 3 }: Props) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
