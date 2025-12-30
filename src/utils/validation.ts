/**
 * Validation Utilities
 * Centralized validation logic for schema operations
 */

import { FIELD_CONSTRAINTS, VALIDATION_MESSAGES } from '@/constants';

export class ValidationUtils {
    /**
     * Validates field name format
     */
    static validateFieldName(name: string): { valid: boolean; error?: string } {
        if (!name || name.trim().length === 0) {
            return { valid: false, error: VALIDATION_MESSAGES.FIELD_NAME_REQUIRED };
        }

        if (name.length > FIELD_CONSTRAINTS.MAX_NAME_LENGTH) {
            return { valid: false, error: VALIDATION_MESSAGES.FIELD_NAME_TOO_LONG };
        }

        // PostgreSQL identifier rules: start with letter or underscore, contain only letters, digits, underscores
        const validNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
        if (!validNamePattern.test(name)) {
            return { valid: false, error: VALIDATION_MESSAGES.FIELD_NAME_INVALID };
        }

        return { valid: true };
    }

    /**
     * Validates if a field name is reserved
     */
    static isReservedName(name: string): boolean {
        return FIELD_CONSTRAINTS.RESERVED_NAMES.includes(name.toLowerCase());
    }

    /**
     * Sanitizes field name
     */
    static sanitizeFieldName(name: string): string {
        return name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/^[0-9]/, '_$&')
            .substring(0, FIELD_CONSTRAINTS.MAX_NAME_LENGTH);
    }

    /**
     * Validates table name
     */
    static validateTableName(name: string): { valid: boolean; error?: string } {
        if (!name || name.trim().length === 0) {
            return { valid: false, error: 'Tên bảng không được để trống' };
        }

        if (name.length > FIELD_CONSTRAINTS.MAX_NAME_LENGTH) {
            return { valid: false, error: 'Tên bảng quá dài (tối đa 63 ký tự)' };
        }

        return { valid: true };
    }

    /**
     * Validates if two fields have compatible types for a relationship
     */
    private static readonly COMPATIBLE_TYPE_GROUPS = [
        ['integer', 'bigint', 'smallint', 'serial', 'bigserial', 'int8', 'int4', 'int2'], // Integer types
        ['varchar', 'text', 'char', 'character varying', 'string'],                       // String types
        ['uuid'],                                                                         // UUID types (Strictly separate from strings)
        ['decimal', 'numeric', 'real', 'double precision', 'float'],                      // Floating types
        ['timestamp', 'timestamptz', 'date', 'time'],                                     // Date types
        ['boolean', 'bool']                                                               // Boolean types
    ];

    /**
     * Validates if two fields have compatible types for a relationship
     */
    static validateRelationshipTypes(
        sourceType: string,
        targetType: string,
        sourceFieldName: string,
        targetFieldName: string
    ): { valid: boolean; error?: string } {
        const sType = sourceType.toLowerCase();
        const tType = targetType.toLowerCase();

        // 1. Strict Equality
        if (sType === tType) return { valid: true };

        // 2. Compatible Groups
        const isCompatible = this.COMPATIBLE_TYPE_GROUPS.some(group =>
            group.includes(sType) && group.includes(tType)
        );

        if (isCompatible) return { valid: true };

        // 3. Special Case: UUID vs String (Sometimes loose validation is preferred, but strict is safer. Let's keep strict + groups)
        // If not compatible
        return {
            valid: false,
            error: `Kiểu dữ liệu không khớp: ${sourceFieldName} (${sourceType}) ≠ ${targetFieldName} (${targetType})`
        };
    }
}
