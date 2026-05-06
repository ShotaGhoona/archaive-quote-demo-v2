import { Plus, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <div className="w-64 border-r border-border flex flex-col shrink-0 bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">ノード一覧</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onCreateClick}
          aria-label="新規ノードマスタ"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {isLoading ? (
            <div className="space-y-2 px-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : !nodeMasters?.length ? (
            <p className="text-xs text-muted-foreground px-3 py-8 text-center">
              ノードマスタがありません
            </p>
          ) : (
            nodeMasters.map((nm) => (
              <button
                key={nm.id}
                onClick={() => onSelect(nm.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
                  "hover:bg-muted/50",
                  selectedId === nm.id ? "bg-muted font-medium" : "text-foreground"
                )}
              >
                <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{nm.name}</span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
