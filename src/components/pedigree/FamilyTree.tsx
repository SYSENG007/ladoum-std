import React, { useRef } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import type { Animal } from '../../types';
import { Mars, Venus, Award, Ruler, Weight, Calendar } from 'lucide-react';
import clsx from 'clsx';

interface FamilyTreeProps {
    rootAnimal: Animal;
    theme?: 'cyan' | 'green' | 'orange' | 'white';
}

interface AnimalNodeProps {
    animal: Animal | null | undefined;
    generation: number;
    position: 'center' | 'top' | 'bottom';
    theme: string;
}

const AnimalNode: React.FC<AnimalNodeProps> = ({ animal, generation }) => {
    if (!animal) {
        return (
            <div className="flex flex-col items-center">
                <div className={clsx(
                    "w-40 h-32 rounded-xl border-2 border-dashed border-slate-200 bg-white/50",
                    "flex flex-col items-center justify-center text-slate-300"
                )}>
                    <div className="text-xs font-medium">Inconnu</div>
                    <div className="text-[10px] text-slate-400 mt-1">Génération {generation}</div>
                </div>
            </div>
        );
    }

    const isMale = animal.gender === 'Male';
    const bgColor = isMale ? 'bg-blue-50' : 'bg-pink-50';
    const borderColor = isMale ? 'border-blue-200' : 'border-pink-200';

    // Calculate age
    const birthDate = new Date(animal.birthDate);
    const age = Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

    return (
        <div className="flex flex-col items-center group">
            <div className={clsx(
                "w-40 rounded-xl border-2 transition-all duration-200",
                "hover:shadow-lg hover:scale-105 cursor-pointer",
                bgColor, borderColor,
                generation === 0 && "ring-2 ring-primary-400 ring-offset-2"
            )}>
                {/* Photo */}
                <div className="relative">
                    <img
                        src={animal.photoUrl}
                        alt={animal.name}
                        className="w-full h-24 object-cover rounded-t-lg"
                    />
                    <div className={clsx(
                        "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center",
                        isMale ? "bg-blue-500" : "bg-pink-500"
                    )}>
                        {isMale ? <Mars className="w-4 h-4 text-white" /> : <Venus className="w-4 h-4 text-white" />}
                    </div>
                    {animal.certification && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white p-1 rounded">
                            <Award className="w-3 h-3" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-1.5">
                    <div>
                        <h4 className="font-bold text-sm text-slate-900 truncate">{animal.name}</h4>
                        <p className="text-[10px] text-slate-500">{animal.tagId}</p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-0.5 text-[10px] text-slate-600">
                        {animal.weight && (
                            <div className="flex items-center gap-1">
                                <Weight className="w-3 h-3" />
                                <span>{animal.weight} kg</span>
                            </div>
                        )}
                        {animal.height && (
                            <div className="flex items-center gap-1">
                                <Ruler className="w-3 h-3" />
                                <span>HG: {animal.height} cm</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{age} an{age > 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Certification */}
                    {animal.certification && (
                        <div className="pt-1 border-t border-slate-200">
                            <div className="text-[9px] font-medium text-amber-600 flex items-center gap-1">
                                <Award className="w-2.5 h-2.5" />
                                {animal.certification.level}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const FamilyTree: React.FC<FamilyTreeProps> = ({ rootAnimal, theme = 'green' }) => {
    const { animals } = useAnimals();
    const treeRef = useRef<HTMLDivElement>(null);

    // Get ancestors
    const father = rootAnimal.sireId ? animals.find(a => a.id === rootAnimal.sireId) : null;
    const mother = rootAnimal.damId ? animals.find(a => a.id === rootAnimal.damId) : null;

    // Paternal grandparents
    const paternalGrandfather = father?.sireId ? (animals.find(a => a.id === father.sireId) || null) : null;
    const paternalGrandmother = father?.damId ? (animals.find(a => a.id === father.damId) || null) : null;

    // Maternal grandparents
    const maternalGrandfather = mother?.sireId ? (animals.find(a => a.id === mother.sireId) || null) : null;
    const maternalGrandmother = mother?.damId ? (animals.find(a => a.id === mother.damId) || null) : null;

    // Paternal great-grandparents
    const paternalGGF_P = paternalGrandfather?.sireId ? (animals.find(a => a.id === paternalGrandfather.sireId) || null) : null;
    const paternalGGM_P = paternalGrandfather?.damId ? (animals.find(a => a.id === paternalGrandfather.damId) || null) : null;
    const paternalGGF_M = paternalGrandmother?.sireId ? (animals.find(a => a.id === paternalGrandmother.sireId) || null) : null;
    const paternalGGM_M = paternalGrandmother?.damId ? (animals.find(a => a.id === paternalGrandmother.damId) || null) : null;

    // Maternal great-grandparents
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
        <div ref={treeRef} className={clsx("p-8 rounded-3xl overflow-auto", themeStyles[theme])}>
            <div className="inline-flex gap-8 min-w-max">
                {/* Generation 3 - Great-Grandparents */}
                <div className="flex flex-col gap-4 justify-center">
                    <div className="text-xs font-bold text-slate-500 text-center mb-2">Arrière-Grands-Parents</div>
                    <div className="space-y-3">
                        <AnimalNode animal={paternalGGF_P} generation={3} position="top" theme={theme} />
                        <AnimalNode animal={paternalGGM_P} generation={3} position="top" theme={theme} />
                    </div>
                    <div className="space-y-3">
                        <AnimalNode animal={paternalGGF_M} generation={3} position="bottom" theme={theme} />
                        <AnimalNode animal={paternalGGM_M} generation={3} position="bottom" theme={theme} />
                    </div>
                    <div className="h-8" />
                    <div className="space-y-3">
                        <AnimalNode animal={maternalGGF_P} generation={3} position="top" theme={theme} />
                        <AnimalNode animal={maternalGGM_P} generation={3} position="top" theme={theme} />
                    </div>
                    <div className="space-y-3">
                        <AnimalNode animal={maternalGGF_M} generation={3} position="bottom" theme={theme} />
                        <AnimalNode animal={maternalGGM_M} generation={3} position="bottom" theme={theme} />
                    </div>
                </div>

                {/* Connecting Lines - Generation 3 to 2 */}
                <div className="flex items-center">
                    <svg width="60" height="800" className="overflow-visible">
                        {/* Lines from great-grandparents to grandparents - Elbow connectors */}
                        {/* Paternal grandfather */}
                        <path d="M 0 100 L 30 100 L 30 200 L 60 200" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                        <path d="M 0 180 L 30 180 L 30 200 L 60 200" stroke="#cbd5e1" strokeWidth="2" fill="none" />

                        {/* Paternal grandmother */}
                        <path d="M 0 280 L 30 280 L 30 300 L 60 300" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                        <path d="M 0 360 L 30 360 L 30 300 L 60 300" stroke="#cbd5e1" strokeWidth="2" fill="none" />

                        {/* Maternal grandfather */}
                        <path d="M 0 480 L 30 480 L 30 500 L 60 500" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                        <path d="M 0 560 L 30 560 L 30 500 L 60 500" stroke="#cbd5e1" strokeWidth="2" fill="none" />

                        {/* Maternal grandmother */}
                        <path d="M 0 660 L 30 660 L 30 600 L 60 600" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                        <path d="M 0 740 L 30 740 L 30 600 L 60 600" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                    </svg>
                </div>

                {/* Generation 2 - Grandparents */}
                <div className="flex flex-col gap-4 justify-center">
                    <div className="text-xs font-bold text-slate-500 text-center mb-2">Grands-Parents</div>
                    <div className="space-y-3">
                        <AnimalNode animal={paternalGrandfather} generation={2} position="top" theme={theme} />
                        <AnimalNode animal={paternalGrandmother} generation={2} position="bottom" theme={theme} />
                    </div>
                    <div className="h-16" />
                    <div className="space-y-3">
                        <AnimalNode animal={maternalGrandfather} generation={2} position="top" theme={theme} />
                        <AnimalNode animal={maternalGrandmother} generation={2} position="bottom" theme={theme} />
                    </div>
                </div>

                {/* Connecting Lines - Generation 2 to 1 */}
                <div className="flex items-center">
                    <svg width="60" height="600" className="overflow-visible">
                        {/* Lines from grandparents to parents - Elbow connectors */}
                        <path d="M 0 150 L 30 150 L 30 200 L 60 200" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                        <path d="M 0 250 L 30 250 L 30 200 L 60 200" stroke="#cbd5e1" strokeWidth="2" fill="none" />

                        <path d="M 0 400 L 30 400 L 30 350 L 60 350" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                        <path d="M 0 500 L 30 500 L 30 350 L 60 350" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                    </svg>
                </div>

                {/* Generation 1 - Parents */}
                <div className="flex flex-col gap-4 justify-center">
                    <div className="text-xs font-bold text-slate-500 text-center mb-2">Parents</div>
                    <div className="space-y-8">
                        <AnimalNode animal={father} generation={1} position="top" theme={theme} />
                        <AnimalNode animal={mother} generation={1} position="bottom" theme={theme} />
                    </div>
                </div>

                {/* Connecting Lines - Generation 1 to 0 */}
                <div className="flex items-center">
                    <svg width="60" height="400" className="overflow-visible">
                        {/* Lines from parents to subject - Elbow connectors */}
                        <path d="M 0 150 L 30 150 L 30 200 L 60 200" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                        <path d="M 0 250 L 30 250 L 30 200 L 60 200" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                    </svg>
                </div>

                {/* Generation 0 - Subject */}
                <div className="flex flex-col justify-center">
                    <div className="text-xs font-bold text-primary-600 text-center mb-4">Sujet</div>
                    <AnimalNode animal={rootAnimal} generation={0} position="center" theme={theme} />
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
            </div>
        </div>
    );
};
