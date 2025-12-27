import { memo, useState, useEffect } from 'react';
import { EdgeProps, getBezierPath, useReactFlow } from '@xyflow/react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RelationshipType = '1-1' | '1-n' | 'n-1';

export interface RelationshipEdgeData {
  relationshipType?: RelationshipType;
}

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<RelationshipEdgeData>) {
  const { updateEdge } = useReactFlow();
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    data?.relationshipType || '1-n'
  );

  // Đồng bộ state với data khi data thay đổi
  useEffect(() => {
    if (data?.relationshipType) {
      setRelationshipType(data.relationshipType);
    }
  }, [data?.relationshipType]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleRelationshipChange = (type: RelationshipType) => {
    setRelationshipType(type);
    updateEdge(id, (edge) => ({
      ...edge,
      data: {
        ...edge.data,
        relationshipType: type,
      },
    }));
  };

  const getRelationshipLabel = (type: RelationshipType) => {
    switch (type) {
      case '1-1':
        return '1:1';
      case '1-n':
        return '1:N';
      case 'n-1':
        return 'N:1';
      default:
        return '1:N';
    }
  };

  const getRelationshipColor = (type: RelationshipType) => {
    switch (type) {
      case '1-1':
        return '#22c55e'; // Xanh lá
      case '1-n':
        return '#3b82f6'; // Xanh dương
      case 'n-1':
        return '#a855f7'; // Tím
      default:
        return '#3b82f6';
    }
  };

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: getRelationshipColor(relationshipType),
          strokeWidth: 2,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={100}
        height={40}
        x={labelX - 50}
        y={labelY - 20}
        className="overflow-visible"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  'h-8 w-8 rounded-full shadow-md hover:shadow-lg transition-all',
                  'bg-white border-2',
                  relationshipType === '1-1' && 'border-green-500',
                  relationshipType === '1-n' && 'border-blue-500',
                  relationshipType === 'n-1' && 'border-purple-500'
                )}
                style={{
                  borderColor: getRelationshipColor(relationshipType),
                }}
              >
                <Settings2
                  size={14}
                  style={{ color: getRelationshipColor(relationshipType) }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-32">
              <DropdownMenuItem
                onClick={() => handleRelationshipChange('1-1')}
                className={cn(
                  'cursor-pointer',
                  relationshipType === '1-1' && 'bg-green-50'
                )}
              >
                <span className="font-semibold text-green-600">1:1</span>
                <span className="ml-2 text-xs text-gray-500">One to One</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRelationshipChange('1-n')}
                className={cn(
                  'cursor-pointer',
                  relationshipType === '1-n' && 'bg-blue-50'
                )}
              >
                <span className="font-semibold text-blue-600">1:N</span>
                <span className="ml-2 text-xs text-gray-500">One to Many</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRelationshipChange('n-1')}
                className={cn(
                  'cursor-pointer',
                  relationshipType === 'n-1' && 'bg-purple-50'
                )}
              >
                <span className="font-semibold text-purple-600">N:1</span>
                <span className="ml-2 text-xs text-gray-500">Many to One</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </foreignObject>
      {/* Hiển thị label quan hệ */}
      <foreignObject
        width={60}
        height={24}
        x={labelX - 30}
        y={labelY + 15}
        className="overflow-visible pointer-events-none"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded bg-white border shadow-sm"
            style={{
              color: getRelationshipColor(relationshipType),
              borderColor: getRelationshipColor(relationshipType),
            }}
          >
            {getRelationshipLabel(relationshipType)}
          </span>
        </div>
      </foreignObject>
    </>
  );
}

export default memo(RelationshipEdge);

