

import { useEffect } from 'react';
import { Plus, Search, Undo2, Redo2, LayoutDashboard, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setAddTableDialogOpen } from '@/store/slices/uiSlice';
import { setNodes } from '@/store/slices/schemaSlice';
import { setSidebarSearchQuery, setIsSidebarCollapsed } from '@/store/slices/sidebarSlice';
import { performAutoLayout } from '@/utils/autoLayout';
import { ActionCreators } from 'redux-undo';

export function SidebarHeader() {
    const dispatch = useDispatch();

    // Data from Redux
    const searchQuery = useSelector((state: RootState) => state.sidebar.searchQuery);
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);

    const canUndo = useSelector((state: RootState) => state.schema.past.length > 0);
    const canRedo = useSelector((state: RootState) => state.schema.future.length > 0);

    const handleAutoLayout = () => {
        const layoutedNodes = performAutoLayout(nodes);
        dispatch(setNodes(layoutedNodes));
    };

    const handleCollapse = () => {
        dispatch(setIsSidebarCollapsed(true)); // Collapsing from header usually implies going to collapsed state
        // Actually, sidebarSlice has a specific toggle, but here we can just set it. 
        // Wait, the header button is "Minimize". 
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    dispatch(ActionCreators.redo());
                } else {
                    dispatch(ActionCreators.undo());
                }
                e.preventDefault();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                dispatch(ActionCreators.redo());
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch]);

    return (
        <div className="p-4 border-b border-gray-200 space-y-3 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="hidden xl:inline">Tables</span>
                </h2>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!canUndo}
                        onClick={() => dispatch(ActionCreators.undo())}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!canRedo}
                        onClick={() => dispatch(ActionCreators.redo())}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-600 hover:text-gray-900"
                        onClick={handleAutoLayout}
                        title="Auto Layout"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dispatch(setAddTableDialogOpen(true))}
                        className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Manage Schema"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>

                    {/* Minimize Button */}
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-gray-900"
                        onClick={handleCollapse}
                        title="Shrink"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => dispatch(setSidebarSearchQuery(e.target.value))}
                    className="pl-8 h-8 text-xs bg-gray-50 border-gray-200 text-gray-900 focus:bg-white placeholder:text-gray-500"
                />
            </div>
        </div>
    );
}
