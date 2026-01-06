import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { SidebarField } from './SidebarField';
import { Plus } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { reorderFields } from '@/store/slices/schemaSlice';
import { openLinkFieldDialog } from '@/store/slices/uiSlice';
import { TableColumn } from '@/types/schema';

interface NestedFieldsListProps {
    nodeId?: string; // Target Node ID (for Linked Tables)
    fields?: TableColumn[]; // Direct Fields (for Inline Objects)
    rootNodeId?: string; // The ID of the root table (for context)
    isReadOnly?: boolean; // Force read-only state
}

export function NestedFieldsList({ nodeId, fields, rootNodeId, isReadOnly }: NestedFieldsListProps) {
    const dispatch = useAppDispatch();
    const targetNode = useAppSelector(state => nodeId ? state.schema.present.nodes.find(n => n.id === nodeId) : null);

    // Field DnD state
    const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
    const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(null);

    // If neither link nor inline fields, nothing to show
    if (!targetNode && !fields) return null;

    // Determine the data source
    const displayFields = fields || (targetNode ? targetNode.data.columns : []);
    const isInline = !!fields;
    const label = isInline ? 'Inline Structure' : targetNode?.data.label;
    const activeNodeId = isInline ? (rootNodeId || '') : (targetNode?.id || '');

    // Effective readonly state: Always true for inline, or if prop is true
    const effectiveReadOnly = isInline || isReadOnly;

    const handleFieldDragStart = (e: React.DragEvent, index: number) => {
        setDraggedFieldIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
    };

    const handleFieldDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedFieldIndex !== null && draggedFieldIndex !== index) {
            setDragOverFieldIndex(index);
        }
    };

    const handleFieldDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!effectiveReadOnly && activeNodeId && draggedFieldIndex !== null && draggedFieldIndex !== index) {
            dispatch(reorderFields({ nodeId: activeNodeId, oldIndex: draggedFieldIndex, newIndex: index }));
        }
        setDraggedFieldIndex(null);
        setDragOverFieldIndex(null);
    };

    return (
        <div className="pl-3 pr-0 ml-3 border-l-2 border-dashed border-gray-300 space-y-1 relative my-2">
            {/* Tree Branch Connector */}
            <div className="absolute -left-[2px] -top-3 w-3 h-4 border-l-2 border-b-2 border-dashed border-gray-300 rounded-bl-lg pointer-events-none" />

            {/* Header */}
            <div className="text-[10px] uppercase font-black text-gray-400 mb-2 pl-2 flex items-center gap-1.5 tracking-wider select-none">
                <span className="bg-gray-100 text-gray-500 px-1 py-0.5 rounded border border-gray-200">
                    {isInline ? 'INLINE' : 'REF OBJECT'}
                </span>
                {label}
            </div>
            {displayFields.map((col, idx) => (
                <SidebarField
                    key={`${activeNodeId || 'inline'}-${idx}`}
                    nodeId={activeNodeId}
                    field={col}
                    index={idx}
                    onDragStart={handleFieldDragStart}
                    onDragOver={handleFieldDragOver}
                    onDrop={handleFieldDrop}
                    isDragging={draggedFieldIndex === idx}
                    isDragOver={dragOverFieldIndex === idx}
                    isReadOnly={effectiveReadOnly}
                />
            ))}

            {!effectiveReadOnly && activeNodeId && (
                <button
                    onClick={() => dispatch(openLinkFieldDialog(activeNodeId))}
                    className="w-full mt-2 py-1.5 text-[10px] border border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded flex items-center justify-center gap-1 transition-colors"
                >
                    <Plus className="w-3 h-3" /> Add Column to {label}
                </button>
            )}
        </div>
    );
}
