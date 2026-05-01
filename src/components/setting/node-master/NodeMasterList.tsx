import { Plus, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { NodeMaster } from "@/hooks/useNodeMasters";

interface Props {
  nodeMasters: NodeMaster[] | undefined;
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
}

export function NodeMasterList({
  nodeMasters,
  isLoading,
  selectedId,
  onSelect,
  onCreateClick,
}: Props) {
  return (
    <div className="w-56 shrink-0 border rounded-md p-2 space-y-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-sm font-medium">ノード一覧</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCreateClick}
          aria-label="新規ノードマスタ"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2 px-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : !nodeMasters?.length ? (
        <p className="px-2 py-4 text-xs text-muted-foreground text-center">
          ノードマスタがありません
        </p>
      ) : (
        nodeMasters.map((nm) => (
          <button
            key={nm.id}
            onClick={() => onSelect(nm.id)}
            className={cn(
              "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-left",
              selectedId === nm.id
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Folder className="h-4 w-4 shrink-0" />
            <span className="truncate">{nm.name}</span>
          </button>
        ))
      )}
    </div>
  );
}
