import { useState, useMemo, useEffect } from 'react';
import { Node } from '@xyflow/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ValidationUtils } from '@/utils/validation';
import { RELATIONSHIP_TYPES } from '@/constants';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { initialNodes } from '@/data/initialSchema';
import { ScrollArea } from './ui/scroll-area';
import { Database, Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableNodeData } from '@/types/schema';

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
    type: '1-n' | 'n-1' | '1-1',
    isNewInstance?: boolean,
    templateId?: string
  ) => void;
  initialValues?: {
    targetNodeId: string;
    sourceKey: string;
    targetKey: string;
    fieldName: string;
    linkType: '1-n' | 'n-1' | '1-1';
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
  const [targetType, setTargetType] = useState<'existing' | 'template'>('existing');
  const [selectedTargetNodeId, setSelectedTargetNodeId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('');
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>('');
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [linkType, setLinkType] = useState<'1-n' | 'n-1' | '1-1'>('1-n');
  const [searchQuery, setSearchQuery] = useState('');

  // Templates from data
  const templates = useMemo(() => {
    return initialNodes.map(node => ({
      id: node.id,
      name: node.data.label,
      tableName: node.data.tableName,
      columns: node.data.columns
    }));
  }, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tableName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  // Populate form when editing
  useEffect(() => {
    if (open && initialValues) {
      setSelectedTargetNodeId(initialValues.targetNodeId);
      setSelectedSourceKey(initialValues.sourceKey);
      setSelectedTargetKey(initialValues.targetKey);
      setNewFieldName(initialValues.fieldName);
      setLinkType(initialValues.linkType);
      setTargetType('existing');
    } else if (open && !initialValues) {
      // Reset if opening in create mode
      setSelectedTargetNodeId('');
      setSelectedTemplateId('');
      setSelectedSourceKey('');
      setSelectedTargetKey('');
      setNewFieldName('');
      setLinkType('1-n');
    }
  }, [open, initialValues]);

  // Target Node List - Only existing instances on board
  const availableTargetNodes = useMemo(() => {
    if (!sourceNode) return [];
    return allNodes.filter(n => n.id !== sourceNode.id);
  }, [allNodes, sourceNode]);

  // Source Fields
  const sourceFields = useMemo(() => {
    if (!sourceNode) return [];
    return sourceNode.data.columns.filter((col) => col.visible !== false);
  }, [sourceNode]);

  // Target Fields
  const targetFields = useMemo(() => {
    if (targetType === 'existing') {
      if (!selectedTargetNodeId) return [];
      const targetNode = availableTargetNodes.find((n) => n.id === selectedTargetNodeId);
      if (!targetNode) return [];
      return targetNode.data.columns.filter((col) => col.visible !== false);
    } else {
      if (!selectedTemplateId) return [];
      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) return [];
      return template.columns;
    }
  }, [selectedTargetNodeId, selectedTemplateId, availableTargetNodes, templates, targetType]);

  const handleConfirm = () => {
    const finalTargetId = targetType === 'existing' ? selectedTargetNodeId : selectedTemplateId;

    if (
      finalTargetId &&
      selectedSourceKey &&
      selectedTargetKey &&
      newFieldName.trim()
    ) {
      onConfirm(
        finalTargetId,
        selectedSourceKey,
        selectedTargetKey,
        newFieldName.trim(),
        linkType,
        targetType === 'template',
        selectedTemplateId
      );
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const validationError = useMemo(() => {
    if (!selectedSourceKey || !selectedTargetKey) return null;
    const finalTargetId = targetType === 'existing' ? selectedTargetNodeId : selectedTemplateId;
    if (!finalTargetId) return null;

    const sourceCol = sourceNode?.data.columns.find(c => c.name === selectedSourceKey);
    const targetCol = targetFields.find(c => c.name === selectedTargetKey);

    if (sourceCol && targetCol) {
      const validation = ValidationUtils.validateRelationshipTypes(
        sourceCol.type,
        targetCol.type,
        sourceCol.name,
        targetCol.name
      );
      if (!validation.valid) return validation.error;
    }
    return null;
  }, [selectedSourceKey, selectedTargetKey, selectedTargetNodeId, selectedTemplateId, sourceNode, targetFields, targetType]);

  const isFormValid =
    (targetType === 'existing' ? selectedTargetNodeId : selectedTemplateId) &&
    selectedSourceKey &&
    selectedTargetKey &&
    newFieldName.trim() &&
    !validationError;

  const isArray = linkType === RELATIONSHIP_TYPES.ONE_TO_MANY;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white text-gray-900 border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Chỉnh Sửa Trường Link' : 'Thêm Trường Link Mới'}</DialogTitle>
          <DialogDescription className="text-gray-500">
            {isEditMode ? 'Cập nhật' : 'Tạo'} liên kết giữa <strong>{sourceNode?.data.label}</strong> và bảng khác.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-6">
          {/* Target Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loại Bảng Đích</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setTargetType('existing')}
                className={cn(
                  "py-2 text-sm font-medium rounded-md transition-all",
                  targetType === 'existing' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Dùng bảng hiện có
              </button>
              <button
                onClick={() => setTargetType('template')}
                className={cn(
                  "py-2 text-sm font-medium rounded-md transition-all",
                  targetType === 'template' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Tạo bản sao từ Data
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Target Selection */}
              {targetType === 'existing' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Chọn Bảng Trên Canvas</label>
                  <select
                    value={selectedTargetNodeId}
                    onChange={(e) => setSelectedTargetNodeId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn bảng --</option>
                    {availableTargetNodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.data.label} (ID: {node.id})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col h-[300px]">
                  <label className="text-sm font-medium text-gray-700">Chọn Bản Sao Từ Data</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm data..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                  <ScrollArea className="flex-1 border rounded-md bg-gray-50">
                    <div className="p-2 space-y-1">
                      {filteredTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplateId(template.id);
                            // Auto-set field name if empty
                            if (!newFieldName) setNewFieldName(template.name.toLowerCase());
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md transition-all group",
                            selectedTemplateId === template.id
                              ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                              : "hover:bg-white text-gray-700"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Database className={cn("w-4 h-4", selectedTemplateId === template.id ? "text-blue-200" : "text-gray-400")} />
                              <div>
                                <div className="text-sm font-bold">{template.name}</div>
                                <div className={cn("text-[10px]", selectedTemplateId === template.id ? "text-blue-100" : "text-gray-500")}>
                                  type: {template.tableName}
                                </div>
                              </div>
                            </div>
                            {selectedTemplateId === template.id && <ArrowRight className="w-4 h-4 text-blue-200 animate-pulse" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Relationship Type */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Kiểu Dữ Liệu</label>
                  <select
                    value={linkType === RELATIONSHIP_TYPES.ONE_TO_MANY ? 'array' : 'object'}
                    onChange={(e) => {
                      const type = e.target.value as 'array' | 'object';
                      if (type === 'array') setLinkType(RELATIONSHIP_TYPES.ONE_TO_MANY);
                      else setLinkType(RELATIONSHIP_TYPES.MANY_TO_ONE);
                    }}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="array">Array (Danh sách)</option>
                    <option value="object">Object (Đối tượng)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Loại Liên Kết</label>
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={RELATIONSHIP_TYPES.ONE_TO_MANY}>1 - Nhiều (One to Many)</option>
                    <option value={RELATIONSHIP_TYPES.MANY_TO_ONE}>Nhiều - 1 (Many to One)</option>
                    <option value={RELATIONSHIP_TYPES.ONE_TO_ONE}>1 - 1 (One to One)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Keys Selection */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex justify-between">
                    <span>Khóa Nguồn ({sourceNode?.data.label})</span>
                    <span className="text-[10px] text-gray-500 font-normal uppercase">Thường là {isArray ? 'PK' : 'FK'}</span>
                  </label>
                  <select
                    value={selectedSourceKey}
                    onChange={(e) => setSelectedSourceKey(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value="">-- Chọn khóa --</option>
                    {sourceFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.name} {field.isPrimaryKey ? '(PK)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center py-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex justify-between">
                    <span>Khóa Đích {targetType === 'template' ? '(Bản sao mới)' : ''}</span>
                    <span className="text-[10px] text-gray-500 font-normal uppercase">Thường là {isArray ? 'FK' : 'PK'}</span>
                  </label>
                  <select
                    value={selectedTargetKey}
                    onChange={(e) => setSelectedTargetKey(e.target.value)}
                    disabled={targetType === 'existing' ? !selectedTargetNodeId : !selectedTemplateId}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:opacity-50"
                  >
                    <option value="">-- Chọn khóa --</option>
                    {targetFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.name} {field.isPrimaryKey ? '(PK)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tên field mới */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tên Field Mới Trong {sourceNode?.data.label}</label>
                <Input
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder={isArray ? "Ví dụ: ds_don_hang" : "Ví dụ: danh_muc"}
                  className="bg-white border-gray-300 text-gray-900 h-10 shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[11px] font-medium flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                  <svg className="shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                  {validationError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end pt-4 mt-2 border-t border-gray-100 shrink-0">
          <Button variant="ghost" onClick={handleCancel} className="text-gray-500 hover:text-gray-900 px-6">
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isFormValid}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] shadow-lg shadow-blue-200 transition-all font-bold"
          >
            {targetType === 'template' ? 'Tạo Bản Sao & Link' : 'Tạo Liên Kết'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

