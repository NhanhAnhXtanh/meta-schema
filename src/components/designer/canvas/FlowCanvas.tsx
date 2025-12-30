import { useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ReactFlowInstance,
    NodeTypes,
    EdgeTypes,
    useUpdateNodeInternals,
    useNodes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { onNodesChange, onEdgesChange, onConnect } from '@/store/slices/schemaSlice';
import { TableNode } from '@/components/TableNode';
import { RelationshipEdge } from '@/components/RelationshipEdge';

const nodeTypes: NodeTypes = {
    table: TableNode,
};

const edgeTypes: EdgeTypes = {
    relationship: RelationshipEdge,
};

// Component to update node internals - must be inside ReactFlow
function NodeUpdater() {
    const updateNodeInternals = useUpdateNodeInternals();
    const nodes = useNodes();

    const nodesVersion = nodes.reduce((sum, node) => sum + ((node.data as any)._version || 0), 0);

    useEffect(() => {
        console.log('🔄 Nodes version changed:', nodesVersion, '- updating internals for', nodes.length, 'nodes');
        nodes.forEach(node => {
            console.log('  → Updating node:', node.id, 'columns:', node.data.columns?.length, 'version:', (node.data as any)._version);
            updateNodeInternals(node.id);
        });
    }, [nodesVersion, nodes.length, updateNodeInternals]);

    return null;
}

export function FlowCanvas() {
    const dispatch = useAppDispatch();
    const nodes = useAppSelector((state) => state.schema.nodes);
    const edges = useAppSelector((state) => state.schema.edges);
    const visibleNodeIds = useAppSelector((state) => state.ui.visibleNodeIds);

    const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

    const visibleNodes = nodes.filter(node => visibleNodeIds.includes(node.id));

    const onInit = useCallback((instance: ReactFlowInstance) => {
        reactFlowInstance.current = instance;
    }, []);

    return (
        <div className="flex-1 h-full w-full">
            <ReactFlow
                nodes={visibleNodes}
                edges={edges}
                onNodesChange={(changes) => dispatch(onNodesChange(changes))}
                onEdgesChange={(changes) => dispatch(onEdgesChange(changes))}
                onConnect={(conn) => dispatch(onConnect(conn))}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onInit={onInit}
                fitView
                className="bg-gray-50"
            >
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
