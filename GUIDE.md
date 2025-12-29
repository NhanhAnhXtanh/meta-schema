# Giải Thích Chi Tiết Từng File - Meta Schema

## 📁 Cấu Trúc Dự Án

```
src/
├── components/          # Các component UI
├── constants/          # Hằng số toàn ứng dụng
├── data/              # Dữ liệu mẫu
├── hooks/             # Custom React hooks
├── services/          # Business logic
├── store/             # Redux state management
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── App.tsx            # Component chính
```

---

## 🎯 1. COMPONENTS (Thành Phần Giao Diện)

### 📄 `App.tsx`
**Mục đích**: Component gốc của toàn bộ ứng dụng

**Chức năng**:
- Render layout chính (Sidebar + Canvas)
- Kết nối các component con
- Cực kỳ đơn giản (chỉ 18 dòng) nhờ tách logic ra

**Code chính**:
```tsx
function App() {
  return (
    <div className="flex h-screen">
      <Sidebar />           {/* Thanh bên trái */}
      <FlowCanvas />        {/* Canvas vẽ schema */}
      <SchemaDialogs />     {/* Các dialog popup */}
    </div>
  );
}
```

---

### 📄 `components/SchemaDialogs.tsx`
**Mục đích**: Quản lý TẤT CẢ các dialog trong ứng dụng

**Chức năng**:
- Quản lý 3 loại dialog:
  1. **AddTableDialog**: Thêm bảng mới
  2. **LinkFieldDialog**: Tạo/Edit liên kết giữa bảng
  3. **ObjectConnectionDialog**: Kết nối object field
- Lắng nghe event `addField` từ các component khác
- Xử lý logic khi user confirm/cancel

**Tại sao tách riêng?**
- App.tsx trước đây 146 dòng → Giờ chỉ 18 dòng
- Logic dialog tập trung 1 chỗ, dễ maintain
- Dễ test riêng

**Logic quan trọng**:
```tsx
// Khi edit field
const handleLinkFieldConfirm = (...) => {
  if (isEditMode) {
    // Xóa field cũ NHƯNG giữ nguyên linked tables
    dispatch(deleteField({ 
      nodeId, 
      fieldIndex, 
      skipRecursive: true  // 👈 Không xóa tables con
    }));
  }
  
  // Tạo lại field với config mới
  dispatch(confirmLinkField({...}));
};
```

---

### 📄 `components/AddTableDialog.tsx`
**Mục đích**: Dialog để thêm bảng mới vào schema

**Chức năng**:
- Input tên bảng
- Tự động tạo field `id` (UUID, Primary Key)
- Validate tên bảng
- Dispatch action `addTable` khi confirm

**Flow**:
```
User nhập "Products" 
→ Click "Tạo" 
→ dispatch(addTable({ name: "Products", columns: [...] }))
→ Redux tạo node mới
→ Hiển thị trên canvas
```

---

### 📄 `components/LinkFieldDialog.tsx`
**Mục đích**: Dialog tạo/edit liên kết giữa 2 bảng

**Chức năng**:
- Chọn loại liên kết: **1-n (Array)** hoặc **n-1 (Object)**
- Chọn bảng đích
- Chọn key nguồn (PK) và key đích (FK)
- Nhập tên field mới
- Hiển thị "Kiểu Dữ Liệu" tự động (array/object)

**Các mode**:
1. **Create mode**: Tạo link mới
2. **Edit mode**: Sửa link đã có (populate initialValues)

**UI Logic**:
```tsx
// Dropdown "Loại Liên Kết"
<select value={linkType} onChange={...}>
  <option value="1-n">1 - Nhiều (One to Many)</option>
  <option value="n-1">Nhiều - 1 (Many to One)</option>
</select>

// Hiển thị kiểu dữ liệu tương ứng
<Input 
  disabled 
  value={linkType === '1-n' ? 'array' : 'object'} 
/>
```

**Label động**:
- **1-n**: "Key Bảng Nguồn (Thường là PK)" / "Key Bảng Đích (Thường là FK)"
- **n-1**: "Key Bảng Nguồn (Thường là FK)" / "Key Bảng Đích (Thường là PK)"

---

### 📄 `components/ObjectConnectionDialog.tsx`
**Mục đích**: Dialog khi kéo thả để tạo object connection

**Chức năng**:
- Hiển thị khi user kéo từ handle "object-target"
- Chọn field FK và PK
- Nhập tên field object mới
- Tạo edge n-1

**Khi nào dùng?**
- User kéo từ special handle (không phải field thường)
- Tạo relationship ngược (reverse)

---

### 📄 `components/TableNode.tsx`
**Mục đích**: Component hiển thị 1 bảng trên canvas

**Chức năng**:
- Hiển thị tên bảng + màu sắc
- Hiển thị danh sách fields
- Tạo handles (điểm kết nối) cho mỗi field
- Dispatch event khi click "Add Field"

**Handles**:
```tsx
// Mỗi field có 2 handles: source (trái) và target (phải)
{columns.map(col => (
  <>
    <Handle 
      type="source" 
      position="left" 
      id={col.name}  // 👈 ID = tên field
    />
    <Handle 
      type="target" 
      position="right" 
      id={col.name}
    />
  </>
))}
```

**Tại sao cần handles?**
- React Flow dùng handles để kết nối các nodes
- Mỗi field cần handle riêng để biết kết nối field nào

---

### 📄 `components/RelationshipEdge.tsx`
**Mục đích**: Component hiển thị đường kết nối giữa 2 bảng

**Chức năng**:
- Vẽ đường cong giữa 2 nodes
- Hiển thị label (1-n hoặc n-1)
- Nút Edit và Delete khi hover
- Cập nhật vị trí khi nodes di chuyển

**Styling**:
```tsx
// Màu sắc theo loại relationship
const edgeColor = relationshipType === '1-n' 
  ? '#22c55e'  // Xanh lá (1-n)
  : '#3b82f6'; // Xanh dương (n-1)
```

---

### 📄 `components/designer/sidebar/Sidebar.tsx`
**Mục đích**: Thanh bên trái hiển thị danh sách bảng

**Chức năng**:
- Hiển thị header với search và nút "Add Table"
- Lọc root nodes (bảng không phải con của bảng khác)
- Render danh sách bảng dạng tree
- Drag & drop để sắp xếp

**Root nodes logic**:
```tsx
const rootNodes = useMemo(() => {
  // Bảng là root nếu KHÔNG phải target của edge nào
  return nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  );
}, [nodes, edges]);
```

**Ví dụ**:
```
Products (root)
  └─> Categories (child)
      └─> Tags (child)

Chỉ hiển thị "Products" ở level đầu
```

---

### 📄 `components/designer/sidebar/SidebarHeader.tsx`
**Mục đích**: Header của sidebar

**Chức năng**:
- Search box để tìm bảng
- Nút "Thêm Bảng" mở AddTableDialog
- Hiển thị số lượng bảng

---

### 📄 `components/designer/sidebar/SidebarItem.tsx`
**Mục đích**: Hiển thị 1 bảng trong sidebar

**Chức năng**:
- Hiển thị tên bảng với màu sắc
- Toggle expand/collapse
- Hiển thị danh sách fields
- Nút "Thêm trường"
- Drag handle để sắp xếp

**Tree structure**:
```tsx
<div>
  <TableHeader />
  {isExpanded && (
    <FieldsList>
      {fields.map(field => (
        <SidebarField field={field} />
      ))}
    </FieldsList>
  )}
</div>
```

---

### 📄 `components/designer/sidebar/SidebarField.tsx`
**Mục đích**: Hiển thị 1 field trong sidebar

**Chức năng**:
- Hiển thị tên, type, các thuộc tính (N, PK, FK)
- Phân biệt field gốc vs virtual:
  - **Field gốc**: Chỉ có checkbox, tên và type (read-only)
  - **Field virtual**: Có đầy đủ controls (edit, delete, toggle keys)
- Expand/collapse để xem nested fields
- Drag & drop để sắp xếp

**Logic phân biệt**:
```tsx
const isEditable = field.isVirtual === true || field.type === 'object';

{isEditable ? (
  // Hiển thị đầy đủ controls
  <>
    <Input editable />
    <TypeBadge />
    <KeyToggles />
    <EditButton />
    <DeleteButton />
  </>
) : (
  // Chỉ hiển thị read-only
  <>
    <Input disabled />
    <TypeBadge readonly />
  </>
)}
```

**Background màu**:
- **Xanh lá**: Field virtual (editable)
- **Xám**: Field gốc (read-only)

---

### 📄 `components/designer/sidebar/NestedFieldsList.tsx`
**Mục đích**: Hiển thị fields của bảng con (recursive)

**Chức năng**:
- Nhận `nodeId` của bảng con
- Hiển thị label "Linked from [Tên Bảng]"
- Render danh sách fields của bảng đó
- Có thể nested tiếp (đệ quy)

**Recursive rendering**:
```tsx
function NestedFieldsList({ nodeId }) {
  const node = nodes.find(n => n.id === nodeId);
  
  return (
    <div className="ml-4 border-l">
      <div>Linked from {node.label}</div>
      {node.columns.map(field => (
        <SidebarField field={field} />
        {/* Nếu field này cũng có link → Render NestedFieldsList tiếp */}
      ))}
    </div>
  );
}
```

---

### 📄 `components/designer/canvas/FlowCanvas.tsx`
**Mục đích**: Canvas để vẽ và tương tác với schema

**Chức năng**:
- Render React Flow canvas
- Kết nối Redux state với React Flow
- Xử lý events: drag, connect, delete
- Cấu hình node types và edge types

**React Flow setup**:
```tsx
const nodeTypes = {
  table: TableNode  // Custom node type
};

const edgeTypes = {
  relationship: RelationshipEdge  // Custom edge type
};

<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  onNodesChange={...}
  onEdgesChange={...}
/>
```

---

## 🎯 2. STORE (Quản Lý State)

### 📄 `store/index.ts`
**Mục đích**: Cấu hình Redux store

**Chức năng**:
- Combine reducers (schema + ui)
- Export store và types

```tsx
const store = configureStore({
  reducer: {
    schema: schemaReducer,  // State của schema (nodes, edges)
    ui: uiReducer          // State của UI (dialogs, visibility)
  }
});
```

---

### 📄 `store/hooks.ts`
**Mục đích**: Typed hooks cho Redux

**Chức năng**:
- Export `useAppDispatch` và `useAppSelector` với TypeScript types
- Tránh phải type mỗi lần dùng

```tsx
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

### 📄 `store/slices/schemaSlice.ts`
**Mục đích**: Quản lý state của schema (nodes, edges)

**State structure**:
```tsx
{
  nodes: Node<TableNodeData>[],  // Danh sách bảng
  edges: Edge[]                  // Danh sách liên kết
}
```

**Reducers quan trọng**:

1. **addTable**: Thêm bảng mới
```tsx
addTable: (state, action) => {
  const newTable = {
    id: generateId(),
    type: 'table',
    position: { x: random(), y: random() },
    data: {
      label: action.payload.name,
      columns: action.payload.columns,
      color: randomColor()
    }
  };
  state.nodes.push(newTable);
}
```

2. **confirmLinkField**: Tạo link 1-n (Array)
```tsx
confirmLinkField: (state, action) => {
  // 1. Thêm virtual field vào source node
  sourceNode.data.columns.push({
    name: newFieldName,
    type: 'varchar',
    isVirtual: true,  // 👈 Đánh dấu virtual
    linkedPrimaryKeyField: sourcePK
  });
  
  // 2. Đánh dấu FK ở target node
  targetColumn.isForeignKey = true;
  
  // 3. Tạo edge
  state.edges.push({
    source: sourceNodeId,
    target: targetNodeId,
    sourceHandle: newFieldName,
    targetHandle: targetFK,
    data: { relationshipType: '1-n' }
  });
}
```

3. **confirmLinkObject**: Tạo link n-1 (Object)
```tsx
confirmLinkObject: (state, action) => {
  // 1. Thêm object field vào source
  sourceNode.data.columns.push({
    name: newFieldName,
    type: 'object',  // 👈 Type là object
    primaryKeyField: targetPK
  });
  
  // 2. Đánh dấu FK
  fkColumn.isForeignKey = true;
  
  // 3. Tạo edge với data khác
  state.edges.push({
    source: sourceNodeId,
    target: targetNodeId,
    sourceHandle: sourceFK,
    targetHandle: targetPK,
    data: { 
      relationshipType: 'n-1',
      objectFieldName: newFieldName  // 👈 Lưu tên field
    }
  });
}
```

4. **deleteField**: Xóa field (có option recursive)
```tsx
deleteField: (state, action) => {
  const { nodeId, fieldIndex, skipRecursive } = action.payload;
  
  // Xóa edges liên quan
  state.edges = state.edges.filter(...);
  
  // Xóa field
  node.data.columns.splice(fieldIndex, 1);
  
  // Nếu KHÔNG skip → Xóa tất cả tables con (đệ quy)
  if (!skipRecursive) {
    childNodeIds.forEach(id => recursiveDelete(id));
  }
}
```

**Tại sao cần skipRecursive?**
- **Delete thường**: Xóa field + tất cả linked tables
- **Edit**: Chỉ xóa field definition, giữ nguyên tables

---

### 📄 `store/slices/uiSlice.ts`
**Mục đích**: Quản lý state của UI (không phải data)

**State structure**:
```tsx
{
  sidebarOpen: boolean,
  visibleNodeIds: string[],      // Bảng nào đang hiển thị
  selectedNodeId: string | null,
  
  isAddTableDialogOpen: boolean,
  
  linkFieldDialog: {
    isOpen: boolean,
    sourceNodeId: string | null,
    isEditMode: boolean,         // Create hay Edit?
    fieldIndex: number,          // Index của field đang edit
    initialValues: {...}         // Giá trị ban đầu khi edit
  },
  
  objectConnectionDialog: {
    isOpen: boolean,
    pendingConnection: {...}
  }
}
```

**Reducers**:

1. **openLinkFieldDialog**: Mở dialog ở create mode
```tsx
openLinkFieldDialog: (state, action) => {
  state.linkFieldDialog.isOpen = true;
  state.linkFieldDialog.sourceNodeId = action.payload;
  state.linkFieldDialog.isEditMode = false;
  state.linkFieldDialog.initialValues = undefined;
}
```

2. **openEditLinkFieldDialog**: Mở dialog ở edit mode
```tsx
openEditLinkFieldDialog: (state, action) => {
  state.linkFieldDialog.isOpen = true;
  state.linkFieldDialog.sourceNodeId = action.payload.sourceNodeId;
  state.linkFieldDialog.isEditMode = true;
  state.linkFieldDialog.fieldIndex = action.payload.fieldIndex;
  state.linkFieldDialog.initialValues = action.payload.initialValues;
}
```

**Tại sao tách UI state?**
- Schema state (nodes, edges) là data thật
- UI state (dialogs, visibility) chỉ là trạng thái giao diện
- Dễ reset UI mà không ảnh hưởng data

---

## 🎯 3. SERVICES (Business Logic)

### 📄 `services/schemaService.ts`
**Mục đích**: Tập trung TẤT CẢ business logic về schema

**Tại sao cần?**
- Logic phức tạp không nên nằm trong component
- Dễ test (pure functions)
- Tái sử dụng ở nhiều nơi

**Methods quan trọng**:

1. **isFieldNameUnique**: Kiểm tra tên field có trùng không
```tsx
static isFieldNameUnique(node, fieldName, excludeIndex?) {
  return !node.data.columns.some((col, idx) => 
    col.name === fieldName && idx !== excludeIndex
  );
}
```

2. **findChildNodes**: Tìm tất cả nodes con của 1 field
```tsx
static findChildNodes(nodeId, fieldName, edges) {
  const childEdges = edges.filter(e =>
    (e.source === nodeId && e.sourceHandle === fieldName) ||
    (e.source === nodeId && e.data?.objectFieldName === fieldName)
  );
  return childEdges.map(e => e.target);
}
```

3. **getLinkedTargetNode**: Lấy node đích của 1 link field
```tsx
static getLinkedTargetNode(nodeId, field, edges, nodes) {
  let targetNodeId = null;
  
  if (field.isVirtual) {
    // Array field
    const edge = edges.find(e => 
      e.source === nodeId && e.sourceHandle === field.name
    );
    if (edge) targetNodeId = edge.target;
  } else if (field.type === 'object') {
    // Object field
    const edge = edges.find(e => 
      e.source === nodeId && e.data?.objectFieldName === field.name
    );
    if (edge) targetNodeId = edge.target;
  }
  
  return nodes.find(n => n.id === targetNodeId) || null;
}
```

4. **getRootNodes**: Lọc các bảng root
```tsx
static getRootNodes(nodes, edges) {
  return nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  );
}
```

5. **getDescendants**: Lấy tất cả nodes con (đệ quy)
```tsx
static getDescendants(nodeId, edges, visited = new Set()) {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);
  
  const children = edges
    .filter(e => e.source === nodeId)
    .map(e => e.target);
  
  const descendants = [...children];
  children.forEach(childId => {
    descendants.push(...this.getDescendants(childId, edges, visited));
  });
  
  return descendants;
}
```

---

## 🎯 4. HOOKS (Custom React Hooks)

### 📄 `hooks/useSchema.ts`
**Mục đích**: Tạo custom hooks để tái sử dụng logic

**Tại sao cần?**
- Component gọn gàng hơn
- Logic có thể test riêng
- Tránh duplicate code

**Hooks**:

1. **useFieldOperations**: CRUD operations cho fields
```tsx
export function useFieldOperations(nodeId: string) {
  const dispatch = useAppDispatch();
  
  const handleAddField = useCallback((field) => {
    dispatch(addField({ nodeId, field }));
  }, [dispatch, nodeId]);
  
  const handleUpdateField = useCallback((fieldIndex, updates) => {
    dispatch(updateField({ nodeId, fieldIndex, updates }));
  }, [dispatch, nodeId]);
  
  return {
    addField: handleAddField,
    updateField: handleUpdateField,
    deleteField: handleDeleteField,
    toggleVisibility: handleToggleVisibility,
    reorderFields: handleReorderFields
  };
}
```

**Sử dụng**:
```tsx
// ❌ TRƯỚC
function SidebarField() {
  const dispatch = useAppDispatch();
  const handleUpdate = () => {
    dispatch(updateField({ nodeId, fieldIndex, updates }));
  };
}

// ✅ SAU
function SidebarField() {
  const { updateField } = useFieldOperations(nodeId);
  const handleUpdate = () => updateField(fieldIndex, updates);
}
```

2. **useLinkedNode**: Lấy thông tin node được link
```tsx
export function useLinkedNode(nodeId, field) {
  const edges = useAppSelector(state => state.schema.edges);
  const nodes = useAppSelector(state => state.schema.nodes);
  
  return useMemo(() => {
    const targetNode = SchemaService.getLinkedTargetNode(
      nodeId, field, edges, nodes
    );
    return {
      targetNode,
      hasLink: !!targetNode,
      targetNodeId: targetNode?.id || null
    };
  }, [nodeId, field, edges, nodes]);
}
```

3. **useNodeHierarchy**: Xử lý cây phân cấp
```tsx
export function useNodeHierarchy() {
  const nodes = useAppSelector(state => state.schema.nodes);
  const edges = useAppSelector(state => state.schema.edges);
  
  const rootNodes = useMemo(() => 
    SchemaService.getRootNodes(nodes, edges),
    [nodes, edges]
  );
  
  const getDescendants = useCallback((nodeId) => 
    SchemaService.getDescendants(nodeId, edges),
    [edges]
  );
  
  return { rootNodes, getDescendants, isRootNode };
}
```

---

## 🎯 5. CONSTANTS (Hằng Số)

### 📄 `constants/index.ts`
**Mục đích**: Tập trung TẤT CẢ hằng số

**Tại sao cần?**
- Single source of truth
- Dễ cập nhật (sửa 1 chỗ)
- Type-safe với TypeScript

**Nội dung**:

1. **TABLE_COLORS**: Màu sắc cho bảng
```tsx
export const TABLE_COLORS = [
  '#22c55e', // Green
  '#a855f7', // Purple
  '#eab308', // Yellow
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#14b8a6', // Teal
] as const;
```

2. **DATA_TYPES**: Các kiểu dữ liệu
```tsx
export const DATA_TYPES = {
  PRIMITIVE: [
    'varchar', 'text', 'int', 'uuid', 
    'timestamp', 'boolean', 'money', ...
  ],
  COMPLEX: ['array', 'object']
};
```

3. **RELATIONSHIP_TYPES**: Loại relationship
```tsx
export const RELATIONSHIP_TYPES = {
  ONE_TO_MANY: '1-n',
  MANY_TO_ONE: 'n-1'
};
```

4. **VALIDATION_MESSAGES**: Thông báo lỗi
```tsx
export const VALIDATION_MESSAGES = {
  FIELD_NAME_REQUIRED: 'Tên trường không được để trống',
  FIELD_NAME_DUPLICATE: 'Tên trường đã tồn tại',
  FIELD_NAME_TOO_LONG: 'Tên trường quá dài',
  ...
};
```

5. **UI_CONSTANTS**: Hằng số UI
```tsx
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 320,
  FIELD_ROW_HEIGHT: 40,
  MAX_VISIBLE_FIELDS: 50
};
```

---

## 🎯 6. UTILS (Tiện Ích)

### 📄 `utils/validation.ts`
**Mục đích**: Validation logic tập trung

**Tại sao cần?**
- Logic validation phức tạp
- Tái sử dụng ở nhiều nơi
- Dễ test

**Methods**:

1. **validateFieldName**: Validate tên field
```tsx
static validateFieldName(name: string) {
  if (!name || name.trim().length === 0) {
    return { 
      valid: false, 
      error: 'Tên trường không được để trống' 
    };
  }
  
  if (name.length > 63) {
    return { 
      valid: false, 
      error: 'Tên trường quá dài (tối đa 63 ký tự)' 
    };
  }
  
  // PostgreSQL identifier rules
  const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!validPattern.test(name)) {
    return { 
      valid: false, 
      error: 'Tên trường không hợp lệ' 
    };
  }
  
  return { valid: true };
}
```

2. **sanitizeFieldName**: Làm sạch tên field
```tsx
static sanitizeFieldName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')  // Thay ký tự đặc biệt = _
    .replace(/^[0-9]/, '_$&')     // Thêm _ nếu bắt đầu bằng số
    .substring(0, 63);            // Giới hạn 63 ký tự
}
```

---

## 🎯 7. DATA (Dữ Liệu Mẫu)

### 📄 `data/initialSchema.ts`
**Mục đích**: Dữ liệu mẫu khi khởi động app

**Chức năng**:
- Tạo 8 bảng mẫu: Products, Warehouses, Suppliers, Categories, Orders, Customers, Reviews, Inventory
- Mỗi bảng có các fields cơ bản
- Dùng colors từ TABLE_COLORS

**Tại sao tách riêng?**
- schemaSlice.ts gọn hơn
- Dễ thay đổi data mẫu
- Có thể load từ API sau

---

## 🎯 8. TYPES (TypeScript Types)

### 📄 `types/schema.ts`
**Mục đích**: Định nghĩa types cho toàn bộ app

**Types quan trọng**:

1. **TableColumn**: Định nghĩa 1 field
```tsx
export interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isNotNull?: boolean;
  visible?: boolean;
  
  // Virtual field properties
  isVirtual?: boolean;
  linkedPrimaryKeyField?: string;
  
  // Object field properties
  primaryKeyField?: string;
  relationshipType?: '1-n' | 'n-1';
}
```

2. **TableNodeData**: Data của 1 node
```tsx
export interface TableNodeData {
  label: string;
  columns: TableColumn[];
  color: string;
}
```

---

## 📊 LUỒNG DỮ LIỆU TỔNG QUAN

```
1. User Action (Click button)
   ↓
2. Component (SidebarItem.tsx)
   ↓
3. Custom Hook (useFieldOperations)
   ↓
4. Redux Action (dispatch(addField))
   ↓
5. Reducer (schemaSlice.ts)
   ↓
6. State Update (Redux store)
   ↓
7. Re-render (Components nhận state mới)
   ↓
8. UI Update (Hiển thị thay đổi)
```

---

## 🎯 LUỒNG TẠO LINK FIELD

```
1. User click "Thêm trường" trong SidebarItem
   ↓
2. Dispatch event 'addField' với nodeId
   ↓
3. SchemaDialogs lắng nghe event
   ↓
4. Dispatch openLinkFieldDialog(nodeId)
   ↓
5. uiSlice set linkFieldDialog.isOpen = true
   ↓
6. LinkFieldDialog render
   ↓
7. User chọn: target table, keys, field name, link type
   ↓
8. User click "Tạo Link"
   ↓
9. onConfirm callback
   ↓
10. SchemaDialogs.handleLinkFieldConfirm
   ↓
11. Dispatch confirmLinkField hoặc confirmLinkObject
   ↓
12. schemaSlice reducer:
    - Thêm virtual/object field vào source node
    - Đánh dấu FK ở target node
    - Tạo edge
   ↓
13. State update
   ↓
14. UI re-render: Hiển thị field mới + edge mới
```

---

## 🎯 LUỒNG EDIT FIELD

```
1. User click nút Edit (pencil icon)
   ↓
2. SidebarField tìm edge tương ứng
   ↓
3. Tạo initialValues từ edge data
   ↓
4. Dispatch openEditLinkFieldDialog({
     sourceNodeId,
     fieldIndex,
     initialValues
   })
   ↓
5. uiSlice set:
   - isEditMode = true
   - fieldIndex = ...
   - initialValues = ...
   ↓
6. LinkFieldDialog render với initialValues
   ↓
7. useEffect populate form fields
   ↓
8. User chỉnh sửa và click "Cập Nhật"
   ↓
9. handleLinkFieldConfirm check isEditMode
   ↓
10. Dispatch deleteField({ 
      nodeId, 
      fieldIndex, 
      skipRecursive: true  // 👈 Giữ linked tables
    })
   ↓
11. Dispatch confirmLinkField/confirmLinkObject (tạo lại)
   ↓
12. State update
   ↓
13. UI re-render: Field đã được update
```

---

## 💡 TÓM TẮT

### Nguyên Tắc Thiết Kế:

1. **Separation of Concerns**: Mỗi file có 1 nhiệm vụ rõ ràng
2. **Single Responsibility**: Mỗi function làm 1 việc
3. **DRY (Don't Repeat Yourself)**: Logic dùng lại → Service/Hook
4. **Type Safety**: TypeScript cho tất cả
5. **Testability**: Pure functions, dễ test

### Khi Thêm Feature Mới:

1. **Business Logic** → `services/`
2. **Reusable React Logic** → `hooks/`
3. **UI Component** → `components/`
4. **State Management** → `store/slices/`
5. **Constants** → `constants/`
6. **Validation** → `utils/`

### Khi Debug:

1. Check Redux DevTools để xem state
2. Check console.log trong reducers
3. Check React DevTools để xem props
4. Check Network tab nếu có API calls
