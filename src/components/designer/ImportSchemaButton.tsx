import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { setNodes, setEdges } from '@/store/slices/schemaSlice';
import { setVisibleNodeIds } from '@/store/slices/uiSlice';
import { importSchema } from '@/utils/schemaImporter';

export function ImportSchemaButton() {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            console.log('[Import] File loaded, size:', text.length);

            const jsonData = JSON.parse(text);
            console.log('[Import] JSON parsed, collections:', jsonData.collections?.length);

            const { nodes, edges } = importSchema(jsonData);
            console.log('[Import] Created:', nodes.length, 'nodes,', edges.length, 'edges');

            if (nodes.length === 0) {
                alert('⚠️ No tables found in the imported file!\n\nMake sure you exported with "Schema JSON" format.');
                return;
            }

            dispatch(setNodes(nodes));
            dispatch(setEdges(edges));

            // Make all imported nodes visible in sidebar
            const nodeIds = nodes.map(n => n.id);
            dispatch(setVisibleNodeIds(nodeIds));

            alert(`✅ Successfully imported!\n\n${nodes.length} table(s)\n${edges.length} relationship(s)`);
        } catch (error) {
            console.error('[Import] Error:', error);
            alert(`❌ Import failed:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck browser console (F12) for details.`);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
            <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                size="sm"
                disabled={isImporting}
            >
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import Schema'}
            </Button>
        </>
    );
}
