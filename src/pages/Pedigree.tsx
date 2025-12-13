import React, { useState, useEffect } from 'react';
import { FamilyTree } from '../components/pedigree/FamilyTree';
import { useAnimals } from '../hooks/useAnimals';
import { Card } from '../components/ui/Card';
import { Search, Download, Share2 } from 'lucide-react';

export const Pedigree: React.FC = () => {
    const { animals } = useAnimals();
    const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');
    const [theme, setTheme] = useState<'cyan' | 'green' | 'orange' | 'white'>('green');

    // Select first animal by default when loaded
    useEffect(() => {
        if (animals.length > 0 && !selectedAnimalId) {
            setSelectedAnimalId(animals[0].id);
        }
    }, [animals, selectedAnimalId]);

    const selectedAnimal = animals.find(a => a.id === selectedAnimalId) || animals[0];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pédigrées</h1>
                    <p className="text-slate-500">Visualisez la généalogie de vos sujets.</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-lg border border-slate-200">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-lg border border-slate-200">
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar / Controls */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="font-bold text-slate-900 mb-4">Sélectionner un sujet</h3>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {animals.map(animal => (
                                <button
                                    key={animal.id}
                                    onClick={() => setSelectedAnimalId(animal.id)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${selectedAnimalId === animal.id ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50'}`}
                                >
                                    <img src={animal.photoUrl} alt={animal.name} className="w-8 h-8 rounded-full object-cover" />
                                    <span className="text-sm font-medium truncate">{animal.name}</span>
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-slate-900 mb-4">Personnalisation</h3>
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 font-medium uppercase">Thème</p>
                            <div className="flex gap-2">
                                {['cyan', 'green', 'orange', 'white'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t as any)}
                                        className={`w-8 h-8 rounded-full border-2 ${theme === t ? 'border-slate-900' : 'border-transparent'} ${t === 'cyan' ? 'bg-cyan-100' :
                                            t === 'green' ? 'bg-emerald-100' :
                                                t === 'orange' ? 'bg-orange-100' : 'bg-white border-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tree Visualization */}
                <div className="lg:col-span-3 overflow-hidden">
                    <Card className="h-full min-h-[600px] flex items-center justify-center bg-slate-50/50" noPadding>
                        <FamilyTree rootAnimal={selectedAnimal} theme={theme} />
                    </Card>
                </div>
            </div>
        </div>
    );
};
