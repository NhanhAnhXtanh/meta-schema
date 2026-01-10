/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Middleware } from "@reduxjs/toolkit";
import { eventReceived } from "../jmixSlice";
import {
  addTable,
  updateTable,
  deleteTable,
  addField,
  updateField,
  deleteField,
  reorderFields,
  toggleFieldVisibility,
  resetSchema,
  confirmLinkField,
  confirmLinkObject,
  setNodes,
} from "../../store/slices/schemaSlice";
import { sendToJmix } from "../jmixBus";
import { performAutoLayout } from "../../utils/autoLayout";
import { ActionCreators } from "redux-undo";
import type { RootState } from "../../store";

export const schemaMiddleware: Middleware<{}, RootState> = (store) => (next) => (action: any) => {
  if (action.type !== eventReceived.type) return next(action);

  const msg = action.payload;

  switch (msg.type) {
    case "SCHEMA_LOAD": {
      const payload = msg.payload ?? {};
      store.dispatch(resetSchema());

      // Store mapping from Jmix Original ID -> React Replica Node IDs
      const idMap: Record<string, string[]> = {};

      // Process Tables
      const processedIds: Record<string, number> = {};

      if (Array.isArray(payload.tables)) {
        payload.tables.forEach((table: any) => {
          const jmixId = table.id;
          let nodeId = table.id;

          // Check duplicate count to generate Replica ID
          if (processedIds[jmixId] === undefined) {
            processedIds[jmixId] = 0;
            nodeId = `node_${jmixId}`;
          } else {
            processedIds[jmixId]++;
            nodeId = `node_${jmixId}_replica_${processedIds[jmixId]}`;
          }

          // Map Logic
          if (jmixId) {
            if (!idMap[jmixId]) {
              idMap[jmixId] = [];
            }
            idMap[jmixId].push(nodeId);
          }

          store.dispatch(
            addTable({
              ...table,
              id: nodeId,
            })
          );
        });
      }

      // Load Relationships
      if (Array.isArray(payload.relationships)) {
        setTimeout(() => {
          payload.relationships.forEach((rel: any) => {
            const sourceNodeIds = idMap[rel.sourceNodeId] || [rel.sourceNodeId];
            const targetNodeIds = idMap[rel.targetNodeId] || [rel.targetNodeId];

            const sourceIdx = rel.sourceReplicaIndex || 0;
            const targetIdx = rel.targetReplicaIndex || 0;

            const sourceId = sourceNodeIds[sourceIdx];
            const targetId = targetNodeIds[targetIdx];

            if (sourceId && targetId) {
              const type = rel.type?.toLowerCase();

              if (type === "array") {
                store.dispatch(
                  confirmLinkField({
                    sourceNodeId: sourceId,
                    targetNodeId: targetId,
                    sourcePK: rel.sourceKey,
                    targetFK: rel.targetKey,
                    newFieldName: rel.fieldName,
                    relationshipType: rel.relationshipType,
                  })
                );
              } else if (type === "object") {
                store.dispatch(
                  confirmLinkObject({
                    sourceNodeId: sourceId,
                    targetNodeId: targetId,
                    sourceFK: rel.sourceKey,
                    targetPK: rel.targetKey,
                    newFieldName: rel.fieldName,
                    relationshipType: rel.relationshipType,
                  })
                );
              }
            }
          });
        }, 50);
      }

      // Auto Layout
      if (payload.autoLayout) {
        setTimeout(() => {
          const currentState = store.getState();
          const layoutedNodes = performAutoLayout(currentState.schema.present.nodes);
          store.dispatch(setNodes(layoutedNodes));
        }, 100);
      }

      // Send confirmation back
      sendToJmix("SCHEMA_LOADED", {}, msg.correlationId);
      break;
    }

    case "TABLE_ADD": {
      const p = msg.payload ?? {};
      store.dispatch(addTable(p));
      sendToJmix("TABLE_ADDED", { id: p.id || `table-${Date.now()}` }, msg.correlationId);
      break;
    }

    case "TABLE_UPDATE": {
      const p = msg.payload ?? {};
      if (p.id) {
        store.dispatch(updateTable({ id: p.id, updates: p.updates ?? {} }));
        sendToJmix("TABLE_UPDATED", { id: p.id }, msg.correlationId);
      }
      break;
    }

    case "TABLE_DELETE": {
      const p = msg.payload ?? {};
      if (p.id) {
        store.dispatch(deleteTable(p.id));
        sendToJmix("TABLE_DELETED", { id: p.id }, msg.correlationId);
      }
      break;
    }

    case "FIELD_ADD": {
      const p = msg.payload ?? {};
      if (p.nodeId && p.field) {
        store.dispatch(addField({ nodeId: p.nodeId, field: p.field }));
        sendToJmix("FIELD_ADDED", { nodeId: p.nodeId }, msg.correlationId);
      }
      break;
    }

    case "FIELD_UPDATE": {
      const p = msg.payload ?? {};
      if (p.nodeId && typeof p.fieldIndex === "number") {
        store.dispatch(
          updateField({
            nodeId: p.nodeId,
            fieldIndex: p.fieldIndex,
            updates: p.updates ?? {},
          })
        );
        sendToJmix("FIELD_UPDATED", { nodeId: p.nodeId, fieldIndex: p.fieldIndex }, msg.correlationId);
      }
      break;
    }

    case "FIELD_DELETE": {
      const p = msg.payload ?? {};
      if (p.nodeId && typeof p.fieldIndex === "number") {
        store.dispatch(deleteField({ nodeId: p.nodeId, fieldIndex: p.fieldIndex }));
        sendToJmix("FIELD_DELETED", { nodeId: p.nodeId, fieldIndex: p.fieldIndex }, msg.correlationId);
      }
      break;
    }

    case "FIELD_REORDER": {
      const p = msg.payload ?? {};
      if (p.nodeId && typeof p.oldIndex === "number" && typeof p.newIndex === "number") {
        store.dispatch(
          reorderFields({
            nodeId: p.nodeId,
            oldIndex: p.oldIndex,
            newIndex: p.newIndex,
          })
        );
        sendToJmix("FIELD_REORDERED", { nodeId: p.nodeId }, msg.correlationId);
      }
      break;
    }

    case "FIELD_TOGGLE_VISIBILITY": {
      const p = msg.payload ?? {};
      if (p.nodeId && typeof p.fieldIndex === "number") {
        store.dispatch(toggleFieldVisibility({ nodeId: p.nodeId, fieldIndex: p.fieldIndex }));
        sendToJmix("FIELD_VISIBILITY_TOGGLED", { nodeId: p.nodeId, fieldIndex: p.fieldIndex }, msg.correlationId);
      }
      break;
    }

    case "RELATIONSHIP_ADD": {
      const p = msg.payload ?? {};
      if (p.type === "1-n" || p.type === "array") {
        store.dispatch(
          confirmLinkField({
            sourceNodeId: p.sourceNodeId,
            targetNodeId: p.targetNodeId,
            sourcePK: p.sourceKey,
            targetFK: p.targetKey,
            newFieldName: p.fieldName,
            relationshipType: p.relationshipType,
          })
        );
      } else if (p.type === "object" || p.type === "n-1") {
        store.dispatch(
          confirmLinkObject({
            sourceNodeId: p.sourceNodeId,
            targetNodeId: p.targetNodeId,
            sourceFK: p.sourceKey,
            targetPK: p.targetKey,
            newFieldName: p.fieldName,
            relationshipType: p.relationshipType,
          })
        );
      }
      sendToJmix("RELATIONSHIP_ADDED", {}, msg.correlationId);
      break;
    }

    case "SCHEMA_UNDO": {
      store.dispatch(ActionCreators.undo());
      sendToJmix("SCHEMA_UNDONE", {}, msg.correlationId);
      break;
    }

    case "SCHEMA_REDO": {
      store.dispatch(ActionCreators.redo());
      sendToJmix("SCHEMA_REDONE", {}, msg.correlationId);
      break;
    }

    case "SCHEMA_AUTO_LAYOUT": {
      const currentState = store.getState();
      const layoutedNodes = performAutoLayout(currentState.schema.present.nodes);
      store.dispatch(setNodes(layoutedNodes));
      sendToJmix("SCHEMA_LAYOUT_APPLIED", {}, msg.correlationId);
      break;
    }

    default:
      break;
  }

  return next(action);
};

