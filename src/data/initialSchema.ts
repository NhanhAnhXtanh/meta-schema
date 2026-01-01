/**
 * Initial Schema Data
 * Sample data for development and testing
 */

import { Node } from '@xyflow/react';
import { TableNodeData } from '@/types/schema';
import { TABLE_COLORS } from '@/constants';

export const initialNodes: Node<TableNodeData>[] = [
    {
        id: '1',
        type: 'table',
        position: { x: 0, y: 0 },
        data: {
            tableName: 'products',
            label: 'Products',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'description', type: 'varchar', visible: true },
                { name: 'price', type: 'money', visible: true },
                { name: 'quantity', type: 'int4', visible: true },
            ],
            color: TABLE_COLORS[0],
        },
    },
    {
        id: '2',
        type: 'table',
        position: { x: 400, y: -150 },
        data: {
            tableName: 'warehouses',
            label: 'Warehouses',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'address', type: 'varchar', visible: true },
                { name: 'capacity', type: 'int4', visible: true },
            ],
            color: TABLE_COLORS[1],
        },
    },
    {
        id: '3',
        type: 'table',
        position: { x: 400, y: 100 },
        data: {
            tableName: 'suppliers',
            label: 'Suppliers',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'contact', type: 'varchar', visible: true },
                { name: 'country', type: 'varchar', visible: true },
            ],
            color: TABLE_COLORS[2],
        },
    },
    {
        id: '4',
        type: 'table',
        position: { x: 800, y: -200 },
        data: {
            tableName: 'categories',
            label: 'Categories',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'description', type: 'text', visible: true },
            ],
            color: TABLE_COLORS[3],
        },
    },
    {
        id: '5',
        type: 'table',
        position: { x: 800, y: -50 },
        data: {
            tableName: 'orders',
            label: 'Orders',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'order_date', type: 'timestamp', visible: true },
                { name: 'total_amount', type: 'money', visible: true },
                { name: 'status', type: 'varchar', visible: true },
            ],
            color: TABLE_COLORS[4],
        },
    },
    {
        id: '6',
        type: 'table',
        position: { x: 800, y: 150 },
        data: {
            tableName: 'customers',
            label: 'Customers',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'name', type: 'varchar', visible: true },
                { name: 'email', type: 'varchar', visible: true },
                { name: 'phone', type: 'varchar', visible: true },
            ],
            color: TABLE_COLORS[5],
        },
    },
    {
        id: '7',
        type: 'table',
        position: { x: 400, y: 350 },
        data: {
            tableName: 'reviews',
            label: 'Reviews',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'rating', type: 'int', visible: true },
                { name: 'comment', type: 'text', visible: true },
                { name: 'created_at', type: 'timestamp', visible: true },
            ],
            color: TABLE_COLORS[0],
        },
    },
    {
        id: '8',
        type: 'table',
        position: { x: 800, y: 350 },
        data: {
            tableName: 'inventory',
            label: 'Inventory',
            columns: [
                { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true },
                { name: 'stock_quantity', type: 'int', visible: true },
                { name: 'last_updated', type: 'timestamp', visible: true },
            ],
            color: TABLE_COLORS[1],
        },
    },
];
