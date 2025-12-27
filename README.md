# ERD Diagram Builder

Ứng dụng xây dựng sơ đồ ERD (Entity Relationship Diagram) sử dụng React Flow, React, Vite, TypeScript và shadcn/ui.

## Tính năng

- ✅ Tạo và quản lý các bảng (tables) trong sơ đồ ERD
- ✅ Thêm các cột với kiểu dữ liệu
- ✅ Đánh dấu Primary Key (PK) và Foreign Key (FK)
- ✅ Kết nối các bảng với nhau bằng cách kéo thả
- ✅ Xóa bảng đã chọn
- ✅ Giao diện đẹp với shadcn/ui components
- ✅ MiniMap và Controls để điều hướng

## Cài đặt

```bash
# Cài đặt dependencies
pnpm install
```

## Chạy dự án

```bash
# Chạy dev server
pnpm dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## Cách sử dụng

1. **Thêm bảng mới**: Click nút "Thêm Bảng" ở thanh toolbar
2. **Nhập thông tin bảng**:
   - Tên bảng
   - Các cột với tên và kiểu dữ liệu
   - Đánh dấu PK (Primary Key) hoặc FK (Foreign Key) nếu cần
3. **Kết nối các bảng**: Kéo từ handle bên phải của một cột đến handle bên trái của cột khác
4. **Di chuyển bảng**: Click và kéo bảng để di chuyển
5. **Xóa bảng**: Chọn bảng và click nút "Xóa Bảng"

## Công nghệ sử dụng

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Flow** - Flow diagram library
- **shadcn/ui** - UI components (Button, Dialog, Input)
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Cấu trúc dự án

```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   └── TableNode.tsx # Component hiển thị bảng
├── lib/
│   └── utils.ts     # Utility functions
├── App.tsx          # Component chính
├── main.tsx         # Entry point
└── index.css        # Global styles
```
