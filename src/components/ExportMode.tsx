import { Download, Copy } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { generateSchema } from '@/utils/schemaGenerator';
import { generateSampleDataWithComments } from '@/utils/sampleDataGenerator';
import { setExportFormat, ExportFormat } from '@/store/slices/exportSlice';

export function ExportMode() {
    const dispatch = useDispatch();
    const format = useSelector((state: RootState) => state.export.format);
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);
    const edges = useSelector((state: RootState) => state.schema.present.edges);

    const getContent = () => {
        if (format === 'sample') {
            return generateSampleDataWithComments(nodes, edges);
        } else {
            const schema = generateSchema(nodes, edges);
            return JSON.stringify(schema, null, 2);
        }
    };

    const content = getContent();

    const handleDownload = () => {
        const extension = format === 'sample' ? '.js' : '.json';
        const filename = format === 'sample' ? 'sample-data' : 'schema';

        const blob = new Blob([content], {
            type: format === 'sample' ? 'text/javascript' : 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename + extension;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(content);
        alert('Copied to clipboard!');
    };

    const handleFormatChange = (newFormat: ExportFormat) => {
        dispatch(setExportFormat(newFormat));
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50/50">
            {/* Header Section */}
            <div className="p-4 border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <Download className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Export Schema</h3>
                        <p className="text-sm text-gray-500">Chọn định dạng để xuất dữ liệu</p>
                    </div>
                </div>

                {/* Format Selector */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant={format === 'sample' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFormatChange('sample')}
                        className={format === 'sample' ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50 hover:text-green-700 hover:border-green-200'}
                    >
                        Sample Data
                    </Button>
                    <Button
                        variant={format === 'schema' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFormatChange('schema')}
                        className={format === 'schema' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'}
                    >
                        Schema JSON
                    </Button>
                </div>
            </div>

            {/* Preview Section */}
            <div className="flex-1 min-h-0 p-4 flex flex-col overflow-hidden">
                <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-auto border border-gray-800 shadow-inner custom-scrollbar">
                    <pre className="font-mono text-[11px] text-green-400 whitespace-pre">
                        {content}
                    </pre>
                </div>
            </div>

            {/* Footer Section */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2 justify-end shrink-0">
                <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    className="min-w-[140px]"
                >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                </Button>
                <Button
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-700 min-w-[140px]"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                </Button>
            </div>
        </div>
    );
}
