/**
 * Core types for pedigree data model
 * Strict biological filiation rules enforced at type level
 */

export interface PedigreeSubject {
    id: string;
    name: string;
    sex: 'M' | 'F';
    generation: number;
    fatherId?: string;
    motherId?: string;

    // Optional display fields
    photoUrl?: string;
    tagId?: string;
    breed?: string;
    birthDate?: string;
}

export interface PedigreeData {
    subjects: PedigreeSubject[];
    rootSubjectId: string;
}

/**
 * Layout computation results
 */
export interface LayoutNode extends PedigreeSubject {
    x: number;  // Calculated position
    y: number;
}

export interface LayoutEdge {
    from: string;  // parent ID
    to: string;    // child ID
    path: string;  // SVG path definition
}

export interface LayoutResult {
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
    nodeWidth: number;
    nodeHeight: number;
    generationGap: number;  // Horizontal spacing between generations
    siblingGap: number;     // Vertical spacing between siblings
    direction: 'horizontal' | 'vertical';
}

/**
 * Zoom/Pan state
 */
export interface ViewportTransform {
    x: number;
    y: number;
    scale: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
