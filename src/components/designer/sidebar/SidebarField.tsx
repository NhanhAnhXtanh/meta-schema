import React, { useState, memo, useEffect } from 'react';
import { GripVertical, Key, Link2, Trash2, ChevronDown, ChevronRight, Check, Plus, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TableColumn } from '@/types/schema';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateField, toggleFieldVisibility } from '@/store/slices/schemaSlice';
import { deleteFieldCascade } from '@/store/thunks/schemaThunks';
import { addVisibleNodeId, removeVisibleNodeId, openEditLinkFieldDialog } from '@/store/slices/uiSlice';
import { NestedFieldsList } from './NestedFieldsList';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface SidebarFieldProps {
    nodeId: string;
    field: TableColumn;
    index: number;
    highlighted?: boolean;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    isDragging?: boolean;
    isDragOver?: boolean;
    isReadOnly?: boolean;
}



const SidebarFieldBase = ({
    nodeId, field, index,
    onDragStart, onDragOver, onDrop,
    isDragging, isDragOver, isReadOnly
}: SidebarFieldProps) => {
    const dispatch = useAppDispatch();


    const [localName, setLocalName] = useState(field.name || '');
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Sync local name when field name changes from external sources, but not while editing
    useEffect(() => {
        if (!isEditing) {
            setLocalName(field.name || '');
        }
    }, [field.name, isEditing]);

    // Debounce update logic
    useEffect(() => {
        if (isReadOnly) return; // Skip updates if readonly
        const timer = setTimeout(() => {
            if (localName !== (field.name || '') && (field.isVirtual === true || field.type === 'object' || field.type === 'array')) {
                dispatch(updateField({ nodeId, fieldIndex: index, updates: { name: localName } }));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localName, nodeId, index, dispatch, field.name, field.isVirtual, field.type, isReadOnly]);


    const edges = useAppSelector(state => state.schema.present.edges);
    const nodes = useAppSelector(state => state.schema.present.nodes);

    // Find linked table name if virtual
    let linkedTableName = '';
    if (field.isVirtual) {
        const edge = edges.find(e => e.source === nodeId && e.sourceHandle === field.name);
        if (edge) {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (targetNode) linkedTableName = targetNode.data.label;
        }
    }

    const isObjectField = field.type === 'object';
    const isVirtualField = field.isVirtual;



    // -- Nested Field Logic --
    const [isExpanded, setIsExpanded] = useState(false);
    const visibleNodeIds = useAppSelector(state => state.ui.visibleNodeIds);

    // Determine target node for nested fields
    let targetNodeId: string | null = null;
    if (field.isVirtual) {
        // Array/Link (source -> target via handle)
        const edge = edges.find(e => e.source === nodeId && e.sourceHandle === field.name);
        if (edge) targetNodeId = edge.target;
    } else if (field.type === 'object') {
        // Object (source -> target via data.objectFieldName edge)
        // Edge logic in confirmLinkObject: data: { objectFieldName: field.name }
        const edge = edges.find(e => e.source === nodeId && e.data?.objectFieldName === field.name);
        if (edge) targetNodeId = edge.target;
    }

    const targetNode = targetNodeId ? nodes.find(n => n.id === targetNodeId) : null;

    // Check for inline children (user provided via schema definition)
    const hasInlineChildren = !!field.children && field.children.length > 0;
    const hasNestedFields = !!targetNode || hasInlineChildren;

    // Check if target node is visible on board
    const isTargetVisible = targetNode ? visibleNodeIds.includes(targetNode.id) : false;

    return (
        <div className="flex flex-col">
            <div
                draggable={!isReadOnly}
                onDragStart={(e) => {
                    if (isReadOnly) return;
                    if ((e.target as HTMLElement).tagName === 'INPUT') {
                        e.preventDefault();
                        return;
                    }
                    onDragStart(e, index);
                }}
                onDragOver={(e) => !isReadOnly && onDragOver(e, index)}
                onDrop={(e) => !isReadOnly && onDrop(e, index)}
                className={cn(
                    "group/field flex items-center gap-2 px-2.5 py-2 hover:bg-gray-100 rounded-md transition-all duration-150 border border-transparent hover:border-gray-200",
                    isDragging && "opacity-50",
                    isDragOver && "border-blue-500 bg-blue-50",
                    field.isVirtual === true && "bg-amber-50 hover:bg-amber-100 border-amber-200/50",
                    field.isVirtual !== true && field.type !== 'object' && "bg-gray-100 hover:bg-gray-150",
                    isReadOnly && "cursor-default hover:bg-transparent pl-1" // Simplify for readonly
                )}
            >
                {/* Drag Handle - Hidden if ReadOnly */}
                {!isReadOnly && <GripVertical className="w-3 h-3 text-gray-400 cursor-move hover:text-gray-600 transition-colors flex-shrink-0" />}

                {/* Expansion Toggle */}
                {hasNestedFields && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-0.5 hover:bg-gray-200 rounded text-gray-500 flex-shrink-0"
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                )}

                {/* Visibility - Hidden if ReadOnly */}
                {!isReadOnly && (
                    <input
                        type="checkbox"
                        checked={field.visible !== false}
                        onChange={() => dispatch(toggleFieldVisibility({ nodeId, fieldIndex: index }))}
                        className="w-4 h-4 cursor-pointer accent-blue-600"
                    />
                )}


                {/* Name Input */}
                <div className="flex-1 min-w-[60px] overflow-hidden flex items-center gap-2">
                    <Input
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        onFocus={() => setIsEditing(true)}
                        onBlur={() => setIsEditing(false)}
                        placeholder="Field Name"
                        disabled={isReadOnly || !field.isVirtual}
                        className={cn(
                            "h-7 flex-1 text-xs bg-transparent border-0 text-gray-900 font-bold font-mono px-1 focus:bg-white focus:border-gray-500 focus:px-2 rounded placeholder:text-gray-400",
                            field.visible === false && "line-through text-gray-500",
                            (isReadOnly || !field.isVirtual) && "cursor-not-allowed disabled:opacity-100 disabled:bg-transparent"
                        )}
                    />
                    {!hasNestedFields && field.isVirtual && linkedTableName && (
                        <span className="text-xs text-green-700 font-medium px-2 py-0.5 bg-green-100 rounded border border-green-200 whitespace-nowrap">
                            → {linkedTableName}
                        </span>
                    )}
                    {hasNestedFields && targetNode && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded border border-blue-200 min-w-0 max-w-[120px]">
                            {/* Toggle Board Visibility of Linked Table */}
                            {!isReadOnly && (
                                <input
                                    type="checkbox"
                                    checked={isTargetVisible}
                                    onChange={() => {
                                        if (isTargetVisible) {
                                            dispatch(removeVisibleNodeId(targetNode.id));
                                        } else {
                                            dispatch(addVisibleNodeId(targetNode.id));
                                        }
                                    }}
                                    className="w-3 h-3 cursor-pointer accent-blue-600 flex-shrink-0"
                                    title="Show/Hide Table on Board"
                                />
                            )}
                            <span className="text-xs text-blue-600 font-medium truncate block" onClick={() => !isTargetVisible && dispatch(addVisibleNodeId(targetNode.id))}>
                                : {targetNode.data.label}
                            </span>
                        </div>
                    )}
                </div>

                {/* Schema Definition Display */}
                <div className="flex items-center gap-2 ml-auto shrink-0 mr-2">
                    {/* 1. TYPE INDICATOR */}
                    <div className={cn(
                        "text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider",
                        field.type === 'object' || field.type === 'array' || field.type === 'jsonb'
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                    )}>
                        {field.isVirtual ? 'Array' : field.type}
                    </div>

                    {/* 2. REF STATUS */}
                    {(field.type === 'object' || field.type === 'array' || field.isVirtual) && (
                        <div className={cn(
                            "flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase",
                            targetNode
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                        )}>
                            <span>Ref: {targetNode ? 'True' : 'False'}</span>
                        </div>
                    )}

                    {/* 3. REF TARGET */}
                    {targetNode && (
                        <div className="flex items-center gap-1 text-[9px] font-bold font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            <span>→ {targetNode.data.tableName || targetNode.data.label}</span>
                        </div>
                    )}

                    {/* 4. KEY ATTRIBUTES Toggle (Hidden if ReadOnly or NOT VIRTUAL) */}
                    {!isReadOnly && field.isVirtual && (
                        <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-1">
                            <button
                                onClick={() => dispatch(updateField({ nodeId, fieldIndex: index, updates: { isPrimaryKey: !field.isPrimaryKey } }))}
                                className={cn(
                                    "w-5 h-5 flex items-center justify-center rounded text-[8px] font-bold transition-all",
                                    field.isPrimaryKey ? "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300" : "text-gray-300 hover:text-gray-500"
                                )}
                                title="Primary Key (PK)"
                            >PK</button>
                            <button
                                onClick={() => dispatch(updateField({ nodeId, fieldIndex: index, updates: { isForeignKey: !field.isForeignKey } }))}
                                className={cn(
                                    "w-5 h-5 flex items-center justify-center rounded text-[8px] font-bold transition-all",
                                    field.isForeignKey ? "bg-purple-100 text-purple-700 ring-1 ring-purple-300" : "text-gray-300 hover:text-gray-500"
                                )}
                                title="Foreign Key (FK)"
                            >FK</button>
                        </div>
                    )}

                    {/* Show PK/FK Badges (Read-Only) if not editable */}
                    {(!field.isVirtual || isReadOnly) && (field.isPrimaryKey || field.isForeignKey) && (
                        <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-1">
                            {field.isPrimaryKey && <span className="bg-yellow-100 text-yellow-700 text-[8px] font-bold px-1 rounded">PK</span>}
                            {field.isForeignKey && <span className="bg-purple-100 text-purple-700 text-[8px] font-bold px-1 rounded">FK</span>}
                        </div>
                    )}

                </div>

                {/* Action Buttons (Edit/Delete) - Hidden if ReadOnly */}
                {!isReadOnly && field.isVirtual && (
                    <>
                        <button
                            onClick={() => {
                                let initialValues = null;
                                // Case 1: Virtual Field (Array 1-n)
                                if (field.isVirtual || field.type === 'array') {
                                    const edge = edges.find(e => e.source === nodeId && e.sourceHandle === field.name);
                                    if (edge && edge.targetHandle) {
                                        initialValues = {
                                            targetNodeId: edge.target,
                                            sourceKey: field.linkedPrimaryKeyField || 'id',
                                            targetKey: edge.targetHandle,
                                            fieldName: field.name,
                                            linkType: '1-n' as const
                                        };
                                    } else {
                                        // No edge exists, open dialog with defaults for creating new link
                                        initialValues = {
                                            targetNodeId: '',
                                            sourceKey: 'id',
                                            targetKey: '',
                                            fieldName: field.name,
                                            linkType: '1-n' as const
                                        };
                                    }
                                } else if (field.type === 'object') {
                                    // n-1 Object
                                    const edge = edges.find(e => e.source === nodeId && e.data?.objectFieldName === field.name);
                                    if (edge && edge.sourceHandle && edge.targetHandle) {
                                        initialValues = {
                                            targetNodeId: edge.target,
                                            sourceKey: edge.data?.sourceFK || edge.sourceHandle, // FK (stored in data for n-1)
                                            targetKey: edge.targetHandle, // PK
                                            fieldName: field.name,
                                            linkType: 'n-1' as const
                                        };
                                    } else {
                                        // No edge exists, open dialog with defaults
                                        initialValues = {
                                            targetNodeId: '',
                                            sourceKey: '',
                                            targetKey: 'id',
                                            fieldName: field.name,
                                            linkType: 'n-1' as const
                                        };
                                    }
                                }

                                // Always open dialog (even if no edge exists)
                                if (initialValues) {
                                    dispatch(openEditLinkFieldDialog({
                                        sourceNodeId: nodeId,
                                        fieldIndex: index,
                                        initialValues
                                    }));
                                }
                            }}
                            className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title={field.isVirtual ? "Edit Field Configuration" : "Connect to Table"}
                        >
                            {field.isVirtual ? <Edit2 className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                        </button>

                        {/* DELETE BUTTON: ONLY FOR VIRTUAL FIELDS */}
                        {field.isVirtual && (
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete Field"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </>
                )}

            </div>

            {/* Nested Fields View - Pass explicit field.children if no target node */}
            {isExpanded && (
                <NestedFieldsList
                    nodeId={targetNode ? targetNode.id : undefined}
                    fields={!targetNode ? field.children : undefined}
                    isReadOnly={isReadOnly}
                />
            )}

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            Xóa trường {field.name}?
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            <span className="block font-medium text-gray-900 mb-2">
                                CẢNH BÁO CAO ĐỘ:
                            </span>
                            Hành động này sẽ xóa trường <strong>{field.name}</strong> VÀ <strong className="text-red-600">TẤT CẢ các bảng con (descendants)</strong> được sinh ra từ trường này.
                            <br /><br />
                            Bạn có chắc chắn muốn tiếp tục không? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => setShowDeleteDialog(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={() => {
                                dispatch(deleteFieldCascade(nodeId, index));
                                setShowDeleteDialog(false);
                            }}
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

export const SidebarField = memo(SidebarFieldBase);
