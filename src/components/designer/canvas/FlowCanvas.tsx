import { useCallback, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ReactFlowInstance,
    NodeTypes,
    EdgeTypes,
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
