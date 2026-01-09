import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { schemaEventBus } from '@/events/eventBus';
import { SchemaEvents, TableFocusPayload } from '@/events/schemaEvents';

/**
 * CanvasVisualHandler
 * 
 * Component này nằm bên trong ReactFlow.
 * Nó chỉ lắng nghe các sự kiện liên quan đến hiển thị (Visual), camera, focus.
 * Nó KHÔNG can thiệp vào dữ liệu (Redux).
 */
export function CanvasVisualHandler() {
    const { fitView } = useReactFlow();

    useEffect(() => {
        // --- Visual Handlers ---

        const handleTableFocus = (payload: TableFocusPayload) => {
            if (payload.nodeId) {
                fitView({
                    nodes: [{ id: payload.nodeId }],
                    duration: 800,
                    padding: 0.2,
                    maxZoom: 1.5
                });
            }
        };

        // If AutoLayout happens, JmixDataController updates the DB (nodes prop updates).
        // If we want to animate the view AFTER layout, we can listen effectively here too, 
        // OR rely on React Flow to just render the new positions.
        // For better UX, we might want to zoom fit after layout.
        const handleAutoLayoutVisuals = () => {
            // Wait a tick for Redux to update nodes, then fit view
            setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
        };

        // Register Listeners
        schemaEventBus.on(SchemaEvents.TABLE_FOCUS, handleTableFocus);
        schemaEventBus.on(SchemaEvents.SCHEMA_AUTO_LAYOUT, handleAutoLayoutVisuals);

        // Cleanup
        return () => {
            schemaEventBus.off(SchemaEvents.TABLE_FOCUS, handleTableFocus);
            schemaEventBus.off(SchemaEvents.SCHEMA_AUTO_LAYOUT, handleAutoLayoutVisuals);
        };
    }, [fitView]);

    return null;
}
