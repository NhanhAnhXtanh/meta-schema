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
    Connection,
    OnNodesDelete,
    Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { TableNodeData } from '@/types/schema';
import { TableNode } from '@/components/designer/canvas/nodes/TableNode';


const defaultEdgeOptions: Omit<Edge, 'id' | 'source' | 'target'> = {
    type: 'relationship',
    animated: true,
};

// Component to update node internals - must be inside ReactFlow
// Only updates nodes that have been modified (have _version timestamp)
function NodeUpdater() {
    const updateNodeInternals = useUpdateNodeInternals();
    const nodes = useNodes();

    // Calculate a hash/sum of versions to trigger effect efficiently
    const nodesVersion = useMemo(() =>
        nodes.reduce((sum, node) => sum + ((node.data as TableNodeData)._version || 0), 0),
        [nodes]
    );

    useEffect(() => {
        // Only update nodes that have _version (recently modified)
        const nodesToUpdate = nodes.filter(n => n.data._version);
        nodesToUpdate.forEach(node => {
            updateNodeInternals(node.id);
        });
    }, [nodesVersion, updateNodeInternals]); // Dependent on computed version

    return null;
}

export function FlowCanvas() {
    const dispatch = useDispatch();
    const nodes:any = []
    const edges:any = []

    // Filter nodes based on isActive property
    // We use useMemo to ensure referential stability for ReactFlow
    const visibleNodes = useMemo(() => {
        return nodes;
    }, [nodes]);

    const onNodesChangeHandler = () => {

    }
        

    // Optimize: Handle Node Deletions (Native Handler)
    const onNodesDelete: OnNodesDelete = useCallback((deletedNodes) => {
        deletedNodes.forEach(node => {
            // schemaEventBus.emit(SchemaEvents.TABLE_DELETE, { id: node.id });
            alert(`Gửi lên Jmix : ${node.id}`);
        });
    }, []);


    return (
        <div className="flex-1 h-full w-full">
            <ReactFlow
                nodes={visibleNodes}
                edges={edges}
                onNodesChange={onNodesChangeHandler}
                onNodesDelete={onNodesDelete}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                className="bg-gray-50"
                minZoom={0.1}
                maxZoom={4}
                snapToGrid={true}
                snapGrid={[16, 16]}
                proOptions={{ hideAttribution: true }} // Valid for Pro or non-commercial if allowed, cleans UI
            >
                <NodeUpdater />
                <Background color="#ccc" gap={16} />
                <Controls className="bg-white text-black border-gray-200 shadow-sm" />
                <MiniMap
                    nodeColor={(node) => (node.data as any).color || '#ccc'}
                    maskColor="rgba(240, 240, 240, 0.6)"
                    className="bg-white border border-gray-200 rounded shadow-md"
                />
            </ReactFlow>
        </div>
    );
}
