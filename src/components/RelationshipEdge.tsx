import { memo, useState, useEffect, useMemo } from 'react';
import { EdgeProps, getBezierPath, useReactFlow, Position, getSmoothStepPath, Node, Edge } from '@xyflow/react';
import { TableNodeData } from '@/types/schema';
import { Button, buttonVariants } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ValidationUtils } from '@/utils/validation';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEME } from '@/constants/theme';
import { useDispatch } from 'react-redux';
import { confirmLinkField, confirmLinkObject, deleteField } from '@/store/slices/schemaSlice';
import { SchemaEvents } from '@/events/schemaEvents';
import { schemaEventBus } from '@/events/eventBus';

export type RelationshipType = '1-1' | '1-n' | 'n-1';
export type EdgePathType = 'bezier' | 'smoothstep' | 'straight';

export interface RelationshipEdgeData {
  relationshipType?: RelationshipType;
  pathType?: EdgePathType;
  controlPoint?: { x: number; y: number };
  primaryKeyField?: string;
  objectFieldName?: string;
  sourceFK?: string;
  [key: string]: unknown;
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
  sourceHandleId: sourceHandle,
  targetHandleId: targetHandle,
}: EdgeProps<Edge<RelationshipEdgeData>>) {

  const { updateEdge, getNode, deleteElements, getNodes } = useReactFlow();
  const dispatch = useDispatch();
  const nodes = getNodes() as Node<TableNodeData>[]; // Get latest nodes for dropdown

  const [relationshipType, setRelationshipType] = useState<RelationshipType>(
    data?.relationshipType || '1-n'
  );

  // Local state for inline editing
  const [editedFieldName, setEditedFieldName] = useState(sourceHandle || '');
  const [editedTargetId, setEditedTargetId] = useState(target);
  const [editedSourceKey, setEditedSourceKey] = useState<string>('');
  const [editedTargetKey, setEditedTargetKey] = useState<string>(targetHandle || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [pathType, setPathType] = useState<EdgePathType>(data?.pathType || 'bezier');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isVirtual, setIsVirtual] = useState(data?.relationshipType === '1-n');

  const validationErrorMemo = useMemo(() => {
    if (!editedSourceKey || !editedTargetKey || !editedTargetId) return null;
    const sourceNode = getNode(source) as Node<TableNodeData> | undefined;
    const targetNode = nodes.find((n: Node) => n.id === editedTargetId) as Node<TableNodeData> | undefined;
    if (sourceNode && targetNode) {
      const sourceCol = sourceNode.data.columns.find((c) => c.name === editedSourceKey);
      const targetCol = targetNode.data.columns.find((c) => c.name === editedTargetKey);
      if (sourceCol && targetCol) {
        const validation = ValidationUtils.validateRelationshipTypes(
          sourceCol.type,
          targetCol.type,
          sourceCol.name,
          targetCol.name
        );
        if (!validation.valid) return validation.error;
      }
    }
    return null;
  }, [editedSourceKey, editedTargetKey, editedTargetId, getNode, source, nodes]);

  useEffect(() => {
    setValidationError(validationErrorMemo || null);
  }, [validationErrorMemo]);



  // Initialize state when menu opens
  useEffect(() => {
    if (isMenuOpen) {
      setEditedFieldName(sourceHandle || '');
      setEditedTargetId(target);
      const sourceNode = getNode(source) as Node<TableNodeData> | undefined;

      // Only initialize if not already set (preserve user selection during type switches)
      // Or if this is the first open (e.g. editedSourceKey is empty)
      // Check !isMenuOpen in deps or use a ref to track open state could work,
      // but here we rely on the fact that we close menu on save.

      let initialSourceKey = editedSourceKey;
      let initialTargetKey = editedTargetKey;

      // If keys are empty (first open), load from data
      if (!initialSourceKey && sourceNode) {
        const col = sourceNode.data.columns.find((c) => c.name === sourceHandle);
        if (data?.relationshipType === '1-n') {
          initialSourceKey = col?.linkedPrimaryKeyField || sourceNode.data.columns.find(c => c.isPrimaryKey)?.name || '';
          initialTargetKey = targetHandle || '';
        } else {
          initialSourceKey = data?.sourceFK || col?.linkedForeignKeyField || '';
          initialTargetKey = targetHandle || '';
        }
        setEditedSourceKey(initialSourceKey);
        setEditedTargetKey(initialTargetKey);
      }

      // Initialize Virtual state only once
      if (sourceNode) {
        const col = sourceNode.data.columns.find((c) => c.name === sourceHandle);
        if (col && isVirtual === undefined) {
          setIsVirtual(!!col.isVirtual);
        }
      }

      // Initialize Virtual state
      const col = sourceNode?.data.columns.find((c) => c.name === sourceHandle);
      if (col) {
        setIsVirtual(!!col.isVirtual);
      }
    }
  }, [isMenuOpen, source, target, sourceHandle, targetHandle, data, getNode]); // Removed relationshipType dependency

  // Handle Save Inline
  const handleSaveInline = () => {
    // Validation: Check for non-primitive types
    const sNode = getNode(source) as Node<TableNodeData> | undefined;
    const tNode = nodes.find(n => n.id === editedTargetId);

    if (sNode && editedSourceKey) {
      const field = sNode.data.columns.find(c => c.name === editedSourceKey);
      if (field && (field.type === 'array' || field.type === 'object')) {
        setValidationError(`Trường nguồn '${editedSourceKey}' có kiểu ${field.type}. Chỉ được liên kết tới kiểu nguyên thủy.`);
        return;
      }
    }

    if (tNode && editedTargetKey) {
      const field = tNode.data.columns.find(c => c.name === editedTargetKey);
      if (field && (field.type === 'array' || field.type === 'object')) {
        setValidationError(`Trường đích '${editedTargetKey}' có kiểu ${field.type}. Chỉ được liên kết tới kiểu nguyên thủy.`);
        return;
      }
    }

    if (!editedFieldName || !editedTargetId || !editedSourceKey || !editedTargetKey) return;

    // Clear validation if passed check
    setValidationError(null);

    // Find original field index to delete
    const sourceNode = getNode(source) as Node<TableNodeData> | undefined;
    if (!sourceNode) return;

    // Determine original field index based on sourceHandle (which is the Field Name)
    const fieldIndex = sourceNode.data.columns.findIndex((c) => c.name === sourceHandle);

    if (fieldIndex !== -1) {
      // 1. Delete old field/edge configuration
      dispatch(deleteField({
        nodeId: source,
        fieldIndex,
        skipRecursive: true // We are replacing it immediately
      }));
    }


    // 2. Create new configuration based on relationship type
    // confirmLinkField and confirmLinkObject will handle FK marking automatically

    if (isVirtual) {
      // Array (1:N) - Source has PK, Target has FK
      dispatch(confirmLinkField({
        sourceNodeId: source,
        targetNodeId: editedTargetId,
        sourcePK: editedSourceKey,
        targetFK: editedTargetKey,
        newFieldName: editedFieldName,
        relationshipType: relationshipType
      }));
    } else {
      // Object (N:1, 1:1) - Source has FK, Target has PK
      // IMPORTANT: sourceFK must be a real FK column in source table, not the object field itself
      dispatch(confirmLinkObject({
        sourceNodeId: source,
        targetNodeId: editedTargetId,
        sourceFK: editedSourceKey,  // This should be the FK column name in source table
        targetPK: editedTargetKey,   // This should be the PK column name in target table
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

    // User requested to keep existing data when switching types
    // So we do NOT auto-reset or guess keys here anymore.
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
    // Open confirmation alert instead of deleting immediately
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    // Delete target table and all its descendants
    // This will also automatically remove this edge
    import('@/events/eventBus').then(({ schemaEventBus }) => {
      import('@/events/schemaEvents').then(({ SchemaEvents }) => {
        schemaEventBus.emit(SchemaEvents.TABLE_DELETE, { id: target });
      });
    });

    setShowDeleteAlert(false);
    setIsMenuOpen(false);
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
        return THEME.RELATIONSHIP.COLORS.ONE_TO_ONE;
      case '1-n':
        return THEME.RELATIONSHIP.COLORS.ONE_TO_MANY;
      case 'n-1':
        return THEME.RELATIONSHIP.COLORS.MANY_TO_ONE;
      default:
        return THEME.RELATIONSHIP.COLORS.ONE_TO_MANY;
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
  const defaultColor = THEME.RELATIONSHIP.COLORS.DEFAULT; // Màu xám mặc định
  const currentColor = selected ? edgeColor : (isHovered ? edgeColor : defaultColor);

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
            <DialogTrigger
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(true);
              }}
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'icon' }),
                'rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer',
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
                          {nodes.filter((n: Node<TableNodeData>) => n.id !== source).map((n) => (
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
                            const sourceNode = getNode(source) as Node<TableNodeData> | undefined;
                            return sourceNode?.data.columns
                              .map((col) => (
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
                            const targetNode = nodes.find((n: Node<TableNodeData>) => n.id === editedTargetId);
                            return targetNode?.data.columns.map((col) => (
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

          <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Xóa quan hệ & Bảng con?
                </DialogTitle>
                <div className="py-2 text-sm text-gray-500">
                  <span className="block font-medium text-gray-900 mb-2">
                    CẢNH BÁO:
                  </span>
                  Bạn đang xóa quan hệ dẫn tới bảng <strong>{nodes.find(n => n.id === target)?.data.label}</strong>.
                  <br /><br />
                  Hành động này sẽ <strong className="text-red-600">XÓA LUÔN Bảng đích</strong> và tất cả các bảng con cháu của nó.
                  <br />
                  Bạn có chắc chắn không?
                </div>
              </DialogHeader>
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteAlert(false)}
                  className="border-gray-300"
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Xóa tất cả
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </foreignObject>
    </g >
  );
}

export default memo(RelationshipEdge);

