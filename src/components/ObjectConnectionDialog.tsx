import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { TableNodeData } from './TableNode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ObjectConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceNodeId: string;
  sourceFieldName: string;
  targetNode: { id: string; data: TableNodeData };
  sourceNode?: { id: string; data: TableNodeData }; // Cần khi kéo ngược lại để validate tên field và chọn PK
  onConfirm: (fieldName: string, primaryKeyFieldName: string) => void;
  isReverse?: boolean; // true nếu kéo từ object-target đến field (ngược lại)
}

export function ObjectConnectionDialog({
  open,
  onOpenChange,
  sourceNodeId,
  sourceFieldName,
  targetNode,
  sourceNode,
  onConfirm,
  isReverse = false,
}: ObjectConnectionDialogProps) {
  const [fieldName, setFieldName] = useState('');
  const [selectedPrimaryKeyField, setSelectedPrimaryKeyField] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Khi kéo ngược lại: đáy bảng chứa PK, nên chọn PK từ bảng chứa đáy bảng (sourceNode)
  // Khi kéo bình thường: đáy bảng chứa PK, nên chọn PK từ bảng chứa đáy bảng (targetNode)
  const pkNode = isReverse && sourceNode ? sourceNode : targetNode;
  const availableFields = pkNode.data.columns.filter((col) => col.visible !== false);
  
  // Kiểm tra tên field có trùng không
  // Field mới luôn được tạo trong bảng chứa PK (đáy bảng)
  const isFieldNameDuplicate = (name: string) => {
    if (!name.trim()) return false;
    return availableFields.some((field) => field.name.toLowerCase() === name.toLowerCase().trim());
  };
  
  const fieldNameError = fieldName.trim() && isFieldNameDuplicate(fieldName) 
    ? 'Tên field này đã tồn tại trong bảng' 
    : '';

  const handleConfirm = () => {
    if (fieldName.trim() && selectedPrimaryKeyField) {
      onConfirm(fieldName.trim(), selectedPrimaryKeyField);
      // Reset form
      setFieldName('');
      setSelectedPrimaryKeyField('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFieldName('');
    setSelectedPrimaryKeyField('');
    onOpenChange(false);
  };

  const selectedField = availableFields.find((f) => f.name === selectedPrimaryKeyField);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo Object Connection</DialogTitle>
          <DialogDescription>
            Chọn trường trong bảng <strong>{pkNode.data.label}</strong> (bảng chứa đáy bảng) làm khóa chính và đặt tên cho field mới
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Field name input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Tên Field Mới
            </label>
            <Input
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Ví dụ: product_info"
              autoFocus
              className={cn(fieldNameError && 'border-red-500')}
            />
            {fieldNameError && (
              <p className="text-xs text-red-500 mt-1">{fieldNameError}</p>
            )}
          </div>

          {/* Select field for PK - Dropdown */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Chọn trường làm Khóa Chính (PK)
            </label>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-between',
                    !selectedPrimaryKeyField && 'text-muted-foreground'
                  )}
                >
                  {selectedField ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedField.name}</span>
                      <span className="text-gray-500 text-xs">({selectedField.type})</span>
                      {selectedField.isPrimaryKey && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                          PK
                        </span>
                      )}
                    </div>
                  ) : (
                    'Chọn trường...'
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full max-h-64 overflow-y-auto">
                {availableFields.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    Không có field nào trong bảng này
                  </div>
                ) : (
                  availableFields.map((column, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => {
                        setSelectedPrimaryKeyField(column.name);
                        setDropdownOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{column.name}</span>
                        <span className="text-gray-500 text-xs">({column.type})</span>
                        {column.isPrimaryKey && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                            PK
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Thông tin:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Đáy bảng <strong>{pkNode.data.label}</strong> chứa Primary Key (PK): <strong>{selectedPrimaryKeyField || '...'}</strong></li>
              <li>Field được kéo/nối sẽ là Foreign Key (FK)</li>
              <li>Field mới <strong>{fieldName || '...'}</strong> sẽ được tạo trong bảng <strong>{pkNode.data.label}</strong> và tham chiếu đến <strong>{selectedPrimaryKeyField || '...'}</strong></li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!fieldName.trim() || !selectedPrimaryKeyField || isFieldNameDuplicate(fieldName)}
            >
              Tạo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

