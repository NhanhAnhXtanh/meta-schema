import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown, MoreVertical, Search } from "lucide-react";
import { Table } from "@/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  tables: Table[];
  onTableClick?: (tableId: string) => void;
}

export function Sidebar({ tables, onTableClick }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTables, setExpandedTables] = useState<Set<string>>(
    new Set(tables.map((t) => t.id))
  );

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Lọc"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Thêm bảng
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
              onClick={() => onTableClick?.(table.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(table.id);
                }}
                className="p-0.5 hover:bg-accent rounded"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expandedTables.has(table.id) ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>
              <span className="flex-1 text-sm text-foreground">{table.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded"
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                  <DropdownMenuItem>Xóa</DropdownMenuItem>
                  <DropdownMenuItem>Nhân đôi</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

