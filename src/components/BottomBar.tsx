import { Button } from "@/components/ui/button";
import {
  Filter,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Undo2,
  Redo2,
  Maximize2,
} from "lucide-react";

interface BottomBarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenterView: () => void;
  onToggleGrid: () => void;
  onUndo: () => void;
  onRedo: () => void;
  showGrid: boolean;
}

export function BottomBar({
  zoom,
  onZoomIn,
  onZoomOut,
  onCenterView,
  onToggleGrid,
  onUndo,
  onRedo,
  showGrid,
}: BottomBarProps) {
  return (
    <div className="h-12 border-t border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="Filter">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onCenterView} title="Center View">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[50px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon" onClick={onZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant={showGrid ? "default" : "ghost"}
          size="icon"
          onClick={onToggleGrid}
          title="Toggle Grid"
        >
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-2" />
        <Button variant="ghost" size="icon" onClick={onUndo} title="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRedo} title="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

