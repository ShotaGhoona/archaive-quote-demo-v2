import { useEffect, useState } from "react";
import { useNodeMasters } from "@/hooks/useNodeMasters";
import type { NodeMasterValue } from "@/hooks/useNodeMasterValues";
import { NodeMasterList } from "./node-master/NodeMasterList";
import { NodeMasterValueTable } from "./node-master/NodeMasterValueTable";
import { NodeMasterValueDialog } from "./node-master/NodeMasterValueDialog";
import { NodeMasterCreateDialog } from "./node-master/NodeMasterCreateDialog";
import { NodeMasterSettingsDialog } from "./node-master/NodeMasterSettingsDialog";

export function NodeMastersSection() {
  const { data: nodeMasters, isLoading } = useNodeMasters();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NodeMasterValue | null>(null);

  useEffect(() => {
    if (!selectedId && nodeMasters?.length) {
      setSelectedId(nodeMasters[0].id);
    }
  }, [nodeMasters, selectedId]);

  const selected = nodeMasters?.find((nm) => nm.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      <NodeMasterList
        nodeMasters={nodeMasters}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreateClick={() => setCreateOpen(true)}
      />

      <div className="flex-1 overflow-hidden">
        {selected ? (
          <NodeMasterValueTable
            nodeMaster={selected}
            onAddClick={() => {
              setEditTarget(null);
              setValueDialogOpen(true);
            }}
            onEditClick={(value) => {
              setEditTarget(value);
              setValueDialogOpen(true);
            }}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            左から種類を選択してください
          </div>
        )}
      </div>

      {selected && (
        <>
          <NodeMasterValueDialog
            open={valueDialogOpen}
            onOpenChange={setValueDialogOpen}
            nodeMaster={selected}
            target={editTarget}
          />
          <NodeMasterSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            nodeMaster={selected}
            onDeleted={() => setSelectedId(null)}
          />
        </>
      )}

      <NodeMasterCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => setSelectedId(id)}
      />
    </div>
  );
}
