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

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter((node) =>
      node.data.label.toLowerCase().includes(query)
    );
  }, [nodes, searchQuery]);

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
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const newColumns = [
      ...node.data.columns,
      { name: '', type: 'varchar', visible: true },
    ];
    onNodeUpdate(nodeId, { columns: newColumns });
    // Tự động expand
    setExpandedNodes((prev) => new Set(prev).add(nodeId));
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
      className="bg-gray-900 text-white flex flex-col h-full border-r border-gray-800 relative"
      style={{ width: `${sidebarWidth}px`, minWidth: '200px', maxWidth: '800px' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 space-y-3">
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
          className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm bảng
        </Button>
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNodes.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {searchQuery ? 'Không tìm thấy bảng nào' : 'Chưa có bảng nào'}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredNodes.map((node) => {
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
                    <div className="pl-4 pr-4 pb-3 space-y-2 border-t border-gray-800 pt-2 mt-2">
                      <div className="text-xs font-semibold text-gray-400 mb-2 px-2">Trường</div>
                      {node.data.columns.map((column: TableNodeData['columns'][0], idx: number) => {
                        const isTypeDropdownOpen = typeDropdownOpen?.nodeId === node.id && typeDropdownOpen?.fieldIndex === idx;
                        const isDragging = draggedField?.nodeId === node.id && draggedField?.fieldIndex === idx;
                        const isDragOver = dragOverFieldIndex === idx && draggedField?.nodeId === node.id;
                        const isObjectField = column.type === 'object';
                        
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
                            
                            {/* Type dropdown - disabled for object */}
                            <div className="relative">
                              <button
                                onClick={() => {
                                  if (!isObjectField) {
                                    setTypeDropdownOpen({ nodeId: node.id, fieldIndex: idx });
                                  }
                                }}
                                disabled={isObjectField}
                                className={cn(
                                  "h-7 px-2 text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded flex items-center gap-1 hover:bg-gray-600 min-w-[80px]",
                                  isObjectField && "cursor-not-allowed opacity-60"
                                )}
                              >
                                <span className="font-mono">{column.type || 'varchar'}</span>
                                {!isObjectField && <ChevronDown className="w-3 h-3" />}
                              </button>
                              
                              {isTypeDropdownOpen && !isObjectField && (
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
            })}
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
