import type { PedigreeData, PedigreeSubject, ValidationResult } from '../types/pedigree';

/**
 * Validates pedigree data against strict biological filiation rules
 */
export function validatePedigree(data: PedigreeData): ValidationResult {
    const errors: string[] = [];
    const { subjects, rootSubjectId } = data;

    // Check root exists
    const root = subjects.find(s => s.id === rootSubjectId);
    if (!root) {
        errors.push(`Root subject ${rootSubjectId} not found in subjects`);
        return { valid: false, errors };
    }

    // Build lookup map
    const subjectMap = new Map<string, PedigreeSubject>();
    subjects.forEach(s => subjectMap.set(s.id, s));

    // Validate each subject
    subjects.forEach(subject => {
        // Check father if present
        if (subject.fatherId) {
            const father = subjectMap.get(subject.fatherId);
            if (!father) {
                errors.push(`Subject ${subject.name}: father ${subject.fatherId} not found`);
            } else {
                // Father must be male
                if (father.sex !== 'M') {
                    errors.push(`Subject ${subject.name}: father ${father.name} must be male`);
                }
                // Father must be next generation
                if (father.generation !== subject.generation + 1) {
                    errors.push(`Subject ${subject.name}: father ${father.name} must be at generation ${subject.generation + 1}, found ${father.generation}`);
                }
            }
        }

        // Check mother if present
        if (subject.motherId) {
            const mother = subjectMap.get(subject.motherId);
            if (!mother) {
                errors.push(`Subject ${subject.name}: mother ${subject.motherId} not found`);
            } else {
                // Mother must be female
                if (mother.sex !== 'F') {
                    errors.push(`Subject ${subject.name}: mother ${mother.name} must be female`);
                }
                // Mother must be next generation
                if (mother.generation !== subject.generation + 1) {
                    errors.push(`Subject ${subject.name}: mother ${mother.name} must be at generation ${subject.generation + 1}, found ${mother.generation}`);
                }
            }
        }
    });

    // Check for cycles (shouldn't happen if generation rules are respected, but safety check)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function hasCycle(subjectId: string): boolean {
        if (recursionStack.has(subjectId)) return true;
        if (visited.has(subjectId)) return false;

        visited.add(subjectId);
        recursionStack.add(subjectId);

        const subject = subjectMap.get(subjectId);
        if (subject) {
            if (subject.fatherId && hasCycle(subject.fatherId)) return true;
            if (subject.motherId && hasCycle(subject.motherId)) return true;
        }

        recursionStack.delete(subjectId);
        return false;
    }

    if (hasCycle(rootSubjectId)) {
        errors.push('Cyclic relationship detected in pedigree');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Get all ancestors of a subject recursively
 */
export function getAncestors(
    subjectId: string,
    subjects: PedigreeSubject[]
): PedigreeSubject[] {
    const subjectMap = new Map(subjects.map(s => [s.id, s]));
    const ancestors: PedigreeSubject[] = [];
    const visited = new Set<string>();

    function traverse(id: string) {
        if (visited.has(id)) return;
        visited.add(id);

        const subject = subjectMap.get(id);
        if (!subject) return;

        if (subject.fatherId) {
            const father = subjectMap.get(subject.fatherId);
            if (father) {
                ancestors.push(father);
                traverse(father.id);
            }
        }

        if (subject.motherId) {
            const mother = subjectMap.get(subject.motherId);
            if (mother) {
                ancestors.push(mother);
                traverse(mother.id);
            }
        }
    }

    traverse(subjectId);
    return ancestors;
}

/**
 * Group subjects by generation
 */
export function groupByGeneration(subjects: PedigreeSubject[]): Map<number, PedigreeSubject[]> {
    const groups = new Map<number, PedigreeSubject[]>();

    subjects.forEach(subject => {
        const gen = subject.generation;
        if (!groups.has(gen)) {
            groups.set(gen, []);
        }
        groups.get(gen)!.push(subject);
    });

    return groups;
}
