# Kiến Trúc Doanh Nghiệp - Meta Schema

## Tổng Quan

Ứng dụng đã được tái cấu trúc theo chuẩn doanh nghiệp với các lớp rõ ràng, dễ mở rộng và bảo trì.

## Cấu Trúc Thư Mục

```
src/
├── components/          # UI Components
│   ├── designer/       # Schema designer components
│   │   ├── canvas/    # Canvas-related components
│   │   └── sidebar/   # Sidebar components
│   ├── SchemaDialogs.tsx  # Dialog management
│   └── ...
├── constants/          # Application constants
│   └── index.ts       # Centralized constants
├── data/              # Static data & initial states
│   └── initialSchema.ts
├── hooks/             # Custom React hooks
│   └── useSchema.ts   # Schema-related hooks
├── services/          # Business logic layer
│   └── schemaService.ts
├── store/             # Redux state management
│   ├── slices/
│   │   ├── schemaSlice.ts  # Schema state
│   │   └── uiSlice.ts      # UI state
│   ├── hooks.ts
│   └── index.ts
├── types/             # TypeScript type definitions
│   └── schema.ts
├── utils/             # Utility functions
│   └── validation.ts
└── App.tsx            # Main application component
```

## Các Lớp Kiến Trúc

### 1. **Services Layer** (`/services`)
- **Mục đích**: Chứa toàn bộ business logic
- **Ví dụ**: `SchemaService`
  - Validation logic
  - Edge/Node relationship calculations
  - Data transformations

**Lợi ích**:
- Logic tập trung, dễ test
- Tái sử dụng giữa các components
- Dễ maintain và debug

### 2. **Custom Hooks** (`/hooks`)
- **Mục đích**: Encapsulate reusable logic với React lifecycle
- **Ví dụ**: 
  - `useFieldOperations`: CRUD operations cho fields
  - `useLinkedNode`: Lấy thông tin linked nodes
  - `useNodeHierarchy`: Xử lý cây phân cấp
  - `useFieldValidation`: Validation hooks

**Lợi ích**:
- Components gọn gàng hơn
- Logic có thể tái sử dụng
- Dễ test riêng biệt

### 3. **Constants** (`/constants`)
- **Mục đích**: Centralize tất cả các giá trị cố định
- **Nội dung**:
  - Colors, data types
  - Validation messages
  - UI constants
  - Event names
  - Storage keys

**Lợi ích**:
- Single source of truth
- Dễ cập nhật
- Type-safe với TypeScript

### 4. **Utils** (`/utils`)
- **Mục đích**: Pure utility functions
- **Ví dụ**: `ValidationUtils`
  - Field name validation
  - Sanitization
  - Format checking

**Lợi ích**:
- Stateless, dễ test
- Có thể dùng ở bất kỳ đâu
- Performance tốt

### 5. **Data** (`/data`)
- **Mục đích**: Static data và initial states
- **Nội dung**: Initial schema, sample data

**Lợi ích**:
- Tách biệt data khỏi logic
- Dễ thay đổi test data
- Có thể load từ API sau

## Ví Dụ Sử Dụng

### Trước (Component phức tạp):
```tsx
function SidebarField({ nodeId, field }) {
  const dispatch = useAppDispatch();
  const edges = useAppSelector(state => state.schema.edges);
  const nodes = useAppSelector(state => state.schema.nodes);
  
  // Lots of logic here...
  const targetNode = useMemo(() => {
    let targetNodeId = null;
    if (field.isVirtual) {
      const edge = edges.find(e => e.source === nodeId && e.sourceHandle === field.name);
      if (edge) targetNodeId = edge.target;
    }
    return nodes.find(n => n.id === targetNodeId);
  }, [field, edges, nodes, nodeId]);
  
  const handleUpdate = (updates) => {
    dispatch(updateField({ nodeId, fieldIndex, updates }));
  };
  
  // More logic...
}
```

### Sau (Component gọn gàng):
```tsx
function SidebarField({ nodeId, field, index }) {
  const { updateField } = useFieldOperations(nodeId);
  const { targetNode } = useLinkedNode(nodeId, field);
  
  // Clean and focused on UI
}
```

## Quy Tắc Phát Triển

### 1. **Business Logic → Services**
- Mọi logic phức tạp phải nằm trong Services
- Services phải là pure functions hoặc static methods
- Không import React hooks trong Services

### 2. **State Logic → Custom Hooks**
- Logic cần access Redux/React state → Custom hooks
- Hooks có thể sử dụng Services
- Một hook một mục đích rõ ràng

### 3. **Constants → /constants**
- Không hardcode values trong components
- Sử dụng constants với type-safe

### 4. **Validation → Utils**
- Validation logic tách riêng
- Có thể test độc lập
- Trả về object với `{ valid, error }`

## Lợi Ích

### ✅ **Dễ Mở Rộng**
- Thêm feature mới không ảnh hưởng code cũ
- Clear separation of concerns
- Modular architecture

### ✅ **Dễ Bảo Trì**
- Logic tập trung, dễ tìm
- Ít duplicate code
- Single responsibility principle

### ✅ **Dễ Test**
- Services và Utils dễ unit test
- Hooks có thể test với React Testing Library
- Mock dependencies dễ dàng

### ✅ **Performance**
- Memoization tốt hơn
- Ít re-render không cần thiết
- Code splitting dễ dàng

### ✅ **Developer Experience**
- Type-safe với TypeScript
- IntelliSense tốt
- Code navigation dễ dàng

## Next Steps

1. **Refactor schemaSlice.ts**
   - Tách thành nhiều slices nhỏ hơn
   - Sử dụng Services trong reducers

2. **Add Unit Tests**
   - Test Services
   - Test Hooks
   - Test Utils

3. **Add Error Handling**
   - Centralized error handling
   - User-friendly error messages

4. **Add Logging**
   - Development logging
   - Production error tracking

5. **Performance Optimization**
   - Memoization strategies
   - Virtual scrolling for large lists
   - Code splitting
