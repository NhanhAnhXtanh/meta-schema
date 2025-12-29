import { useState, useMemo } from 'react';
import { Node } from '@xyflow/react';
import { TableNodeData } from './TableNode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LinkFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceNode: Node<TableNodeData> | undefined;
  allNodes: Node<TableNodeData>[];
  visibleNodeIds: Set<string>;
  onConfirm: (
    targetNodeId: string,
    sourcePK: string,
    targetFK: string,
    newFieldName: string
  ) => void;
}

export function LinkFieldDialog({
  open,
  onOpenChange,
  sourceNode,
  allNodes,
  visibleNodeIds,
  onConfirm,
}: LinkFieldDialogProps) {
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState<string>('');
  const [selectedSourcePK, setSelectedSourcePK] = useState<string>('');
  const [selectedTargetFK, setSelectedTargetFK] = useState<string>('');
  const [newFieldName, setNewFieldName] = useState<string>('');

  // Các bảng có thể link (không bao gồm bảng hiện tại và đã được hiển thị)
  const availableTargetNodes = useMemo(() => {
    if (!sourceNode) return [];
    return allNodes.filter(
      (node) => node.id !== sourceNode.id && !visibleNodeIds.has(node.id)
    );
  }, [allNodes, sourceNode, visibleNodeIds]);

  // Các field PK từ bảng nguồn
  const sourcePKFields = useMemo(() => {
    if (!sourceNode) return [];
    return sourceNode.data.columns.filter((col) => col.visible !== false);
  }, [sourceNode]);

  // Các field FK từ bảng được chọn
  const targetFKFields = useMemo(() => {
    if (!selectedTargetNodeId) return [];
    const targetNode = allNodes.find((n) => n.id === selectedTargetNodeId);
    if (!targetNode) return [];
    return targetNode.data.columns.filter((col) => col.visible !== false);
  }, [selectedTargetNodeId, allNodes]);

  const handleConfirm = () => {
    if (
      selectedTargetNodeId &&
      selectedSourcePK &&
      selectedTargetFK &&
      newFieldName.trim()
    ) {
      onConfirm(
        selectedTargetNodeId,
        selectedSourcePK,
        selectedTargetFK,
        newFieldName.trim()
      );
      // Reset form
      setSelectedTargetNodeId('');
      setSelectedSourcePK('');
      setSelectedTargetFK('');
      setNewFieldName('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedTargetNodeId('');
    setSelectedSourcePK('');
    setSelectedTargetFK('');
    setNewFieldName('');
    onOpenChange(false);
  };

  const isFormValid =
    selectedTargetNodeId &&
    selectedSourcePK &&
    selectedTargetFK &&
    newFieldName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Field với Bảng Khác</DialogTitle>
          <DialogDescription>
            Tạo relationship giữa bảng <strong>{sourceNode?.data.label}</strong>{' '}
            với bảng khác
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Chọn bảng đích */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Chọn bảng để link</label>
            <select
              value={selectedTargetNodeId}
              onChange={(e) => setSelectedTargetNodeId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Chọn bảng...</option>
              {availableTargetNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data.label}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn khóa chính từ bảng nguồn */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Khóa chính từ bảng {sourceNode?.data.label || 'nguồn'}
            </label>
            <select
              value={selectedSourcePK}
              onChange={(e) => setSelectedSourcePK(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Chọn khóa chính...</option>
              {sourcePKFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name} ({field.type})
                </option>
              ))}
            </select>
          </div>

          {/* Chọn khóa phụ từ bảng đích */}
          {selectedTargetNodeId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Khóa phụ (FK) từ bảng{' '}
                {
                  allNodes.find((n) => n.id === selectedTargetNodeId)?.data
                    .label
                }
              </label>
              <select
                value={selectedTargetFK}
                onChange={(e) => setSelectedTargetFK(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Chọn khóa phụ...</option>
                {targetFKFields.map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name} ({field.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tên field mới */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên field mới (chứa link)</label>
            <Input
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="Ví dụ: warehouse_link"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Hủy
            </Button>
            <Button onClick={handleConfirm} disabled={!isFormValid}>
              Tạo Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

