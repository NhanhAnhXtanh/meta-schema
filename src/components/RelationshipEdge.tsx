import { memo, useState, useEffect, useCallback } from 'react';
import { EdgeProps, getBezierPath, useReactFlow, Position, getSmoothStepPath } from '@xyflow/react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RelationshipType = '1-1' | '1-n' | 'n-1';
export type EdgePathType = 'bezier' | 'smoothstep' | 'straight';

export interface RelationshipEdgeData {
  relationshipType?: RelationshipType;
  pathType?: EdgePathType;
  controlPoint?: { x: number; y: number };
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
  selected,
  source,
  target,
  sourceHandle,
  targetHandle,
}: EdgeProps<RelationshipEdgeData>) {
  const { updateEdge, getNode, deleteElements } = useReactFlow();
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    data?.relationshipType || '1-n'
  );
  const [isHovered, setIsHovered] = useState(false);
  const [pathType, setPathType] = useState<EdgePathType>(data?.pathType || 'bezier');

  // Đồng bộ state với data khi data thay đổi
  useEffect(() => {
    if (data?.relationshipType) {
      setRelationshipType(data.relationshipType);
    }
    if (data?.pathType) {
      setPathType(data.pathType);
    }
  }, [data?.relationshipType, data?.pathType]);

  // Tính toán path dựa trên pathType
  const getEdgePath = () => {
    if (pathType === 'straight') {
      return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
    } else if (pathType === 'smoothstep') {
      const [path] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      return path;
    } else {
      const [path] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      return path;
    }
  };

  const edgePath = getEdgePath();
  
  // Tính toán vị trí label ở giữa edge
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

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

  const handlePathTypeChange = (type: EdgePathType) => {
    setPathType(type);
    updateEdge(id, (edge) => ({
      ...edge,
      data: {
        ...edge.data,
        pathType: type,
      },
    }));
  };

  const handleDeleteEdge = () => {
    deleteElements({ edges: [{ id }] });
  };

  // Highlight fields khi hover vào edge
  useEffect(() => {
    if (!source || !target || !sourceHandle || !targetHandle) return;
    
    const edgeColor = getRelationshipColor(relationshipType);
    
    // Tìm source handle - React Flow sử dụng data-handleid và data-nodeid
    const sourceHandleEl = document.querySelector(
      `.react-flow__handle[data-handleid="${sourceHandle}"][data-nodeid="${source}"]`
    ) as HTMLElement;
    
    // Tìm target handle
    const targetHandleEl = document.querySelector(
      `.react-flow__handle[data-handleid="${targetHandle}"][data-nodeid="${target}"]`
    ) as HTMLElement;
    
    if (isHovered || selected) {
      if (sourceHandleEl) {
        sourceHandleEl.style.backgroundColor = edgeColor;
        sourceHandleEl.style.borderColor = edgeColor;
        sourceHandleEl.style.boxShadow = `0 0 0 2px ${edgeColor}40`;
      }
      if (targetHandleEl) {
        targetHandleEl.style.backgroundColor = edgeColor;
        targetHandleEl.style.borderColor = edgeColor;
        targetHandleEl.style.boxShadow = `0 0 0 2px ${edgeColor}40`;
      }
    } else {
      if (sourceHandleEl) {
        sourceHandleEl.style.backgroundColor = '';
        sourceHandleEl.style.borderColor = '';
        sourceHandleEl.style.boxShadow = '';
      }
      if (targetHandleEl) {
        targetHandleEl.style.backgroundColor = '';
        targetHandleEl.style.borderColor = '';
        targetHandleEl.style.boxShadow = '';
      }
    }
    
    return () => {
      // Cleanup khi unmount
      if (sourceHandleEl) {
        sourceHandleEl.style.backgroundColor = '';
        sourceHandleEl.style.borderColor = '';
        sourceHandleEl.style.boxShadow = '';
      }
      if (targetHandleEl) {
        targetHandleEl.style.backgroundColor = '';
        targetHandleEl.style.borderColor = '';
        targetHandleEl.style.boxShadow = '';
      }
    };
  }, [isHovered, selected, relationshipType, source, target, sourceHandle, targetHandle]);

  // Lấy label cho source và target dựa trên relationshipType
  const getSourceLabel = (type: RelationshipType) => {
    switch (type) {
      case '1-1':
        return '1';
      case '1-n':
        return '1';
      case 'n-1':
        return 'N';
      default:
        return '1';
    }
  };

  const getTargetLabel = (type: RelationshipType) => {
    switch (type) {
      case '1-1':
        return '1';
      case '1-n':
        return 'N';
      case 'n-1':
        return '1';
      default:
        return 'N';
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

  // Tính toán vị trí để hiển thị label ở gần source và target
  const getSourceLabelPosition = () => {
    const offset = 20;
    let x = sourceX;
    let y = sourceY;
    
    if (sourcePosition === Position.Left) {
      x = sourceX - offset;
    } else if (sourcePosition === Position.Right) {
      x = sourceX + offset;
    } else if (sourcePosition === Position.Top) {
      y = sourceY - offset;
    } else if (sourcePosition === Position.Bottom) {
      y = sourceY + offset;
    }
    
    return { x, y };
  };

  const getTargetLabelPosition = () => {
    const offset = 20;
    let x = targetX;
    let y = targetY;
    
    if (targetPosition === Position.Left) {
      x = targetX - offset;
    } else if (targetPosition === Position.Right) {
      x = targetX + offset;
    } else if (targetPosition === Position.Top) {
      y = targetY - offset;
    } else if (targetPosition === Position.Bottom) {
      y = targetY + offset;
    }
    
    return { x, y };
  };

  const sourceLabelPos = getSourceLabelPosition();
  const targetLabelPos = getTargetLabelPosition();

  const edgeColor = getRelationshipColor(relationshipType);
  const defaultColor = '#9ca3af'; // Màu xám mặc định
  const currentColor = selected ? edgeColor : (isHovered ? edgeColor : defaultColor);
  const showButton = selected; // Chỉ hiện button khi selected

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible path rộng hơn để làm hit area - dễ click hơn */}
      <path
        id={`${id}-hitarea`}
        style={{
          ...style,
          stroke: 'transparent',
          strokeWidth: 20,
          fill: 'none',
          pointerEvents: 'stroke',
        }}
        className="react-flow__edge-path cursor-pointer"
        d={edgePath}
      />
      {/* Path thật để hiển thị */}
      <path
        id={id}
        style={{
          ...style,
          stroke: currentColor,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '5,5',
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
          pointerEvents: 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Label ở đầu source */}
      <foreignObject
        width={30}
        height={30}
        x={sourceLabelPos.x - 15}
        y={sourceLabelPos.y - 15}
        className="overflow-visible pointer-events-none"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center w-full h-full">
          <span
            className="text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-colors duration-200"
            style={{
              backgroundColor: currentColor,
            }}
          >
            {getSourceLabel(relationshipType)}
          </span>
        </div>
      </foreignObject>

      {/* Label ở đầu target */}
      <foreignObject
        width={30}
        height={30}
        x={targetLabelPos.x - 15}
        y={targetLabelPos.y - 15}
        className="overflow-visible pointer-events-none"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center w-full h-full">
          <span
            className="text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md transition-colors duration-200"
            style={{
              backgroundColor: currentColor,
            }}
          >
            {getTargetLabel(relationshipType)}
          </span>
        </div>
      </foreignObject>

      {/* Button 3 chấm ở giữa edge - chỉ hiện khi selected */}
      {showButton && (
        <foreignObject
          width={40}
          height={40}
          x={labelX - 20}
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
                    'h-8 w-8 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer',
                    'bg-white border-2 hover:scale-110 animate-in fade-in zoom-in duration-200'
                  )}
                  style={{
                    borderColor: edgeColor,
                  }}
                >
                  <MoreVertical
                    size={16}
                    style={{ color: edgeColor }}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Quan hệ</div>
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
                <div className="border-t my-1"></div>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Kiểu đường</div>
                <DropdownMenuItem
                  onClick={() => handlePathTypeChange('bezier')}
                  className={cn(
                    'cursor-pointer',
                    pathType === 'bezier' && 'bg-gray-50'
                  )}
                >
                  <span className="text-sm">Cong (Bezier)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePathTypeChange('smoothstep')}
                  className={cn(
                    'cursor-pointer',
                    pathType === 'smoothstep' && 'bg-gray-50'
                  )}
                >
                  <span className="text-sm">Bậc thang (Smoothstep)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePathTypeChange('straight')}
                  className={cn(
                    'cursor-pointer',
                    pathType === 'straight' && 'bg-gray-50'
                  )}
                >
                  <span className="text-sm">Thẳng (Straight)</span>
                </DropdownMenuItem>
                <div className="border-t my-1"></div>
                <DropdownMenuItem
                  onClick={handleDeleteEdge}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 size={14} className="mr-2" />
                  <span className="text-sm font-medium">Xóa quan hệ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default memo(RelationshipEdge);

