import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import { schemaEventBus } from '@/events/eventBus';
import { SchemaEvents } from '@/events/schemaEvents';
import { TableNodeData } from '@/types/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { useTableNode } from './useTableNode';
import { TableNodeHeader } from './TableNodeHeader';
import { TableNodeField } from './TableNodeField';

function TableNodeComponent({ data, selected, id }: NodeProps<TableNodeData>) {
  const {
    isEditing, setIsEditing,
    editName, setEditName,
    showDeleteDialog, setShowDeleteDialog,
    headerColor,
    handleAddField, handleClone, handleSaveRename
  } = useTableNode(id, data);

  return (
    <>
      <div
        className={cn(
          'bg-white border-2 rounded-lg shadow-xl min-w-[240px] group/node',
          selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
        )}
      >
        <TableNodeHeader
          data={data}
          id={id}
          isEditing={isEditing}
          editName={editName}
          headerColor={headerColor}
          setIsEditing={setIsEditing}
          setEditName={setEditName}
          handleSaveRename={handleSaveRename}
          handleClone={handleClone}
          setShowDeleteDialog={setShowDeleteDialog}
        />

        <div className="divide-y nodrag">
          {data.columns.map((column) => (
            <TableNodeField key={column.name} column={column} />
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

        {/* Object Target Handle - Bottom - Invisible Anchor */}
        <div className="relative border-t border-gray-200 py-0 h-0">
          <Handle
            type="target"
            position={Position.Bottom}
            id="object-target"
            isConnectable={false}
            className="w-1 h-1 !bg-transparent !border-0 opacity-0 pointer-events-none absolute"
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
