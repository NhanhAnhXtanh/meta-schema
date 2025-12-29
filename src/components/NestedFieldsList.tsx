import React from 'react';
import { Node } from '@xyflow/react';
import { TableNodeData } from './TableNode';
import { Input } from './ui/input';
import { ChevronDown, ChevronRight, GripVertical, Key, Link2, Trash2, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NestedFieldsListProps {
    tableNode: Node<TableNodeData>;
    visibleNodes: Node<TableNodeData>[];
    edges: any[];
    expandedNodes: Set<string>;
    setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
    typeDropdownOpen: { nodeId: string; fieldIndex: number } | null;
    setTypeDropdownOpen: React.Dispatch<React.SetStateAction<{ nodeId: string; fieldIndex: number } | null>>;
    typeSearchQuery: string;
    setTypeSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    draggedField: { nodeId: string; fieldIndex: number } | null;
    setDraggedField: React.Dispatch<React.SetStateAction<{ nodeId: string; fieldIndex: number } | null>>;
    dragOverFieldIndex: number | null;
    setDragOverFieldIndex: React.Dispatch<React.SetStateAction<number | null>>;
    handleFieldUpdate: (nodeId: string, fieldIndex: number, updates: Partial<TableNodeData['columns'][0]>) => void;
    handleFieldVisibilityToggle: (nodeId: string, fieldIndex: number) => void;
    handleDeleteField: (nodeId: string, fieldIndex: number) => void;
    handleAddField: (nodeId: string) => void;
    handleFieldDragStart: (e: React.DragEvent, nodeId: string, fieldIndex: number) => void;
    handleFieldDragOver: (e: React.DragEvent, nodeId: string, fieldIndex: number) => void;
    handleFieldDragLeave: () => void;
    handleFieldDrop: (e: React.DragEvent, nodeId: string, targetFieldIndex: number) => void;
    handleTypeSelect: (nodeId: string, fieldIndex: number, type: string) => void;
    filteredDataTypes: string[];
    onFieldRename: (nodeId: string, fieldIndex: number, oldName: string, newName: string) => void;
    depth?: number;
}

export const NestedFieldsList: React.FC<NestedFieldsListProps> = ({
    tableNode,
    visibleNodes,
    edges,
    expandedNodes,
    setExpandedNodes,
    typeDropdownOpen,
    setTypeDropdownOpen,
    typeSearchQuery,
    setTypeSearchQuery,
    draggedField,
    setDraggedField,
    dragOverFieldIndex,
    setDragOverFieldIndex,
    handleFieldUpdate,
    handleFieldVisibilityToggle,
    handleDeleteField,
    handleAddField,
    handleFieldDragStart,
    handleFieldDragOver,
    handleFieldDragLeave,
    handleFieldDrop,
    handleTypeSelect,
    filteredDataTypes,
    onFieldRename,
    depth = 0,
}) => {
    return (
        <div className="space-y-1.5 pt-1">
            {tableNode.data.columns.map((column: TableNodeData['columns'][0], idx: number) => {
                const isTypeDropdownOpen = typeDropdownOpen?.nodeId === tableNode.id && typeDropdownOpen?.fieldIndex === idx;
                const isDragging = draggedField?.nodeId === tableNode.id && draggedField?.fieldIndex === idx;
                const isDragOver = dragOverFieldIndex === idx && draggedField?.nodeId === tableNode.id;
                const isObjectField = column.type === 'object';
                const isVirtualField = !column.name || column.name.trim() === '';

                // Find linked table if this is a virtual field
                const linkedTableId = column.isVirtual ? edges.find(
                    e => e.source === tableNode.id && e.sourceHandle === column.name
                )?.target : null;
                const linkedTable = linkedTableId ? visibleNodes.find(n => n.id === linkedTableId) : null;
                const isFieldExpanded = expandedNodes.has(`${tableNode.id}-field-${idx}`);

                return (
                    <div key={idx}>
                        <div
                            draggable
                            onDragStart={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.tagName === 'INPUT' || target.closest('input')) {
                                    e.preventDefault();
                                    return;
                                }
                                handleFieldDragStart(e, tableNode.id, idx);
                            }}
                            onDragOver={(e) => handleFieldDragOver(e, tableNode.id, idx)}
                            onDragLeave={handleFieldDragLeave}
                            onDrop={(e) => handleFieldDrop(e, tableNode.id, idx)}
                            className={cn(
                                "group/field flex items-center gap-2 px-2.5 py-2 hover:bg-gray-800/50 rounded-md cursor-move transition-all duration-150 border border-transparent hover:border-gray-700/30",
                                isDragging && "opacity-50",
                                isDragOver && "border-blue-500 bg-blue-500/10",
                                column.isVirtual && "bg-green-500/5 hover:bg-green-500/10"
                            )}
                        >
                            {/* Expand button for virtual field with link */}
                            {column.isVirtual && linkedTable ? (
                                <button
                                    onClick={() => {
                                        const fieldKey = `${tableNode.id}-field-${idx}`;
                                        setExpandedNodes((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(fieldKey)) {
                                                next.delete(fieldKey);
                                            } else {
                                                next.add(fieldKey);
                                            }
                                            return next;
                                        });
                                    }}
                                    className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                                >
                                    {isFieldExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-green-400" />
                                    ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-green-400" />
                                    )}
                                </button>
                            ) : (
                                <GripVertical className="w-3 h-3 text-gray-600 cursor-move hover:text-gray-400 transition-colors" />
                            )}

                            {/* Checkbox for visibility */}
                            <input
                                type="checkbox"
                                checked={column.visible !== false}
                                onChange={() => handleFieldVisibilityToggle(tableNode.id, idx)}
                                className="w-4 h-4 cursor-pointer"
                            />

                            {/* Field name */}
                            <div className="flex-1 min-w-[60px] overflow-hidden flex items-center gap-2">
                                <Input
                                    value={column.name || ''}
                                    onChange={(e) => {
                                        if (isObjectField) return;
                                        const oldName = column.name;
                                        const newName = e.target.value;
                                        handleFieldUpdate(tableNode.id, idx, { name: newName });
                                        if (oldName && oldName !== newName) {
                                            onFieldRename(tableNode.id, idx, oldName, newName);
                                        }
                                    }}
                                    placeholder="Tên field"
                                    disabled={isObjectField}
                                    className={cn(
                                        "h-7 flex-1 text-xs bg-transparent border-0 text-gray-200 font-mono px-1 focus:bg-gray-700 focus:border-gray-600 focus:px-2 rounded",
                                        column.visible === false && "line-through text-gray-600",
                                        isObjectField && "cursor-not-allowed opacity-60"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                    onDragStart={(e) => e.preventDefault()}
                                    draggable={false}
                                />
                                {column.isVirtual && linkedTable && (
                                    <span className="text-xs text-green-400 font-medium px-2 py-0.5 bg-green-500/10 rounded border border-green-500/30 whitespace-nowrap">
                                        → {linkedTable.data.label}
                                    </span>
                                )}
                            </div>

                            {/* Type dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        if (!isObjectField && isVirtualField) {
                                            setTypeDropdownOpen({ nodeId: tableNode.id, fieldIndex: idx });
                                        }
                                    }}
                                    disabled={isObjectField || !isVirtualField}
                                    className={cn(
                                        "h-7 px-2 text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded flex items-center gap-1 hover:bg-gray-600 min-w-[80px]",
                                        (isObjectField || !isVirtualField) && "cursor-not-allowed opacity-60"
                                    )}
                                >
                                    <span className="font-mono">{column.type || 'varchar'}</span>
                                    {!isObjectField && isVirtualField && <ChevronDown className="w-3 h-3" />}
                                </button>

                                {isTypeDropdownOpen && !isObjectField && isVirtualField && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => {
                                                setTypeDropdownOpen(null);
                                                setTypeSearchQuery('');
                                            }}
                                        />
                                        <div className="absolute left-0 top-8 z-20 bg-gray-800 border border-gray-700 rounded-md shadow-lg w-56 max-h-64 overflow-hidden">
                                            <div className="p-2 border-b border-gray-700">
                                                <Input
                                                    placeholder="Search..."
                                                    value={typeSearchQuery}
                                                    onChange={(e) => setTypeSearchQuery(e.target.value)}
                                                    className="h-7 text-xs bg-gray-700 border-gray-600 text-white"
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {filteredDataTypes.map((type: string) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => handleTypeSelect(tableNode.id, idx, type)}
                                                        className={cn(
                                                            "w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center justify-between",
                                                            column.type === type && "bg-gray-700"
                                                        )}
                                                    >
                                                        <span className="font-mono">{type}</span>
                                                        {column.type === type && <Check className="w-4 h-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* NotNull button */}
                            <button
                                onClick={() => {
                                    if (!isObjectField) {
                                        handleFieldUpdate(tableNode.id, idx, { isNotNull: !column.isNotNull });
                                    }
                                }}
                                disabled={isObjectField}
                                className={cn(
                                    "h-7 w-7 flex items-center justify-center rounded text-xs font-semibold transition-colors",
                                    column.isNotNull
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-700 text-gray-400 hover:bg-gray-600",
                                    isObjectField && "cursor-not-allowed opacity-60"
                                )}
                                title="Not Null"
                            >
                                N
                            </button>

                            {/* PK button */}
                            <button
                                onClick={() => {
                                    if (!isObjectField) {
                                        handleFieldUpdate(tableNode.id, idx, { isPrimaryKey: !column.isPrimaryKey });
                                    }
                                }}
                                disabled={isObjectField}
                                className={cn(
                                    "h-7 w-7 flex items-center justify-center rounded transition-colors",
                                    column.isPrimaryKey
                                        ? "text-orange-400"
                                        : "text-gray-400 hover:text-gray-300",
                                    isObjectField && "cursor-not-allowed opacity-60"
                                )}
                                title="Primary Key"
                            >
                                <Key className="w-4 h-4" />
                            </button>

                            {/* FK button */}
                            <button
                                onClick={() => {
                                    if (!isObjectField) {
                                        handleFieldUpdate(tableNode.id, idx, { isForeignKey: !column.isForeignKey });
                                    }
                                }}
                                disabled={isObjectField}
                                className={cn(
                                    "h-7 w-7 flex items-center justify-center rounded transition-colors",
                                    column.isForeignKey
                                        ? "text-blue-400"
                                        : "text-gray-400 hover:text-gray-300",
                                    isObjectField && "cursor-not-allowed opacity-60"
                                )}
                                title="Foreign Key"
                            >
                                <Link2 className="w-4 h-4" />
                            </button>

                            {/* Delete button */}
                            {!isObjectField && (
                                <button
                                    onClick={() => handleDeleteField(tableNode.id, idx)}
                                    className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover/field:opacity-100"
                                    title="Xóa field"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* RECURSIVE: Render nested linked table fields */}
                        {column.isVirtual && linkedTable && isFieldExpanded && (
                            <div className="ml-4 mt-1.5 border-l-2 border-green-500/60 pl-2">
                                <NestedFieldsList
                                    tableNode={linkedTable}
                                    visibleNodes={visibleNodes}
                                    edges={edges}
                                    expandedNodes={expandedNodes}
                                    setExpandedNodes={setExpandedNodes}
                                    typeDropdownOpen={typeDropdownOpen}
                                    setTypeDropdownOpen={setTypeDropdownOpen}
                                    typeSearchQuery={typeSearchQuery}
                                    setTypeSearchQuery={setTypeSearchQuery}
                                    draggedField={draggedField}
                                    setDraggedField={setDraggedField}
                                    dragOverFieldIndex={dragOverFieldIndex}
                                    setDragOverFieldIndex={setDragOverFieldIndex}
                                    handleFieldUpdate={handleFieldUpdate}
                                    handleFieldVisibilityToggle={handleFieldVisibilityToggle}
                                    handleDeleteField={handleDeleteField}
                                    handleAddField={handleAddField}
                                    handleFieldDragStart={handleFieldDragStart}
                                    handleFieldDragOver={handleFieldDragOver}
                                    handleFieldDragLeave={handleFieldDragLeave}
                                    handleFieldDrop={handleFieldDrop}
                                    handleTypeSelect={handleTypeSelect}
                                    filteredDataTypes={filteredDataTypes}
                                    onFieldRename={onFieldRename}
                                    depth={depth + 1}
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Add field button */}
            <button
                onClick={() => handleAddField(tableNode.id)}
                className="w-full mt-2 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-700/20 rounded-md flex items-center justify-center gap-2 border border-dashed border-gray-700 hover:border-blue-500/50 transition-all duration-200"
            >
                <Plus className="w-3.5 h-3.5" />
                Thêm trường
            </button>
        </div>
    );
};
