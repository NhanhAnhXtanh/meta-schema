import { useMemo } from 'react';
import { initialNodes } from '@/data/initialSchema';

export interface Template {
    id: string;
    name: string; // The display label
    tableName: string; // The db table name
    description?: string;
    columns: any[];
}

export function useTemplates(searchQuery: string = '') {
    const templates = useMemo<Template[]>(() => {
        return initialNodes.map(node => ({
            id: node.id,
            name: node.data.label,
            tableName: node.data.tableName,
            description: `Bảng mẫu với ${node.data.columns.length} cột`,
            columns: node.data.columns
        }));
    }, []);

    const filteredTemplates = useMemo(() => {
        if (!searchQuery) return templates;
        const lowerQuery = searchQuery.toLowerCase();
        return templates.filter(t =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.tableName.toLowerCase().includes(lowerQuery)
        );
    }, [templates, searchQuery]);

    return { templates, filteredTemplates };
}
