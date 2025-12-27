import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

export interface TableNodeData {
  label: string;
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    isNotNull?: boolean;
    visible?: boolean;
  }>;
  color?: string;
}

export function TableNode({ data, selected }: NodeProps<TableNodeData>) {
  const headerColor = data.color || '#3b82f6';
  
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
            key={index}
            className={cn(
              'px-4 py-2 text-sm flex items-center justify-between relative',
              column.isPrimaryKey && 'bg-yellow-50',
              column.isForeignKey && 'bg-blue-50'
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
            
            <div className="flex items-center gap-2 flex-1 min-w-0 pointer-events-none">
              <span className="font-medium text-gray-900">{column.name}</span>
              <span className="text-gray-500 text-xs">{column.type}</span>
            </div>
            <div className="flex gap-1 items-center pointer-events-none">
              {column.isPrimaryKey && (
                <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                  PK
                </span>
              )}
              {column.isForeignKey && (
                <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">
                  FK
                </span>
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
      </div>
    </div>
  );
}
