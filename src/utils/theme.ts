/**
 * Theme-aware utility classes for consistent styling across light and dark modes
 */

export const themeClasses = {
    /**
     * Input field styles (text inputs, selects, textareas)
     */
    input: 'bg-surface-input border-border-default text-text-primary placeholder:text-text-muted focus:ring-primary-500 focus:border-transparent',

    /**
     * Select dropdown styles
     */
    select: 'bg-surface-input border-border-default text-text-primary focus:ring-primary-500 focus:border-transparent',

    /**
     * Textarea styles
     */
    textarea: 'bg-surface-input border-border-default text-text-primary placeholder:text-text-muted focus:ring-primary-500 focus:border-transparent',

    /**
     * Modal/Dialog backgrounds
     */
    modal: 'bg-surface-modal border border-border-default',

    /**
     * Modal backdrop
     */
    backdrop: 'bg-black/50 dark:bg-black/70',

    /**
     * Card styles (for quick inline use)
     */
    card: 'bg-surface-card border border-border-subtle',

    /**
     * Text color utilities
     */
    text: {
        primary: 'text-text-primary',
        secondary: 'text-text-secondary',
        muted: 'text-text-muted',
        disabled: 'text-text-disabled',
    },

    /**
     * Border utilities
     */
    border: {
        default: 'border-border-default',
        subtle: 'border-border-subtle',
        bold: 'border-border-bold',
    },

    /**
     * Background utilities
     */
    bg: {
        primary: 'bg-bg-primary',
        secondary: 'bg-bg-secondary',
        elevated: 'bg-bg-elevated',
        muted: 'bg-bg-muted',
    },

    /**
     * Hover state backgrounds
     */
    hover: {
        card: 'hover:bg-surface-hover',
        overlay: 'hover:bg-overlay-hover',
    },
};
