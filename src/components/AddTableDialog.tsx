import { useState, useCallback, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Database, LayoutGrid } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addTable } from '@/store/slices/schemaSlice';
import { addVisibleNodeId } from '@/store/slices/uiSlice';
import { initialNodes } from '@/data/initialSchema';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddTableDialog({ open, onOpenChange }: AddTableDialogProps) {
    const dispatch = useAppDispatch();
    const existingNodes = useAppSelector(state => state.schema.present.nodes);
    const [mode, setMode] = useState<'manual' | 'template'>('template');

    // Manual Mode State
    const [tableName, setTableName] = useState('');
    const [columns, setColumns] = useState<Array<{ name: string; type: string; isPrimaryKey?: boolean; isForeignKey?: boolean; visible?: boolean }>>([
        { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
    ]);

    // Template Mode State
    const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);

    // Convert initialNodes to templates
    const templates = useMemo(() => {
        return initialNodes.map(node => ({
            id: node.id,
            name: node.data.label,
            description: `Sample table with ${node.data.columns.length} columns`,
            columns: node.data.columns
        }));
    }, []);

    const handleAddTable = useCallback(() => {
        if (mode === 'manual') {
            if (!tableName.trim()) return;
            // Generate manual ID
            const newId = `table-${Date.now()}`;

            dispatch(addTable({
                id: newId,
                name: tableName,
                columns: columns.map(c => ({
                    ...c,
                    visible: true,
                    isNotNull: false,
                    isVirtual: false
                }))
            }));
            dispatch(addVisibleNodeId(newId));

            // Reset
            setTableName('');
            setColumns([{ name: 'id', type: 'uuid', isPrimaryKey: true, visible: true }]);
        } else {
            // Template Mode
            if (!selectedTemplateName) return;
            const template = templates.find(t => t.name === selectedTemplateName);

            if (template) {
                // Check if table with this ID or Name already exists
                const existingNodeById = existingNodes.find(n => n.id === template.id);
                // Also check by Label/Name to prevent duplicate names even if ID is differnet
                const existingNodeByName = existingNodes.find(n => n.data.label === template.name);

                const existingNode = existingNodeById || existingNodeByName;

                if (existingNode) {
                    // Table exists, just ensure it's visible
                    dispatch(addVisibleNodeId(existingNode.id));
                } else {
                    // Table completely missing, re-add it with ORIGINAL ID
                    dispatch(addTable({
                        id: template.id,
                        name: template.name,
                        columns: template.columns.map(c => ({ ...c, visible: true }))
                    }));
                    dispatch(addVisibleNodeId(template.id));
                }
            }
        }
        onOpenChange(false);
    }, [tableName, columns, dispatch, onOpenChange, mode, selectedTemplateName, templates, existingNodes]);

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

    const selectedTemplate = templates.find(t => t.name === selectedTemplateName);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-white text-gray-900 border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Thêm Bảng Mới</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Chọn từ dữ liệu mẫu hoặc tạo thủ công
                    </DialogDescription>
                </DialogHeader>

                {/* Mode Switcher */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg shrink-0">
                    <button
                        onClick={() => setMode('template')}
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all",
                            mode === 'template' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Database className="w-4 h-4" /> Dữ Liệu Mẫu
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all",
                            mode === 'manual' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" /> Tạo Thủ Công
                    </button>
                </div>

                <div className="flex-1 overflow-hidden mt-4">
                    {mode === 'template' ? (
                        <div className="h-full flex gap-4">
                            {/* Template List */}
                            <div className="w-1/3 border-r border-gray-200 pr-4 overflow-y-auto">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Available Tables</h3>
                                <div className="space-y-1">
                                    {templates.map(table => (
                                        <button
                                            key={table.name}
                                            onClick={() => setSelectedTemplateName(table.name)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                                                selectedTemplateName === table.name
                                                    ? "bg-blue-50 text-blue-700 font-medium"
                                                    : "hover:bg-gray-100 text-gray-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Database className="w-3.5 h-3.5" />
                                                {table.name}
                                            </div>
                                            {table.description && (
                                                <div className="text-[10px] text-gray-400 mt-0.5 truncate pl-5">
                                                    {table.description}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-md border border-gray-200 p-4">
                                {selectedTemplate ? (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Database className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{selectedTemplate.name}</h4>
                                                <p className="text-xs text-gray-500">{selectedTemplate.description}</p>
                                            </div>
                                        </div>

                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="py-2 text-xs font-medium text-gray-500 w-8">PK</th>
                                                    <th className="py-2 text-xs font-medium text-gray-500">Name</th>
                                                    <th className="py-2 text-xs font-medium text-gray-500">Type</th>
                                                    <th className="py-2 text-xs font-medium text-gray-500">Attributes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedTemplate.columns.map((col, idx) => (
                                                    <tr key={idx}>
                                                        <td className="py-2">
                                                            {col.isPrimaryKey && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />}
                                                        </td>
                                                        <td className="py-2 font-mono text-gray-700">{col.name}</td>
                                                        <td className="py-2 text-gray-500">{col.type}</td>
                                                        <td className="py-2">
                                                            <div className="flex gap-1">
                                                                {col.isForeignKey && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">FK</span>}
                                                                {col.isNotNull && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded">NN</span>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                        Select a table to preview
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 h-full overflow-y-auto pr-2">
                            {/* Manual Form Content is same as before but wrapped in div */}
                            <div>
                                <label className="text-sm font-medium mb-2 block text-gray-700">
                                    Table Name
                                </label>
                                <Input
                                    value={tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                    placeholder="e.g. Products"
                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Columns
                                    </label>
                                    <Button variant="ghost" size="sm" onClick={addColumn} className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        <Plus className="w-3 h-3 mr-1" /> Add Column
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {columns.map((column, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <Input
                                                value={column.name}
                                                onChange={(e) => updateColumn(index, 'name', e.target.value)}
                                                placeholder="Column name"
                                                className="flex-1 bg-white border-gray-300 text-gray-900 h-8 text-sm placeholder:text-gray-400"
                                            />
                                            <Input
                                                value={column.type}
                                                onChange={(e) => updateColumn(index, 'type', e.target.value)}
                                                placeholder="Type"
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
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddTable}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={mode === 'template' && !selectedTemplateName || mode === 'manual' && !tableName}
                    >
                        Add Table
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
