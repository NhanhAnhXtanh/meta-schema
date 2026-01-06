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

interface AddTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddTableDialog({ open, onOpenChange }: AddTableDialogProps) {
    const dispatch = useAppDispatch();
    const existingNodes = useAppSelector(state => state.schema.present.nodes);
    const [mode, setMode] = useState<'manual' | 'template' | 'api'>('template');
    const [searchQuery, setSearchQuery] = useState('');
    // API Mode
    const [apiUrl, setApiUrl] = useState('https://jsonplaceholder.typicode.com/users/1');
    const [isFetching, setIsFetching] = useState(false);

    // Manual Mode State
    const [tableName, setTableName] = useState(''); // DB table name
    const [displayLabel, setDisplayLabel] = useState(''); // Display label/role
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
            tableName: node.data.tableName,
            description: `Bảng mẫu với ${node.data.columns.length} cột`,
            columns: node.data.columns
        }));
    }, []);

    // Filter templates
    const filteredTemplates = useMemo(() => {
        return templates.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tableName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [templates, searchQuery]);

    const handleAddTable = useCallback(() => {
        if (mode === 'manual') {
            if (!tableName.trim() || !displayLabel.trim()) return;
            // Generate manual ID
            const newId = `table-${Date.now()}`;

            dispatch(addTable({
                id: newId,
                name: displayLabel, // Display label
                tableName: tableName, // Actual DB table name
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
            setDisplayLabel('');
            setColumns([{ name: 'id', type: 'uuid', isPrimaryKey: true, visible: true }]);
        } else {
            // Template Mode - ALWAYS create new instance
            if (!selectedTemplateName) return;
            const template = templates.find(t => t.name === selectedTemplateName);

            if (template) {
                // Find how many instances of this table already exist to make the label unique
                const instanceCount = existingNodes.filter(n => n.data.tableName === template.name.toLowerCase()).length;
                const newId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const displayLabel = instanceCount > 0 ? `${template.name} (${instanceCount + 1})` : template.name;

                dispatch(addTable({
                    id: newId,
                    name: displayLabel,
                    tableName: template.tableName || template.name.toLowerCase().replace(/\s+/g, '_'),
                    columns: template.columns.map(c => ({ ...c, visible: true, isVirtual: false }))
                }));
                dispatch(addVisibleNodeId(newId));
            }
        }
        onOpenChange(false);
    }, [tableName, columns, dispatch, onOpenChange, mode, selectedTemplateName, templates, existingNodes, displayLabel]);

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
                        Tạo một bản sao (instance) từ mẫu hoặc tạo bảng trống mới.
                    </DialogDescription>
                </DialogHeader>

                {/* Mode Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg shrink-0">
                    <button
                        onClick={() => setMode('template')}
                        className={cn(
                            "py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all",
                            mode === 'template' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Database className="w-4 h-4" /> Chọn Mẫu Có Sẵn (Instance)
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={cn(
                            "py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all",
                            mode === 'manual' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" /> Tạo Thủ Công (Empty)
                    </button>
                </div>

                <div className="flex-1 overflow-hidden mt-4 min-h-0 flex flex-col">
                    {mode === 'template' ? (
                        <div className="flex-1 flex gap-4 min-h-0">
                            {/* Template List */}
                            <div className="w-1/3 border-r border-gray-200 pr-4 flex flex-col min-h-0">
                                <div className="relative mb-2 shrink-0">
                                    <Database className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Tìm kiếm mẫu..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                                    />
                                </div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Danh sách mẫu</h3>

                                <div className="flex-1 overflow-y-auto -mr-2 pr-2 min-h-0">
                                    <div className="space-y-1 pb-2">
                                        {filteredTemplates.map(table => (
                                            <button
                                                key={table.name}
                                                onClick={() => setSelectedTemplateName(table.name)}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 rounded-md text-sm transition-all border border-transparent",
                                                    selectedTemplateName === table.name
                                                        ? "bg-blue-50 text-blue-700 font-medium border-blue-100 shadow-sm"
                                                        : "hover:bg-gray-100 text-gray-700 hover:border-gray-200"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                                        selectedTemplateName === table.name ? "bg-blue-500" : "bg-gray-300"
                                                    )} />
                                                    <span className="truncate">{table.name}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5 truncate pl-3.5">
                                                    {table.tableName}
                                                </div>
                                            </button>
                                        ))}
                                        {filteredTemplates.length === 0 && (
                                            <div className="text-center py-8 text-gray-400 text-xs italic">
                                                Không tìm thấy mẫu nào
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-md border border-gray-200 p-4">
                                {selectedTemplate ? (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                <Database className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg">{selectedTemplate.name}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{selectedTemplate.tableName}</span>
                                                    <span>•</span>
                                                    <span>{selectedTemplate.columns.length} columns</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-md border border-gray-200 overflow-hidden bg-white">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr className="border-b border-gray-200">
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 w-10 text-center">PK</th>
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-500">Field Name</th>
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 w-24">Type</th>
                                                        <th className="py-2.5 px-3 text-xs font-semibold text-gray-500 w-20 text-right">Attributes</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {selectedTemplate.columns.map((col, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="py-2 px-3 text-center">
                                                                {col.isPrimaryKey && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mx-auto" />}
                                                            </td>
                                                            <td className="py-2 px-3 font-medium text-gray-700">{col.name}</td>
                                                            <td className="py-2 px-3 text-gray-500 text-xs font-mono">{col.type}</td>
                                                            <td className="py-2 px-3 text-right">
                                                                <div className="flex gap-1 justify-end">
                                                                    {col.isForeignKey && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-medium">FK</span>}
                                                                    {col.isNotNull && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-medium">NN</span>}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                                        <Database className="w-8 h-8 opacity-20" />
                                        <p>Chọn một bảng bên trái để xem trước</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                            {/* Manual Form Content */}
                            <div>
                                <label className="text-sm font-medium mb-2 block text-gray-700">
                                    Table Name (DB)
                                    <span className="text-xs text-gray-500 ml-2 font-normal">Tên bảng thực tế trong database (viết liền, không dấu)</span>
                                </label>
                                <Input
                                    value={tableName}
                                    onChange={(e) => setTableName(e.target.value)}
                                    placeholder="e.g. cong_dan, ho_khau"
                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block text-gray-700">
                                    Display Label
                                    <span className="text-xs text-gray-500 ml-2 font-normal">Tên hiển thị trên giao diện</span>
                                </label>
                                <Input
                                    value={displayLabel}
                                    onChange={(e) => setDisplayLabel(e.target.value)}
                                    placeholder="e.g. Chủ hộ, Thành viên"
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
                                            <label className="flex items-center gap-1 text-xs cursor-pointer text-gray-600 select-none">
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
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-6">
                        Hủy
                    </Button>
                    <Button
                        onClick={handleAddTable}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all font-bold"
                        disabled={mode === 'template' && !selectedTemplateName || mode === 'manual' && (!tableName || !displayLabel)}
                    >
                        {mode === 'template' ? 'Tạo Bản Sao (Instance)' : 'Tạo Bảng Mới'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
