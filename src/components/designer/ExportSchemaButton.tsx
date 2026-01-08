import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { generateSchema } from '@/utils/schemaGenerator';
import { generateSampleDataWithComments } from '@/utils/sampleDataGenerator';
import { generatePostgreSQLSchema, generateMySQLSchema } from '@/utils/sqlGenerator';

type ExportFormat = 'sample' | 'schema' | 'postgresql' | 'mysql';

export function ExportSchemaButton() {
    const [showPreview, setShowPreview] = useState(false);
    const [format, setFormat] = useState<ExportFormat>('sample');
    const nodes = useAppSelector(state => state.schema.present.nodes);
    const edges = useAppSelector(state => state.schema.present.edges);

    const getContent = () => {
        if (format === 'sample') {
            return generateSampleDataWithComments(nodes, edges);
        } else if (format === 'postgresql') {
            return generatePostgreSQLSchema(nodes, edges);
        } else if (format === 'mysql') {
            return generateMySQLSchema(nodes, edges);
        } else {
            const schema = generateSchema(nodes, edges);
            return JSON.stringify(schema, null, 2);
        }
    };

    const content = getContent();

    const handleDownload = () => {
        const extension = format === 'sample' ? '.js' :
            format === 'postgresql' || format === 'mysql' ? '.sql' :
                '.json';
        const filename = format === 'sample' ? 'sample-data' :
            format === 'postgresql' ? 'schema-postgresql' :
                format === 'mysql' ? 'schema-mysql' :
                    'schema';

        const blob = new Blob([content], {
            type: format === 'sample' ? 'text/javascript' :
                format === 'postgresql' || format === 'mysql' ? 'text/plain' :
                    'application/json'
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

    return (
        <>
            <Button
                onClick={() => setShowPreview(true)}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
                size="sm"
            >
                <Eye className="w-4 h-4 mr-2" />
                Export Schema
            </Button>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Export Schema</DialogTitle>
                        <DialogDescription>
                            Choose format and export your schema
                        </DialogDescription>
                    </DialogHeader>

                    {/* Format Selector */}
                    <div className="flex gap-2 pb-3 border-b flex-wrap">
                        <Button
                            variant={format === 'sample' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFormat('sample')}
                            className={format === 'sample' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            Sample Data
                        </Button>
                        <Button
                            variant={format === 'postgresql' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFormat('postgresql')}
                            className={format === 'postgresql' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                            PostgreSQL
                        </Button>
                        <Button
                            variant={format === 'mysql' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFormat('mysql')}
                            className={format === 'mysql' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        >
                            MySQL
                        </Button>
                        <Button
                            variant={format === 'schema' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFormat('schema')}
                            className={format === 'schema' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        >
                            Schema JSON
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
                        <pre>{content}</pre>
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handleCopyToClipboard}
                        >
                            Copy to Clipboard
                        </Button>
                        <Button
                            onClick={handleDownload}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
