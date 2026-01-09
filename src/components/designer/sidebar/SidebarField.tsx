import React, { useState, memo, useEffect } from 'react';
import { GripVertical, Trash2, ChevronDown, ChevronRight, Check, Edit2, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TableColumn } from '@/types/schema';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
    const dispatch = useDispatch<AppDispatch>();


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


    const edges = useSelector((state: RootState) => state.schema.present.edges);
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);

    // Find linked table name if virtual
    let linkedTableName = '';
    if (field.isVirtual) {
        const edge = edges.find(e => e.source === nodeId && e.sourceHandle === field.name);
        if (edge) {
            const targetNode = nodes.find(n => n.id === edge.target);
            if (targetNode) linkedTableName = targetNode.data.label;
        }
    }



    // Determine if this is a virtual array field (1-n relationship)
    let isVirtualArray = false;
    if (field.isVirtual) {
        const edge = edges.find(e => e.source === nodeId && e.sourceHandle === field.name);
        if (edge && edge.data?.relationshipType === '1-n') {
            isVirtualArray = true;
        }
    }



    // -- Nested Field Logic --
    const [isExpanded, setIsExpanded] = useState(false);
    const visibleNodeIds = useSelector((state: RootState) => state.ui.visibleNodeIds);

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
                    "group/field flex items-center gap-2 px-2.5 py-2 hover:bg-gray-100 rounded-md transition-all duration-150 border border-transparent hover:border-gray-200 overflow-hidden",
                    isDragging && "opacity-50",
                    isDragOver && "border-blue-500 bg-blue-50",
                    (field.isVirtual === true && !isVirtualArray && field.type !== 'array' && field.type !== 'object')
                        ? "bg-amber-50 hover:bg-amber-100 border-amber-200"
                        : "bg-gray-100 hover:bg-gray-200 border-gray-200", // Darker gray for standard types including array/object
                    isReadOnly && "cursor-default hover:bg-transparent pl-1"
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
                <div className="flex items-center gap-1 ml-auto shrink-0 max-w-[40%] overflow-hidden justify-end">
                    {/* 1. TYPE INDICATOR */}
                    <div className={cn(
                        "text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0",
                        isVirtualArray
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : field.type === 'array'
                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                : field.type === 'object' || field.type === 'jsonb'
                                    ? "bg-violet-100 text-violet-700 border-violet-200"
                                    : field.isVirtual
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                        : "bg-gray-50 text-gray-500 border-gray-200"
                    )}>
                        {isVirtualArray ? 'Array' : (field.type === 'array' ? 'Array' : (field.type === 'object' || field.type === 'jsonb' ? 'Object' : (field.isVirtual ? 'Virtual' : field.type)))}
                    </div>

                    {/* 2. REF STATUS */}
                    {(field.type === 'object' || field.type === 'array' || field.isVirtual) && (
                        <div className={cn(
                            "flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase shrink-0",
                            targetNode
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                        )}>
                            <span className="truncate max-w-[80px]">Ref: {targetNode ? 'True' : 'False'}</span>
                        </div>
                    )}

                    {/* 3. REF TARGET - Hidden on small screens or text truncated */}
                    {targetNode && (
                        <div className="hidden xl:flex items-center gap-1 text-[9px] font-bold font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0 max-w-[80px]">
                            <span className="truncate">→ {targetNode.data.tableName || targetNode.data.label}</span>
                        </div>
                    )}

                </div>

                {/* 4. ACTIONS DROPDOWN (Fixed at end) */}
                {!isReadOnly && field.isVirtual && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-500 transition-colors ml-1 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => dispatch(updateField({ nodeId, fieldIndex: index, updates: { isPrimaryKey: !field.isPrimaryKey } }))}>
                                <div className="flex items-center gap-2 w-full">
                                    <div className={cn("w-4 h-4 flex items-center justify-center rounded text-[8px] font-bold border",
                                        field.isPrimaryKey ? "bg-yellow-100 border-yellow-300 text-yellow-700" : "bg-gray-50 border-gray-200 text-gray-400")}>PK</div>
                                    <span>Primary Key</span>
                                    {field.isPrimaryKey && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => dispatch(updateField({ nodeId, fieldIndex: index, updates: { isForeignKey: !field.isForeignKey } }))}>
                                <div className="flex items-center gap-2 w-full">
                                    <div className={cn("w-4 h-4 flex items-center justify-center rounded text-[8px] font-bold border",
                                        field.isForeignKey ? "bg-sky-100 border-sky-300 text-sky-700" : "bg-gray-50 border-gray-200 text-gray-400")}>FK</div>
                                    <span>Foreign Key</span>
                                    {field.isForeignKey && <Check className="w-3 h-3 ml-auto text-blue-600" />}
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
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
                                            sourceKey: (edge.data?.sourceFK as string) || edge.sourceHandle || '', // FK (stored in data for n-1)
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
                            }}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                <span>Chỉnh sửa liên kết</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-2" />
                                <span>Xóa trường</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
