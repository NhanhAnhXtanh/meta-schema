import { useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ValidationUtils } from '@/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { initialNodes } from '@/data/initialSchema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database, Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  setLinkFieldTargetType,
  setLinkFieldSelectedTargetNodeId,
  setLinkFieldSelectedTemplateId,
  setLinkFieldSelectedSourceKey,
  setLinkFieldSelectedTargetKey,
  setLinkFieldNewFieldName,
  setLinkFieldLinkType,
  setLinkFieldSearchQuery,
  initializeLinkFieldState,
  resetLinkFieldState
} from '@/store/slices/linkFieldSlice';
import { closeLinkFieldDialog, addVisibleNodeId } from '@/store/slices/uiSlice';
import {
  confirmLinkField,
  confirmLinkObject,
  updateLinkConnection,
  deleteField,
  addTable
} from '@/store/slices/schemaSlice';

export function LinkFieldDialog() {
  const dispatch = useDispatch();

  // Global State
  const nodes = useSelector((state: RootState) => state.schema.present.nodes);

  // UI Dialog State
  const { isOpen, sourceNodeId, isEditMode, fieldIndex, initialValues } = useSelector((state: RootState) => state.ui.linkFieldDialog);

  // Form State
  const {
    targetType,
    selectedTargetNodeId,
    selectedTemplateId,
    selectedSourceKey,
    selectedTargetKey,
    newFieldName,
    linkType,
    searchQuery
  } = useSelector((state: RootState) => state.linkField);

  // Derived State
  const sourceNode = useMemo(() => nodes.find(n => n.id === sourceNodeId), [nodes, sourceNodeId]);
  const allNodes = nodes;

  // Initialize Form
  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        dispatch(initializeLinkFieldState({
          targetType: 'existing',
          selectedTargetNodeId: initialValues.targetNodeId,
          selectedSourceKey: initialValues.sourceKey,
          selectedTargetKey: initialValues.targetKey,
          newFieldName: initialValues.fieldName,
          linkType: initialValues.linkType,
          selectedTemplateId: '',
          searchQuery: ''
        }));
      } else {
        // Reset for create mode
        dispatch(resetLinkFieldState());
      }
    }
  }, [isOpen, initialValues, dispatch]);


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

  // Validation
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

  const handleConfirm = () => {
    // Logic from SchemaDialogs transferred here
    if (!sourceNodeId) return;

    const finalTargetId = targetType === 'existing' ? selectedTargetNodeId : selectedTemplateId;
    const isNewInstance = targetType === 'template';

    if (finalTargetId && selectedSourceKey && selectedTargetKey && newFieldName.trim()) {

      let actualTargetNodeId = selectedTargetNodeId;

      // 1. If Edit Mode, delete field first to cleanup old definition
      if (isEditMode && fieldIndex !== undefined) {
        dispatch(deleteField({
          nodeId: sourceNodeId,
          fieldIndex: fieldIndex,
          skipRecursive: true
        }));
      }

      // 2. If it's a new instance, create it first
      if (isNewInstance && selectedTemplateId) {
        const template = initialNodes.find(n => n.id === selectedTemplateId);
        const sNode = nodes.find(n => n.id === sourceNodeId);

        if (template && sNode) {
          const newId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const existingCount = nodes.filter(n => n.data.tableName === template.data.tableName).length;
          const label = existingCount > 0 ? `${template.data.label} (${existingCount + 1})` : template.data.label;

          const ROW_HEIGHT = 37;
          const sourceCols = sNode.data.columns.filter((c: any) => c.visible !== false);
          const sourceIndex = sourceCols.length;
          const targetCols = template.data.columns.filter((c: any) => c.visible !== false);
          const targetIndex = targetCols.findIndex((c: any) => c.name === selectedTargetKey);

          let position = { x: sNode.position.x + 600, y: sNode.position.y };

          if (targetIndex !== -1) {
            const yDiff = (sourceIndex - targetIndex) * ROW_HEIGHT;
            position.y = sNode.position.y + yDiff;
          }

          const isOccupied = (x: number, y: number) => {
            return nodes.some(n =>
              Math.abs(n.position.x - x) < 100 &&
              Math.abs(n.position.y - y) < 100
            );
          };

          let attempts = 0;
          while (isOccupied(position.x, position.y) && attempts < 5) {
            position.y += 100;
            attempts++;
          }

          dispatch(addTable({
            id: newId,
            name: label,
            tableName: template.data.tableName,
            columns: template.data.columns.map(c => ({ ...c, isVirtual: false })),
            position
          }));
          dispatch(addVisibleNodeId(newId));
          actualTargetNodeId = newId;
        }
      }

      // 3. Add Relationship
      if (isEditMode) {
        dispatch(updateLinkConnection({
          sourceNodeId: sourceNodeId!,
          oldFieldName: initialValues?.fieldName || '',
          newFieldName: newFieldName.trim(),
          targetNodeId: actualTargetNodeId,
          sourceKey: selectedSourceKey,
          targetKey: selectedTargetKey,
          relationshipType: linkType
        }));
      } else {
        if (linkType === '1-n') {
          dispatch(confirmLinkField({
            sourceNodeId: sourceNodeId!,
            targetNodeId: actualTargetNodeId,
            sourcePK: selectedSourceKey,
            targetFK: selectedTargetKey,
            newFieldName: newFieldName.trim(),
            relationshipType: linkType
          }));
        } else {
          dispatch(confirmLinkObject({
            sourceNodeId: sourceNodeId!,
            targetNodeId: actualTargetNodeId,
            sourceFK: selectedSourceKey,
            targetPK: selectedTargetKey,
            newFieldName: newFieldName.trim(),
            relationshipType: linkType as 'n-1' | '1-1'
          }));
        }
      }
      dispatch(closeLinkFieldDialog());
    }
  };

  const handleCancel = () => {
    dispatch(closeLinkFieldDialog());
  };

  if (!sourceNode) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className={cn(
        "bg-white text-gray-900 border-gray-200 shadow-xl flex flex-col p-0 gap-0",
        "resize-y overflow-hidden min-h-[500px]",
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
                      onClick={() => dispatch(setLinkFieldLinkType('1-n'))}
                      className={cn("w-full text-left p-3 rounded-lg border transition-all", linkType === '1-n' ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" : "bg-gray-50 border-transparent hover:bg-gray-100")}
                    >
                      <div className={cn("font-bold text-sm mb-0.5", linkType === '1-n' ? "text-blue-700" : "text-gray-900")}>Array</div>
                      <div className="text-xs text-gray-500">Danh sách (1:N)</div>
                    </button>
                    <button
                      onClick={() => dispatch(setLinkFieldLinkType('n-1'))}
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
                        onClick={() => dispatch(setLinkFieldLinkType(opt.id as any))}
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
                    onChange={(e) => dispatch(setLinkFieldSearchQuery(e.target.value))}
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
                          dispatch(setLinkFieldSelectedTemplateId(template.id));
                          if (!newFieldName) dispatch(setLinkFieldNewFieldName(template.name.toLowerCase()));
                          dispatch(setLinkFieldTargetType('template'));
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
                            <button onClick={() => dispatch(setLinkFieldLinkType('1-n'))} className={cn("flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-all", linkType === '1-n' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 hover:border-gray-300 text-slate-700")}>
                              Array (1:N)
                            </button>
                            <button onClick={() => dispatch(setLinkFieldLinkType('n-1'))} className={cn("flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-all", linkType !== '1-n' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 hover:border-gray-300 text-slate-700")}>
                              Object (N:1)
                            </button>
                          </div>
                        </div>
                        {/* Relation */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase block">Quan hệ</label>
                          <div className="flex gap-2">
                            {['1-1', '1-n', 'n-1'].map(id => (
                              <button key={id} onClick={() => dispatch(setLinkFieldLinkType(id as any))} className={cn("flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-all uppercase", linkType === id ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 hover:border-gray-300 text-slate-700")}>
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
                              dispatch(setLinkFieldTargetType('template'));
                              dispatch(setLinkFieldSelectedTemplateId(val.replace('template:', '')));
                              dispatch(setLinkFieldSelectedTargetNodeId(''));
                            } else {
                              dispatch(setLinkFieldTargetType('existing'));
                              dispatch(setLinkFieldSelectedTargetNodeId(val));
                              dispatch(setLinkFieldSelectedTemplateId(''));
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
                          onChange={(e) => dispatch(setLinkFieldSelectedSourceKey(e.target.value))}
                          disabled={targetType === 'existing' && !isEditMode}
                          className="w-full h-9 rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
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
                          onChange={(e) => dispatch(setLinkFieldSelectedTargetKey(e.target.value))}
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
                        onChange={(e) => dispatch(setLinkFieldNewFieldName(e.target.value))}
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
