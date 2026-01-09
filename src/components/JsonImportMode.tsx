import { useRef } from 'react';
import { Upload, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { importSchema } from '@/utils/schemaImporter';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setJsonImportFileName, setJsonImportPreviewData, setJsonImportError, resetJsonImportState } from '@/store/slices/jsonImportSlice';

interface JsonImportModeProps {
    onImport: (nodes: any[], edges: any[]) => void;
}

export function JsonImportMode({ onImport }: JsonImportModeProps) {
    const dispatch = useDispatch();
    const { fileName, previewData, error } = useSelector((state: RootState) => state.jsonImport);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        dispatch(setJsonImportFileName(file.name));
        dispatch(setJsonImportError(''));
        dispatch(setJsonImportPreviewData(null));

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            const { nodes, edges } = importSchema(jsonData);

            if (nodes.length === 0) {
                dispatch(setJsonImportError('Không tìm thấy bảng nào trong file JSON!'));
                return;
            }

            dispatch(setJsonImportPreviewData({
                nodes,
                edges,
                collections: jsonData.collections || []
            }));
        } catch (err) {
            dispatch(setJsonImportError(err instanceof Error ? err.message : 'Lỗi khi đọc file JSON'));
            console.error('[JSON Import]', err);
        }
    };

    const handleImport = () => {
        if (previewData) {
            onImport(previewData.nodes, previewData.edges);
            // Optionally reset after success
            dispatch(resetJsonImportState());
        }
    };

    const handleCancel = () => {
        dispatch(resetJsonImportState());
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {!previewData ? (
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
                        <FileJson className="w-12 h-12 text-blue-500" />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Import Schema từ JSON
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Chọn file JSON đã export trước đó để tạo bảng tự động
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Chọn File JSON
                    </Button>

                    {fileName && (
                        <p className="mt-3 text-xs text-gray-400">
                            File: {fileName}
                        </p>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-2xl">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                <FileJson className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-green-900 mb-1">
                                    Sẵn sàng import!
                                </h4>
                                <p className="text-sm text-green-700 mb-3">
                                    File: <span className="font-mono">{fileName}</span>
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-white rounded px-3 py-2">
                                        <div className="text-gray-500 text-xs">Số bảng</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {previewData.nodes.length}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded px-3 py-2">
                                        <div className="text-gray-500 text-xs">Mối quan hệ</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {previewData.edges.length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                        {(() => {
                            const linkedCollections: any[] = [];
                            const independentCollections: any[] = [];

                            previewData.collections.forEach((col: any) => {
                                // Find instances of this collection
                                const instanceIds = previewData.nodes
                                    .filter((n: any) => n.data.tableName === col.name)
                                    .map((n: any) => n.id);

                                // Check if any instance participates in an edge
                                const isLinked = previewData.edges.some((e: any) =>
                                    instanceIds.includes(e.source) || instanceIds.includes(e.target)
                                );

                                if (isLinked) {
                                    linkedCollections.push(col);
                                } else {
                                    independentCollections.push(col);
                                }
                            });

                            return (
                                <div className="space-y-4">
                                    {/* Group 1: Linked Tables */}
                                    {linkedCollections.length > 0 && (
                                        <div>
                                            <h5 className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase mb-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                Bảng có mối quan hệ ({linkedCollections.length})
                                            </h5>
                                            <div className="space-y-1 pl-3 border-l-2 border-blue-100">
                                                {linkedCollections.map((col: any, idx: number) => (
                                                    <div key={`linked-${idx}`} className="bg-white rounded px-3 py-2 text-sm shadow-sm flex justify-between items-center group">
                                                        <div>
                                                            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                {col.displayName}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Type: {col.name}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                                            {col.instances?.length || 1} instance(s)
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Group 2: Independent Tables */}
                                    {independentCollections.length > 0 && (
                                        <div>
                                            <h5 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-2 mt-4">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                Bảng độc lập ({independentCollections.length})
                                            </h5>
                                            <div className="space-y-1 pl-3 border-l-2 border-gray-200">
                                                {independentCollections.map((col: any, idx: number) => (
                                                    <div key={`indep-${idx}`} className="bg-white rounded px-3 py-2 text-sm border border-gray-100 opacity-80 hover:opacity-100 transition-opacity">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <div className="font-medium text-gray-700">{col.displayName}</div>
                                                                <div className="text-xs text-gray-400">Type: {col.name}</div>
                                                            </div>
                                                            <div className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                                {col.instances?.length || 1} instance(s)
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="flex-1"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleImport}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Tạo Bảng
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
