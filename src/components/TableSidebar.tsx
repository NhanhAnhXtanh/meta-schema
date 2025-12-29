import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { TableNodeData } from './TableNode';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Search, ChevronDown, ChevronRight, GripVertical, Palette, Key, Check, Link2, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { NestedFieldsList } from './NestedFieldsList';

interface TableSidebarProps {
  nodes: Node<TableNodeData>[];
  selectedNodeId?: string;
  onNodeSelect: (nodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeUpdate: (nodeId: string, updates: Partial<TableNodeData>) => void;
  onAddTable: () => void;
  tableColors: Record<string, string>;
  onColorChange: (nodeId: string, color: string) => void;
  onNodesReorder: (newOrder: Node<TableNodeData>[]) => void;
  onFieldReorder: (nodeId: string, oldIndex: number, newIndex: number) => void;
  onFieldRename: (nodeId: string, fieldIndex: number, oldName: string, newName: string) => void;
  onFieldVisibilityToggle?: (nodeId: string, fieldIndex: number, newVisibility: boolean) => void;
  onFieldDelete?: (nodeId: string, fieldIndex: number) => void;
  visibleNodeIds: Set<string>; // Chỉ hiển thị các bảng visible
  edges: any[]; // Để xây dựng tree structure
}

const COLOR_OPTIONS = [
  { name: 'Xanh lá', value: '#22c55e' },
  { name: 'Tím', value: '#a855f7' },
  { name: 'Vàng', value: '#eab308' },
  { name: 'Xanh dương', value: '#3b82f6' },
  { name: 'Đỏ', value: '#ef4444' },
  { name: 'Xanh ngọc', value: '#14b8a6' },
  { name: 'Cam', value: '#f97316' },
  { name: 'Hồng', value: '#ec4899' },
];

const DATA_TYPES = [
  'boolean',
  'date',
  'int',
  'text',
  'timestamp',
  'timestamptz',
  'varchar(n)',
  'bigint',
  'decimal',
  'float',
  'double',
  'char(n)',
  'json',
  'jsonb',
  'uuid',
  'money',
  'serial',
  'bigserial',
];

export function TableSidebar({
  nodes,
  selectedNodeId,
  onNodeSelect,
  onNodeDelete,
  onNodeUpdate,
  onAddTable,
  tableColors,
  onColorChange,
  onNodesReorder,
  onFieldReorder,
  onFieldRename,
  onFieldVisibilityToggle,
  onFieldDelete,
  visibleNodeIds,
  edges,
}: TableSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpenNodeId, setMenuOpenNodeId] = useState<string | null>(null);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [colorDialogNodeId, setColorDialogNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<{ nodeId: string; fieldIndex: number } | null>(null);
  const [typeSearchQuery, setTypeSearchQuery] = useState('');
  const [draggedField, setDraggedField] = useState<{ nodeId: string; fieldIndex: number } | null>(null);
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width: w-80 = 320px
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Chỉ hiển thị các nodes visible
  const visibleNodes = useMemo(() => {
    return nodes.filter(node => visibleNodeIds.has(node.id));
  }, [nodes, visibleNodeIds]);

  // Build tree structure dựa trên edges
  const nodeTree = useMemo(() => {
    const tree: Record<string, string[]> = {}; // parentId -> childIds[]

    // Tìm parent-child relationships từ edges
    edges.forEach(edge => {
      const sourceNode = visibleNodes.find(n => n.id === edge.source);
      const targetNode = visibleNodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        // Target node là child của source node
        if (!tree[edge.source]) {
          tree[edge.source] = [];
        }
        if (!tree[edge.source].includes(edge.target)) {
          tree[edge.source].push(edge.target);
        }
      }
    });

    return tree;
  }, [visibleNodes, edges]);

  // Tìm root nodes (không phải child của ai)
  const rootNodes = useMemo(() => {
    const childIds = new Set<string>();
    Object.values(nodeTree).forEach(children => {
      children.forEach(childId => childIds.add(childId));
    });

    return visibleNodes.filter(node => !childIds.has(node.id));
  }, [visibleNodes, nodeTree]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return rootNodes;
    const query = searchQuery.toLowerCase();
    return visibleNodes.filter((node) =>
      node.data.label.toLowerCase().includes(query)
    );
  }, [rootNodes, visibleNodes, searchQuery]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleEdit = (node: Node<TableNodeData>) => {
    setEditingNodeId(node.id);
    setEditName(node.data.label);
  };

  const handleSaveEdit = () => {
    if (editingNodeId && editName.trim()) {
      onNodeUpdate(editingNodeId, { label: editName.trim() });
      setEditingNodeId(null);
      setEditName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingNodeId(null);
    setEditName('');
  };

  const openColorDialog = (nodeId: string) => {
    setColorDialogNodeId(nodeId);
    setColorDialogOpen(true);
    setMenuOpenNodeId(null);
  };

  const handleColorSelect = (color: string) => {
    if (colorDialogNodeId) {
      onColorChange(colorDialogNodeId, color);
      setColorDialogOpen(false);
      setColorDialogNodeId(null);
    }
  };

  const handleFieldUpdate = (nodeId: string, fieldIndex: number, updates: Partial<TableNodeData['columns'][0]>) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newColumns = [...node.data.columns];
    newColumns[fieldIndex] = { ...newColumns[fieldIndex], ...updates };
    onNodeUpdate(nodeId, { columns: newColumns });
  };

  const handleFieldVisibilityToggle = (nodeId: string, fieldIndex: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const field = node.data.columns[fieldIndex];
    const newVisibility = field.visible === false ? true : false;

    const newColumns = [...node.data.columns];
    newColumns[fieldIndex] = {
      ...newColumns[fieldIndex],
      visible: newVisibility,
    };
    onNodeUpdate(nodeId, { columns: newColumns });

    // Gọi callback để xử lý logic ẩn object field nếu cần
    if (onFieldVisibilityToggle) {
      onFieldVisibilityToggle(nodeId, fieldIndex, newVisibility);
    }
  };

  const handleAddField = (nodeId: string) => {
    // Dispatch custom event để App.tsx mở dialog link field
    const event = new CustomEvent('addField', { detail: { nodeId } });
    window.dispatchEvent(event);
  };

  const handleDeleteField = (nodeId: string, fieldIndex: number) => {
    if (onFieldDelete) {
      onFieldDelete(nodeId, fieldIndex);
    } else {
      // Fallback nếu không có callback
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      const field = node.data.columns[fieldIndex];

      // Không cho phép xóa field object
      if (field.type === 'object') {
        return;
      }

      const newColumns = node.data.columns.filter((_, idx) => idx !== fieldIndex);
      onNodeUpdate(nodeId, { columns: newColumns });
    }
  };


  const handleFieldDragStart = (e: React.DragEvent, nodeId: string, fieldIndex: number) => {
    setDraggedField({ nodeId, fieldIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFieldDragOver = (e: React.DragEvent, nodeId: string, fieldIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedField && draggedField.nodeId === nodeId && draggedField.fieldIndex !== fieldIndex) {
      setDragOverFieldIndex(fieldIndex);
    }
  };

  const handleFieldDragLeave = () => {
    setDragOverFieldIndex(null);
  };

  const handleFieldDrop = (e: React.DragEvent, nodeId: string, targetFieldIndex: number) => {
    e.preventDefault();
    if (!draggedField || draggedField.nodeId !== nodeId) {
      setDraggedField(null);
      setDragOverFieldIndex(null);
      return;
    }

    const oldIndex = draggedField.fieldIndex;
    if (oldIndex === targetFieldIndex) {
      setDraggedField(null);
      setDragOverFieldIndex(null);
      return;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newColumns = [...node.data.columns];
    const [removed] = newColumns.splice(oldIndex, 1);
    newColumns.splice(targetFieldIndex, 0, removed);

    onNodeUpdate(nodeId, { columns: newColumns });
    onFieldReorder(nodeId, oldIndex, targetFieldIndex);
    setDraggedField(null);
    setDragOverFieldIndex(null);
  };

  const filteredDataTypes = useMemo(() => {
    if (!typeSearchQuery.trim()) return DATA_TYPES;
    const query = typeSearchQuery.toLowerCase();
    return DATA_TYPES.filter((type: string) => type.toLowerCase().includes(query));
  }, [typeSearchQuery]);

  const handleTypeSelect = (nodeId: string, fieldIndex: number, type: string) => {
    handleFieldUpdate(nodeId, fieldIndex, { type });
    setTypeDropdownOpen(null);
    setTypeSearchQuery('');
  };

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedNodeId && draggedNodeId !== nodeId) {
      setDragOverNodeId(nodeId);
    }
  };

  const handleDragLeave = () => {
    setDragOverNodeId(null);
  };

  const handleDrop = (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault();
    if (!draggedNodeId || draggedNodeId === targetNodeId) {
      setDraggedNodeId(null);
      setDragOverNodeId(null);
      return;
    }

    const draggedIndex = nodes.findIndex(n => n.id === draggedNodeId);
    const targetIndex = nodes.findIndex(n => n.id === targetNodeId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newNodes = [...nodes];
    const [removed] = newNodes.splice(draggedIndex, 1);
    newNodes.splice(targetIndex, 0, removed);

    onNodesReorder(newNodes);
    setDraggedNodeId(null);
    setDragOverNodeId(null);
  };

  const getNodeColor = (nodeId: string) => {
    return tableColors[nodeId] || COLOR_OPTIONS[0].value;
  };

  // Render node và children recursively
  const renderNodeWithChildren = (node: Node<TableNodeData>, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const nodeColor = getNodeColor(node.id);
    const isDragging = draggedNodeId === node.id;
    const isDragOver = dragOverNodeId === node.id;
    const children = nodeTree[node.id] || [];

    return (
      <div key={node.id}>
        {/* Node chính */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.id)}
          className={cn(
            'group hover:bg-gray-800/60 transition-all duration-200 rounded-lg mx-2 mb-1',
            isSelected && 'bg-gray-800/80 shadow-lg border border-gray-700/50',
            isDragging && 'opacity-50',
            isDragOver && 'border-t-2 border-blue-500'
          )}
          style={{ paddingLeft: `${depth === 0 ? 8 : depth * 12 + 8}px` }}
        >
          <div className="flex items-center relative">
            {/* Color bar với gradient - chỉ hiển thị cho root nodes */}
            {depth === 0 && (
              <div
                className="w-1.5 h-12 rounded-r-full shadow-sm"
                style={{
                  background: `linear-gradient(180deg, ${nodeColor} 0%, ${nodeColor}dd 100%)`
                }}
              />
            )}
            {/* Line xanh dọc cho nested tables */}
            {depth > 0 && (
              <div className="w-0.5 h-12 bg-green-500/60 rounded-r-full mr-1" />
            )}

            {/* Expand/Collapse */}
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-2 hover:bg-gray-700"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Drag handle */}
            <GripVertical className="w-4 h-4 text-gray-500 mr-2 cursor-move" />

            {/* Node name */}
            <div
              className="flex-1 cursor-pointer py-3"
              onClick={() => onNodeSelect(node.id)}
            >
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  autoFocus
                  className="h-8 bg-gray-700 border-gray-600 text-white"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-sm font-medium">{node.data.label}</span>
              )}
            </div>

            {/* Menu button */}
            <div className="relative">
              <button
                onClick={() =>
                  setMenuOpenNodeId(
                    menuOpenNodeId === node.id ? null : node.id
                  )
                }
                className="p-2 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>

              {menuOpenNodeId === node.id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpenNodeId(null)}
                  />
                  <div className="absolute right-2 top-10 z-20 bg-gray-800 border border-gray-700 rounded-md shadow-lg min-w-[160px]">
                    <button
                      onClick={() => handleEdit(node)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Chỉnh sửa tên
                    </button>
                    <button
                      onClick={() => openColorDialog(node.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Palette className="w-4 h-4" />
                      Đổi màu
                    </button>
                    <button
                      onClick={() => {
                        onNodeDelete(node.id);
                        setMenuOpenNodeId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Expanded columns */}
          {isExpanded && (
            <div className="pl-4 pr-4 pb-3 space-y-1.5 border-t border-gray-700/30 pt-3 mt-2 bg-gray-900/30 rounded-b-lg">
              <div className="text-xs font-bold text-gray-400 mb-3 px-2 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-3 bg-gray-600 rounded-full"></div>
                Trường
              </div>
              {node.data.columns.map((column: TableNodeData['columns'][0], idx: number) => {
                const isTypeDropdownOpen = typeDropdownOpen?.nodeId === node.id && typeDropdownOpen?.fieldIndex === idx;
                const isDragging = draggedField?.nodeId === node.id && draggedField?.fieldIndex === idx;
                const isDragOver = dragOverFieldIndex === idx && draggedField?.nodeId === node.id;
                const isObjectField = column.type === 'object';
                // Virtual field là field mới thêm (chưa có tên hoặc tên rỗng)
                const isVirtualField = !column.name || column.name.trim() === '';

                // Tìm bảng linked nếu field là virtual
                const linkedTableId = column.isVirtual ? edges.find(
                  e => e.source === node.id && e.sourceHandle === column.name
                )?.target : null;
                const linkedTable = linkedTableId ? visibleNodes.find(n => n.id === linkedTableId) : null;
                const isFieldExpanded = expandedNodes.has(`${node.id}-field-${idx}`);

                return (
                  <div key={idx}>
                    <div
                      draggable
                      onDragStart={(e) => {
                        // Chỉ cho phép drag nếu không phải từ Input
                        const target = e.target as HTMLElement;
                        if (target.tagName === 'INPUT' || target.closest('input')) {
                          e.preventDefault();
                          return;
                        }
                        handleFieldDragStart(e, node.id, idx);
                      }}
                      onDragOver={(e) => handleFieldDragOver(e, node.id, idx)}
                      onDragLeave={handleFieldDragLeave}
                      onDrop={(e) => handleFieldDrop(e, node.id, idx)}
                      className={cn(
                        "group/field flex items-center gap-2 px-2.5 py-2 hover:bg-gray-800/50 rounded-md cursor-move transition-all duration-150 border border-transparent hover:border-gray-700/30",
                        isDragging && "opacity-50",
                        isDragOver && "border-blue-500 bg-blue-500/10",
                        column.isVirtual && "bg-green-500/5 hover:bg-green-500/10"
                      )}
                    >
                      {/* Expand button cho virtual field có link */}
                      {column.isVirtual && linkedTable ? (
                        <button
                          onClick={() => {
                            const fieldKey = `${node.id}-field-${idx}`;
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
                        onChange={() => handleFieldVisibilityToggle(node.id, idx)}
                        className="w-4 h-4 cursor-pointer"
                      />

                      {/* Field name - editable directly, disabled for object */}
                      <div className="flex-1 min-w-[60px] overflow-hidden flex items-center gap-2">
                        <Input
                          value={column.name || ''}
                          onChange={(e) => {
                            if (isObjectField) return;
                            const oldName = column.name;
                            const newName = e.target.value;
                            handleFieldUpdate(node.id, idx, { name: newName });
                            if (oldName && oldName !== newName) {
                              onFieldRename(node.id, idx, oldName, newName);
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
                        {/* Hiển thị tên bảng linked ngay cạnh tên field */}
                        {column.isVirtual && linkedTable && (
                          <span className="text-xs text-green-400 font-medium px-2 py-0.5 bg-green-500/10 rounded border border-green-500/30 whitespace-nowrap">
                            → {linkedTable.data.label}
                          </span>
                        )}
                      </div>

                      {/* Type dropdown - disabled for object và field có sẵn (chỉ cho phép với virtual field) */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            if (!isObjectField && isVirtualField) {
                              setTypeDropdownOpen({ nodeId: node.id, fieldIndex: idx });
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
                                    onClick={() => handleTypeSelect(node.id, idx, type)}
                                    className={cn(
                                      "w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center justify-between",
                                      column.type === type && "bg-gray-700"
                                    )}
                                  >
                                    <span className="font-mono">{type}</span>
                                    {column.type === type && (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* NotNull button - disabled for object */}
                      <button
                        onClick={() => {
                          if (!isObjectField) {
                            handleFieldUpdate(node.id, idx, { isNotNull: !column.isNotNull });
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

                      {/* PK button - disabled for object */}
                      <button
                        onClick={() => {
                          if (!isObjectField) {
                            handleFieldUpdate(node.id, idx, { isPrimaryKey: !column.isPrimaryKey });
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

                      {/* FK button - disabled for object */}
                      <button
                        onClick={() => {
                          if (!isObjectField) {
                            handleFieldUpdate(node.id, idx, { isForeignKey: !column.isForeignKey });
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

                      {/* Delete button - disabled for object */}
                      {!isObjectField && (
                        <button
                          onClick={() => handleDeleteField(node.id, idx)}
                          className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover/field:opacity-100"
                          title="Xóa field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Hiển thị chỉ fields của bảng linked - không có header bảng */}
                    {column.isVirtual && linkedTable && isFieldExpanded && (
                      <div className="ml-4 mt-1.5 border-l-2 border-green-500/60 pl-2">
                        {/* Chỉ render fields, không render node header */}
                        <div className="space-y-1.5 pt-1">
                          {linkedTable.data.columns.map((linkedColumn: TableNodeData['columns'][0], linkedIdx: number) => {
                            const isLinkedTypeDropdownOpen = typeDropdownOpen?.nodeId === linkedTable.id && typeDropdownOpen?.fieldIndex === linkedIdx;
                            const isLinkedDragging = draggedField?.nodeId === linkedTable.id && draggedField?.fieldIndex === linkedIdx;
                            const isLinkedDragOver = dragOverFieldIndex === linkedIdx && draggedField?.nodeId === linkedTable.id;
                            const isLinkedObjectField = linkedColumn.type === 'object';
                            const isLinkedVirtualField = !linkedColumn.name || linkedColumn.name.trim() === '';

                            // Tìm bảng linked nếu field nested cũng là virtual
                            const nestedLinkedTableId = linkedColumn.isVirtual ? edges.find(
                              e => e.source === linkedTable.id && e.sourceHandle === linkedColumn.name
                            )?.target : null;
                            const nestedLinkedTable = nestedLinkedTableId ? visibleNodes.find(n => n.id === nestedLinkedTableId) : null;
                            const isNestedFieldExpanded = expandedNodes.has(`${linkedTable.id}-field-${linkedIdx}`);

                            return (
                              <div key={linkedIdx}>
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (target.tagName === 'INPUT' || target.closest('input')) {
                                      e.preventDefault();
                                      return;
                                    }
                                    handleFieldDragStart(e, linkedTable.id, linkedIdx);
                                  }}
                                  onDragOver={(e) => handleFieldDragOver(e, linkedTable.id, linkedIdx)}
                                  onDragLeave={handleFieldDragLeave}
                                  onDrop={(e) => handleFieldDrop(e, linkedTable.id, linkedIdx)}
                                  className={cn(
                                    "group/field flex items-center gap-2 px-2.5 py-2 hover:bg-gray-800/50 rounded-md cursor-move transition-all duration-150 border border-transparent hover:border-gray-700/30",
                                    isLinkedDragging && "opacity-50",
                                    isLinkedDragOver && "border-blue-500 bg-blue-500/10"
                                  )}
                                >
                                  {/* Expand button cho nested virtual field có link */}
                                  {linkedColumn.isVirtual && nestedLinkedTable ? (
                                    <button
                                      onClick={() => {
                                        const nestedFieldKey = `${linkedTable.id}-field-${linkedIdx}`;
                                        setExpandedNodes((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(nestedFieldKey)) {
                                            next.delete(nestedFieldKey);
                                          } else {
                                            next.add(nestedFieldKey);
                                          }
                                          return next;
                                        });
                                      }}
                                      className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                                    >
                                      {isNestedFieldExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-green-400" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-green-400" />
                                      )}
                                    </button>
                                  ) : (
                                    <GripVertical className="w-3 h-3 text-gray-600 cursor-move hover:text-gray-400 transition-colors" />
                                  )}

                                  {/* Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={linkedColumn.visible !== false}
                                    onChange={() => handleFieldVisibilityToggle(linkedTable.id, linkedIdx)}
                                    className="w-4 h-4 cursor-pointer"
                                  />

                                  {/* Field name */}
                                  <div className="flex-1 min-w-[60px] overflow-hidden flex items-center gap-2">
                                    <Input
                                      value={linkedColumn.name || ''}
                                      onChange={(e) => {
                                        if (isLinkedObjectField) return;
                                        const oldName = linkedColumn.name;
                                        const newName = e.target.value;
                                        handleFieldUpdate(linkedTable.id, linkedIdx, { name: newName });
                                        if (oldName && oldName !== newName) {
                                          onFieldRename(linkedTable.id, linkedIdx, oldName, newName);
                                        }
                                      }}
                                      placeholder="Tên field"
                                      disabled={isLinkedObjectField}
                                      className={cn(
                                        "h-7 flex-1 text-xs bg-transparent border-0 text-gray-200 font-mono px-1 focus:bg-gray-700 focus:border-gray-600 focus:px-2 rounded",
                                        linkedColumn.visible === false && "line-through text-gray-600",
                                        isLinkedObjectField && "cursor-not-allowed opacity-60"
                                      )}
                                      onClick={(e) => e.stopPropagation()}
                                      onDragStart={(e) => e.preventDefault()}
                                      draggable={false}
                                    />
                                    {/* Hiển thị tên bảng linked ngay cạnh tên field */}
                                    {linkedColumn.isVirtual && nestedLinkedTable && (
                                      <span className="text-xs text-green-400 font-medium px-2 py-0.5 bg-green-500/10 rounded border border-green-500/30 whitespace-nowrap">
                                        → {nestedLinkedTable.data.label}
                                      </span>
                                    )}
                                  </div>

                                  {/* Type dropdown */}
                                  <div className="relative">
                                    <button
                                      onClick={() => {
                                        if (!isLinkedObjectField && isLinkedVirtualField) {
                                          setTypeDropdownOpen({ nodeId: linkedTable.id, fieldIndex: linkedIdx });
                                        }
                                      }}
                                      disabled={isLinkedObjectField || !isLinkedVirtualField}
                                      className={cn(
                                        "h-7 px-2 text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded flex items-center gap-1 hover:bg-gray-600 min-w-[80px]",
                                        (isLinkedObjectField || !isLinkedVirtualField) && "cursor-not-allowed opacity-60"
                                      )}
                                    >
                                      <span className="font-mono">{linkedColumn.type || 'varchar'}</span>
                                      {!isLinkedObjectField && isLinkedVirtualField && <ChevronDown className="w-3 h-3" />}
                                    </button>
                                  </div>

                                  {/* NotNull button */}
                                  <button
                                    onClick={() => {
                                      if (!isLinkedObjectField) {
                                        handleFieldUpdate(linkedTable.id, linkedIdx, { isNotNull: !linkedColumn.isNotNull });
                                      }
                                    }}
                                    disabled={isLinkedObjectField}
                                    className={cn(
                                      "h-7 w-7 flex items-center justify-center rounded text-xs font-semibold transition-colors",
                                      linkedColumn.isNotNull
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-700 text-gray-400 hover:bg-gray-600",
                                      isLinkedObjectField && "cursor-not-allowed opacity-60"
                                    )}
                                    title="Not Null"
                                  >
                                    N
                                  </button>

                                  {/* PK button */}
                                  <button
                                    onClick={() => {
                                      if (!isLinkedObjectField) {
                                        handleFieldUpdate(linkedTable.id, linkedIdx, { isPrimaryKey: !linkedColumn.isPrimaryKey });
                                      }
                                    }}
                                    disabled={isLinkedObjectField}
                                    className={cn(
                                      "h-7 w-7 flex items-center justify-center rounded transition-colors",
                                      linkedColumn.isPrimaryKey
                                        ? "text-orange-400"
                                        : "text-gray-400 hover:text-gray-300",
                                      isLinkedObjectField && "cursor-not-allowed opacity-60"
                                    )}
                                    title="Primary Key"
                                  >
                                    <Key className="w-4 h-4" />
                                  </button>

                                  {/* FK button */}
                                  <button
                                    onClick={() => {
                                      if (!isLinkedObjectField) {
                                        handleFieldUpdate(linkedTable.id, linkedIdx, { isForeignKey: !linkedColumn.isForeignKey });
                                      }
                                    }}
                                    disabled={isLinkedObjectField}
                                    className={cn(
                                      "h-7 w-7 flex items-center justify-center rounded transition-colors",
                                      linkedColumn.isForeignKey
                                        ? "text-blue-400"
                                        : "text-gray-400 hover:text-gray-300",
                                      isLinkedObjectField && "cursor-not-allowed opacity-60"
                                    )}
                                    title="Foreign Key"
                                  >
                                    <Link2 className="w-4 h-4" />
                                  </button>

                                  {/* Delete button */}
                                  {!isLinkedObjectField && (
                                    <button
                                      onClick={() => handleDeleteField(linkedTable.id, linkedIdx)}
                                      className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover/field:opacity-100"
                                      title="Xóa field"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Hiển thị fields của nested linked table (recursive) */}
                                {linkedColumn.isVirtual && nestedLinkedTable && isNestedFieldExpanded && (
                                  <div className="ml-4 mt-1.5 border-l-2 border-green-500/60 pl-2">
                                    <div className="space-y-1.5 pt-1">
                                      {nestedLinkedTable.data.columns.map((nestedColumn: TableNodeData['columns'][0], nestedIdx: number) => {
                                        const isNestedObjectField = nestedColumn.type === 'object';
                                        const isNestedVirtualField = !nestedColumn.name || nestedColumn.name.trim() === '';

                                        // Recursive: Tìm bảng linked của nested field
                                        const deepLinkedTableId = nestedColumn.isVirtual ? edges.find(
                                          e => e.source === nestedLinkedTable.id && e.sourceHandle === nestedColumn.name
                                        )?.target : null;
                                        const deepLinkedTable = deepLinkedTableId ? visibleNodes.find(n => n.id === deepLinkedTableId) : null;
                                        const isDeepFieldExpanded = expandedNodes.has(`${nestedLinkedTable.id}-field-${nestedIdx}`);

                                        return (
                                          <div key={nestedIdx}>
                                            <div className={cn(
                                              "group/field flex items-center gap-2 px-2.5 py-2 hover:bg-gray-800/50 rounded-md cursor-move transition-all duration-150 border border-transparent hover:border-gray-700/30",
                                              nestedColumn.isVirtual && "bg-green-500/5 hover:bg-green-500/10"
                                            )}>
                                              {/* Expand button cho deep nested virtual field */}
                                              {nestedColumn.isVirtual && deepLinkedTable ? (
                                                <button
                                                  onClick={() => {
                                                    const deepFieldKey = `${nestedLinkedTable.id}-field-${nestedIdx}`;
                                                    setExpandedNodes((prev) => {
                                                      const next = new Set(prev);
                                                      if (next.has(deepFieldKey)) {
                                                        next.delete(deepFieldKey);
                                                      } else {
                                                        next.add(deepFieldKey);
                                                      }
                                                      return next;
                                                    });
                                                  }}
                                                  className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                                                >
                                                  {isDeepFieldExpanded ? (
                                                    <ChevronDown className="w-3.5 h-3.5 text-green-400" />
                                                  ) : (
                                                    <ChevronRight className="w-3.5 h-3.5 text-green-400" />
                                                  )}
                                                </button>
                                              ) : (
                                                <GripVertical className="w-3 h-3 text-gray-600 cursor-move hover:text-gray-400 transition-colors" />
                                              )}

                                              <input
                                                type="checkbox"
                                                checked={nestedColumn.visible !== false}
                                                onChange={() => handleFieldVisibilityToggle(nestedLinkedTable.id, nestedIdx)}
                                                className="w-4 h-4 cursor-pointer"
                                              />

                                              <div className="flex-1 min-w-[60px] overflow-hidden flex items-center gap-2">
                                                <Input
                                                  value={nestedColumn.name || ''}
                                                  onChange={(e) => {
                                                    if (isNestedObjectField) return;
                                                    const oldName = nestedColumn.name;
                                                    const newName = e.target.value;
                                                    handleFieldUpdate(nestedLinkedTable.id, nestedIdx, { name: newName });
                                                    if (oldName && oldName !== newName) {
                                                      onFieldRename(nestedLinkedTable.id, nestedIdx, oldName, newName);
                                                    }
                                                  }}
                                                  placeholder="Tên field"
                                                  disabled={isNestedObjectField}
                                                  className={cn(
                                                    "h-7 flex-1 text-xs bg-transparent border-0 text-gray-200 font-mono px-1 focus:bg-gray-700 focus:border-gray-600 focus:px-2 rounded",
                                                    nestedColumn.visible === false && "line-through text-gray-600",
                                                    isNestedObjectField && "cursor-not-allowed opacity-60"
                                                  )}
                                                  onClick={(e) => e.stopPropagation()}
                                                  onDragStart={(e) => e.preventDefault()}
                                                  draggable={false}
                                                />
                                                {nestedColumn.isVirtual && deepLinkedTable && (
                                                  <span className="text-xs text-green-400 font-medium px-2 py-0.5 bg-green-500/10 rounded border border-green-500/30 whitespace-nowrap">
                                                    → {deepLinkedTable.data.label}
                                                  </span>
                                                )}
                                              </div>

                                              <div className="relative">
                                                <button
                                                  onClick={() => {
                                                    if (!isNestedObjectField && isNestedVirtualField) {
                                                      setTypeDropdownOpen({ nodeId: nestedLinkedTable.id, fieldIndex: nestedIdx });
                                                    }
                                                  }}
                                                  disabled={isNestedObjectField || !isNestedVirtualField}
                                                  className={cn(
                                                    "h-7 px-2 text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded flex items-center gap-1 hover:bg-gray-600 min-w-[80px]",
                                                    (isNestedObjectField || !isNestedVirtualField) && "cursor-not-allowed opacity-60"
                                                  )}
                                                >
                                                  <span className="font-mono">{nestedColumn.type || 'varchar'}</span>
                                                  {!isNestedObjectField && isNestedVirtualField && <ChevronDown className="w-3 h-3" />}
                                                </button>
                                              </div>

                                              <button
                                                onClick={() => {
                                                  if (!isNestedObjectField) {
                                                    handleFieldUpdate(nestedLinkedTable.id, nestedIdx, { isNotNull: !nestedColumn.isNotNull });
                                                  }
                                                }}
                                                disabled={isNestedObjectField}
                                                className={cn(
                                                  "h-7 w-7 flex items-center justify-center rounded text-xs font-semibold transition-colors",
                                                  nestedColumn.isNotNull
                                                    ? "bg-orange-500 text-white"
                                                    : "bg-gray-700 text-gray-400 hover:bg-gray-600",
                                                  isNestedObjectField && "cursor-not-allowed opacity-60"
                                                )}
                                                title="Not Null"
                                              >
                                                N
                                              </button>

                                              <button
                                                onClick={() => {
                                                  if (!isNestedObjectField) {
                                                    handleFieldUpdate(nestedLinkedTable.id, nestedIdx, { isPrimaryKey: !nestedColumn.isPrimaryKey });
                                                  }
                                                }}
                                                disabled={isNestedObjectField}
                                                className={cn(
                                                  "h-7 w-7 flex items-center justify-center rounded transition-colors",
                                                  nestedColumn.isPrimaryKey
                                                    ? "text-orange-400"
                                                    : "text-gray-400 hover:text-gray-300",
                                                  isNestedObjectField && "cursor-not-allowed opacity-60"
                                                )}
                                                title="Primary Key"
                                              >
                                                <Key className="w-4 h-4" />
                                              </button>

                                              <button
                                                onClick={() => {
                                                  if (!isNestedObjectField) {
                                                    handleFieldUpdate(nestedLinkedTable.id, nestedIdx, { isForeignKey: !nestedColumn.isForeignKey });
                                                  }
                                                }}
                                                disabled={isNestedObjectField}
                                                className={cn(
                                                  "h-7 w-7 flex items-center justify-center rounded transition-colors",
                                                  nestedColumn.isForeignKey
                                                    ? "text-blue-400"
                                                    : "text-gray-400 hover:text-gray-300",
                                                  isNestedObjectField && "cursor-not-allowed opacity-60"
                                                )}
                                                title="Foreign Key"
                                              >
                                                <Link2 className="w-4 h-4" />
                                              </button>

                                              {!isNestedObjectField && (
                                                <button
                                                  onClick={() => handleDeleteField(nestedLinkedTable.id, nestedIdx)}
                                                  className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover/field:opacity-100"
                                                  title="Xóa field"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </div>

                                            {/* RECURSIVE: Render unlimited nested levels */}
                                            {nestedColumn.isVirtual && deepLinkedTable && isDeepFieldExpanded && (
                                              <div className="ml-4 mt-1.5 border-l-2 border-green-500/60 pl-2">
                                                <NestedFieldsList
                                                  tableNode={deepLinkedTable}
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
                                                  depth={3}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}

                                      <button
                                        onClick={() => handleAddField(nestedLinkedTable.id)}
                                        className="w-full mt-2 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-700/20 rounded-md flex items-center justify-center gap-2 border border-dashed border-gray-700 hover:border-blue-500/50 transition-all duration-200"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        Thêm trường
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Add field button cho nested table */}
                          <button
                            onClick={() => handleAddField(linkedTable.id)}
                            className="w-full mt-2 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-700/20 rounded-md flex items-center justify-center gap-2 border border-dashed border-gray-700 hover:border-blue-500/50 transition-all duration-200"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Thêm trường
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add field button */}
              <button
                onClick={() => handleAddField(node.id)}
                className="w-full mt-3 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-700/20 rounded-md flex items-center justify-center gap-2 border border-dashed border-gray-700 hover:border-blue-500/50 transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm trường
              </button>
            </div>
          )}
        </div>

        {/* Note: Children không cần render ở đây nữa vì đã render nested under fields */}
      </div>
    );
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      // Giới hạn width từ 200px đến 800px
      if (newWidth >= 200 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div
      ref={sidebarRef}
      className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white flex flex-col h-full border-r border-gray-700/50 relative shadow-2xl"
      style={{ width: `${sidebarWidth}px`, minWidth: '200px', maxWidth: '800px' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm space-y-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Lọc"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>
        </div>
        <Button
          onClick={onAddTable}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm bảng
        </Button>
      </div>

      {/* Table List - Tree structure */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {filteredNodes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <div className="text-gray-500 mb-2">📋</div>
            {searchQuery ? 'Không tìm thấy bảng nào' : 'Chưa có bảng nào'}
          </div>
        ) : (
          <div className="py-2">
            {/* Nếu có search query, hiển thị flat list, nếu không hiển thị tree */}
            {searchQuery ? filteredNodes.map((node) => {
              const isExpanded = expandedNodes.has(node.id);
              const isSelected = selectedNodeId === node.id;
              const isEditing = editingNodeId === node.id;
              const nodeColor = getNodeColor(node.id);
              const isDragging = draggedNodeId === node.id;
              const isDragOver = dragOverNodeId === node.id;

              return (
                <div
                  key={node.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, node.id)}
                  onDragOver={(e) => handleDragOver(e, node.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, node.id)}
                  className={cn(
                    'group hover:bg-gray-800 transition-colors',
                    isSelected && 'bg-gray-800',
                    isDragging && 'opacity-50',
                    isDragOver && 'border-t-2 border-blue-500'
                  )}
                >
                  <div className="flex items-center">
                    {/* Color bar */}
                    <div
                      className="w-1 h-12"
                      style={{ backgroundColor: nodeColor }}
                    />

                    {/* Expand/Collapse */}
                    <button
                      onClick={() => toggleExpand(node.id)}
                      className="p-1.5 hover:bg-gray-700/50 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-300" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      )}
                    </button>

                    {/* Drag handle */}
                    <GripVertical className="w-4 h-4 text-gray-600 mr-2 cursor-move hover:text-gray-400 transition-colors" />

                    {/* Node name */}
                    <div
                      className="flex-1 cursor-pointer py-3"
                      onClick={() => onNodeSelect(node.id)}
                    >
                      {isEditing ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                          className="h-8 bg-gray-700/80 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={cn(
                          "text-sm font-semibold transition-colors",
                          isSelected ? "text-white" : "text-gray-200"
                        )}>
                          {node.data.label}
                        </span>
                      )}
                    </div>

                    {/* Menu button */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuOpenNodeId(
                            menuOpenNodeId === node.id ? null : node.id
                          )
                        }
                        className="p-2 hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>

                      {menuOpenNodeId === node.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpenNodeId(null)}
                          />
                          <div className="absolute right-2 top-10 z-20 bg-gray-800 border border-gray-700 rounded-md shadow-lg min-w-[160px]">
                            <button
                              onClick={() => handleEdit(node)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Chỉnh sửa tên
                            </button>
                            <button
                              onClick={() => openColorDialog(node.id)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Palette className="w-4 h-4" />
                              Đổi màu
                            </button>
                            <button
                              onClick={() => {
                                onNodeDelete(node.id);
                                setMenuOpenNodeId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Xóa
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded columns */}
                  {isExpanded && (
                    <div className="pl-4 pr-4 pb-3 space-y-2 border-t border-gray-800 pt-2 mt-2">
                      <div className="text-xs font-semibold text-gray-400 mb-2 px-2">Trường</div>
                      {node.data.columns.map((column: TableNodeData['columns'][0], idx: number) => {
                        const isTypeDropdownOpen = typeDropdownOpen?.nodeId === node.id && typeDropdownOpen?.fieldIndex === idx;
                        const isDragging = draggedField?.nodeId === node.id && draggedField?.fieldIndex === idx;
                        const isDragOver = dragOverFieldIndex === idx && draggedField?.nodeId === node.id;
                        const isObjectField = column.type === 'object';
                        // Virtual field là field mới thêm (chưa có tên hoặc tên rỗng)
                        const isVirtualField = !column.name || column.name.trim() === '';

                        return (
                          <div
                            key={idx}
                            draggable
                            onDragStart={(e) => {
                              // Chỉ cho phép drag nếu không phải từ Input
                              const target = e.target as HTMLElement;
                              if (target.tagName === 'INPUT' || target.closest('input')) {
                                e.preventDefault();
                                return;
                              }
                              handleFieldDragStart(e, node.id, idx);
                            }}
                            onDragOver={(e) => handleFieldDragOver(e, node.id, idx)}
                            onDragLeave={handleFieldDragLeave}
                            onDrop={(e) => handleFieldDrop(e, node.id, idx)}
                            className={cn(
                              "group/field flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800 rounded cursor-move",
                              isDragging && "opacity-50",
                              isDragOver && "border-t-2 border-blue-500"
                            )}
                          >
                            {/* Drag handle */}
                            <GripVertical className="w-3 h-3 text-gray-600 cursor-move" />

                            {/* Checkbox for visibility */}
                            <input
                              type="checkbox"
                              checked={column.visible !== false}
                              onChange={() => handleFieldVisibilityToggle(node.id, idx)}
                              className="w-4 h-4 cursor-pointer"
                            />

                            {/* Field name - editable directly, disabled for object */}
                            <div className="flex-1 min-w-[60px] overflow-hidden">
                              <Input
                                value={column.name || ''}
                                onChange={(e) => {
                                  if (isObjectField) return;
                                  const oldName = column.name;
                                  const newName = e.target.value;
                                  handleFieldUpdate(node.id, idx, { name: newName });
                                  if (oldName && oldName !== newName) {
                                    onFieldRename(node.id, idx, oldName, newName);
                                  }
                                }}
                                placeholder="Tên field"
                                disabled={isObjectField}
                                className={cn(
                                  "h-7 w-full text-xs bg-transparent border-0 text-gray-200 font-mono px-1 focus:bg-gray-700 focus:border-gray-600 focus:px-2 rounded",
                                  column.visible === false && "line-through text-gray-600",
                                  isObjectField && "cursor-not-allowed opacity-60"
                                )}
                                onClick={(e) => e.stopPropagation()}
                                onDragStart={(e) => e.preventDefault()}
                                draggable={false}
                              />
                            </div>

                            {/* Type dropdown - disabled for object và field có sẵn (chỉ cho phép với virtual field) */}
                            <div className="relative">
                              <button
                                onClick={() => {
                                  if (!isObjectField && isVirtualField) {
                                    setTypeDropdownOpen({ nodeId: node.id, fieldIndex: idx });
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
                                          onClick={() => handleTypeSelect(node.id, idx, type)}
                                          className={cn(
                                            "w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center justify-between",
                                            column.type === type && "bg-gray-700"
                                          )}
                                        >
                                          <span className="font-mono">{type}</span>
                                          {column.type === type && (
                                            <Check className="w-4 h-4" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* NotNull button - disabled for object */}
                            <button
                              onClick={() => {
                                if (!isObjectField) {
                                  handleFieldUpdate(node.id, idx, { isNotNull: !column.isNotNull });
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

                            {/* PK button - disabled for object */}
                            <button
                              onClick={() => {
                                if (!isObjectField) {
                                  handleFieldUpdate(node.id, idx, { isPrimaryKey: !column.isPrimaryKey });
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

                            {/* FK button - disabled for object */}
                            <button
                              onClick={() => {
                                if (!isObjectField) {
                                  handleFieldUpdate(node.id, idx, { isForeignKey: !column.isForeignKey });
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

                            {/* Delete button - disabled for object */}
                            {!isObjectField && (
                              <button
                                onClick={() => handleDeleteField(node.id, idx)}
                                className="h-7 w-7 flex items-center justify-center rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover/field:opacity-100"
                                title="Xóa field"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Add field button */}
                      <button
                        onClick={() => handleAddField(node.id)}
                        className="w-full mt-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Thêm trường
                      </button>
                    </div>
                  )}
                </div>
              );
            }) : filteredNodes.map((node) => renderNodeWithChildren(node, 0))}
          </div>
        )}
      </div>

      {/* Color Picker Dialog */}
      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Chọn màu cho bảng</DialogTitle>
            <DialogDescription className="text-gray-400">
              Chọn một màu để phân biệt bảng này
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                className="aspect-square rounded-md border-2 border-gray-600 hover:border-gray-500 transition-colors"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors",
          isResizing && "bg-blue-500"
        )}
        style={{ zIndex: 1000 }}
      />
    </div>
  );
}
