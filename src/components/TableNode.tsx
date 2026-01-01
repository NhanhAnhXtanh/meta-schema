import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Plus, Copy, Trash2, Edit2 } from 'lucide-react';
import { openLinkFieldDialog, addVisibleNodeId } from '@/store/slices/uiSlice';
import { addTable, deleteTable, updateTable } from '@/store/slices/schemaSlice';
import { THEME } from '@/constants/theme';
import { Input } from './ui/input';
import { useAppDispatch } from '@/store/hooks';
import { TableNodeData } from '@/types/schema';

function TableNodeComponent({ data, selected, id }: NodeProps<TableNodeData>) {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.label);
  const headerColor = data.color || THEME.NODE.HEADER_BG_DEFAULT;

  const handleAddField = () => {
    dispatch(openLinkFieldDialog(id));
  };

  const handleClone = () => {
    const newId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    dispatch(addTable({
      id: newId,
      name: `${data.label} (Bản sao)`,
      tableName: data.tableName || data.label,
      columns: data.columns
    }));
    dispatch(addVisibleNodeId(newId));
  };

  const handleSaveRename = () => {
    if (editName.trim()) {
      dispatch(updateTable({ id, updates: { label: editName.trim() } }));
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        'bg-white border-2 rounded-lg shadow-xl min-w-[240px] group/node',
        selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      )}
    >
      <div
        className="text-white px-4 py-3 rounded-t-lg relative"
        style={{ backgroundColor: headerColor }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-8">
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                autoFocus
                className="h-7 bg-white/20 border-white/30 text-white placeholder:text-white/50 text-sm font-bold focus:bg-white/30"
              />
            ) : (
              <div
                className="font-bold text-sm cursor-text hover:bg-white/10 rounded px-1 -ml-1"
                onDoubleClick={() => setIsEditing(true)}
              >
                {data.label}
              </div>
            )}
            <div className="text-[10px] opacity-80 flex items-center gap-1.5 mt-1">
              <span>ID: {id}</span>
              <span>•</span>
              <span className="font-mono">{data.tableName || data.label}</span>
            </div>
          </div>

          <div className="flex gap-1 absolute right-2 top-2 opacity-0 group-hover/node:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Đổi tên"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClone}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Nhân bản (Instance)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => dispatch(deleteTable(id))}
              className="p-1 hover:bg-red-500/50 rounded transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      <div className="divide-y">
        {data.columns.filter(col => col.visible !== false).map((column, index) => (
          <div
            key={column.name}
            className={cn(
              'px-4 py-2 text-sm flex items-center gap-2 relative',
              column.isPrimaryKey && 'bg-yellow-50',
              column.isForeignKey && 'bg-blue-50',
              column.isVirtual && 'bg-green-50 border-l-2 border-l-green-400'
            )}
          >
            {/* Target Handle - Bên trái */}
            <Handle
              type="target"
              position={Position.Left}
              id={column.name}
              className="react-flow-handle-target !w-4 !h-4 !bg-gray-400 !border-2 !border-white !-left-2 !transition-colors !duration-200 hover:!bg-green-500 !z-10"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'all'
              }}
            />

            {/* Field name */}
            <span className="font-medium text-gray-900 pointer-events-none">{column.name || ''}</span>

            {/* Field type hoặc linked PK */}
            {column.isVirtual && column.linkedPrimaryKeyField ? (
              <span className="text-gray-500 text-xs flex items-center gap-1 pointer-events-none">
                <span className="text-green-600">→</span>
                <span className="text-green-600 font-medium">{column.linkedPrimaryKeyField}</span>
              </span>
            ) : column.type === 'object' && column.primaryKeyField ? (
              <span className="text-gray-500 text-xs flex items-center gap-1 pointer-events-none">
                <span className="text-purple-600">→</span>
                <span className="text-purple-600">{column.primaryKeyField}</span>
              </span>
            ) : (
              <span className="text-gray-500 text-xs pointer-events-none">{column.type}</span>
            )}

            {/* Badges */}
            <div className="flex gap-1 items-center ml-auto pointer-events-none">
              {column.isVirtual && (
                <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-semibold">
                  V
                </span>
              )}
              {column.isPrimaryKey && (
                <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded font-semibold">
                  PK
                </span>
              )}
              {column.isForeignKey && (
                <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                  FK
                </span>
              )}
              {column.type === 'object' && (
                <>
                  <span className="text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                    O
                  </span>
                  {column.primaryKeyField && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded font-semibold">
                      PK
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Source Handle - Bên phải */}
            <Handle
              type="source"
              position={Position.Right}
              id={column.name}
              className="react-flow-handle-source !w-4 !h-4 !bg-gray-400 !border-2 !border-white !-right-2 !transition-colors !duration-200 hover:!bg-green-500 !z-10"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'all'
              }}
            />
          </div>
        ))}

        {/* Button thêm field */}
        <div className="px-4 py-2 border-t border-gray-200">
          <button
            onClick={handleAddField}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
            title="Thêm field mới"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm field</span>
          </button>
        </div>
      </div>
      {/* Object Target Handle - Handle đặc biệt ở đáy để nhận field từ bảng khác */}
      <div className="relative border-t border-gray-200 py-2">
        <Handle
          type="target"
          position={Position.Bottom}
          id="object-target"
          className="react-flow-handle-object-target !w-6 !h-6 !bg-purple-500 !border-2 !border-white !-bottom-3 !transition-colors !duration-200 hover:!bg-purple-600 !z-10 !rounded-full"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'all'
          }}
        />
      </div>
    </div>
  );
}

export const TableNode = memo(TableNodeComponent);
