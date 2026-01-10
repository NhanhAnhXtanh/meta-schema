import { TableNodeData } from '@/types/schema';

interface TableNodeHeaderProps {
    data: TableNodeData;
    id: string;
    headerColor: string;
}

export function TableNodeHeader({
    data, id, headerColor
}: TableNodeHeaderProps) {
    return (
        <div
            className="text-white px-4 py-3 rounded-t-lg relative"
            style={{ backgroundColor: headerColor }}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 mr-8">
                    <div className="font-bold text-sm px-1 -ml-1">
                        {data.label}
                    </div>
                    <div className="text-[10px] opacity-80 flex items-center gap-1.5 mt-1">
                        <span>ID: {id}</span>
                        <span>•</span>
                        <span className="font-mono">{data.tableName || data.label}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
