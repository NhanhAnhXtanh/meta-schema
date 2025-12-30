export const THEME = {
    NODE: {
        HEADER_BG_DEFAULT: '#3b82f6', // blue-500
        BORDER_SELECTED: '#2563eb',   // blue-600
        BORDER_DEFAULT: '#d1d5db',    // gray-300
    },
    RELATIONSHIP: {
        COLORS: {
            ONE_TO_ONE: '#22c55e',  // green-500
            ONE_TO_MANY: '#3b82f6', // blue-500
            MANY_TO_ONE: '#a855f7', // purple-500
            DEFAULT: '#9ca3af',     // gray-400
            HOVER: '#3b82f6',       // blue-500
        },
        STROKE_WIDTH: {
            DEFAULT: 2,
            SELECTED: 3,
        }
    }
} as const;
