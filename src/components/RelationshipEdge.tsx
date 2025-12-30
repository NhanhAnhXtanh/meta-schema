import { memo, useState, useEffect, useCallback } from 'react';
import { EdgeProps, getBezierPath, useReactFlow, Position, getSmoothStepPath } from '@xyflow/react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { openEditLinkFieldDialog } from '@/store/slices/uiSlice';

export type RelationshipType = '1-1' | '1-n' | 'n-1';
export type EdgePathType = 'bezier' | 'smoothstep' | 'straight';

export interface RelationshipEdgeData {
  relationshipType?: RelationshipType;
  pathType?: EdgePathType;
  controlPoint?: { x: number; y: number };
  primaryKeyField?: string; // Field làm PK (cho object connection)
  objectFieldName?: string; // Tên field object mới được tạo
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
  const { updateEdge, getNode, deleteElements, getEdges } = useReactFlow();
  const dispatch = useAppDispatch();
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    data?.relationshipType || '1-n'
  );
  const [isHovered, setIsHovered] = useState(false);
  const [pathType, setPathType] = useState<EdgePathType>(data?.pathType || 'bezier');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleRelationshipChange = (newType: RelationshipType) => {
    if (newType === relationshipType) return; // No change

    setRelationshipType(newType);

    // Get source node to update field
    const sourceNode = getNode(source);
    if (!sourceNode || !sourceHandle || !targetHandle) return;

    // Find the field index
    const fieldIndex = sourceNode.data.columns.findIndex((col: any) => {
      if (relationshipType === '1-n') {
        // Currently array field
        return col.name === sourceHandle && col.isVirtual === true;
      } else {
        // Currently object field
        return col.name === data?.objectFieldName && col.type === 'object';
      }
    });

    if (fieldIndex === -1) return;

    const currentField = sourceNode.data.columns[fieldIndex];

    // Convert field type
    if (newType === '1-n' && relationshipType === 'n-1') {
      // Convert from Object (n-1) to Array (1-n)
      // Delete old object field and create new virtual field
      dispatch(openEditLinkFieldDialog({
        sourceNodeId: source,
        fieldIndex,
        initialValues: {
          targetNodeId: target,
          sourceKey: targetHandle, // PK becomes source key
          targetKey: sourceHandle, // FK becomes target key
          fieldName: currentField.name,
          linkType: '1-n'
        }
      }));
    } else if (newType === 'n-1' && relationshipType === '1-n') {
      // Convert from Array (1-n) to Object (n-1)
      dispatch(openEditLinkFieldDialog({
        sourceNodeId: source,
        fieldIndex,
        initialValues: {
          targetNodeId: target,
          sourceKey: targetHandle, // Target key becomes FK
          targetKey: currentField.linkedPrimaryKeyField || 'id', // Source PK
          fieldName: currentField.name,
          linkType: 'n-1'
        }
      }));
    }

    // Update edge data
    updateEdge(id, (edge) => ({
      ...edge,
      data: {
        ...edge.data,
        relationshipType: newType,
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

  const handleEditEdge = () => {
    // Lấy source node để tìm field index
    const sourceNode = getNode(source);
    if (!sourceNode || !sourceHandle || !targetHandle) return;

    // Tìm field index trong source node
    const fieldIndex = sourceNode.data.columns.findIndex((col: any) => {
      if (relationshipType === '1-n') {
        // Array field: sourceHandle = field name
        return col.name === sourceHandle && col.isVirtual === true;
      } else {
        // Object field: tìm theo objectFieldName trong edge data
        return col.name === data?.objectFieldName && col.type === 'object';
      }
    });

    if (fieldIndex === -1) return;

    const field = sourceNode.data.columns[fieldIndex];

    // Tạo initialValues
    const initialValues = {
      targetNodeId: target,
      sourceKey: relationshipType === '1-n' ? (field.linkedPrimaryKeyField || 'id') : sourceHandle!,
      targetKey: targetHandle,
      fieldName: relationshipType === '1-n' ? sourceHandle : (data?.objectFieldName || field.name),
      linkType: relationshipType as '1-n' | 'n-1'
    };

    // Dispatch action để mở dialog
    dispatch(openEditLinkFieldDialog({
      sourceNodeId: source,
      fieldIndex,
      initialValues
    }));
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
  const showButton = true; // Luôn hiện button 3 chấm

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
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(true);
        }}
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

      {/* Hiển thị tên primary key nếu có */}
      {data?.primaryKeyField && (
        <foreignObject
          width={200}
          height={40}
          x={targetLabelPos.x + 25}
          y={targetLabelPos.y - 20}
          className="overflow-visible pointer-events-none"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
              PK: {data.primaryKeyField}
            </span>
          </div>
        </foreignObject>
      )}

      {/* Nút 3 chấm ở giữa edge với dropdown menu */}
      <foreignObject
        width={60}
        height={60}
        x={labelX - 30}
        y={labelY - 30}
        className="overflow-visible"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center w-full h-full">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={cn(
                  'h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer',
                  'bg-white border-2 hover:scale-110'
                )}
                style={{
                  borderColor: edgeColor,
                }}
              >
                <MoreVertical
                  size={20}
                  style={{ color: edgeColor }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[600px]">
              <div className="grid gap-4 p-2" style={{ gridTemplateColumns: '2fr 3fr' }}>
                {/* Left Column: Quan hệ & Kiểu đường */}
                <div className="space-y-3">
                  <div>
                    <DropdownMenuLabel className="px-0">Quan hệ</DropdownMenuLabel>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleRelationshipChange('1-1')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          relationshipType === '1-1' ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="font-semibold text-green-600">1:1</span>
                        <span className="ml-2 text-xs text-gray-500">One to One</span>
                      </button>
                      <button
                        onClick={() => handleRelationshipChange('1-n')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          relationshipType === '1-n' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="font-semibold text-blue-600">1:N</span>
                        <span className="ml-2 text-xs text-gray-500">One to Many</span>
                      </button>
                      <button
                        onClick={() => handleRelationshipChange('n-1')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          relationshipType === 'n-1' ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="font-semibold text-purple-600">N:1</span>
                        <span className="ml-2 text-xs text-gray-500">Many to One</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <DropdownMenuLabel className="px-0">Kiểu đường</DropdownMenuLabel>
                    <div className="space-y-1">
                      <button
                        onClick={() => handlePathTypeChange('bezier')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          pathType === 'bezier' ? 'bg-gray-100' : 'hover:bg-gray-50'
                        )}
                      >
                        Cong (Bezier)
                      </button>
                      <button
                        onClick={() => handlePathTypeChange('smoothstep')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          pathType === 'smoothstep' ? 'bg-gray-100' : 'hover:bg-gray-50'
                        )}
                      >
                        Bậc thang (Smoothstep)
                      </button>
                      <button
                        onClick={() => handlePathTypeChange('straight')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          pathType === 'straight' ? 'bg-gray-100' : 'hover:bg-gray-50'
                        )}
                      >
                        Thẳng (Straight)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Thông tin liên kết */}
                <div className="border-l pl-4">
                  <DropdownMenuLabel className="px-0">Thông tin liên kết</DropdownMenuLabel>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Tên trường</label>
                        <input
                          type="text"
                          value={(() => {
                            const sourceNode = getNode(source);
                            if (!sourceNode) return '';

                            if (relationshipType === '1-n') {
                              // Array field: Find virtual field
                              const field = sourceNode.data.columns.find((col: any) =>
                                col.isVirtual === true
                              );
                              return field?.name || '';
                            } else {
                              // Object field: Get from data.objectFieldName
                              return data?.objectFieldName || '';
                            }
                          })()}
                          readOnly
                          className="w-full px-2 py-1 text-xs border rounded bg-gray-50 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Bảng đích</label>
                        <input
                          type="text"
                          value={(() => {
                            const targetNode = getNode(target);
                            return targetNode?.data.label || '';
                          })()}
                          readOnly
                          className="w-full px-2 py-1 text-xs border rounded bg-gray-50 text-gray-700"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          {relationshipType === '1-n' ? 'Source (PK)' : 'Source (FK)'}
                        </label>
                        <input
                          type="text"
                          value={(() => {
                            const sourceNode = getNode(source);
                            if (!sourceNode) return 'N/A';

                            if (relationshipType === '1-n') {
                              // Array field: Find virtual field and get its linkedPrimaryKeyField
                              const virtualField = sourceNode.data.columns.find((col: any) =>
                                col.isVirtual === true && getEdges().some(e =>
                                  e.id === id && e.source === source
                                )
                              );
                              return virtualField?.linkedPrimaryKeyField || 'id';
                            } else {
                              // Object field: Find FK field
                              const fkField = sourceNode.data.columns.find((col: any) =>
                                col.isForeignKey === true
                              );
                              return fkField?.name || 'N/A';
                            }
                          })()}
                          readOnly
                          className="w-full px-2 py-1 text-xs border rounded bg-gray-50 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">
                          {relationshipType === '1-n' ? 'Target (FK)' : 'Target (PK)'}
                        </label>
                        <input
                          type="text"
                          value={(() => {
                            const targetNode = getNode(target);
                            if (!targetNode) return 'N/A';

                            if (relationshipType === '1-n') {
                              // Array field: Find FK in target
                              const fkField = targetNode.data.columns.find((col: any) =>
                                col.isForeignKey === true
                              );
                              return fkField?.name || 'N/A';
                            } else {
                              // Object field: Get PK from data or find PK field
                              return data?.primaryKeyField || targetNode.data.columns.find((col: any) =>
                                col.isPrimaryKey === true
                              )?.name || 'id';
                            }
                          })()}
                          readOnly
                          className="w-full px-2 py-1 text-xs border rounded bg-gray-50 text-gray-700"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleEditEdge}
                      className="w-full px-2 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <Edit2 size={12} />
                      <span>Chỉnh sửa chi tiết</span>
                    </button>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />
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
    </g>
  );
}

export default memo(RelationshipEdge);

