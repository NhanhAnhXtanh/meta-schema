import React, { memo } from 'react';
import { Node } from '@xyflow/react';
import { ChevronDown, ChevronRight, Edit2, GripVertical, MoreVertical, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TableNodeData } from '@/types/schema';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { SidebarField } from './SidebarField';
import { useSidebarItem } from './useSidebarItem';
import {
    setEditingNodeId,
    setEditName,
    setMenuOpenNodeId,
    setDeleteDialogNodeId,
} from '@/store/slices/sidebarSlice';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface SidebarItemProps {
    node: Node<TableNodeData>;
    depth?: number;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    isSelected?: boolean;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
    isDragging?: boolean;
    isDragOver?: boolean;
}

const SidebarItemBase = ({
    node, depth = 0, isExpanded, onToggleExpand, isSelected,
    onDragStart, onDragOver, onDrop,
    isDragging, isDragOver
}: SidebarItemProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const {
        isEditing,
        currentEditName,
        isMenuOpen,
        showDeleteDialog,
        draggedFieldIndex,
        dragOverFieldIndex,
        isThisNodeFieldDragging,
        handleSaveEdit,
        handleFieldDragStart,
        handleFieldDragOver,
        handleFieldDrop,
        handleAddField,
        handleFocusNode,
        handleToggleMenu,
        handleConfirmDelete
    } = useSidebarItem(node, isExpanded, onToggleExpand);

    // Helper to close menu
    const closeMenu = () => dispatch(setMenuOpenNodeId(null));

    return (
        <div className="mb-1">
            {/* Node Header */}
            <div
                draggable
                onDragStart={(e) => onDragStart(e, node.id)}
                onDragOver={(e) => onDragOver(e, node.id)}
                onDrop={(e) => onDrop(e, node.id)}
                className={cn(
                    'group flex items-center relative hover:bg-gray-100 transition-all duration-200 rounded-lg mx-2 mb-1',
                    isSelected && 'bg-blue-50 shadow-sm ring-1 ring-blue-200',
                    isDragging && 'opacity-50',
                    isDragOver && 'border-t-2 border-blue-500'
                )}
                style={{ paddingLeft: `${depth === 0 ? 8 : depth * 12 + 8}px` }}
            >
                <div className="flex items-center relative w-full pr-2">
                    {/* Color Strip */}
                    {depth === 0 && (
                        <div
                            className="w-1.5 h-12 rounded-r-full shadow-sm mr-2 flex-shrink-0"
                            style={{
                                background: `linear-gradient(180deg, ${node.data.color || '#3b82f6'} 0%, ${node.data.color || '#3b82f6'}dd 100%)`
                            }}
                        />
                    )}
                    {depth > 0 && <div className="w-0.5 h-12 bg-green-500/60 rounded-r-full mr-1 flex-shrink-0" />}

                    {/* Expand Toggle */}
                    <button onClick={() => onToggleExpand(node.id)} className="p-2 hover:bg-gray-200 z-10 rounded-full transition-colors ml-1">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </button>

                    <GripVertical className="w-4 h-4 text-gray-400 mr-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex-1 cursor-pointer py-3 min-w-0" onClick={handleFocusNode}>
                        {isEditing ? (
                            <Input
                                value={currentEditName}
                                onChange={e => dispatch(setEditName(e.target.value))}
                                onBlur={handleSaveEdit}
                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                autoFocus
                                className="h-8 bg-white border-gray-300 text-gray-900"
                                onClick={e => e.stopPropagation()}
                            />
                        ) : (
                            <div>
                                <span className="text-sm font-medium text-gray-700 truncate block" title={node.data.label}>
                                    {node.data.label}
                                </span>
                                <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                                    <span>ID: {node.id}</span>
                                    <span>•</span>
                                    <span>Type: {node.data.tableName || node.data.label}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Menu */}
                    <div className="relative">
                        <button onClick={handleToggleMenu} className="p-2 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-all">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={closeMenu} />
                                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-md shadow-lg min-w-[140px]">
                                    <button onClick={() => { dispatch(setEditingNodeId(node.id)); dispatch(setEditName(node.data.label)); closeMenu(); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700">
                                        <Edit2 className="w-3 h-3" /> Rename
                                    </button>
                                    <button onClick={() => { closeMenu(); dispatch(setDeleteDialogNodeId(node.id)); }} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-gray-100">
                                        <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Fields List */}
            {isExpanded && (
                <div className="pl-4 pr-4 pb-3 space-y-1.5 border-t border-gray-100 pt-3 mt-2 bg-gray-50/50 rounded-b-lg">
                    <div className="text-xs font-bold text-gray-500 mb-3 px-2 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1 h-3 bg-gray-400 rounded-full" /> Trường
                    </div>
                    {node.data.columns.map((col, idx) => (
                        <SidebarField
                            key={idx}
                            nodeId={node.id}
                            field={col}
                            index={idx}
                            onDragStart={handleFieldDragStart}
                            onDragOver={handleFieldDragOver}
                            onDrop={handleFieldDrop}
                            isDragging={isThisNodeFieldDragging && draggedFieldIndex === idx}
                            isDragOver={isThisNodeFieldDragging && dragOverFieldIndex === idx}
                        />
                    ))}

                    {/* Add Field Button */}
                    <button
                        onClick={handleAddField}
                        className="w-full mt-3 px-3 py-2 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-blue-300 transition-all duration-200"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm trường
                    </button>
                </div>
            )}

            <Dialog open={showDeleteDialog} onOpenChange={(open) => !open && dispatch(setDeleteDialogNodeId(null))}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Xóa bảng {node.data.label}?
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            <span className="block font-medium text-gray-900 mb-2">
                                CẢNH BÁO CAO ĐỘ:
                            </span>
                            Hành động này sẽ xóa bảng <strong>{node.data.label}</strong> VÀ <strong className="text-red-600">TẤT CẢ các bảng con (descendants)</strong> đang được liên kết với nó.
                            <br /><br />
                            Bạn có chắc chắn muốn tiếp tục không? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => dispatch(setDeleteDialogNodeId(null))}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Xác nhận Xóa
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export const SidebarItem = memo(SidebarItemBase);
