import React, { useRef } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import type { Animal } from '../../types';
import { Mars, Venus, Award } from 'lucide-react';
import clsx from 'clsx';

interface FamilyTreeProps {
    rootAnimal: Animal;
    theme?: 'cyan' | 'green' | 'orange' | 'white';
}

interface AnimalNodeProps {
    animal: Animal | null | undefined;
    generation: number;
}

const AnimalNode: React.FC<AnimalNodeProps> = ({ animal, generation }) => {
    if (!animal) {
        return (
            <div className="w-40 h-32 rounded-xl border-2 border-dashed border-slate-200 bg-white/50 flex flex-col items-center justify-center text-slate-300">
                <div className="text-xs font-medium">Inconnu</div>
                <div className="text-[10px] text-slate-400 mt-1">Génération {generation}</div>
            </div>
        );
    }

    const isMale = animal.gender === 'Male';
    const bgColor = isMale ? 'bg-blue-50' : 'bg-pink-50';
    const borderColor = isMale ? 'border-blue-200' : 'border-pink-200';

    return (
        <div className={clsx(
            "w-40 h-32 rounded-xl border-2 transition-all duration-200",
            "hover:shadow-lg hover:scale-105 cursor-pointer",
            bgColor, borderColor,
            generation === 0 && "ring-2 ring-primary-400 ring-offset-2"
        )}>
            {/* Photo */}
            <div className="relative h-16">
                <img
                    src={animal.photoUrl}
                    alt={animal.name}
                    className="w-full h-full object-cover rounded-t-lg"
                />
                <div className={clsx(
                    "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center",
                    isMale ? "bg-blue-500" : "bg-pink-500"
                )}>
                    {isMale ? <Mars className="w-3 h-3 text-white" /> : <Venus className="w-3 h-3 text-white" />}
                </div>
                {animal.certification && (
                    <div className="absolute top-1 left-1 bg-amber-500 text-white p-0.5 rounded">
                        <Award className="w-2.5 h-2.5" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-2 space-y-0.5">
                <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">{animal.name}</h4>
                <p className="text-[9px] text-slate-500">{animal.tagId}</p>

                <div className="flex items-center gap-2 text-[9px] text-slate-600">
                    {animal.weight && <span>{animal.weight}kg</span>}
                    {animal.height && <span>•</span>}
                    {animal.height && <span>{animal.height}cm</span>}
                </div>
            </div>
        </div>
    );
};

// Pair component with elbow connectors
const AnimalPair: React.FC<{
    animal1: Animal | null | undefined;
    animal2: Animal | null | undefined;
    generation: number;
}> = ({ animal1, animal2, generation }) => {
    return (
        <div className="relative">
            <div className="flex flex-col gap-3">
                <AnimalNode animal={animal1} generation={generation} />
                <AnimalNode animal={animal2} generation={generation} />
            </div>
        </div>
    );
};

// Connector section between generations
const ElbowConnector: React.FC<{ pairs: number }> = ({ pairs }) => {
    return (
        <div className="relative flex items-center" style={{ width: '80px' }}>
            <svg width="80" height={pairs * 280} className="overflow-visible">
                {Array.from({ length: pairs }).map((_, pairIndex) => {
                    const pairY = pairIndex * 280 + 140; // Center of each pair
                    const nextY = Math.floor(pairIndex / 2) * 560 + 280; // Center of next generation pair

                    return (
                        <g key={pairIndex}>
                            {/* Horizontal line from left */}
                            <line x1="0" y1={pairY} x2="40" y2={pairY} stroke="#94a3b8" strokeWidth="2" />
                            {/* Vertical line */}
                            <line x1="40" y1={pairY} x2="40" y2={nextY} stroke="#94a3b8" strokeWidth="2" />
                            {/* Horizontal line to right */}
                            <line x1="40" y1={nextY} x2="80" y2={nextY} stroke="#94a3b8" strokeWidth="2" />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const FamilyTree: React.FC<FamilyTreeProps> = ({ rootAnimal, theme = 'green' }) => {
    const { animals } = useAnimals();
    const treeRef = useRef<HTMLDivElement>(null);

    // Get ancestors
    const father = rootAnimal.sireId ? animals.find(a => a.id === rootAnimal.sireId) : null;
    const mother = rootAnimal.damId ? animals.find(a => a.id === rootAnimal.damId) : null;

    const paternalGrandfather = father?.sireId ? (animals.find(a => a.id === father.sireId) || null) : null;
    const paternalGrandmother = father?.damId ? (animals.find(a => a.id === father.damId) || null) : null;

    const maternalGrandfather = mother?.sireId ? (animals.find(a => a.id === mother.sireId) || null) : null;
    const maternalGrandmother = mother?.damId ? (animals.find(a => a.id === mother.damId) || null) : null;

    const paternalGGF_P = paternalGrandfather?.sireId ? (animals.find(a => a.id === paternalGrandfather.sireId) || null) : null;
    const paternalGGM_P = paternalGrandfather?.damId ? (animals.find(a => a.id === paternalGrandfather.damId) || null) : null;
    const paternalGGF_M = paternalGrandmother?.sireId ? (animals.find(a => a.id === paternalGrandmother.sireId) || null) : null;
    const paternalGGM_M = paternalGrandmother?.damId ? (animals.find(a => a.id === paternalGrandmother.damId) || null) : null;

    const maternalGGF_P = maternalGrandfather?.sireId ? (animals.find(a => a.id === maternalGrandfather.sireId) || null) : null;
    const maternalGGM_P = maternalGrandfather?.damId ? (animals.find(a => a.id === maternalGrandfather.damId) || null) : null;
    const maternalGGF_M = maternalGrandmother?.sireId ? (animals.find(a => a.id === maternalGrandmother.sireId) || null) : null;
    const maternalGGM_M = maternalGrandmother?.damId ? (animals.find(a => a.id === maternalGrandmother.damId) || null) : null;

    const themeStyles = {
        cyan: 'bg-gradient-to-br from-cyan-50 to-blue-50',
        green: 'bg-gradient-to-br from-emerald-50 to-teal-50',
        orange: 'bg-gradient-to-br from-orange-50 to-amber-50',
        white: 'bg-white',
    };

    return (
        <div ref={treeRef} className={clsx("p-8 rounded-2xl overflow-auto", themeStyles[theme])}>
            <div className="inline-flex gap-0 min-w-max items-center">
                {/* Generation 3 - Great-Grandparents */}
                <div className="flex flex-col justify-center gap-8">
                    <div className="text-xs font-bold text-slate-500 text-center -mb-4">Arrière-Grands-Parents</div>
                    <AnimalPair animal1={paternalGGF_P} animal2={paternalGGM_P} generation={3} />
                    <AnimalPair animal1={paternalGGF_M} animal2={paternalGGM_M} generation={3} />
                    <AnimalPair animal1={maternalGGF_P} animal2={maternalGGM_P} generation={3} />
                    <AnimalPair animal1={maternalGGF_M} animal2={maternalGGM_M} generation={3} />
                </div>

                {/* Connectors Gen 3 to 2 */}
                <ElbowConnector pairs={4} />

                {/* Generation 2 - Grandparents */}
                <div className="flex flex-col justify-center gap-16">
                    <div className="text-xs font-bold text-slate-500 text-center -mb-12">Grands-Parents</div>
                    <AnimalPair animal1={paternalGrandfather} animal2={paternalGrandmother} generation={2} />
                    <AnimalPair animal1={maternalGrandfather} animal2={maternalGrandmother} generation={2} />
                </div>

                {/* Connectors Gen 2 to 1 */}
                <ElbowConnector pairs={2} />

                {/* Generation 1 - Parents */}
                <div className="flex flex-col justify-center">
                    <div className="text-xs font-bold text-slate-500 text-center -mb-8">Parents</div>
                    <AnimalPair animal1={father} animal2={mother} generation={1} />
                </div>

                {/* Connectors Gen 1 to 0 */}
                <div className="relative flex items-center" style={{ width: '80px' }}>
                    <svg width="80" height="280" className="overflow-visible">
                        {/* From father */}
                        <line x1="0" y1="76" x2="40" y2="76" stroke="#94a3b8" strokeWidth="2" />
                        <line x1="40" y1="76" x2="40" y2="140" stroke="#94a3b8" strokeWidth="2" />
                        {/* From mother */}
                        <line x1="0" y1="204" x2="40" y2="204" stroke="#94a3b8" strokeWidth="2" />
                        <line x1="40" y1="204" x2="40" y2="140" stroke="#94a3b8" strokeWidth="2" />
                        {/* To subject */}
                        <line x1="40" y1="140" x2="80" y2="140" stroke="#94a3b8" strokeWidth="2" />
                    </svg>
                </div>

                {/* Generation 0 - Subject */}
                <div className="flex flex-col justify-center">
                    <div className="text-xs font-bold text-primary-600 text-center mb-4">Sujet</div>
                    <AnimalNode animal={rootAnimal} generation={0} />
                </div>
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-50 border-2 border-blue-200"></div>
                    <span>Mâle</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-pink-50 border-2 border-pink-200"></div>
                    <span>Femelle</span>
                </div>
                <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Certifié</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-slate-400"></div>
                    <span>Lien de filiation</span>
                </div>
            </div>
        </div>
    );
};
