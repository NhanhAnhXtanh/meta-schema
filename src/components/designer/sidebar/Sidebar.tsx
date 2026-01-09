import { useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setNodes } from '@/store/slices/schemaSlice';
import {
    toggleSidebarNodeExpand,
    setSidebarDraggedNodeId,
    setSidebarDragOverNodeId,
    setSidebarWidth,
    setIsSidebarResizing,
    setIsSidebarCollapsed
} from '@/store/slices/sidebarSlice';

import { SidebarHeader } from './SidebarHeader';
import { SidebarItem } from './SidebarItem';

export function Sidebar() {
    const dispatch = useDispatch();
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);
    const edges = useSelector((state: RootState) => state.schema.present.edges);
    const selectedNodeId = useSelector((state: RootState) => state.ui.selectedNodeId);

    // Sidebar State
    const {
        searchQuery,
        expandedNodes,
        draggedNodeId,
        dragOverNodeId,
        width,
        isResizing,
        isCollapsed
    } = useSelector((state: RootState) => state.sidebar);

    const sidebarRef = useRef<HTMLDivElement>(null);

    // Filter visible nodes
    // Trust Redux state for visible nodes
    const appVisibleNodes = nodes.filter(n => n.data.isActive !== false);

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
        dispatch(toggleSidebarNodeExpand(id));
    };

    // DnD Handlers for Nodes
    const handleNodeDragStart = (e: React.DragEvent, id: string) => {
        dispatch(setSidebarDraggedNodeId(id));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleNodeDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (draggedNodeId && draggedNodeId !== id) {
            dispatch(setSidebarDragOverNodeId(id));
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
        dispatch(setSidebarDraggedNodeId(null));
        dispatch(setSidebarDragOverNodeId(null));
    };

    const startResizing = (e: React.MouseEvent) => {
        dispatch(setIsSidebarResizing(true));
        e.preventDefault();
        window.addEventListener('mousemove', resize as any);
        window.addEventListener('mouseup', stopResizing);
    };

    const stopResizing = () => {
        dispatch(setIsSidebarResizing(false));
        window.removeEventListener('mousemove', resize as any);
        window.removeEventListener('mouseup', stopResizing);
    };

    const resize = (e: MouseEvent) => {
        if (sidebarRef.current && !isCollapsed) {
            const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
            if (newWidth > 280 && newWidth < 800) {
                dispatch(setSidebarWidth(newWidth));
            } else if (newWidth <= 280) {
                // Do not collapse automatically on resize, just stop at min width
                dispatch(setSidebarWidth(280)); // Hard stop at min width
            }
        }
    };

    const toggleCollapse = () => {
        dispatch(setIsSidebarCollapsed(!isCollapsed));
    };

    if (isCollapsed) {
        return (
            <div className="h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 w-[50px] shrink-0 transition-all">
                <button
                    onClick={toggleCollapse}
                    className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                </button>
            </div>
        );
    }

    return (
        <div
            ref={sidebarRef}
            className="flex flex-col h-full bg-white border-r border-gray-200 flex-shrink-0 relative group transition-[width] duration-0 ease-linear"
            style={{ width: `${width}px` }}
        >
            <SidebarHeader />
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
                {filteredNodes.map(node => (
                    <SidebarItem
                        key={node.id}
                        node={node}
                        isExpanded={expandedNodes.includes(node.id)}
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
                className={`absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-40 ${isResizing ? 'bg-blue-500' : 'bg-transparent'}`}
                onMouseDown={startResizing}
            />
        </div>
    );
}
