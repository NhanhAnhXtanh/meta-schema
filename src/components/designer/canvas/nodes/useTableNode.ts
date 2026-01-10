import { SchemaEvents } from '@/events/schemaEvents';
import { schemaEventBus } from '@/events/eventBus';
import { TableNodeData } from '@/types/schema';
import { THEME } from '@/constants/theme';

export function useTableNode(id: string, data: TableNodeData) {
    const headerColor = data.color || THEME.NODE.HEADER_BG_DEFAULT;

    const handleAddField = () => {
        schemaEventBus.emit(SchemaEvents.LINK_FIELD_OPEN, { sourceNodeId: id });
    };

    return {
        headerColor,
        handleAddField
    };
}
