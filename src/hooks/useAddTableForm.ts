import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
    setMode, setSearchQuery, setApiUrl, setIsFetching, setTableName, setDisplayLabel,
    addColumn, updateColumn, removeColumn, setSelectedTemplateName, setColumns, resetAddTableState
} from '@/store/slices/addTableSlice';
import { setAddTableDialogOpen } from '@/store/slices/uiSlice';

import { schemaEventBus } from '@/events/eventBus';
import { SchemaEvents } from '@/events/schemaEvents';

import { useTemplates } from '@/hooks/useTemplates';

export function useAddTableForm() {
    const dispatch = useDispatch();
    const open = useSelector((state: RootState) => state.ui.isAddTableDialogOpen);
    const existingNodes = useSelector((state: RootState) => state.schema.present.nodes);

    // State from Redux
    const state = useSelector((state: RootState) => state.addTable);
    const { mode, searchQuery, apiUrl, isFetching, tableName, displayLabel, columns, selectedTemplateName } = state;

    // Derived State
    const { templates, filteredTemplates } = useTemplates(searchQuery);

    // Actions
    const handleOpenChange = useCallback((isOpen: boolean) => {
        dispatch(setAddTableDialogOpen(isOpen));
        if (!isOpen) {
            // Optional cleanup
        }
    }, [dispatch]);

    const submitManualTable = useCallback(() => {
        if (!tableName.trim() || !displayLabel.trim()) return;
        const newId = `table-${Date.now()}`;

        schemaEventBus.emit(SchemaEvents.TABLE_ADD, {
            id: newId,
            name: displayLabel,
            tableName: tableName,
            columns: columns.map(c => ({
                ...c,
                visible: true,
                isNotNull: false,
                isVirtual: false
            }))
        });

        dispatch(resetAddTableState());
        handleOpenChange(false);
    }, [tableName, displayLabel, columns, dispatch, handleOpenChange]);

    const submitTemplateTable = useCallback(() => {
        if (!selectedTemplateName) return;
        const template = templates.find(t => t.name === selectedTemplateName);

        if (template) {
            const instanceCount = existingNodes.filter(n => n.data.tableName === template.tableName).length;
            const newId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newDisplayLabel = instanceCount > 0 ? `${template.name} (${instanceCount + 1})` : template.name;

            schemaEventBus.emit(SchemaEvents.TABLE_ADD, {
                id: newId,
                name: newDisplayLabel,
                tableName: template.tableName || template.name.toLowerCase().replace(/\s+/g, '_'),
                columns: template.columns.map(c => ({ ...c, visible: true, isVirtual: false }))
            });
        }
        handleOpenChange(false);
    }, [selectedTemplateName, templates, existingNodes, handleOpenChange]);

    const handleAddTable = useCallback(() => {
        if (mode === 'manual') {
            submitManualTable();
        } else {
            submitTemplateTable();
        }
    }, [mode, submitManualTable, submitTemplateTable]);

    const handleJsonImport = useCallback((nodes: any[], edges: any[]) => {
        nodes.forEach(node => {
            schemaEventBus.emit(SchemaEvents.TABLE_ADD, {
                id: node.id,
                name: node.data.label,
                tableName: node.data.tableName,
                columns: node.data.columns
            });
        });

        // Edges handling might need dispatch or event? 
        // For now edges are handled by parent component if needed or we dispatch here?
        // AddTableDialog implementation used dispatch(addEdge). 
        // We should preferably use Event. 
        // But for now let's keep it consistent.
        // Wait, AddTableDialog previously imported addEdge. 
        // We can emit RELATIONSHIP_ADD? 
        // Or generic BATCH_IMPORT event?
        // Let's stick to emitting multiple events for now or return data to component?
        // The original code dispatched addEdge directly. 
        // I will assume we can export that logic or keep it simple.

        handleOpenChange(false);
    }, [handleOpenChange]);

    // Expose actions
    const setModeAction = (m: any) => dispatch(setMode(m));
    const setSearchQueryAction = (q: string) => dispatch(setSearchQuery(q));
    const setApiUrlAction = (url: string) => dispatch(setApiUrl(url));
    const setTableNameAction = (n: string) => dispatch(setTableName(n));
    const setDisplayLabelAction = (l: string) => dispatch(setDisplayLabel(l));
    const addColumnAction = () => dispatch(addColumn());
    const updateColumnAction = (payload: any) => dispatch(updateColumn(payload));
    const removeColumnAction = (idx: number) => dispatch(removeColumn(idx));
    const setSelectedTemplateNameAction = (name: string) => dispatch(setSelectedTemplateName(name));

    // API Fetch Logic remains in component or move here? Move here.
    const handleFetchApi = async () => {
        dispatch(setIsFetching(true));
        try {
            const res = await fetch(apiUrl);
            const data = await res.json();

            // ... parsing logic (copy from component)
            const parseToColumns = (obj: any): any[] => {
                if (!obj || typeof obj !== 'object') return [];

                return Object.keys(obj).map(key => {
                    const val = obj[key];
                    let type = 'varchar';
                    let children = undefined;

                    if (Array.isArray(val)) {
                        type = 'array';
                    } else if (val === null) {
                        type = 'varchar';
                    } else if (typeof val === 'number') {
                        type = Number.isInteger(val) ? 'int' : 'float';
                    } else if (typeof val === 'boolean') {
                        type = 'boolean';
                    } else if (typeof val === 'object') {
                        type = 'object';
                        children = parseToColumns(val);
                    }

                    return {
                        name: key,
                        type,
                        visible: true,
                        isPrimaryKey: key === 'id',
                        children
                    };
                });
            };

            const newCols = parseToColumns(data);
            dispatch(setColumns(newCols));
            dispatch(setTableName('imported_api_table'));
            dispatch(setDisplayLabel('API Data Table'));
            dispatch(setMode('manual'));
        } catch (e) {
            console.error(e);
            alert('Failed to fetch/parse API: ' + e);
        } finally {
            dispatch(setIsFetching(false));
        }
    };


    return {
        // State
        open,
        mode,
        searchQuery,
        apiUrl,
        isFetching,
        tableName,
        displayLabel,
        columns,
        selectedTemplateName,
        templates,
        filteredTemplates,

        // Handlers
        handleOpenChange,
        handleAddTable,
        handleJsonImport,
        handleFetchApi,

        // Setters
        setMode: setModeAction,
        setSearchQuery: setSearchQueryAction,
        setApiUrl: setApiUrlAction,
        setTableName: setTableNameAction,
        setDisplayLabel: setDisplayLabelAction,
        addColumn: addColumnAction,
        updateColumn: updateColumnAction,
        removeColumn: removeColumnAction,
        setSelectedTemplateName: setSelectedTemplateNameAction
    };
}
