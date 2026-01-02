import React, { useEffect, useState } from 'react';
import { GitFork, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import type { Animal } from '../../types';
import { AnimalService } from '../../services/AnimalService';

interface PedigreeSummaryCardProps {
    animal: Animal;
}

export const PedigreeSummaryCard: React.FC<PedigreeSummaryCardProps> = ({ animal }) => {
    const [sire, setSire] = useState<Animal | null>(null);
    const [dam, setDam] = useState<Animal | null>(null);

    // Fetch parents when animal changes
    useEffect(() => {
        const fetchParents = async () => {
            if (animal.sireId) {
                try {
                    const sireDoc = await AnimalService.get(animal.sireId);
                    if (sireDoc) setSire(sireDoc);
                } catch (e) { console.error('Error fetching sire', e); }
            }
            if (animal.damId) {
                try {
                    const damDoc = await AnimalService.get(animal.damId);
                    if (damDoc) setDam(damDoc);
                } catch (e) { console.error('Error fetching dam', e); }
            }
        };
        fetchParents();
    }, [animal.sireId, animal.damId]);

    return (
        <Card className="h-full flex flex-col relative group min-h-[320px]">
            <Link to="/pedigree" className="absolute top-4 right-4 text-slate-400 hover:text-primary-600 transition-colors">
                <Maximize2 className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-2 text-amber-600 mb-6">
                <GitFork className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">Généalogie</h3>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-6 relative">
                {/* Connection Lines (SVG Overlay) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none text-slate-200" style={{ zIndex: 0 }}>
                    <path d="M60 40 L40 40 L40 130 L60 130" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M40 85 L90 85" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>

                {/* Sire */}
                <div className="flex items-center gap-4 relative z-10 pl-12">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold ring-4 ring-white shrink-0 overflow-hidden">
                        {sire?.photoUrl ? <img src={sire.photoUrl} className="w-full h-full object-cover" /> : 'P'}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Père</p>
                        <p className="font-bold text-slate-900 text-sm">{sire ? sire.name : (animal.sireId ? '...' : 'Inconnu')}</p>
                    </div>
                </div>

                {/* Subject (Center) */}
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center gap-4 relative z-10 ml-8">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                        <img src={animal.photoUrl} alt={animal.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Animal</p>
                        <p className="font-bold text-slate-900">{animal.name}</p>
                    </div>
                </div>

                {/* Dam */}
                <div className="flex items-center gap-4 relative z-10 pl-12">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold ring-4 ring-white shrink-0 overflow-hidden">
                        {dam?.photoUrl ? <img src={dam.photoUrl} className="w-full h-full object-cover" /> : 'M'}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mère</p>
                        <p className="font-bold text-slate-900 text-sm">{dam ? dam.name : (animal.damId ? '...' : 'Inconnue')}</p>
                    </div>
                </div>
            </div>

            {/* Footer - removed hardcoded genetic score */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 italic">
                    Cliquez sur l'icône en haut à droite pour voir l'arbre complet
                </p>
            </div>
        </Card>
    );
};
