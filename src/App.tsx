import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
import { TableNode, TableNodeData } from './components/TableNode';
import { TableSidebar } from './components/TableSidebar';
import { RelationshipEdge, RelationshipEdgeData } from './components/RelationshipEdge';
import { ObjectConnectionDialog } from './components/ObjectConnectionDialog';
import { Plus, Trash2 } from 'lucide-react';
import { EdgeTypes } from '@xyflow/react';

const nodeTypes: NodeTypes = {
  table: TableNode,
};

const edgeTypes: EdgeTypes = {
  relationship: RelationshipEdge,
};

const COLOR_OPTIONS = [
  '#22c55e', // Xanh lá
  '#a855f7', // Tím
  '#eab308', // Vàng
  '#3b82f6', // Xanh dương
  '#ef4444', // Đỏ
  '#14b8a6', // Xanh ngọc
];

const initialNodes: Node<TableNodeData>[] = [
  {
    id: '1',
    type: 'table',
    position: { x: 0, y: 0 },
    data: {
      label: 'Products',
      columns: [
        { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
        { name: 'name', type: 'varchar', visible: true },
        { name: 'description', type: 'varchar', visible: true },
        { name: 'warehouse_id', type: 'uuid', isForeignKey: true, visible: true },
        { name: 'supplier_id', type: 'uuid', isForeignKey: true, visible: true },
        { name: 'price', type: 'money', visible: true },
        { name: 'quantity', type: 'int4', visible: true },
      ],
      color: COLOR_OPTIONS[0], // Xanh lá
    },
  },
  {
    id: '2',
    type: 'table',
    position: { x: 350, y: -100 },
    data: {
      label: 'Warehouses',
      columns: [
        { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
        { name: 'name', type: 'varchar', visible: true },
        { name: 'address', type: 'varchar', visible: true },
        { name: 'capacity', type: 'int4', visible: true },
      ],
      color: COLOR_OPTIONS[1], // Tím
    },
  },
  {
    id: '3',
    type: 'table',
    position: { x: 350, y: 200 },
    data: {
      label: 'Suppliers',
      columns: [
        { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
        { name: 'name', type: 'varchar', visible: true },
        { name: 'description', type: 'varchar', visible: true },
        { name: 'country', type: 'varchar', visible: true },
      ],
      color: COLOR_OPTIONS[2], // Vàng
    },
  },
];

const initialEdges: Edge<RelationshipEdgeData>[] = [
  {
    id: 'products-warehouses',
    source: '1',
    target: '2',
    sourceHandle: 'warehouse_id',
    targetHandle: 'id',
    type: 'relationship',
    data: {
      relationshipType: 'n-1',
    },
  },
  {
    id: 'products-suppliers',
    source: '1',
    target: '3',
    sourceHandle: 'supplier_id',
    targetHandle: 'id',
    type: 'relationship',
    data: {
      relationshipType: 'n-1',
    },
  },
];

function App() {
  const [nodes, setNodes] = useState<Node<TableNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge<RelationshipEdgeData>[]>(initialEdges);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Array<{ name: string; type: string; isPrimaryKey?: boolean; isForeignKey?: boolean }>>([
    { name: '', type: 'VARCHAR(255)' },
  ]);
  const [tableColors, setTableColors] = useState<Record<string, string>>(() => {
    const colors: Record<string, string> = {};
    initialNodes.forEach((node, index) => {
      colors[node.id] = node.data.color || COLOR_OPTIONS[index % COLOR_OPTIONS.length];
    });
    return colors;
  });
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  
  // Object connection dialog state
  const [objectDialogOpen, setObjectDialogOpen] = useState(false);
  const [pendingObjectConnection, setPendingObjectConnection] = useState<{
    sourceNodeId: string;
    sourceFieldName: string;
    targetNodeId: string;
    targetFieldName?: string; // Field PK được chọn khi kéo ngược lại
  } | null>(null);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onEdgeUpdate = useCallback((oldEdge: Edge<RelationshipEdgeData>, newConnection: Connection) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === oldEdge.id) {
          return {
            ...edge,
            source: newConnection.source!,
            target: newConnection.target!,
            sourceHandle: newConnection.sourceHandle,
            targetHandle: newConnection.targetHandle,
          };
        }
        return edge;
      })
    );
  }, []);

  const isValidConnection = useCallback((connection: Connection) => {
    // Không cho phép kết nối giữa 2 đáy bảng (object-target với object-target)
    if (connection.sourceHandle === 'object-target' && connection.targetHandle === 'object-target') {
      return false;
    }
    
    // Cho phép kết nối đến object-target từ field (không phải từ object-target)
    if (connection.targetHandle === 'object-target') {
      return connection.source !== connection.target && connection.sourceHandle !== 'object-target';
    }
    
    // Cho phép kết nối từ object-target đến field (không phải đến object-target)
    if (connection.sourceHandle === 'object-target' && connection.targetHandle) {
      return connection.source !== connection.target && connection.targetHandle !== 'object-target';
    }
    
    // Kết nối bình thường giữa các field
    return connection.source !== connection.target;
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.sourceHandle && params.targetHandle) {
        // Kiểm tra nếu đây là object connection (kết nối đến object-target handle)
        if (params.targetHandle === 'object-target') {
          // Kéo từ field đến đáy bảng (bình thường)
          setPendingObjectConnection({
            sourceNodeId: params.source,
            sourceFieldName: params.sourceHandle,
            targetNodeId: params.target,
          });
          setObjectDialogOpen(true);
          return; // Không tạo edge ngay, đợi user confirm trong dialog
        }

        // Kiểm tra nếu đây là object connection ngược lại (kéo từ object-target đến field)
        if (params.sourceHandle === 'object-target') {
          // Kéo từ đáy bảng đến field (ngược lại)
          // Trong trường hợp này:
          // - sourceNodeId là bảng chứa object-target (sẽ chứa FK - field mới)
          // - targetNodeId là bảng chứa field được chọn (chứa PK)
          // - targetHandle là field được chọn (PK)
          setPendingObjectConnection({
            sourceNodeId: params.source, // Bảng chứa object-target (sẽ tạo field mới ở đây)
            sourceFieldName: 'object-target', // Đánh dấu đây là kết nối ngược
            targetNodeId: params.target, // Bảng chứa field PK
            targetFieldName: params.targetHandle, // Field PK được chọn
          });
          setObjectDialogOpen(true);
          return; // Không tạo edge ngay, đợi user confirm trong dialog
        }

        // Kết nối bình thường giữa các field
        const edgeId = `${params.source}-${params.sourceHandle}-to-${params.target}-${params.targetHandle}`;
        const newEdge: Edge<RelationshipEdgeData> = {
          id: edgeId,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: 'relationship',
          data: {
            relationshipType: '1-n',
          },
        };
        setEdges((eds) => {
          // Kiểm tra xem edge đã tồn tại chưa
          const exists = eds.some(
            (e) =>
              e.source === params.source &&
              e.target === params.target &&
              e.sourceHandle === params.sourceHandle &&
              e.targetHandle === params.targetHandle
          );
          if (exists) return eds;
          return [...eds, newEdge];
        });
      }
    },
    []
  );

  const addTable = useCallback(() => {
    if (!tableName.trim()) return;

    const newId = String(nodes.length + 1);
    const defaultColor = COLOR_OPTIONS[nodes.length % COLOR_OPTIONS.length];
    const newTable: Node<TableNodeData> = {
      id: newId,
      type: 'table',
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: tableName,
        columns: columns
          .filter((col) => col.name.trim() !== '')
          .map((col) => ({ ...col, visible: true })),
        color: defaultColor,
      },
    };

    setNodes((nds) => [...nds, newTable]);
    setTableColors((prev) => ({ ...prev, [newId]: defaultColor }));
    setTableName('');
    setColumns([{ name: '', type: 'VARCHAR(255)' }]);
    setDialogOpen(false);
  }, [tableName, columns, nodes.length]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, []);

  const addColumn = useCallback(() => {
    setColumns((cols) => [...cols, { name: '', type: 'VARCHAR(255)' }]);
  }, []);

  const updateColumn = useCallback((index: number, field: string, value: string | boolean) => {
    setColumns((cols) =>
      cols.map((col, i) =>
        i === index ? { ...col, [field]: value } : col
      )
    );
  }, []);

  const removeColumn = useCallback((index: number) => {
    setColumns((cols) => cols.filter((_, i) => i !== index));
  }, []);

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.selected);
  }, [nodes]);

  const selectedNodeId = useMemo(() => {
    return selectedNode?.id;
  }, [selectedNode]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === nodeId,
      }))
    );

    // Focus vào node được chọn
    if (reactFlowInstance.current) {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        reactFlowInstance.current.fitView({
          padding: 0.2,
          nodes: [node],
          duration: 300,
        });
      }
    }
  }, [nodes]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<TableNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, []);

  const handleColorChange = useCallback((nodeId: string, color: string) => {
    setTableColors((prev) => ({ ...prev, [nodeId]: color }));
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, color } }
          : node
      )
    );
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const handleNodesReorder = useCallback((newOrder: Node<TableNodeData>[]) => {
    setNodes(newOrder);
  }, []);

  const handleFieldReorder = useCallback((nodeId: string, oldIndex: number, newIndex: number) => {
    // Khi field được sắp xếp lại, cập nhật edges để trỏ đúng vào field mới
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === nodeId) {
          const sourceNode = nodes.find((n) => n.id === nodeId);
          if (sourceNode) {
            const oldField = sourceNode.data.columns[oldIndex];
            const newField = sourceNode.data.columns[newIndex];
            // Nếu edge đang trỏ vào field cũ, cập nhật sang field mới
            if (edge.sourceHandle === oldField?.name) {
              return { ...edge, sourceHandle: newField?.name };
            }
          }
        }
        if (edge.target === nodeId) {
          const targetNode = nodes.find((n) => n.id === nodeId);
          if (targetNode) {
            const oldField = targetNode.data.columns[oldIndex];
            const newField = targetNode.data.columns[newIndex];
            // Nếu edge đang trỏ vào field cũ, cập nhật sang field mới
            if (edge.targetHandle === oldField?.name) {
              return { ...edge, targetHandle: newField?.name };
            }
          }
        }
        return edge;
      })
    );
  }, [nodes]);

  const handleFieldRename = useCallback((nodeId: string, fieldIndex: number, oldName: string, newName: string) => {
    // Khi field được đổi tên, cập nhật edges để trỏ đúng vào tên mới
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === nodeId && edge.sourceHandle === oldName) {
          return { ...edge, sourceHandle: newName };
        }
        if (edge.target === nodeId && edge.targetHandle === oldName) {
          return { ...edge, targetHandle: newName };
        }
        return edge;
      })
    );
  }, []);

  const handleFieldVisibilityToggle = useCallback((nodeId: string, fieldIndex: number, newVisibility: boolean) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const field = node.data.columns[fieldIndex];
    
    // Nếu field này là FK và có edge kết nối đến object field, thì cũng ẩn object field đó
    if (field.isForeignKey) {
      // Tìm edge từ field FK này đến object field
      const connectedEdges = edges.filter(
        (edge) =>
          edge.source === nodeId &&
          edge.sourceHandle === field.name &&
          edge.data?.objectFieldName // Edge có objectFieldName nghĩa là kết nối đến object field
      );

      // Ẩn/hiện các object field được kết nối
      connectedEdges.forEach((edge) => {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode) {
          const objectFieldIndex = targetNode.data.columns.findIndex(
            (col) => col.name === edge.data?.objectFieldName && col.type === 'object'
          );
          
          if (objectFieldIndex !== -1) {
            // Cập nhật visibility của object field
            setNodes((nds) =>
              nds.map((n) =>
                n.id === edge.target
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        columns: n.data.columns.map((col, idx) =>
                          idx === objectFieldIndex
                            ? { ...col, visible: newVisibility }
                            : col
                        ),
                      },
                    }
                  : n
              )
            );
          }
        }
      });
    }
  }, [nodes, edges]);

  const handleObjectConnectionConfirm = useCallback(
    (fieldName: string, primaryKeyFieldName: string) => {
      if (!pendingObjectConnection) return;

      const { sourceNodeId, sourceFieldName, targetNodeId } = pendingObjectConnection;
      const isReverse = sourceFieldName === 'object-target';

      // Logic đơn giản: Đáy bảng luôn chứa PK, field được kéo luôn là FK
      let pkNodeId: string; // Bảng chứa PK (đáy bảng)
      let fkNodeId: string; // Bảng chứa FK (field được kéo)
      let fkFieldName: string; // Tên field FK

      if (isReverse) {
        // Kéo từ đáy bảng A đến field B
        // Đáy bảng A = chứa PK (chọn trong popup)
        // Field B = FK
        pkNodeId = sourceNodeId; // Bảng A chứa PK
        fkNodeId = targetNodeId; // Bảng B chứa FK
        fkFieldName = pendingObjectConnection.targetFieldName || ''; // Field B là FK
      } else {
        // Kéo từ field A đến đáy bảng B
        // Field A = FK
        // Đáy bảng B = chứa PK (chọn trong popup)
        pkNodeId = targetNodeId; // Bảng B chứa PK
        fkNodeId = sourceNodeId; // Bảng A chứa FK
        fkFieldName = sourceFieldName; // Field A là FK
      }

      const pkNode = nodes.find((n) => n.id === pkNodeId);
      if (!pkNode) return;

      // Tạo field mới trong bảng chứa PK (đáy bảng) - field này tham chiếu đến PK được chọn
      const newField = {
        name: fieldName,
        type: 'object', // Type đặc biệt cho object
        isPrimaryKey: false, // Field này không phải PK, nó tham chiếu đến PK khác
        visible: true,
        primaryKeyField: primaryKeyFieldName, // Lưu field làm PK
      };

      // Thêm field mới vào bảng chứa PK
      setNodes((nds) =>
        nds.map((node) =>
          node.id === pkNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  columns: [...node.data.columns, newField],
                },
              }
            : node
        )
      );

      // Đánh dấu field được kéo là FK
      setNodes((nds) =>
        nds.map((node) =>
          node.id === fkNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  columns: node.data.columns.map((col) =>
                    col.name === fkFieldName
                      ? { ...col, isForeignKey: true }
                      : col
                  ),
                },
              }
            : node
        )
      );

      // Tạo edge giữa field FK và field object mới trong bảng PK
      // Quan hệ: FK (N) -> PK (1)
      const edgeId = `${fkNodeId}-${fkFieldName}-to-${pkNodeId}-${fieldName}`;
      const newEdge: Edge<RelationshipEdgeData> = {
        id: edgeId,
        source: fkNodeId,
        target: pkNodeId,
        sourceHandle: fkFieldName, // Field FK (N)
        targetHandle: fieldName, // Field object mới trong bảng PK (1)
        type: 'relationship',
        data: {
          relationshipType: 'n-1', // FK (N) -> PK (1)
          primaryKeyField: primaryKeyFieldName, // PK được chọn trong popup
          objectFieldName: fieldName, // Tên field object mới được tạo
        },
      };

      setEdges((eds) => {
        const exists = eds.some(
          (e) =>
            e.source === fkNodeId &&
            e.target === pkNodeId &&
            e.sourceHandle === fkFieldName &&
            e.targetHandle === fieldName
        );
        if (exists) return eds;
        return [...eds, newEdge];
      });

      // Reset pending connection
      setPendingObjectConnection(null);
    },
    [pendingObjectConnection, nodes]
  );

  return (
    <div className="w-screen h-screen flex">
      {/* Sidebar */}
      <TableSidebar
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onNodeSelect={handleNodeSelect}
        onNodeDelete={deleteNode}
        onNodeUpdate={handleNodeUpdate}
        onAddTable={() => setDialogOpen(true)}
        tableColors={tableColors}
        onColorChange={handleColorChange}
        onNodesReorder={handleNodesReorder}
        onFieldReorder={handleFieldReorder}
        onFieldRename={handleFieldRename}
        onFieldVisibilityToggle={handleFieldVisibilityToggle}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b bg-background p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">ERD Diagram Builder</h1>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm Bảng
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Thêm Bảng Mới</DialogTitle>
                  <DialogDescription>
                    Tạo một bảng mới với các cột của nó
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Tên Bảng
                    </label>
                    <Input
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder="Ví dụ: Products"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Các Cột
                    </label>
                    <div className="space-y-2">
                      {columns.map((column, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            value={column.name}
                            onChange={(e) =>
                              updateColumn(index, 'name', e.target.value)
                            }
                            placeholder="Tên cột"
                            className="flex-1"
                          />
                          <Input
                            value={column.type}
                            onChange={(e) =>
                              updateColumn(index, 'type', e.target.value)
                            }
                            placeholder="Kiểu dữ liệu"
                            className="w-32"
                          />
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={column.isPrimaryKey || false}
                              onChange={(e) =>
                                updateColumn(index, 'isPrimaryKey', e.target.checked)
                              }
                            />
                            PK
                          </label>
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={column.isForeignKey || false}
                              onChange={(e) =>
                                updateColumn(index, 'isForeignKey', e.target.checked)
                              }
                            />
                            FK
                          </label>
                          {columns.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeColumn(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" onClick={addColumn} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm Cột
                      </Button>
                    </div>
                  </div>
                  <Button onClick={addTable} className="w-full">
                    Tạo Bảng
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {selectedNode && (
              <Button
                variant="destructive"
                onClick={() => deleteNode(selectedNode.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa Bảng
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeUpdate={onEdgeUpdate}
            onInit={onInit}
            isValidConnection={isValidConnection}
            edgesUpdatable={true}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-gray-50"
            connectionMode="loose"
            defaultEdgeOptions={{
              type: 'relationship',
              animated: false,
            }}
            connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2 }}
            connectionLineType="smoothstep"
            connectionRadius={20}
            snapToGrid={false}
            deleteKeyCode={null}
          >
            <Background variant="dots" gap={12} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Object Connection Dialog */}
      {pendingObjectConnection && (
        <ObjectConnectionDialog
          open={objectDialogOpen}
          onOpenChange={setObjectDialogOpen}
          sourceNodeId={pendingObjectConnection.sourceNodeId}
          sourceFieldName={pendingObjectConnection.sourceFieldName}
          targetNode={
            nodes.find((n) => n.id === pendingObjectConnection.targetNodeId) || {
              id: '',
              data: { label: '', columns: [] },
            }
          }
          sourceNode={
            pendingObjectConnection.sourceFieldName === 'object-target'
              ? nodes.find((n) => n.id === pendingObjectConnection.sourceNodeId) || {
                  id: '',
                  data: { label: '', columns: [] },
                }
              : undefined
          }
          onConfirm={handleObjectConnectionConfirm}
          isReverse={pendingObjectConnection.sourceFieldName === 'object-target'}
        />
      )}
    </div>
  );
}

export default App;
