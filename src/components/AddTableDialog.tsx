import { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { addTable } from '@/store/slices/schemaSlice';

interface AddTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddTableDialog({ open, onOpenChange }: AddTableDialogProps) {
    const dispatch = useAppDispatch();
    const [tableName, setTableName] = useState('');
    const [columns, setColumns] = useState<Array<{ name: string; type: string; isPrimaryKey?: boolean; isForeignKey?: boolean; visible?: boolean }>>([
        { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
    ]);

    const handleAddTable = useCallback(() => {
        if (!tableName.trim()) return;

        dispatch(addTable({
            name: tableName,
            columns: columns.map(c => ({
                ...c,
                visible: true,
                isNotNull: false, // Default
                isVirtual: false
            }))
        }));

        // Reset
        setTableName('');
        setColumns([{ name: 'id', type: 'uuid', isPrimaryKey: true, visible: true }]);
        onOpenChange(false);
    }, [tableName, columns, dispatch, onOpenChange]);

    const addColumn = useCallback(() => {
        setColumns((cols) => [...cols, { name: '', type: 'varchar', visible: true }]);
    }, []);

    const updateColumn = useCallback((index: number, field: string, value: string | boolean) => {
        setColumns((cols) =>
            cols.map((col, i) =>
                i === index ? { ...col, [field]: value } : col
            )
        );
    }, []);

    const removeColumn = useCallback((index: number) => {
        setColumns((cols) => cols.filter((_, i) => i !== index));
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white text-gray-900 border-gray-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle>Thêm Bảng Mới</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Tạo một bảng mới với các cột của nó
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block text-gray-700">
                            Tên Bảng
                        </label>
                        <Input
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            placeholder="Ví dụ: Products"
                            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">
                                Các Cột
                            </label>
                            <Button variant="ghost" size="sm" onClick={addColumn} className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                <Plus className="w-3 h-3 mr-1" /> Thêm Cột
                            </Button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {columns.map((column, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <Input
                                        value={column.name}
                                        onChange={(e) => updateColumn(index, 'name', e.target.value)}
                                        placeholder="Tên cột"
                                        className="flex-1 bg-white border-gray-300 text-gray-900 h-8 text-sm placeholder:text-gray-400"
                                    />
                                    <Input
                                        value={column.type}
                                        onChange={(e) => updateColumn(index, 'type', e.target.value)}
                                        placeholder="Kiểu"
                                        className="w-24 bg-white border-gray-300 text-gray-900 h-8 text-sm"
                                    />
                                    <label className="flex items-center gap-1 text-xs cursor-pointer text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={column.isPrimaryKey || false}
                                            onChange={(e) => updateColumn(index, 'isPrimaryKey', e.target.checked)}
                                            className="rounded bg-gray-100 border-gray-300 accent-blue-600"
                                        />
                                        PK
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => removeColumn(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                            Hủy
                        </Button>
                        <Button onClick={handleAddTable} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Tạo Bảng
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
