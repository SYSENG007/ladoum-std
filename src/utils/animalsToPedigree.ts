import type { Animal } from '../types';
import type { PedigreeData, PedigreeSubject } from '../types/pedigree';

/**
 * Convert Animal data structure to PedigreeSubject format
 * Traverses family tree BIDIRECTIONALLY:
 * - Ancestors (positive generations: +1, +2, ...)
 * - Subject (generation 0)
 * - Descendants (negative generations: -1, -2, ...)
 */
export function convertAnimalsToPedigree(
    rootAnimal: Animal,
    allAnimals: Animal[]
): PedigreeData {
    const visited = new Set<string>();
    const subjects: PedigreeSubject[] = [];
    const animalMap = new Map(allAnimals.map(a => [a.id, a]));

    // Build reverse lookup: parentId -> childIds
    const childrenMap = new Map<string, string[]>();
    allAnimals.forEach(animal => {
        if (animal.sireId) {
            if (!childrenMap.has(animal.sireId)) {
                childrenMap.set(animal.sireId, []);
            }
            childrenMap.get(animal.sireId)!.push(animal.id);
        }
        if (animal.damId) {
            if (!childrenMap.has(animal.damId)) {
                childrenMap.set(animal.damId, []);
            }
            childrenMap.get(animal.damId)!.push(animal.id);
        }
    });

    function addSubject(animal: Animal, generation: number) {
        if (visited.has(animal.id)) return;
        visited.add(animal.id);

        const subject: PedigreeSubject = {
            id: animal.id,
            name: animal.name,
            sex: animal.gender === 'Male' ? 'M' : 'F',
            generation,
            fatherId: animal.sireId,
            motherId: animal.damId,
            photoUrl: animal.photoUrl,
            tagId: animal.tagId,
            birthDate: animal.birthDate,
        };

        subjects.push(subject);
    }

    // Traverse ancestors (positive generations)
    function traverseAncestors(animal: Animal, generation: number) {
        addSubject(animal, generation);

        if (animal.sireId) {
            const father = animalMap.get(animal.sireId);
            if (father) {
                traverseAncestors(father, generation + 1);
            }
        }

        if (animal.damId) {
            const mother = animalMap.get(animal.damId);
            if (mother) {
                traverseAncestors(mother, generation + 1);
            }
        }
    }

    // Traverse descendants (negative generations)
    function traverseDescendants(animalId: string, generation: number) {
        const childIds = childrenMap.get(animalId) || [];

        childIds.forEach(childId => {
            const child = animalMap.get(childId);
            if (child && !visited.has(childId)) {
                addSubject(child, generation);
                traverseDescendants(childId, generation - 1);
            }
        });
    }

    // Start with root animal at generation 0
    traverseAncestors(rootAnimal, 0);

    // Then traverse descendants (generation -1, -2, ...)
    traverseDescendants(rootAnimal.id, -1);

    return {
        subjects,
        rootSubjectId: rootAnimal.id,
    };
}
