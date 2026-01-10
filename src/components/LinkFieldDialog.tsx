
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database, Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLinkFieldForm } from '@/hooks/useLinkFieldForm';

export function LinkFieldDialog() {
  const {
    // State
    isOpen,
    isEditMode,
    sourceNode,
    sourceFields,
    targetFields,
    validationError,
    isFormValid,

    // Form Values
    targetType,
    selectedTargetNodeId,
    selectedTemplateId,
    selectedSourceKey,
    selectedTargetKey,
    newFieldName,
    linkType,
    searchQuery,
    selectedTargetName,
    availableTargetNodes,
    filteredTemplates,
    templates,

    // Handlers
    handleConfirm,
    handleCancel,

    // Setters
    setLinkFieldSearchQuery,
    setLinkFieldSelectedTemplateId,
    setLinkFieldNewFieldName,
    setLinkFieldLinkType,
    setLinkFieldSelectedTargetNodeId,
    setLinkFieldSelectedSourceKey,
    setLinkFieldSelectedTargetKey,
    setSelectionAction
  } = useLinkFieldForm();

  if (!sourceNode) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className={cn(
        "bg-white text-gray-900 border-gray-200 shadow-xl flex flex-col p-0 gap-0",
        "resize-y overflow-hidden min-h-[500px]",
        "max-w-5xl h-[80vh]"
      )} style={{ resize: 'both' }}>
        {/* ... Header ... */}
        <DialogHeader className="p-4 border-b border-gray-100 shrink-0">
          <DialogTitle>{isEditMode ? 'Chỉnh Sửa Trường Link' : 'Thêm Trường Link Mới'}</DialogTitle>
          <DialogDescription className="text-gray-500">
            {isEditMode ? 'Cập nhật' : 'Tạo'} liên kết giữa <strong>{sourceNode?.data.label}</strong> và bảng khác.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Right Panel: Content */}
          <div className="flex-1 flex flex-col bg-white min-w-0">
            <div className="flex-1 min-h-0 flex flex-col relative">
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
                </>
              ) : (
                // ... Empty State ...
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                    <Database className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">
                    {isEditMode ? 'Chọn bảng đích để chỉnh sửa liên kết' : 'Chọn một bảng từ danh sách bên trái'}
                  </p>
                </div>
              )}
            </div>

            {/* Configuration Form - Always Visible */}
            <div className="p-6 border-t border-gray-100 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-20">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Cấu hình liên kết</h4>
              <div className="grid grid-cols-12 gap-6">

                {/* Link Type Controls (Only in CREATE Mode, as Edit Mode has Sidebar) */}
                <div className="col-span-12 grid grid-cols-2 gap-6 pb-4 border-b border-gray-50 mb-2">
                  {/* Data Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block">Kiểu Dữ Liệu</label>
                    <div className="flex gap-2">
                      <button onClick={() => setLinkFieldLinkType('1-n')} className={cn("flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-all", linkType === '1-n' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 hover:border-gray-300 text-slate-700")}>
                        Array (1:N)
                      </button>
                      <button onClick={() => setLinkFieldLinkType('n-1')} className={cn("flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-all", linkType !== '1-n' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 hover:border-gray-300 text-slate-700")}>
                        Object (N:1)
                      </button>
                    </div>
                  </div>
                  {/* Relation */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase block">Quan hệ</label>
                    <div className="flex gap-2">
                      {['1-1', '1-n', 'n-1'].map(id => (
                        <button key={id} onClick={() => setLinkFieldLinkType(id as any)} className={cn("flex-1 py-1.5 px-3 rounded text-xs font-medium border transition-all uppercase", linkType === id ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 hover:border-gray-300 text-slate-700")}>
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-12 space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase block">Target Table</label>
                  <select
                    value={targetType === 'existing' ? (selectedTargetNodeId || "") : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setSelectionAction({ type: 'existing', id: val });
                      }
                    }}
                    className="w-full h-9 rounded-md border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition-colors shadow-sm"
                  >
                    <option value="">-- Chọn bảng đích --</option>
                    {availableTargetNodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.data.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Keys */}
                <div className="col-span-8 grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase flex justify-between">
                      <span>Source Key (PK)</span>
                      <span className="text-blue-600">{sourceNode?.data.label}</span>
                    </label>
                    <select
                      value={selectedSourceKey}
                      onChange={(e) => setLinkFieldSelectedSourceKey(e.target.value)}
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
                      onChange={(e) => setLinkFieldSelectedTargetKey(e.target.value)}
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
                    onChange={(e) => setLinkFieldNewFieldName(e.target.value)}
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
