import { memo, useState, useEffect, useCallback } from 'react';
import { EdgeProps, getBezierPath, useReactFlow, Position, getSmoothStepPath } from '@xyflow/react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openEditLinkFieldDialog } from '@/store/slices/uiSlice';
import { updateField, confirmLinkField, confirmLinkObject, deleteField } from '@/store/slices/schemaSlice';

export type RelationshipType = '1-1' | '1-n' | 'n-1';
export type EdgePathType = 'bezier' | 'smoothstep' | 'straight';

export interface RelationshipEdgeData {
  relationshipType?: RelationshipType;
  pathType?: EdgePathType;
  controlPoint?: { x: number; y: number };
  primaryKeyField?: string;
  objectFieldName?: string;
  sourceFK?: string;
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
  sourceHandleId,
  targetHandleId,
}: EdgeProps<RelationshipEdgeData>) {
  // Alias props to maintain compatibility with existing logic
  const sourceHandle = sourceHandleId;
  const targetHandle = targetHandleId;

  const { updateEdge, getNode, deleteElements, getEdges, getNodes } = useReactFlow();
  const dispatch = useAppDispatch();
  const nodes = getNodes(); // Get latest nodes for dropdown

  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    data?.relationshipType || '1-n'
  );

  // Local state for inline editing
  const [editedFieldName, setEditedFieldName] = useState(sourceHandle || '');
  const [editedTargetId, setEditedTargetId] = useState(target);
  const [editedSourceKey, setEditedSourceKey] = useState('');
  const [editedTargetKey, setEditedTargetKey] = useState(targetHandle || '');

  const [isHovered, setIsHovered] = useState(false);
  const [pathType, setPathType] = useState<EdgePathType>(data?.pathType || 'bezier');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVirtual, setIsVirtual] = useState(data?.relationshipType === '1-n');

  const validationError = useMemo(() => {
    if (!editedSourceKey || !editedTargetKey || !editedTargetId) return null;
    const sourceNode = getNode(source);
    const targetNode = nodes.find((n: any) => n.id === editedTargetId);
    if (sourceNode && targetNode) {
      const sourceCol = sourceNode.data.columns.find((c: any) => c.name === editedSourceKey);
      const targetCol = targetNode.data.columns.find((c: any) => c.name === editedTargetKey);
      if (sourceCol && targetCol && sourceCol.type !== targetCol.type) {
        return `Kiểu dữ liệu không khớp: ${sourceCol.name} (${sourceCol.type}) ≠ ${targetCol.name} (${targetCol.type})`;
      }
    }
    return null;
  }, [editedSourceKey, editedTargetKey, editedTargetId, getNode, source, nodes]);

  // 1. Initialize basic fields when menu opens
  useEffect(() => {
    if (isMenuOpen) {
      setEditedFieldName(sourceHandle || '');
      setEditedTargetId(target);
      setEditedTargetKey(targetHandle || '');

      const sourceNode = getNode(source);
      if (sourceNode) {
        const col = sourceNode.data.columns.find((c: any) => c.name === sourceHandle);
        // Initialize Data Type based on actual column
        if (col) {
          setIsVirtual(!!col.isVirtual);
        }
      }
    }
  }, [isMenuOpen, sourceHandle, target, targetHandle, getNode, source]);

  // 2. Update Source Key when Relationship Type changes
  useEffect(() => {
    if (isMenuOpen) {
      const sourceNode = getNode(source);
      if (sourceNode) {
        const col = sourceNode.data.columns.find((c: any) => c.name === sourceHandle);

        let val = '';
        if (relationshipType === '1-n') {
          val = col?.linkedPrimaryKeyField || '';
        } else {
          val = data?.sourceFK || '';
        }
        if (!val) {
          val = col?.linkedPrimaryKeyField || data?.sourceFK ||
            (col?.isForeignKey ? col.name : '') || '';
        }
        setEditedSourceKey(val);
      }
    }
  }, [isMenuOpen, relationshipType, sourceHandle, data, getNode, source]);

  // Handle Save Inline
  const handleSaveInline = () => {
    if (!editedFieldName || !editedTargetId || !editedSourceKey || !editedTargetKey) return;

    // Find original field index to delete
    const sourceNode = getNode(source);
    if (!sourceNode) return;

    // Determine original field index based on sourceHandle (which is the Field Name)
    const fieldIndex = sourceNode.data.columns.findIndex((c: any) => c.name === sourceHandle);

    if (fieldIndex !== -1) {
      // 1. Delete old field/edge configuration
      dispatch(deleteField({
        nodeId: source,
        fieldIndex,
        skipRecursive: true // We are replacing it immediately
      }));
    }

    // 2. Create new configuration
    // 2. Create new configuration
    if (isVirtual) {
      dispatch(confirmLinkField({
        sourceNodeId: source,
        targetNodeId: editedTargetId,
        sourcePK: editedSourceKey,
        targetFK: editedTargetKey,
        newFieldName: editedFieldName,
        relationshipType: relationshipType
      }));
    } else {
      // n-1 or 1-1
      dispatch(confirmLinkObject({
        sourceNodeId: source,
        targetNodeId: editedTargetId,
        sourceFK: editedSourceKey,
        targetPK: editedTargetKey,
        newFieldName: editedFieldName,
        relationshipType: relationshipType as 'n-1' | '1-1'
      }));
    }

    setIsMenuOpen(false);
  };

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
    if (newType === relationshipType) return;
    setRelationshipType(newType);

    // Smart auto-fill keys based on new type constraints
    const sourceNode = getNode(source);
    const targetNode = nodes.find(n => n.id === editedTargetId);

    if (newType === '1-n') {
      // 1-n: Source is PK, Target is FK
      // Find PK in source
      const sourcePK = sourceNode?.data.columns.find(c => c.isPrimaryKey)?.name;
      if (sourcePK) setEditedSourceKey(sourcePK);

      // Reset Target key if it looks like a PK (usually 'id')
      // or keep it if it looks like an FK
    } else {
      // n-1 or 1-1: Source is FK, Target is PK
      // Find PK in target
      const targetPK = targetNode?.data.columns.find(c => c.isPrimaryKey)?.name;
      if (targetPK) setEditedTargetKey(targetPK);
    }
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
    // Only delete the edge, keep fields intact so they can be re-linked
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
          <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(true);
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
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden gap-0">
              <DialogHeader className="px-6 py-4 border-b bg-gray-50">
                <DialogTitle>Chỉnh sửa liên kết</DialogTitle>
              </DialogHeader>

              <div className="grid gap-6 p-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
                {/* Left Column: Quan hệ & Kiểu đường */}
                <div className="space-y-6 border-r pr-6">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-3">Kiểu Dữ Liệu</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setIsVirtual(true);
                          if (relationshipType !== '1-n') handleRelationshipChange('1-n');
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          isVirtual ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        <span className="block font-semibold">Array</span>
                        <span className="block text-xs text-gray-500 mt-0.5">Danh sách (1:N)</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsVirtual(false);
                          if (relationshipType === '1-n') handleRelationshipChange('n-1');
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          !isVirtual ? 'bg-purple-50 text-purple-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        <span className="block font-semibold">Object</span>
                        <span className="block text-xs text-gray-500 mt-0.5">Đối tượng (N:1, 1:1)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-3">Quan hệ</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleRelationshipChange('1-1')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors flex items-center justify-between',
                          relationshipType === '1-1' ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="font-semibold text-green-600">1:1</span>
                        <span className="text-xs text-gray-500">One to One</span>
                      </button>
                      <button
                        onClick={() => {
                          handleRelationshipChange('1-n');
                          setIsVirtual(true);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors flex items-center justify-between',
                          relationshipType === '1-n' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="font-semibold text-blue-600">1:N</span>
                        <span className="text-xs text-gray-500">One to Many</span>
                      </button>
                      <button
                        onClick={() => handleRelationshipChange('n-1')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors flex items-center justify-between',
                          relationshipType === 'n-1' ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="font-semibold text-purple-600">N:1</span>
                        <span className="text-xs text-gray-500">Many to One</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-3">Kiểu đường</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => handlePathTypeChange('bezier')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          pathType === 'bezier' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        Cong (Bezier)
                      </button>
                      <button
                        onClick={() => handlePathTypeChange('smoothstep')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          pathType === 'smoothstep' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        Bậc thang (Smoothstep)
                      </button>
                      <button
                        onClick={() => handlePathTypeChange('straight')}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded cursor-pointer transition-colors',
                          pathType === 'straight' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        Thẳng (Straight)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Thông tin liên kết */}
                <div className="">
                  <h4 className="font-medium text-sm text-gray-900 mb-4">Thông tin liên kết</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500 block mb-1.5 font-medium">Tên trường</label>
                        <input
                          type="text"
                          value={editedFieldName}
                          onChange={(e) => setEditedFieldName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 block mb-1.5 font-medium">Bảng đích</label>
                        <select
                          value={editedTargetId}
                          onChange={(e) => {
                            setEditedTargetId(e.target.value);
                            setEditedTargetKey(''); // Reset key when target changes
                          }}
                          className="w-full px-2 py-2 text-sm border rounded bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {nodes.filter((n: any) => n.id !== source).map((n: any) => (
                            <option key={n.id} value={n.id}>{n.data.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500 block mb-1.5 font-medium">
                          {relationshipType === '1-n' ? 'Source (PK)' : 'Source (FK)'}
                        </label>
                        <select
                          value={editedSourceKey}
                          onChange={(e) => setEditedSourceKey(e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Chọn...</option>
                          {(() => {
                            const sourceNode = getNode(source);
                            return sourceNode?.data.columns.map((col: any) => (
                              <option key={col.name} value={col.name}>
                                {col.name} {col.isPrimaryKey ? '(PK)' : ''}
                              </option>
                            )) || null;
                          })()}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 block mb-1.5 font-medium">
                          {relationshipType === '1-n' ? 'Target (FK)' : 'Target (PK)'}
                        </label>
                        <select
                          value={editedTargetKey}
                          onChange={(e) => setEditedTargetKey(e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Chọn...</option>
                          {(() => {
                            const targetNode = nodes.find((n: any) => n.id === editedTargetId);
                            return targetNode?.data.columns.map((col: any) => (
                              <option key={col.name} value={col.name}>
                                {col.name} {col.isPrimaryKey ? '(PK)' : ''}
                              </option>
                            )) || null;
                          })()}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                      {validationError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-medium flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                          {validationError}
                        </div>
                      )}
                      <button
                        onClick={handleSaveInline}
                        disabled={!!validationError}
                        className={cn(
                          "w-full px-3 py-2.5 text-sm rounded flex items-center justify-center gap-1.5 transition-colors font-medium shadow-sm hover:shadow",
                          !!validationError
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        <Edit2 size={14} />
                        <span>Lưu thay đổi</span>
                      </button>

                      <div className="h-px bg-gray-100 my-1" />

                      <button
                        onClick={handleDeleteEdge}
                        className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center justify-center gap-2 transition-colors font-medium"
                      >
                        <Trash2 size={14} />
                        <span>Xóa quan hệ</span>
                      </button>
                    </div>

                  </div>
                </div>
              </div>

            </DialogContent>
          </Dialog>
        </div>
      </foreignObject>
    </g>
  );
}

export default memo(RelationshipEdge);

