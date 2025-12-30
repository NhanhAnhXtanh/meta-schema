/**
 * Application Constants
 * Centralized location for all application-wide constants
 */

// Color palette for table nodes
export const TABLE_COLORS = [
    '#22c55e', // Green
    '#a855f7', // Purple
    '#eab308', // Yellow
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#14b8a6', // Teal
] as const;

// Data types for fields
export const DATA_TYPES = {
    PRIMITIVE: [
        'varchar',
        'text',
        'int',
        'int4',
        'bigint',
        'decimal',
        'numeric',
        'money',
        'boolean',
        'uuid',
        'timestamp',
        'date',
        'time',
        'json',
        'jsonb'
    ],
    COMPLEX: ['array', 'object']
} as const;

// Relationship types
export const RELATIONSHIP_TYPES = {
    ONE_TO_MANY: '1-n',
    MANY_TO_ONE: 'n-1',
    ONE_TO_ONE: '1-1'
} as const;

// Field constraints
export const FIELD_CONSTRAINTS = {
    MAX_NAME_LENGTH: 63, // PostgreSQL identifier limit
    MIN_NAME_LENGTH: 1,
    RESERVED_NAMES: ['id', 'created_at', 'updated_at']
} as const;

// UI Constants
export const UI_CONSTANTS = {
    SIDEBAR_WIDTH: 320,
    MIN_SIDEBAR_WIDTH: 280,
    MAX_SIDEBAR_WIDTH: 600,
    FIELD_ROW_HEIGHT: 40,
    MAX_VISIBLE_FIELDS: 50
} as const;

// Validation Messages
export const VALIDATION_MESSAGES = {
    FIELD_NAME_REQUIRED: 'Tên trường không được để trống',
    FIELD_NAME_DUPLICATE: 'Tên trường đã tồn tại',
    FIELD_NAME_TOO_LONG: 'Tên trường quá dài (tối đa 63 ký tự)',
    FIELD_NAME_INVALID: 'Tên trường không hợp lệ (chỉ chứa chữ cái, số và dấu gạch dưới)',
    SOURCE_NODE_NOT_FOUND: 'Không tìm thấy bảng nguồn',
    TARGET_NODE_NOT_FOUND: 'Không tìm thấy bảng đích',
    SOURCE_KEY_NOT_FOUND: 'Không tìm thấy khóa nguồn',
    TARGET_KEY_NOT_FOUND: 'Không tìm thấy khóa đích',
    LINK_ALREADY_EXISTS: 'Liên kết đã tồn tại'
} as const;

// Event Names
export const CUSTOM_EVENTS = {
    ADD_FIELD: 'addField',
    DELETE_FIELD: 'deleteField',
    UPDATE_FIELD: 'updateField'
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
    SCHEMA_STATE: 'meta-schema-state',
    UI_PREFERENCES: 'meta-schema-ui-prefs',
    RECENT_SCHEMAS: 'meta-schema-recent'
} as const;
