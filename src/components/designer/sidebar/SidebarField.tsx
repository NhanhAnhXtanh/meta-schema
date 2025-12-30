import React, { useState, memo, useEffect } from 'react';
import { GripVertical, Key, Link2, Trash2, ChevronDown, ChevronRight, Check, Plus, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TableColumn } from '@/types/schema';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateField, deleteField, toggleFieldVisibility } from '@/store/slices/schemaSlice';
import { addVisibleNodeId, removeVisibleNodeId, openEditLinkFieldDialog } from '@/store/slices/uiSlice';
import { NestedFieldsList } from './NestedFieldsList';

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
}



const SidebarFieldBase = ({
    nodeId, field, index,
    onDragStart, onDragOver, onDrop,
    isDragging, isDragOver
}: SidebarFieldProps) => {
    const dispatch = useAppDispatch();


    const [localName, setLocalName] = useState(field.name || '');
    const [isEditing, setIsEditing] = useState(false);

    // Sync local name when field name changes from external sources, but not while editing
    useEffect(() => {
        if (!isEditing) {
            setLocalName(field.name || '');
        }
    }, [field.name, isEditing]);

    // Debounce update logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localName !== (field.name || '') && (field.isVirtual === true || field.type === 'object' || field.type === 'array')) {
                dispatch(updateField({ nodeId, fieldIndex: index, updates: { name: localName } }));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localName, nodeId, index, dispatch, field.name, field.isVirtual, field.type]);


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
    const hasNestedFields = !!targetNode;

    // Check if target node is visible on board
    const isTargetVisible = targetNode ? visibleNodeIds.includes(targetNode.id) : false;

    return (
        <div className="flex flex-col">
            <div
                draggable
                onDragStart={(e) => {
                    if ((e.target as HTMLElement).tagName === 'INPUT') {
                        e.preventDefault();
                        return;
                    }
                    onDragStart(e, index);
                }}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDrop(e, index)}
                className={cn(
                    "group/field flex items-center gap-2 px-2.5 py-2 hover:bg-gray-100 rounded-md cursor-move transition-all duration-150 border border-transparent hover:border-gray-200",
                    isDragging && "opacity-50",
                    isDragOver && "border-blue-500 bg-blue-50",
                    field.isVirtual === true && "bg-amber-50 hover:bg-amber-100 border-amber-200/50",
                    field.isVirtual !== true && field.type !== 'object' && "bg-gray-100 hover:bg-gray-150"
                )}
            >
                {/* Drag Handle - Always visible */}
                <GripVertical className="w-3 h-3 text-gray-400 cursor-move hover:text-gray-600 transition-colors flex-shrink-0" />

                {/* Expansion Toggle */}
                {hasNestedFields && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-0.5 hover:bg-gray-200 rounded text-gray-500 flex-shrink-0"
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                )}

                {/* Visibility -> For nested parent, we keep it simple */}
                <input
                    type="checkbox"
                    checked={field.visible !== false}
                    onChange={() => dispatch(toggleFieldVisibility({ nodeId, fieldIndex: index }))}
                    className="w-4 h-4 cursor-pointer accent-blue-600"
                />


                {/* Name Input */}
                <div className="flex-1 min-w-[60px] overflow-hidden flex items-center gap-2">
                    <Input
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        onFocus={() => setIsEditing(true)}
                        onBlur={() => setIsEditing(false)}
                        placeholder="Field Name"
                        disabled={field.isVirtual !== true && field.type !== 'object' && field.type !== 'array'}
                        className={cn(
                            "h-7 flex-1 text-xs bg-transparent border-0 text-gray-900 font-bold font-mono px-1 focus:bg-white focus:border-gray-500 focus:px-2 rounded placeholder:text-gray-400",
                            field.visible === false && "line-through text-gray-500",
                            (field.isVirtual !== true && field.type !== 'object' && field.type !== 'array') && "cursor-not-allowed disabled:opacity-100"
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
                            <span className="text-xs text-blue-600 font-medium truncate block" onClick={() => !isTargetVisible && dispatch(addVisibleNodeId(targetNode.id))}>
                                : {targetNode.data.label}
                            </span>
                        </div>
                    )}
                </div>

                {/* Only show controls for virtual/object fields */}
                {/* Only show controls for virtual/object fields */}
                {(field.isVirtual === true || field.type === 'object') && (
                    <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                        <div className="flex items-center gap-1 mr-1">
                            <span className="text-[10px] text-gray-900 font-bold font-mono tracking-tighter max-w-[60px] truncate" title={targetNode ? targetNode.data.label : field.type}>
                                {targetNode ? targetNode.data.label : field.type}
                            </span>

                            {/* Type Selector for Virtual Fields */}
                            <div className="relative">
                                <button
                                    className="px-1.5 py-0.5 text-[10px] rounded border transition-colors flex items-center gap-1 font-bold bg-blue-100 border-blue-300 text-blue-900 cursor-default"
                                >
                                    {field.isVirtual === true ? 'Array' : 'Object'}
                                </button>
                            </div>
                        </div>

                        {/* Key Toggles for Virtual Fields */}
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={() => {
                                    dispatch(updateField({ nodeId, fieldIndex: index, updates: { isNotNull: !field.isNotNull } }));
                                }}
                                className={cn(
                                    "h-6 w-6 flex items-center justify-center rounded transition-colors font-bold text-[10px]",
                                    field.isNotNull ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-gray-600"
                                )}
                                title="Not Null"
                            >N</button>

                            <button
                                onClick={() => {
                                    dispatch(updateField({ nodeId, fieldIndex: index, updates: { isPrimaryKey: !field.isPrimaryKey } }));
                                }}
                                className={cn(
                                    "h-6 w-6 flex items-center justify-center rounded transition-colors",
                                    field.isPrimaryKey ? "text-orange-500 bg-orange-50" : "text-gray-400 hover:text-gray-600"
                                )}
                                title="Primary Key"
                            ><Key className="w-3.5 h-3.5" /></button>

                            <button
                                onClick={() => {
                                    dispatch(updateField({ nodeId, fieldIndex: index, updates: { isForeignKey: !field.isForeignKey } }));
                                }}
                                className={cn(
                                    "h-6 w-6 flex items-center justify-center rounded transition-colors",
                                    field.isForeignKey ? "text-blue-500 bg-blue-50" : "text-gray-400 hover:text-gray-600"
                                )}
                                title="Foreign Key"
                            ><Link2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                )}

                {/* For base fields, just show type as read-only text */}
                {field.isVirtual !== true && field.type !== 'object' && (
                    <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-[10px] text-gray-600 font-bold font-mono px-2 py-1 bg-gray-100 rounded border border-gray-300">
                            {field.type}
                        </span>
                    </div>
                )}

                {(field.isVirtual || field.type === 'object') && (
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
                                            sourceKey: edge.sourceHandle, // FK
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
                            title="Edit Field"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => dispatch(deleteField({ nodeId, fieldIndex: index }))}
                            className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Field"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}

            </div>

            {/* Nested Fields View currently moved outside the field row styling to look like a tree */}
            {isExpanded && targetNode && (
                <NestedFieldsList nodeId={targetNode.id} />
            )}
        </div>
    );
};

export const SidebarField = memo(SidebarFieldBase);
