import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';


export interface TableNodeData {
  label: string;
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isNotNull?: boolean;
    visible?: boolean;
    primaryKeyField?: string; // Field làm PK cho object type (thay vì compositeKeyFields)
    isVirtual?: boolean; // Đánh dấu field virtual (field tự thêm, không phải field gốc)
    linkedPrimaryKeyField?: string; // Field PK mà field virtual link tới
    relationshipType?: '1-n' | 'n-1' | '1-1' | 'n-n'; // Loại quan hệ
  }>;
  color?: string;
  _version?: number; // Timestamp for tracking node changes (used for React Flow handle updates)
}

function TableNodeComponent({ data, selected, id }: NodeProps<TableNodeData>) {
  const headerColor = data.color || '#3b82f6';

  const handleAddField = () => {
    // Dispatch custom event để App.tsx có thể listen
    const event = new CustomEvent('addField', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={cn(
        'bg-white border-2 rounded-lg shadow-lg min-w-[200px]',
        selected ? 'border-primary' : 'border-gray-300'
      )}
    >
      <div
        className="text-white px-4 py-2 font-bold rounded-t-lg"
        style={{ backgroundColor: headerColor }}
      >
        {data.label}
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
