import { useState, useMemo, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Node } from '@xyflow/react';
import { TableNodeData } from '@/types/schema';
import { setNodes } from '@/store/slices/schemaSlice';

import { SidebarHeader } from './SidebarHeader';
import { SidebarItem } from './SidebarItem';

export function Sidebar() {
    const dispatch = useAppDispatch();
    const nodes = useAppSelector(state => state.schema.nodes);
    const edges = useAppSelector(state => state.schema.edges);
    const visibleNodeIds = useAppSelector(state => state.ui.visibleNodeIds);
    const selectedNodeId = useAppSelector(state => state.ui.selectedNodeId);

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // DnD state for Nodes
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

    // Filter visible nodes
    // Trust Redux state for visible nodes
    const appVisibleNodes = nodes.filter(n => visibleNodeIds.includes(n.id));

    // Strict Root Logic: A node is a root if no edge points to it inside the edges list
    const rootNodes = useMemo(() => {
        const childIds = new Set(edges.map(e => e.target));
        return appVisibleNodes.filter(n => !childIds.has(n.id));
    }, [appVisibleNodes, edges]);

    const filteredNodes = useMemo(() => {
        if (!searchQuery.trim()) return rootNodes;
        return appVisibleNodes.filter(n => n.data.label.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery, rootNodes, appVisibleNodes]);

    const handleToggleExpand = (id: string) => {
        const next = new Set(expandedNodes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedNodes(next);
    };

    // DnD Handlers for Nodes
    const handleNodeDragStart = (e: React.DragEvent, id: string) => {
        setDraggedNodeId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleNodeDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (draggedNodeId && draggedNodeId !== id) {
            setDragOverNodeId(id);
        }
    };

    const handleNodeDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (draggedNodeId && draggedNodeId !== targetId) {
            // Reorder logic
            const draggedIndex = nodes.findIndex(n => n.id === draggedNodeId);
            const targetIndex = nodes.findIndex(n => n.id === targetId);
            if (draggedIndex !== -1 && targetIndex !== -1) {
                const newNodes = [...nodes];
                const [removed] = newNodes.splice(draggedIndex, 1);
                newNodes.splice(targetIndex, 0, removed);
                dispatch(setNodes(newNodes));
            }
        }
        setDraggedNodeId(null);
        setDragOverNodeId(null);
    };

    // Resizing State
    const [width, setWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const startResizing = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
        window.addEventListener('mousemove', resize as any);
        window.addEventListener('mouseup', stopResizing);
    };

    const stopResizing = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', resize as any);
        window.removeEventListener('mouseup', stopResizing);
    };

    const resize = (e: MouseEvent) => {
        if (sidebarRef.current) {
            const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
            if (newWidth > 200 && newWidth < 800) {
                setWidth(newWidth);
            }
        }
    };

    return (
        <div
            ref={sidebarRef}
            className="flex flex-col h-full bg-white border-r border-gray-200 flex-shrink-0 relative group"
            style={{ width: `${width}px` }}
        >
            <SidebarHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <div className="flex-1 overflow-y-auto p-2">
                {filteredNodes.map(node => (
                    <SidebarItem
                        key={node.id}
                        node={node}
                        isExpanded={expandedNodes.has(node.id)}
                        onToggleExpand={handleToggleExpand}
                        isSelected={selectedNodeId === node.id}
                        onDragStart={handleNodeDragStart}
                        onDragOver={handleNodeDragOver}
                        onDrop={handleNodeDrop}
                        isDragging={draggedNodeId === node.id}
                        isDragOver={dragOverNodeId === node.id}
                    />
                ))}
                {filteredNodes.length === 0 && (
                    <div className="text-gray-500 text-center py-4 text-sm italic">
                        {searchQuery ? 'No tables found' : 'No root tables visible'}
                    </div>
                )}
            </div>

            {/* Resize Handle */}
            <div
                className={`absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-50 ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
                onMouseDown={startResizing}
            />
        </div>
    );
}
