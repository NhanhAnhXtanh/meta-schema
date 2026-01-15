import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { TableColumn } from '@/types/schema';

interface TableNodeFieldProps {
    column: TableColumn;
}

export function TableNodeField({ column }: TableNodeFieldProps) {
    if (column.visible === false) return null;

    return (
        <div
            className={cn(
                'px-4 py-2 text-sm flex items-center gap-2 relative',
                column.isPrimaryKey && 'bg-yellow-50',
                column.isForeignKey && 'bg-blue-50',
                column.isVirtual && 'bg-green-50 border-l-2 border-l-green-400'
            )}
        >
            {/* Target Handle - Left Side - Invisible Anchor */}
            <Handle
                type="target"
                position={Position.Left}
                id={column.name}
                isConnectable={false}
                className="w-1 h-1 !bg-transparent !border-0 opacity-0 pointer-events-none absolute left-0"
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

            {/* Source Handle - Right Side - Invisible Anchor */}
            <Handle
                type="source"
                position={Position.Right}
                id={column.name}
                isConnectable={false}
                className="w-1 h-1 !bg-transparent !border-0 opacity-0 pointer-events-none absolute right-0"
                style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                }}
            />
        </div>
    );
}
