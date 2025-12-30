import { TableColumn } from '@/types/schema';

export interface MockTable {
    name: string;
    description?: string;
    columns: TableColumn[];
}

export const MOCK_DATABASE: MockTable[] = [
    {
        name: 'users',
        description: 'System users and authentication info',
        columns: [
            { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true, isNotNull: true },
            { name: 'email', type: 'varchar', visible: true, isNotNull: true },
            { name: 'password_hash', type: 'varchar', visible: true, isNotNull: true },
            { name: 'full_name', type: 'varchar', visible: true },
            { name: 'role', type: 'varchar', visible: true, isNotNull: true },
            { name: 'avatar_url', type: 'varchar', visible: true },
            { name: 'created_at', type: 'timestamp', visible: true, isNotNull: true },
            { name: 'last_login', type: 'timestamp', visible: true },
        ]
    },
    {
        name: 'posts',
        description: 'User blog posts or articles',
        columns: [
            { name: 'id', type: 'bigint', isPrimaryKey: true, visible: true, isNotNull: true },
            { name: 'user_id', type: 'uuid', isForeignKey: true, visible: true, isNotNull: true },
            { name: 'title', type: 'varchar', visible: true, isNotNull: true },
            { name: 'slug', type: 'varchar', visible: true, isNotNull: true },
            { name: 'content', type: 'text', visible: true },
            { name: 'is_published', type: 'boolean', visible: true, isNotNull: true },
            { name: 'created_at', type: 'timestamp', visible: true, isNotNull: true },
        ]
    },
    {
        name: 'comments',
        description: 'Comments on posts',
        columns: [
            { name: 'id', type: 'bigint', isPrimaryKey: true, visible: true, isNotNull: true },
            { name: 'post_id', type: 'bigint', isForeignKey: true, visible: true, isNotNull: true },
            { name: 'user_id', type: 'uuid', isForeignKey: true, visible: true, isNotNull: true },
            { name: 'content', type: 'text', visible: true, isNotNull: true },
            { name: 'created_at', type: 'timestamp', visible: true, isNotNull: true },
        ]
    },
    {
        name: 'audit_logs',
        description: 'System activity tracking',
        columns: [
            { name: 'id', type: 'uuid', isPrimaryKey: true, visible: true, isNotNull: true },
            { name: 'user_id', type: 'uuid', visible: true },
            { name: 'action', type: 'varchar', visible: true, isNotNull: true },
            { name: 'resource', type: 'varchar', visible: true },
            { name: 'ip_address', type: 'varchar', visible: true },
            { name: 'timestamp', type: 'timestamp', visible: true, isNotNull: true },
        ]
    },
    {
        name: 'settings',
        description: 'Global application settings',
        columns: [
            { name: 'key', type: 'varchar', isPrimaryKey: true, visible: true, isNotNull: true },
            { name: 'value', type: 'text', visible: true },
            { name: 'type', type: 'varchar', visible: true },
            { name: 'group', type: 'varchar', visible: true },
        ]
    }
];
