import { useState, useRef } from 'react';
import { Upload, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { importSchema } from '@/utils/schemaImporter';

interface JsonImportModeProps {
    onImport: (nodes: any[], edges: any[]) => void;
}

export function JsonImportMode({ onImport }: JsonImportModeProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>('');
    const [previewData, setPreviewData] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError('');
        setPreviewData(null);

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            const { nodes, edges } = importSchema(jsonData);

            if (nodes.length === 0) {
                setError('Không tìm thấy bảng nào trong file JSON!');
                return;
            }

            setPreviewData({
                nodes,
                edges,
                collections: jsonData.collections || []
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi khi đọc file JSON');
            console.error('[JSON Import]', err);
        }
    };

    const handleImport = () => {
        if (previewData) {
            onImport(previewData.nodes, previewData.edges);
        }
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
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Danh sách bảng sẽ được tạo:
                        </h5>
                        <div className="space-y-1">
                            {previewData.collections.map((col: any, idx: number) => (
                                <div key={idx} className="bg-white rounded px-3 py-2 text-sm">
                                    <div className="font-medium text-gray-900">{col.displayName}</div>
                                    <div className="text-xs text-gray-500">
                                        Table: {col.name} • {col.instances?.length || 1} instance(s)
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPreviewData(null);
                                setFileName('');
                                setError('');
                            }}
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
