import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Plus, Copy, Trash2, Edit2 } from 'lucide-react';
import { openLinkFieldDialog, addVisibleNodeId } from '@/store/slices/uiSlice';
import { schemaEventBus } from '@/events/eventBus';
import { SchemaEvents } from '@/events/schemaEvents';
import { THEME } from '@/constants/theme';
import { Input } from './ui/input';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { TableNodeData } from '@/types/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

function TableNodeComponent({ data, selected, id }: NodeProps<TableNodeData>) {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.label);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const headerColor = data.color || THEME.NODE.HEADER_BG_DEFAULT;

  const handleAddField = () => {
    dispatch(openLinkFieldDialog(id));
  };

  const handleClone = () => {
    const newId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    schemaEventBus.emit(SchemaEvents.TABLE_ADD, {
      id: newId,
      name: `${data.label} (Bản sao)`,
      tableName: data.tableName || data.label,
      columns: data.columns
    });
    dispatch(addVisibleNodeId(newId));
  };

  const handleSaveRename = () => {
    if (editName.trim()) {
      schemaEventBus.emit(SchemaEvents.TABLE_UPDATE, { id, updates: { label: editName.trim() } });
      setIsEditing(false);
    }
  };

  return (
    <>
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
                onClick={() => setShowDeleteDialog(true)}
                className="p-1 hover:bg-red-500/50 rounded transition-colors"
                title="Xóa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="divide-y nodrag">
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
              {/* Target Handle - Invisible Anchor */}
              <Handle
                type="target"
                position={Position.Left}
                id={column.name}
                isConnectable={false}
                className="!w-0 !h-0 !min-w-0 !min-h-0 !opacity-0 !border-0 !bg-transparent pointer-events-none"
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
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
              ) : column.type === 'object' && (column.linkedForeignKeyField || column.primaryKeyField) ? (
                <span className="text-gray-500 text-xs flex items-center gap-1 pointer-events-none">
                  <span className="text-violet-600">→</span>
                  <span className="text-violet-600 font-medium">{column.linkedForeignKeyField || column.primaryKeyField}</span>
                </span>
              ) : (
                <span className="text-gray-500 text-xs pointer-events-none">{column.type}</span>
              )}

              {/* Badges */}
              <div className="flex gap-1 items-center ml-auto pointer-events-none">
                {column.isVirtual && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200/50 rounded shadow-sm font-bold select-none" title="Virtual Field">
                    V
                  </span>
                )}
                {column.isPrimaryKey && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] bg-amber-100 text-amber-700 border border-amber-200/50 rounded shadow-sm font-bold select-none" title="Primary Key">
                    PK
                  </span>
                )}
                {column.isForeignKey && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] bg-sky-100 text-sky-700 border border-sky-200/50 rounded shadow-sm font-bold select-none" title="Foreign Key">
                    FK
                  </span>
                )}
                {column.type === 'object' && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] bg-violet-100 text-violet-700 border border-violet-200/50 rounded shadow-sm font-bold select-none" title="Object">
                    O
                  </span>
                )}
                {column.type === 'array' && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] bg-orange-100 text-orange-700 border border-orange-200/50 rounded shadow-sm font-bold select-none" title="Array">
                    A
                  </span>
                )}
              </div>

              {/* Source Handle - Invisible Anchor */}
              <Handle
                type="source"
                position={Position.Right}
                id={column.name}
                isConnectable={false}
                className="!w-0 !h-0 !min-w-0 !min-h-0 !opacity-0 !border-0 !bg-transparent pointer-events-none"
                style={{
                  top: '50%',
                  transform: 'translateY(-50%)',
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
        {/* Object Target Handle - Invisible Anchor */}
        <div className="relative border-t border-gray-200 py-0 h-0">
          <Handle
            type="target"
            position={Position.Bottom}
            id="object-target"
            isConnectable={false}
            className="!w-0 !h-0 !min-w-0 !min-h-0 !opacity-0 !border-0 !bg-transparent pointer-events-none"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Xóa bảng {data.label}?
            </DialogTitle>
            <DialogDescription className="py-2">
              <span className="block font-medium text-gray-900 mb-2">
                CẢNH BÁO CAO ĐỘ:
              </span>
              Hành động này sẽ xóa bảng <strong>{data.label}</strong> VÀ <strong className="text-red-600">TẤT CẢ các bảng con (descendants)</strong> đang được liên kết với nó.
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
                schemaEventBus.emit(SchemaEvents.TABLE_DELETE, { id });
                setShowDeleteDialog(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Xác nhận Xóa
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const TableNode = memo(TableNodeComponent);
