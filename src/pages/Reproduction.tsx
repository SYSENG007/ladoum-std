import React, { useState, useMemo } from 'react';
import { useAnimals } from '../hooks/useAnimals';
import { BreedingCalculator } from '../components/reproduction/BreedingCalculator';
import { MatrixBreedingSimulator } from '../components/reproduction/MatrixBreedingSimulator';
import { HeatCalendar } from '../components/reproduction/HeatCalendar';
import { ReproductionEventModal } from '../components/reproduction/ReproductionEventModal';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Baby, CalendarClock, Heart, Plus, TrendingUp, Grid3X3, Calendar } from 'lucide-react';
import clsx from 'clsx';

type TabType = 'gestations' | 'births' | 'planning' | 'matrix' | 'calendar';

export const Reproduction: React.FC = () => {
    const { animals } = useAnimals();
    const [selectedTab, setSelectedTab] = useState<TabType>('gestations');
    const [showEventModal, setShowEventModal] = useState(false);

    // Filter animals with reproduction records
    const femaleAnimals = useMemo(() =>
        animals.filter(a => a.gender === 'Female' && a.status === 'Active'),
        [animals]
    );

    const maleAnimals = useMemo(() =>
        animals.filter(a => a.gender === 'Male' && a.status === 'Active'),
        [animals]
    );

    // Get animals with recent reproduction records
    const activeGestations = useMemo(() => {
        return femaleAnimals
            .filter(a => a.reproductionRecords && a.reproductionRecords.length > 0)
            .map(animal => {
                const records = animal.reproductionRecords!;
                const sortedRecords = [...records].sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                // Find last mating or ultrasound without a birth after it
                for (const record of sortedRecords) {
                    if (record.type === 'Mating' || record.type === 'Ultrasound') {
                        const matingDate = new Date(record.date);
                        const today = new Date();
                        const daysSinceMating = Math.floor((today.getTime() - matingDate.getTime()) / (1000 * 60 * 60 * 24));
                        const gestationPeriod = 150; // ~5 months for sheep
                        const daysRemaining = gestationPeriod - daysSinceMating;

                        // Check if there's a birth after this mating
                        const hasBirthAfter = records.some(
                            r => r.type === 'Birth' && new Date(r.date) > matingDate
                        );

                        if (daysRemaining > 0 && !hasBirthAfter) {
                            return {
                                animal,
                                daysSinceMating,
                                daysRemaining,
                                expectedDate: new Date(matingDate.getTime() + gestationPeriod * 24 * 60 * 60 * 1000),
                                mateId: record.mateId
                            };
                        }
                    }
                }
                return null;
            })
            .filter(Boolean);
    }, [femaleAnimals]);

    const recentBirths = useMemo(() => {
        return animals
            .filter(a => {
                const birthDate = new Date(a.birthDate);
                const today = new Date();
                const daysSinceBirth = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysSinceBirth <= 90; // Born in last 3 months
            })
            .sort((a, b) => new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime());
    }, [animals]);

    const stats = {
        totalFemales: femaleAnimals.length,
        totalMales: maleAnimals.length,
        activeGestations: activeGestations.length,
        recentBirths: recentBirths.length
    };

    const tabs = [
        { id: 'gestations' as const, label: 'Gestations', icon: CalendarClock },
        { id: 'births' as const, label: 'Naissances', icon: Baby },
        { id: 'planning' as const, label: 'Simulation', icon: TrendingUp },
        { id: 'matrix' as const, label: 'Matrice', icon: Grid3X3 },
        { id: 'calendar' as const, label: 'Chaleurs', icon: Calendar },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Reproduction</h1>
                    <p className="text-slate-500">Gérez les accouplements, naissances et cycles de chaleurs.</p>
                </div>
                <Button icon={Plus} onClick={() => setShowEventModal(true)}>
                    Enregistrer un événement
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                            <Heart className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Femelles</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.totalFemales}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Mâles</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.totalMales}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <CalendarClock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Gestations</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.activeGestations}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Baby className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Naissances (90j)</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.recentBirths}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 border-b border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id)}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap",
                            selectedTab === tab.id
                                ? "text-primary-700 border-primary-600"
                                : "text-slate-500 border-transparent hover:text-slate-700"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {selectedTab === 'gestations' && (
                    <Card>
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CalendarClock className="w-5 h-5 text-primary-600" />
                            Gestations en cours ({activeGestations.length})
                        </h3>
                        <div className="space-y-4">
                            {activeGestations.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p>Aucune gestation en cours</p>
                                </div>
                            ) : (
                                activeGestations.map((gestation: any) => {
                                    const mate = gestation.mateId ? animals.find(a => a.id === gestation.mateId) : null;
                                    return (
                                        <div key={gestation.animal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={gestation.animal.photoUrl}
                                                    alt={gestation.animal.name}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="font-bold text-slate-900">{gestation.animal.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {gestation.animal.tagId} • {gestation.daysSinceMating} jours
                                                        {mate && ` • Père: ${mate.name}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {gestation.expectedDate.toLocaleDateString('fr-FR')}
                                                </p>
                                                <Badge variant={gestation.daysRemaining < 30 ? "warning" : "info"}>
                                                    {gestation.daysRemaining} jours restants
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                )}

                {selectedTab === 'births' && (
                    <Card>
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Baby className="w-5 h-5 text-primary-600" />
                            Naissances récentes ({recentBirths.length})
                        </h3>
                        <div className="space-y-4">
                            {recentBirths.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Baby className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p>Aucune naissance récente</p>
                                </div>
                            ) : (
                                recentBirths.map(animal => {
                                    const mother = animal.damId ? animals.find(a => a.id === animal.damId) : null;
                                    const birthDate = new Date(animal.birthDate);
                                    const daysOld = Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <div key={animal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={animal.photoUrl}
                                                    alt={animal.name}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="font-bold text-slate-900">{animal.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {animal.tagId} • {animal.gender === 'Male' ? 'Mâle' : 'Femelle'}
                                                        {mother && ` • Mère: ${mother.name}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-900">
                                                    {birthDate.toLocaleDateString('fr-FR')}
                                                </p>
                                                <span className="text-xs text-slate-500">{daysOld} jours</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                )}

                {selectedTab === 'planning' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <BreedingCalculator />
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <h3 className="font-bold text-slate-900 mb-4">Femelles disponibles</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {femaleAnimals.slice(0, 6).map(animal => (
                                        <div key={animal.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <img
                                                src={animal.photoUrl}
                                                alt={animal.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900 text-sm">{animal.name}</p>
                                                <p className="text-xs text-slate-500">{animal.tagId}</p>
                                            </div>
                                            <Badge variant="success">Disponible</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card>
                                <h3 className="font-bold text-slate-900 mb-4">Mâles reproducteurs</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {maleAnimals.slice(0, 6).map(animal => (
                                        <div key={animal.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <img
                                                src={animal.photoUrl}
                                                alt={animal.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900 text-sm">{animal.name}</p>
                                                <p className="text-xs text-slate-500">{animal.tagId}</p>
                                            </div>
                                            {animal.certification && (
                                                <Badge variant="info">{animal.certification.level}</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {selectedTab === 'matrix' && (
                    <MatrixBreedingSimulator />
                )}

                {selectedTab === 'calendar' && (
                    <HeatCalendar />
                )}
            </div>

            {/* Event Modal */}
            <ReproductionEventModal
                isOpen={showEventModal}
                onClose={() => setShowEventModal(false)}
            />
        </div>
    );
};
