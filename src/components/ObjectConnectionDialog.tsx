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
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ObjectConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceNodeId: string;
  sourceFieldName: string;
  targetNode: { id: string; data: TableNodeData };
  onConfirm: (fieldName: string, selectedFieldNames: string[]) => void;
}

export function ObjectConnectionDialog({
  open,
  onOpenChange,
  sourceNodeId,
  sourceFieldName,
  targetNode,
  onConfirm,
}: ObjectConnectionDialogProps) {
  const [fieldName, setFieldName] = useState('');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  const toggleField = (fieldName: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (fieldName.trim() && selectedFields.size > 0) {
      onConfirm(fieldName.trim(), Array.from(selectedFields));
      // Reset form
      setFieldName('');
      setSelectedFields(new Set());
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFieldName('');
    setSelectedFields(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo Object Connection</DialogTitle>
          <DialogDescription>
            Chọn các trường trong bảng <strong>{targetNode.data.label}</strong> làm khóa chính và đặt tên cho field mới
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
            />
          </div>

          {/* Select fields for PK */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Chọn các trường làm Khóa Chính (PK)
            </label>
            <div className="border rounded-md max-h-64 overflow-y-auto">
              {targetNode.data.columns
                .filter((col) => col.visible !== false)
                .map((column, index) => (
                  <button
                    key={index}
                    onClick={() => toggleField(column.name)}
                    className={cn(
                      'w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between transition-colors',
                      selectedFields.has(column.name) && 'bg-blue-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{column.name}</span>
                      <span className="text-gray-500 text-xs">{column.type}</span>
                      {column.isPrimaryKey && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                          PK
                        </span>
                      )}
                    </div>
                    {selectedFields.has(column.name) && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
            </div>
            {targetNode.data.columns.filter((col) => col.visible !== false).length === 0 && (
              <div className="text-center text-gray-500 py-4 text-sm">
                Không có field nào trong bảng này
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">Thông tin:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Field <strong>{sourceFieldName}</strong> từ bảng nguồn sẽ là Foreign Key (FK)</li>
              <li>Field mới <strong>{fieldName || '...'}</strong> sẽ chứa các trường được chọn làm Composite Primary Key</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!fieldName.trim() || selectedFields.size === 0}
            >
              Tạo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

