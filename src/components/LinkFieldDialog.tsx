import { useState, useMemo, useEffect } from 'react';
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
    sourceKey: string,
    targetKey: string,
    newFieldName: string,
    type: '1-n' | 'n-1'
  ) => void;
  initialValues?: {
    targetNodeId: string;
    sourceKey: string;
    targetKey: string;
    fieldName: string;
    linkType: '1-n' | 'n-1';
  };
  isEditMode?: boolean;
}

export function LinkFieldDialog({
  open,
  onOpenChange,
  sourceNode,
  allNodes,
  visibleNodeIds,
  onConfirm,
  initialValues,
  isEditMode = false
}: LinkFieldDialogProps) {
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState<string>('');
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('');
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>('');
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [linkType, setLinkType] = useState<'1-n' | 'n-1'>('1-n');

  // Populate form when editing
  useEffect(() => {
    if (open && initialValues) {
      setSelectedTargetNodeId(initialValues.targetNodeId);
      setSelectedSourceKey(initialValues.sourceKey);
      setSelectedTargetKey(initialValues.targetKey);
      setNewFieldName(initialValues.fieldName);
      setLinkType(initialValues.linkType);
    } else if (open && !initialValues) {
      // Reset if opening in create mode
      setSelectedTargetNodeId('');
      setSelectedSourceKey('');
      setSelectedTargetKey('');
      setNewFieldName('');
      setLinkType('1-n');
    }
  }, [open, initialValues]);

  // Các bảng có thể link (không bao gồm bảng hiện tại và đã được hiển thị)
  const availableTargetNodes = useMemo(() => {
    if (!sourceNode) return [];
    if (isEditMode && selectedTargetNodeId) {
      // In edit mode, we might want to allow keeping the current target even if it's visible?
      // For now, keep logic simple. If editing, finding the table by ID is enough.
      // Actually, if filtering removes the current target, select dropdown might break.
      // Let's ensure selectedTargetNodeId is included if it exists in allNodes.
      return allNodes.filter(n => n.id !== sourceNode.id);
    }
    return allNodes.filter(
      (node) => node.id !== sourceNode.id && !visibleNodeIds.has(node.id)
    );
  }, [allNodes, sourceNode, visibleNodeIds, isEditMode, selectedTargetNodeId]);

  // Source Fields
  const sourceFields = useMemo(() => {
    if (!sourceNode) return [];
    return sourceNode.data.columns.filter((col) => col.visible !== false);
  }, [sourceNode]);

  // Target Fields
  const targetFields = useMemo(() => {
    if (!selectedTargetNodeId) return [];
    const targetNode = allNodes.find((n) => n.id === selectedTargetNodeId);
    if (!targetNode) return [];
    return targetNode.data.columns.filter((col) => col.visible !== false);
  }, [selectedTargetNodeId, allNodes]);

  const handleConfirm = () => {
    if (
      selectedTargetNodeId &&
      selectedSourceKey &&
      selectedTargetKey &&
      newFieldName.trim()
    ) {
      onConfirm(
        selectedTargetNodeId,
        selectedSourceKey,
        selectedTargetKey,
        newFieldName.trim(),
        linkType
      );
      // Reset handled by parent or useEffect
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isFormValid =
    selectedTargetNodeId &&
    selectedSourceKey &&
    selectedTargetKey &&
    newFieldName.trim();

  const isArray = linkType === '1-n';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white text-gray-900 border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Chỉnh Sửa Trường Link' : 'Thêm Trường Link Mới'}</DialogTitle>
          <DialogDescription className="text-gray-500">
            {isEditMode ? 'Cập nhật' : 'Tạo'} liên kết giữa bảng <strong>{sourceNode?.data.label}</strong> và bảng khác.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Loại Link & Data Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Loại Liên Kết</label>
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as '1-n' | 'n-1')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="1-n">1 - Nhiều (One to Many)</option>
                <option value="n-1">Nhiều - 1 (Many to One)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Kiểu Dữ Liệu</label>
              <Input
                disabled
                value={linkType === '1-n' ? 'array' : 'object'}
                className="bg-gray-100 text-gray-600 font-mono"
              />
            </div>
          </div>

          {/* Chọn bảng đích */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Link tới Bảng</label>
            <select
              value={selectedTargetNodeId}
              onChange={(e) => setSelectedTargetNodeId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="">Chọn bảng...</option>
              {availableTargetNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.data.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Source Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {isArray ? `Key Bảng Nguồn` : `Key Bảng Nguồn`}
                <span className="text-xs text-gray-500 ml-1 font-normal">
                  ({isArray ? 'Thường là PK' : 'Thường là FK'})
                </span>
              </label>
              <select
                value={selectedSourceKey}
                onChange={(e) => setSelectedSourceKey(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">Chọn khóa...</option>
                {sourceFields.map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name} {field.isPrimaryKey ? '(PK)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Key */}
            {selectedTargetNodeId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {isArray ? `Key Bảng Đich` : `Key Bảng Đích`}
                  <span className="text-xs text-gray-500 ml-1 font-normal">
                    ({isArray ? 'Thường là FK' : 'Thường là PK'})
                  </span>
                </label>
                <select
                  value={selectedTargetKey}
                  onChange={(e) => setSelectedTargetKey(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <option value="">Chọn khóa...</option>
                  {targetFields.map((field) => (
                    <option key={field.name} value={field.name}>
                      {field.name} {field.isPrimaryKey ? '(PK)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tên field mới */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tên Field Mới</label>
            <Input
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder={isArray ? "Ví dụ: orders" : "Ví dụ: category"}
              className="bg-white border-gray-300 text-gray-900"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={handleCancel} className="text-gray-500 hover:text-gray-900">
              Hủy
            </Button>
            <Button onClick={handleConfirm} disabled={!isFormValid} className="bg-blue-600 hover:bg-blue-700 text-white">
              Tạo Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

