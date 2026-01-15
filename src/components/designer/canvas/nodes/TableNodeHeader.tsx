import { Edit2, Copy, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TableNodeData } from '@/types/schema';

interface TableNodeHeaderProps {
    data: TableNodeData;
    id: string;
    isEditing: boolean;
    editName: string;
    headerColor: string;
    setIsEditing: (val: boolean) => void;
    setEditName: (val: string) => void;
    handleSaveRename: () => void;
    handleClone: () => void;
    setShowDeleteDialog: (val: boolean) => void;
}

export function TableNodeHeader({
    data, id, isEditing, editName, headerColor,
    setIsEditing, setEditName, handleSaveRename, handleClone, setShowDeleteDialog
}: TableNodeHeaderProps) {
    return (
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
    );
}
