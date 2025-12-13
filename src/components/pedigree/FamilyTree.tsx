import React from 'react';
import type { Animal } from '../../types';
import { Mars, Venus, User } from 'lucide-react';
import clsx from 'clsx';

interface FamilyTreeProps {
    rootAnimal: Animal;
    theme?: 'cyan' | 'green' | 'orange' | 'white';
}

const Node: React.FC<{ animal: any; role?: string; className?: string }> = ({ animal, role, className }) => {
    if (!animal) return <div className={clsx("w-32 h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-xs", className)}>Inconnu</div>;

    return (
        <div className={clsx("flex flex-col items-center relative group", className)}>
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-100 relative z-10 transition-transform hover:scale-110 cursor-pointer">
                {animal.photoUrl ? (
                    <img src={animal.photoUrl} alt={animal.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <User className="w-10 h-10" />
                    </div>
                )}
            </div>
            <div className="mt-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 text-center min-w-[120px] relative z-20">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[100px] mx-auto">{animal.name}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                    {animal.gender === 'Male' ? <Mars className="w-3 h-3 text-blue-500" /> : <Venus className="w-3 h-3 text-pink-500" />}
                    <span className="text-[10px] text-slate-500">{animal.tagId}</span>
                </div>
            </div>
            {role && <span className="absolute -top-6 text-[10px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-full">{role}</span>}
        </div>
    );
};

export const FamilyTree: React.FC<FamilyTreeProps> = ({ rootAnimal, theme = 'green' }) => {
    // const treeData = getAncestors(rootAnimal, 0); // Unused for now as we hardcode the tree structure below for MVP layout

    const themeStyles = {
        cyan: 'bg-cyan-50',
        green: 'bg-emerald-50',
        orange: 'bg-orange-50',
        white: 'bg-white',
    };

    return (
        <div className={clsx("p-8 rounded-3xl overflow-x-auto min-w-[800px]", themeStyles[theme])}>
            <div className="flex flex-col items-center gap-12 relative">

                {/* Generation 1 (Root) */}
                <div className="relative">
                    <Node animal={rootAnimal} role="Sujet" />
                    {/* Lines to parents */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-px h-8 bg-slate-300 -z-10" />
                </div>

                {/* Generation 2 (Parents) */}
                <div className="flex gap-32 relative">
                    <div className="relative">
                        <Node animal={{ name: 'Père', gender: 'Male', tagId: 'PERE-01' }} role="Père" />
                        {/* Lines to grandparents */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-px h-8 bg-slate-300 -z-10" />
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-6 bg-slate-300 -z-10" />
                        <div className="absolute top-full left-1/2 w-[150%] h-px bg-slate-300 -z-10 border-t border-slate-300" style={{ transform: 'translateX(-50%) translateY(24px)' }} />
                    </div>
                    <div className="relative">
                        <Node animal={{ name: 'Mère', gender: 'Female', tagId: 'MERE-01' }} role="Mère" />
                        {/* Lines to grandparents */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-px h-8 bg-slate-300 -z-10" />
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-6 bg-slate-300 -z-10" />
                    </div>

                    {/* Connector between parents */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-px bg-slate-300 -z-10" />
                </div>

                {/* Generation 3 (Grandparents) - Simplified for MVP layout */}
                <div className="flex gap-8">
                    <Node animal={{ name: 'GP Paternel', gender: 'Male' }} />
                    <Node animal={{ name: 'GM Paternelle', gender: 'Female' }} />
                    <div className="w-16" />
                    <Node animal={{ name: 'GP Maternel', gender: 'Male' }} />
                    <Node animal={{ name: 'GM Maternelle', gender: 'Female' }} />
                </div>

                <div className="text-center text-slate-400 text-sm mt-4">
                    * Arbre simplifié pour la démo (Données simulées)
                </div>
            </div>
        </div>
    );
};
