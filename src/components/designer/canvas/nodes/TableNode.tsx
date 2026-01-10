import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { TableNodeData, TableColumn } from '@/types/schema';

import { useTableNode } from './useTableNode';
import { TableNodeHeader } from './TableNodeHeader';
import { TableNodeField } from './TableNodeField';

function TableNodeComponent({ data, selected, id }: NodeProps<Node<TableNodeData>>) {
  const {
    headerColor,
    handleAddField
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
          headerColor={headerColor}
        />

        <div className="divide-y nodrag">
          {data.columns.map((column: TableColumn) => (
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
    </>
  );
}

export const TableNode = memo(TableNodeComponent);
