import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { SidebarField } from './SidebarField';
import { Plus } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { addField, reorderFields } from '@/store/slices/schemaSlice';

interface NestedFieldsListProps {
    nodeId: string;
}

export function NestedFieldsList({ nodeId }: NestedFieldsListProps) {
    const dispatch = useAppDispatch();
    const node = useAppSelector(state => state.schema.present.nodes.find(n => n.id === nodeId));

    // Field DnD state
    const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
    const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(null);

    if (!node) return null;

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
        if (draggedFieldIndex !== null && draggedFieldIndex !== index) {
            dispatch(reorderFields({ nodeId: node.id, oldIndex: draggedFieldIndex, newIndex: index }));
        }
        setDraggedFieldIndex(null);
        setDragOverFieldIndex(null);
    };

    return (
        <div className="pl-4 pr-2 border-l-2 border-gray-200 ml-2 mb-2 space-y-1 mt-1">
            <div className="text-[10px] text-gray-900 font-bold mb-1 flex items-center gap-2">
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                Linked from {node.data.label}
            </div>
            {node.data.columns.map((col, idx) => (
                <SidebarField
                    key={`${nodeId}-${idx}`}
                    nodeId={nodeId}
                    field={col}
                    index={idx}
                    onDragStart={handleFieldDragStart}
                    onDragOver={handleFieldDragOver}
                    onDrop={handleFieldDrop}
                    isDragging={draggedFieldIndex === idx}
                    isDragOver={dragOverFieldIndex === idx}
                />
            ))}
            <button
                onClick={() => window.dispatchEvent(new CustomEvent('addField', { detail: { nodeId: node.id } }))}
                className="w-full mt-2 py-1.5 text-[10px] border border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded flex items-center justify-center gap-1 transition-colors"
            >
                <Plus className="w-3 h-3" /> Add Column to {node.data.label}
            </button>
        </div>
    );
}
