import { Undo2, Redo2, LayoutDashboard, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ActionCreators } from 'redux-undo';
import { setAddTableDialogOpen } from '@/store/slices/uiSlice';
import { setNodes } from '@/store/slices/schemaSlice';
import { performAutoLayout } from '@/utils/autoLayout';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function CanvasToolbar() {
    const dispatch = useDispatch();
    const canUndo = useSelector((state: RootState) => state.schema.past.length > 0);
    const canRedo = useSelector((state: RootState) => state.schema.future.length > 0);
    const nodes = useSelector((state: RootState) => state.schema.present.nodes);

    // We might want local search state if we removed sidebar slice
    const [searchQuery, setSearchQuery] = useState('');

    const handleAutoLayout = () => {
        const layoutedNodes = performAutoLayout(nodes);
        dispatch(setNodes(layoutedNodes));
    };

    return (
        <TooltipProvider>
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {/* Main Action Bar */}
                <div className="bg-white p-1.5 rounded-lg shadow-md border border-gray-200 flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={!canUndo}
                                onClick={() => dispatch(ActionCreators.undo())}
                            >
                                <Undo2 className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={!canRedo}
                                onClick={() => dispatch(ActionCreators.redo())}
                            >
                                <Redo2 className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redo</TooltipContent>
                    </Tooltip>

                    <div className="w-px h-5 bg-gray-200 mx-1" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-blue-600"
                                onClick={handleAutoLayout}
                            >
                                <LayoutDashboard className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Auto Layout</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                onClick={() => dispatch(setAddTableDialogOpen(true))}
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add Table</TooltipContent>
                    </Tooltip>
                </div>

                {/* Optional Search Bar */}
                <div className="bg-white p-1.5 rounded-lg shadow-md border border-gray-200 flex items-center gap-2 w-[240px]">
                    <Search className="w-4 h-4 text-gray-400 ml-1" />
                    <Input
                        className="h-7 border-0 focus-visible:ring-0 px-1 text-xs"
                        placeholder="Search nodes..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            // TODO: Add search logic (e.g. highlight/focus nodes) using EventBus
                            // window.dispatchEvent(new CustomEvent('searchNodes', { detail: e.target.value }));
                        }}
                    />
                </div>
            </div>
        </TooltipProvider>
    );
}
