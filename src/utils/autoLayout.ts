import { Node } from '@xyflow/react';
import { TableNodeData } from '@/types/schema';

/**
 * Simple Grid Layout Algorithm
 * Arranges nodes in a grid pattern
 */
export const performAutoLayout = (nodes: Node<TableNodeData>[]): Node<TableNodeData>[] => {
    const ROW_ITEMS = 3;
    const SPACING_X = 400; // Expected width of table + gap
    const SPACING_Y = 300; // Expected height of table + gap

    // Separate visible vs hidden nodes if needed, but usually we layout everything or just visible
    // We assume input 'nodes' are the ones we want to layout.

    return nodes.map((node, index) => {
        const row = Math.floor(index / ROW_ITEMS);
        const col = index % ROW_ITEMS;

        return {
            ...node,
            position: {
                x: col * SPACING_X,
                y: row * SPACING_Y
            },
            // Update version to force redraw if needed, though position change usually triggers it
            data: {
                ...node.data,
                _version: Date.now()
            }
        };
    });
};
