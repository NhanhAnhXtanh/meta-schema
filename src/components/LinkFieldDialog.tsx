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
  isNameEditable?: boolean;
}

export function LinkFieldDialog({
  open,
  onOpenChange,
  sourceNode,
  allNodes,
  visibleNodeIds,
  onConfirm,
  initialValues,
  isEditMode = false,
  isNameEditable = true
}: LinkFieldDialogProps) {
  // ... (existing code)

  // ... inside return ...

  const [targetType, setTargetType] = useState<'existing' | 'template'>('template');
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
      t.tableName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [templates, searchQuery]);

  // Filter existing nodes
  const availableTargetNodes = useMemo(() => {
    if (!sourceNode) return [];
    return allNodes;
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
      // ... existing logic ...
      if (!selectedTargetNodeId) return [];
      const targetNode = availableTargetNodes.find((n) => n.id === selectedTargetNodeId);
      if (!targetNode) return [];
      return targetNode.data.columns.filter((col) => col.visible !== false);
    } else {
      // ... existing logic ...
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
      <DialogContent className={cn(
        "bg-white text-gray-900 border-gray-200 shadow-xl flex flex-col p-0 gap-0",
        "resize-y overflow-hidden min-h-[500px]", // Allow vertical resize at least? resize-both needs overflow.
        isEditMode ? "max-w-6xl h-[80vh]" : "max-w-7xl h-[85vh]"
      )} style={{ resize: 'both' }}>
        {/* ... Header ... */}
        <DialogHeader className="p-4 border-b border-gray-100 shrink-0">
          <DialogTitle>{isEditMode ? 'Chỉnh Sửa Trường Link' : 'Thêm Trường Link Mới'}</DialogTitle>
          <DialogDescription className="text-gray-500">
            {isEditMode ? 'Cập nhật' : 'Tạo'} liên kết giữa <strong>{sourceNode?.data.label}</strong> và bảng khác.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left Sidebar: Relation Config - Only show in EDIT mode */}
          {isEditMode && (
            <div className="w-[280px] border-r border-gray-200 flex flex-col bg-white min-h-0 overflow-y-auto shrink-0">
              <div className="p-6 space-y-8">
                {/* Data Type */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Kiểu Dữ Liệu</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setLinkType('1-n')}
                      className={cn("w-full text-left p-3 rounded-lg border transition-all", linkType === '1-n' ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" : "bg-gray-50 border-transparent hover:bg-gray-100")}
                    >
                      <div className={cn("font-bold text-sm mb-0.5", linkType === '1-n' ? "text-blue-700" : "text-gray-900")}>Array</div>
                      <div className="text-xs text-gray-500">Danh sách (1:N)</div>
                    </button>
                    <button
                      onClick={() => setLinkType('n-1')}
                      className={cn("w-full text-left p-3 rounded-lg border transition-all", linkType !== '1-n' ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" : "bg-gray-50 border-transparent hover:bg-gray-100")}
                    >
                      <div className={cn("font-bold text-sm mb-0.5", linkType !== '1-n' ? "text-blue-700" : "text-gray-900")}>Object</div>
                      <div className="text-xs text-gray-500">Đối tượng (N:1, 1:1)</div>
                    </button>
                  </div>
                </div>

                {/* Relation */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quan hệ</h3>
                  <div className="space-y-2">
                    {[
                      { id: '1-1', label: '1:1', desc: 'One to One' },
                      { id: '1-n', label: '1:N', desc: 'One to Many' },
                      { id: 'n-1', label: 'N:1', desc: 'Many to One' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setLinkType(opt.id as any)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 px-3 rounded-md transition-all",
                          linkType === opt.id ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <span className={cn("font-mono text-xs", linkType === opt.id && "bg-blue-100 px-1.5 py-0.5 rounded")}>{opt.label}</span>
                        <span className="text-xs opacity-70">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Left Sidebar: Selection - Only show in CREATE mode */}
          {!isEditMode && (
            <div className="w-[320px] border-r border-gray-200 flex flex-col bg-gray-50/50 min-h-0">

              {/* Search */}
              <div className="p-3 pb-0 bg-gray-50/50 pt-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Tìm mẫu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm bg-white border-gray-200"
                  />
                </div>
              </div>

              {/* List Content */}
              <div className="flex-1 p-3 overflow-y-auto min-h-0">
                <div className="space-y-1">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          if (!newFieldName) setNewFieldName(template.name.toLowerCase());
                          setTargetType('template');
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
                  ) : <div className="text-center py-8 text-xs text-gray-400">Không tìm thấy mẫu data</div>}
                </div>
              </div>
            </div>
          )}


          {/* Right Panel: Content */}
          <div className="flex-1 flex flex-col bg-white min-w-0">
            {selectedTargetName ? (
              <>
                {/* Header and Preview (Assumed unchanged) */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">Selected</span>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedTargetName}</h3>
                  </div>
                  {/* ... */}
                </div>

                <div className="flex-1 min-h-0 bg-gray-50 relative group">
                  <ScrollArea className="h-full">
                    <div className="p-6 grid grid-cols-[1fr,100px,1fr] gap-0 relative">
                      {/* SOURCE TABLE */}
                      <div className="space-y-3 z-10 w-full min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">Source</span>
                          <h4 className="font-bold text-gray-900 text-sm truncate">{sourceNode?.data.label}</h4>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ring-1 ring-gray-900/5">
                          <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                              <tr className="bg-gray-50/50 border-b border-gray-100 h-10">
                                <th className="px-3 text-[9px] font-extrabold text-slate-700 uppercase tracking-widest font-sans w-full">Field</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {sourceFields.map((col, idx) => (
                                <tr key={idx} className={cn("transition-colors h-10", selectedSourceKey === col.name ? "bg-blue-50" : "hover:bg-slate-50")}>
                                  <td className={cn("px-3 text-xs font-bold font-mono truncate", col.isPrimaryKey ? "text-violet-800" : "text-slate-800", selectedSourceKey === col.name && "text-blue-700")}>
                                    <div className="flex items-center gap-2">
                                      {col.isPrimaryKey && <div className="w-1.5 h-1.5 bg-violet-600 rounded-full ring-2 ring-violet-100 shadow-sm shrink-0" />}
                                      <span className="truncate">{col.name}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {sourceFields.length === 0 && (
                                <tr>
                                  <td className="py-4 text-center text-gray-400 text-xs">No columns</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* CONNECTION LINES (Center Column) */}
                      <div className="relative w-full h-full pointer-events-none">
                        <svg className="absolute top-0 left-0 w-full h-full overflow-visible">
                          <defs>
                            <marker id="arrowhead-start" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                              <circle cx="3" cy="3" r="2" fill="#3b82f6" />
                            </marker>
                            <marker id="arrowhead-end" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                              <circle cx="3" cy="3" r="2" fill="#3b82f6" />
                            </marker>
                          </defs>
                          {(() => {
                            // Find indices
                            const sIndex = sourceFields.findIndex(f => f.name === selectedSourceKey);
                            const tIndex = targetFields.findIndex(f => f.name === selectedTargetKey);

                            if (sIndex === -1 || tIndex === -1) return null;

                            // Header: 12px (text spacing) + 40px (th h-10) ? No. 
                            // Source Table Header: 32px (container gap) + ...
                            // Let's estimate:
                            // Container Top Padding: 24px (p-6) -> No, SVG is INSIDE p-6 grid? No, Grid has p-6.
                            // The SVG is in a column. 0,0 is at top of grid content.
                            // We have "Source" Label (h-auto ~24px?) + mb-2 (8px). 
                            // Then Table starts. Header h-10 (40px).
                            // Row h-10 (40px).

                            const HEADER_OFFSET = 32 + 40; // Label + margin + th
                            // actually, label line-height 20px (text-sm) + 8px mb. ~ 28px. Let's say 30.
                            // Plus TH height 40. Total 70? 
                            // Let's simplify: 
                            // Label row: height ~ 28px. 
                            // Table Header: 40px.
                            // Total Top Offset = 28 + 40 = 68px.

                            const TOP_OFFSET = 68;
                            const ROW_HEIGHT = 40;

                            const y1 = TOP_OFFSET + (sIndex * ROW_HEIGHT) + (ROW_HEIGHT / 2);
                            const y2 = TOP_OFFSET + (tIndex * ROW_HEIGHT) + (ROW_HEIGHT / 2);

                            return (
                              <>
                                {/* Connection Line */}
                                <path
                                  d={`M 0 ${y1} C 50 ${y1}, 50 ${y2}, 100 ${y2}`}
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="2"
                                  strokeDasharray="4"
                                  className="animate-pulse"
                                  markerEnd="url(#arrowhead-end)"
                                />
                                {/* Link label */}
                                {/* <rect x="35" y={(y1+y2)/2 - 10} width="30" height="20" rx="4" fill="white" stroke="#e5e7eb" /> */}
                                {/* <text x="50" y={(y1+y2)/2 + 4} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="bold">LINK</text> */}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* TARGET TABLE */}
                      <div className="space-y-3 z-10 w-full min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide", targetType === 'existing' ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700")}>Target ({targetType})</span>
                          <h4 className="font-bold text-gray-900 text-sm truncate">{selectedTargetName}</h4>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ring-1 ring-gray-900/5">
                          <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                              <tr className="bg-gray-50/50 border-b border-gray-100 h-10">
                                <th className="px-3 text-[9px] font-extrabold text-slate-700 uppercase tracking-widest w-10 text-center font-sans">PK</th>
                                <th className="px-3 text-[9px] font-extrabold text-slate-700 uppercase tracking-widest font-sans w-full">Field</th>
                                <th className="px-3 text-[9px] font-extrabold text-slate-700 uppercase tracking-widest w-20 text-right font-sans">Type</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {targetFields.map((col, idx) => (
                                <tr key={idx} className={cn("transition-colors h-10", selectedTargetKey === col.name ? "bg-blue-50" : "hover:bg-slate-50")}>
                                  <td className="px-3 text-center">
                                    {col.isPrimaryKey && <div className="w-1.5 h-1.5 bg-violet-600 rounded-full mx-auto ring-2 ring-violet-100 shadow-sm" />}
                                  </td>
                                  <td className={cn("px-3 text-xs font-bold font-mono truncate", col.isPrimaryKey ? "text-violet-800" : "text-slate-800", selectedTargetKey === col.name && "text-blue-700")}>
                                    {col.name}
                                    {col.isVirtual && (
                                      <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-800 uppercase tracking-wider">
                                        Vir
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 text-[10px] font-semibold font-mono text-slate-600 text-right truncate">
                                    {col.isVirtual ? 'relation' : col.type}
                                  </td>
                                </tr>
                              ))}
                              {targetFields.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="py-4 text-center text-gray-400 text-xs">No columns found</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>

                {/* Configuration Form - Always Visible */}
                <div className="p-6 border-t border-gray-100 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-20">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Cấu hình liên kết</h4>
                  <div className="grid grid-cols-12 gap-6">

                    {/* Link Type Controls (Only in CREATE Mode, as Edit Mode has Sidebar) */}
                    {!isEditMode && (
                      <div className="col-span-12 grid grid-cols-2 gap-6 pb-4 border-b border-gray-50 mb-2">
                        {/* Data Type */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase block">Kiểu Dữ Liệu</label>
                          <div className="flex gap-2">
                            <button onClick={() => setLinkType('1-n')} className={cn("flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-all", linkType === '1-n' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 hover:border-gray-300 text-slate-700")}>
                              Array (1:N)
                            </button>
                            <button onClick={() => setLinkType('n-1')} className={cn("flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-all", linkType !== '1-n' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 hover:border-gray-300 text-slate-700")}>
                              Object (N:1)
                            </button>
                          </div>
                        </div>
                        {/* Relation */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase block">Quan hệ</label>
                          <div className="flex gap-2">
                            {['1-1', '1-n', 'n-1'].map(id => (
                              <button key={id} onClick={() => setLinkType(id as any)} className={cn("flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-all uppercase", linkType === id ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 hover:border-gray-300 text-slate-700")}>
                                {id}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Target Table (Only in Edit Mode) */}
                    {isEditMode && (
                      <div className="col-span-12 space-y-1.5">
                        <label className="text-[10px] font-semibold text-gray-500 uppercase block">Target Table</label>
                        <select
                          value={targetType === 'template' ? `template:${selectedTemplateId}` : selectedTargetNodeId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('template:')) {
                              setTargetType('template');
                              setSelectedTemplateId(val.replace('template:', ''));
                              setSelectedTargetNodeId('');
                            } else {
                              setTargetType('existing');
                              setSelectedTargetNodeId(val);
                              setSelectedTemplateId('');
                            }
                          }}
                          className="w-full h-9 rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors shadow-sm"
                        >
                          <optgroup label="Bảng hiện có">
                            {availableTargetNodes.map((node) => (
                              <option key={node.id} value={node.id}>
                                {node.data.label} (Instance)
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Tạo bảng mới từ mẫu">
                            {templates.map((t) => (
                              <option key={t.id} value={`template:${t.id}`}>
                                {t.name} (Template)
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    )}

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
                          disabled={targetType === 'existing' && !isEditMode}
                          className="w-full h-9 rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          <option value="">-- Chọn khóa --</option>
                          {/* ... options ... */}
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
                          disabled={targetType === 'existing' && !isEditMode}
                          className="w-full h-9 rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
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
                        disabled={targetType === 'existing' && !isEditMode}
                        className="h-9 bg-white border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                  {/* Info helper */}
                  {targetType === 'existing' && !isEditMode && (
                    <div className="mt-3 bg-blue-50 p-3 rounded text-[11px] text-blue-700 flex gap-2">
                      <span className="font-bold">Info:</span>
                      <span>Select keys below to create a link to this existing table.</span>
                    </div>
                  )}

                  {/* Validation Error */}
                  {validationError && (
                    <div className="mt-3 text-red-600 text-[11px] font-medium flex items-center gap-2 animate-in slide-in-from-left-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {validationError}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // ... Empty State ...
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
            {targetType === 'existing' && !isEditMode ? 'Đóng' : 'Hủy bỏ'}
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={!isFormValid}
            className={cn(
              "min-w-[140px] shadow-lg shadow-blue-500/20 transition-all font-bold",
              isFormValid ? "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {targetType === 'template' ? 'Tạo Bản Sao & Link' : (isEditMode ? 'Lưu Thay Đổi' : 'Tạo Liên Kết')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

