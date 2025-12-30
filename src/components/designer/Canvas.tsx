import { useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    MiniMap,
    Background,
    Connection,
    Edge,
    NodeTypes,
    EdgeTypes,
    ReactFlowInstance,
    OnConnect,
    useUpdateNodeInternals,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    onNodesChange as onNodesChangeAction,
    onEdgesChange as onEdgesChangeAction,
    onConnect as onConnectAction
} from '@/store/slices/schemaSlice';
import {
    openLinkFieldDialog,
    openObjectConnectionDialog,
} from '@/store/slices/uiSlice';

import { TableNode } from '../TableNode';
import { RelationshipEdge } from '../RelationshipEdge';

const nodeTypes: NodeTypes = {
    table: TableNode,
};

const edgeTypes: EdgeTypes = {
    relationship: RelationshipEdge,
};

export function Canvas() {
    const dispatch = useAppDispatch();
    const nodes = useAppSelector((state) => state.schema.present.nodes);
    const edges = useAppSelector((state) => state.schema.present.edges);
    const visibleNodeIds = useAppSelector((state) => state.ui.visibleNodeIds);
    const updateNodeInternals = useUpdateNodeInternals();

    // Filter nodes based on visibility
    const visibleNodes = nodes.filter(node => visibleNodeIds.includes(node.id));

    // Keep visible edges that connect visible nodes
    const visibleEdges = edges.filter(edge => {
        const sourceVisible = visibleNodeIds.includes(edge.source);
        const targetVisible = visibleNodeIds.includes(edge.target);
        return sourceVisible && targetVisible;
    });

    const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

    const onNodesChange = useCallback(
        (changes: any) => dispatch(onNodesChangeAction(changes)),
        [dispatch]
    );

    const onEdgesChange = useCallback(
        (changes: any) => dispatch(onEdgesChangeAction(changes)),
        [dispatch]
    );

    // Validation logic from original App.tsx
    const isValidConnection = useCallback((connection: Connection) => {
        if (connection.sourceHandle === 'object-target' && connection.targetHandle === 'object-target') {
            return false;
        }
        if (connection.targetHandle === 'object-target') {
            return connection.source !== connection.target && connection.sourceHandle !== 'object-target';
        }
        if (connection.sourceHandle === 'object-target' && connection.targetHandle) {
            return connection.source !== connection.target && connection.targetHandle !== 'object-target';
        }
        return connection.source !== connection.target;
    }, []);

    const onConnect: OnConnect = useCallback(
        (params: Connection) => {
            if (params.source && params.target && params.sourceHandle && params.targetHandle) {
                // Validation logic for Object Connection Dialog
                if (params.targetHandle === 'object-target') {
                    dispatch(openObjectConnectionDialog({
                        sourceNodeId: params.source,
                        sourceFieldName: params.sourceHandle,
                        targetNodeId: params.target,
                    }));
                    return;
                }

                if (params.sourceHandle === 'object-target') {
                    dispatch(openObjectConnectionDialog({
                        sourceNodeId: params.source,
                        sourceFieldName: 'object-target',
                        targetNodeId: params.target,
                        targetFieldName: params.targetHandle,
                    }));
                    return;
                }

                // Standard connection
                dispatch(onConnectAction(params));
            }
        },
        [dispatch]
    );

    // Force React Flow to update node internals when nodes change
    // This ensures handle positions are recomputed after field reordering
    const nodesVersion = nodes.reduce((sum, node) => sum + (node.data._version || 0), 0);

    useEffect(() => {
        // Only update nodes that have _version (recently modified)
        const nodesToUpdate = nodes.filter(n => n.data._version);
        nodesToUpdate.forEach(node => {
            updateNodeInternals(node.id);
        });
    }, [nodesVersion, updateNodeInternals]);

    // Replacement for CustomEvent 'addField' listener in App.tsx
    // We will instead handle this inside the TableNode component directly if possible, 
    // OR we keep the valid pattern of dispatching an action.
    // The TableNode component should use dispatch(openLinkFieldDialog(id)). 
    // I will need to refactor TableNode to use Redux hooks.
    // For now, if TableNode still emits event, we need to listen?
    // User said "tách mọi thứ có thể", so I'll refactor TableNode to use Redux.

    return (
        <div className="flex-1 h-full w-full">
            <ReactFlow
                nodes={visibleNodes}
                edges={visibleEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                isValidConnection={isValidConnection}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onInit={(instance) => { reactFlowInstance.current = instance; }}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
}
