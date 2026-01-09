import { useEffect, useMemo, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    NodeTypes,
    EdgeTypes,
    useUpdateNodeInternals,
    useNodes,
} from '@xyflow/react';
import { CanvasVisualHandler } from '@/components/designer/canvas/CanvasVisualHandler';
import '@xyflow/react/dist/style.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { onNodesChange, onEdgesChange, onConnect } from '@/store/slices/schemaSlice';
import { TableNodeData } from '@/types/schema';
import { TableNode } from '@/components/TableNode';
import { RelationshipEdge } from '@/components/RelationshipEdge';
import { openLinkFieldDialogWithValues } from '@/store/slices/uiSlice';
import { SchemaEvents } from '@/events/schemaEvents';
import { schemaEventBus } from '@/events/eventBus';

const nodeTypes: NodeTypes = {
    table: TableNode as any,
};

const edgeTypes: EdgeTypes = {
    relationship: RelationshipEdge,
};

// Component to update node internals - must be inside ReactFlow
// Only updates nodes that have been modified (have _version timestamp)
function NodeUpdater() {
    const updateNodeInternals = useUpdateNodeInternals();
    const nodes = useNodes();

    const nodesVersion = nodes.reduce((sum, node) => sum + ((node.data as TableNodeData)._version || 0), 0);

    useEffect(() => {
        // Only update nodes that have _version (recently modified)
        const nodesToUpdate = nodes.filter(n => n.data._version);
        nodesToUpdate.forEach(node => {
            updateNodeInternals(node.id);
        });
    }, [nodesVersion, updateNodeInternals]);

    return null;
}

export function FlowCanvas() {
    const dispatch = useDispatch();
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);
    const edges = useSelector((state: RootState) => state.schema.present.edges);

    // Filter nodes based on isActive property
    const visibleNodes = useMemo(() => {
        return nodes.filter(node => node.data?.isActive !== false); // Default to true if undefined
    }, [nodes]);

    // Custom onNodesChange to intercept deletions
    const onNodesChangeHandler = useCallback((changes: any[]) => {
        const changesToApply = changes.filter(c => c.type !== 'remove');
        if (changesToApply.length > 0) {
            dispatch(onNodesChange(changesToApply));
        }

        // Handle removals via Event Bus to trigger Cascade Deletion
        const removals = changes.filter(c => c.type === 'remove');
        removals.forEach(c => {
            schemaEventBus.emit(SchemaEvents.TABLE_DELETE, { id: c.id });
        });
    }, [dispatch]);

    // Custom onConnect to open Link Dialog
    const onConnectHandler = useCallback((connection: any) => {
        const { source, target, sourceHandle, targetHandle } = connection;
        if (source && target && sourceHandle && targetHandle) {
            dispatch(openLinkFieldDialogWithValues({
                sourceNodeId: source,
                initialValues: {
                    targetNodeId: target,
                    sourceKey: sourceHandle,
                    targetKey: targetHandle,
                    // Default guess, can be changed in dialog
                    linkType: '1-n',
                    fieldName: ''
                }
            }));
        }
    }, [dispatch]);

    const isValidConnection = useCallback((connection: any) => {
        return connection.source !== connection.target;
    }, []);

    return (
        <div className="flex-1 h-full w-full">
            <ReactFlow
                nodes={visibleNodes}
                edges={edges}
                onNodesChange={onNodesChangeHandler}
                onEdgesChange={(changes) => dispatch(onEdgesChange(changes))}
                onConnect={onConnectHandler}
                isValidConnection={isValidConnection}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-gray-50"
            >
                <CanvasVisualHandler />
                <NodeUpdater />
                <Background color="#ccc" gap={16} />
                <Controls className="bg-white text-black border-gray-200 shadow-sm" />
                <MiniMap
                    nodeColor={(node) => {
                        return (node.data as any).color || '#ccc';
                    }}
                    maskColor="rgba(240, 240, 240, 0.6)"
                    className="bg-white border border-gray-200"
                />
            </ReactFlow>
        </div>
    );
}
