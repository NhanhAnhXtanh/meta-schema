import { useState, useMemo, useEffect } from 'react';
import { Node } from '@xyflow/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ValidationUtils } from '@/utils/validation';
import { RELATIONSHIP_TYPES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { initialNodes } from '@/data/initialSchema';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tableName.toLowerCase().includes(searchQuery.toLowerCase())) &&
      t.tableName !== sourceNode?.data.tableName // Filter out self
    );
  }, [templates, searchQuery, sourceNode]);

  // Filter existing nodes
  const availableTargetNodes = useMemo(() => {
    if (!sourceNode) return [];
    return allNodes.filter(n => n.id !== sourceNode.id);
  }, [allNodes, sourceNode]);

  const filteredExistingNodes = useMemo(() => {
    return availableTargetNodes.filter(n =>
      n.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.data.tableName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableTargetNodes, searchQuery]);

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

  const selectedTargetName = useMemo(() => {
    if (targetType === 'existing') {
      return availableTargetNodes.find(n => n.id === selectedTargetNodeId)?.data.label;
    }
    return templates.find(t => t.id === selectedTemplateId)?.name;
  }, [targetType, selectedTargetNodeId, selectedTemplateId, availableTargetNodes, templates]);

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
      <DialogContent className="max-w-5xl bg-white text-gray-900 border-gray-200 shadow-xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-gray-100 shrink-0">
          <DialogTitle>{isEditMode ? 'Chỉnh Sửa Trường Link' : 'Thêm Trường Link Mới'}</DialogTitle>
          <DialogDescription className="text-gray-500">
            {isEditMode ? 'Cập nhật' : 'Tạo'} liên kết giữa <strong>{sourceNode?.data.label}</strong> và bảng khác.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar: Selection */}
          <div className="w-[320px] border-r border-gray-200 flex flex-col bg-gray-50/50">
            {/* Type Toggle */}
            <div className="p-3 border-b border-gray-100 bg-white">
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => { setTargetType('existing'); setSearchQuery(''); }}
                  className={cn(
                    "py-1.5 text-xs font-semibold rounded-md transition-all",
                    targetType === 'existing' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Bảng hiện có
                </button>
                <button
                  onClick={() => { setTargetType('template'); setSearchQuery(''); }}
                  className={cn(
                    "py-1.5 text-xs font-semibold rounded-md transition-all",
                    targetType === 'template' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Bản sao từ Data
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 pb-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder={targetType === 'existing' ? "Tìm bảng..." : "Tìm mẫu..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm bg-white border-gray-200"
                />
              </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1">
                {targetType === 'existing' ? (
                  filteredExistingNodes.length > 0 ? (
                    filteredExistingNodes.map(node => (
                      <button
                        key={node.id}
                        onClick={() => setSelectedTargetNodeId(node.id)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg transition-all border group",
                          selectedTargetNodeId === node.id
                            ? "bg-blue-50 border-blue-200 shadow-sm"
                            : "border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-2 h-8 rounded-full shrink-0", selectedTargetNodeId === node.id ? "bg-blue-500" : "bg-gray-300")} style={{ backgroundColor: node.data.color }} />
                          <div className="min-w-0">
                            <div className={cn("text-sm font-semibold truncate", selectedTargetNodeId === node.id ? "text-blue-900" : "text-gray-700")}>{node.data.label}</div>
                            <div className="text-[10px] text-gray-400 font-mono truncate">ID: {node.id}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : <div className="text-center py-8 text-xs text-gray-400">Không tìm thấy bảng</div>
                ) : (
                  filteredTemplates.length > 0 ? (
                    filteredTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          if (!newFieldName) setNewFieldName(template.name.toLowerCase());
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg transition-all border group",
                          selectedTemplateId === template.id
                            ? "bg-blue-50 border-blue-200 shadow-sm"
                            : "border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <Database className={cn("w-4 h-4 shrink-0", selectedTemplateId === template.id ? "text-blue-600" : "text-gray-400")} />
                          <div className="min-w-0">
                            <div className={cn("text-sm font-semibold truncate", selectedTemplateId === template.id ? "text-blue-900" : "text-gray-700")}>{template.name}</div>
                            <div className="text-[10px] text-gray-400 truncate">{template.tableName}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : <div className="text-center py-8 text-xs text-gray-400">Không tìm thấy mẫu data</div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Content */}
          <div className="flex-1 flex flex-col bg-white min-w-0">
            {selectedTargetName ? (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">Selected</span>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedTargetName}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-violet-600" />
                      <span>Primary Key</span>
                    </div>
                  </div>
                </div>

                {/* Field Preview */}
                <div className="flex-1 min-h-0 bg-gray-50 relative group">
                  <ScrollArea className="h-full">
                    <div className="p-6">
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                              <th className="py-3 px-4 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest w-12 text-center font-sans">PK</th>
                              <th className="py-3 px-4 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest font-sans">Field Name</th>
                              <th className="py-3 px-4 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest w-32 text-right font-sans">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {targetFields.map((col, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-4 text-center">
                                  {col.isPrimaryKey && <div className="w-2 h-2 bg-violet-600 rounded-full mx-auto ring-2 ring-violet-100 shadow-sm" />}
                                </td>
                                <td className={cn("py-2.5 px-4 text-sm font-bold font-mono", col.isPrimaryKey ? "text-violet-800" : "text-slate-800")}>
                                  {col.name}
                                </td>
                                <td className="py-2.5 px-4 text-xs font-semibold font-mono text-slate-600 text-right">
                                  {col.type}
                                </td>
                              </tr>
                            ))}
                            {targetFields.length === 0 && (
                              <tr>
                                <td colSpan={3} className="py-8 text-center text-gray-400 text-sm">No columns found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </ScrollArea>
                </div>

                {/* Configuration Form */}
                <div className="p-6 border-t border-gray-100 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-20">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Cấu hình liên kết</h4>
                  <div className="grid grid-cols-12 gap-6">
                    {/* Keys */}
                    <div className="col-span-8 grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-gray-500 uppercase flex justify-between">
                          <span>Source Key (PK)</span>
                          <span className="text-blue-600">{sourceNode?.data.label}</span>
                        </label>
                        <select
                          value={selectedSourceKey}
                          onChange={(e) => setSelectedSourceKey(e.target.value)}
                          className="w-full h-9 rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors shadow-sm"
                        >
                          <option value="">-- Chọn khóa --</option>
                          {sourceFields.map((field) => (
                            <option key={field.name} value={field.name}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-5 text-gray-300">
                        <ArrowRight className="w-5 h-5" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-gray-500 uppercase flex justify-between">
                          <span>Target Key (FK)</span>
                          <span className="text-blue-600 truncate max-w-[100px]">{selectedTargetName}</span>
                        </label>
                        <select
                          value={selectedTargetKey}
                          onChange={(e) => setSelectedTargetKey(e.target.value)}
                          className="w-full h-9 rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors shadow-sm"
                        >
                          <option value="">-- Chọn khóa --</option>
                          {targetFields.map((field) => (
                            <option key={field.name} value={field.name}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Field Name */}
                    <div className="col-span-4 space-y-1.5">
                      <label className="text-[10px] font-semibold text-gray-500 uppercase block">Field Name in Source</label>
                      <Input
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="e.g. suppliers"
                        className="h-9 bg-white border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {validationError && (
                    <div className="mt-3 text-red-600 text-[11px] font-medium flex items-center gap-2 animate-in slide-in-from-left-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {validationError}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Database className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">Chọn một bảng từ danh sách bên trái</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
          <Button variant="ghost" onClick={handleCancel} className="text-gray-500 hover:text-gray-900 border border-transparent hover:bg-white hover:border-gray-200 transition-all font-medium">
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isFormValid}
            className={cn(
              "min-w-[140px] shadow-lg shadow-blue-500/20 transition-all font-bold",
              isFormValid ? "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {targetType === 'template' ? 'Tạo Bản Sao & Link' : 'Tạo Liên Kết'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
