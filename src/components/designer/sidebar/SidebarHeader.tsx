import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { setAddTableDialogOpen } from '@/store/slices/uiSlice';

interface SidebarHeaderProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export function SidebarHeader({ searchQuery, setSearchQuery }: SidebarHeaderProps) {
    const dispatch = useAppDispatch();

    return (
        <div className="p-4 border-b border-gray-200 space-y-3 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>Tables</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-normal">
                        Beta
                    </span>
                </h2>
                <Button
                    size="sm"
                    onClick={() => dispatch(setAddTableDialogOpen(true))}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-2"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Table
                </Button>
            </div>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-gray-50 border-gray-200 text-gray-900 focus:bg-white placeholder:text-gray-500"
                />
            </div>
        </div>
    );
}
