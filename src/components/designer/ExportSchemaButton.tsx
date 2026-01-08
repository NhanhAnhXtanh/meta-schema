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

export function ExportSchemaButton() {
    const [showPreview, setShowPreview] = useState(false);
    const nodes = useAppSelector(state => state.schema.present.nodes);
    const edges = useAppSelector(state => state.schema.present.edges);

    const schema = generateSchema(nodes, edges);
    const schemaJson = JSON.stringify(schema, null, 2);

    const handleDownload = () => {
        const blob = new Blob([schemaJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schema.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(schemaJson);
        alert('Schema copied to clipboard!');
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
                        <DialogTitle>Schema Preview</DialogTitle>
                        <DialogDescription>
                            Preview and export your schema
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
                        <pre>{schemaJson}</pre>
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
                            Download JSON
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
