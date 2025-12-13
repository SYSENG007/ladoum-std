import React, { useState, useEffect, useRef } from 'react';
import { FamilyTree } from '../components/pedigree/FamilyTree';
import { useAnimals } from '../hooks/useAnimals';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Download, Share2, ZoomIn, ZoomOut, Maximize2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const Pedigree: React.FC = () => {
    const { animals } = useAnimals();
    const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');
    const [theme, setTheme] = useState<'cyan' | 'green' | 'orange' | 'white'>('green');
    const [searchTerm, setSearchTerm] = useState('');
    const [zoom, setZoom] = useState(100);
    const [exporting, setExporting] = useState(false);
    const treeContainerRef = useRef<HTMLDivElement>(null);

    // Select first animal by default when loaded
    useEffect(() => {
        if (animals.length > 0 && !selectedAnimalId) {
            setSelectedAnimalId(animals[0].id);
        }
    }, [animals, selectedAnimalId]);

    const selectedAnimal = animals.find(a => a.id === selectedAnimalId) || animals[0];

    const filteredAnimals = animals.filter(animal =>
        animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.tagId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportPDF = async () => {
        if (!treeContainerRef.current) return;
        setExporting(true);

        try {
            const canvas = await html2canvas(treeContainerRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 297; // A4 landscape width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`pedigree-${selectedAnimal?.name || 'animal'}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Erreur lors de l\'export PDF');
        } finally {
            setExporting(false);
        }
    };

    const handleExportImage = async () => {
        if (!treeContainerRef.current) return;
        setExporting(true);

        try {
            const canvas = await html2canvas(treeContainerRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
            });

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `pedigree-${selectedAnimal?.name || 'animal'}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            });
        } catch (error) {
            console.error('Error exporting image:', error);
            alert('Erreur lors de l\'export image');
        } finally {
            setExporting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 10, 150));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 10, 50));
    };

    const handleResetZoom = () => {
        setZoom(100);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pédigrées</h1>
                    <p className="text-slate-500">Visualisez la généalogie de vos sujets sur 4 générations.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        icon={Printer}
                        onClick={handlePrint}
                        disabled={exporting}
                    >
                        Imprimer
                    </Button>
                    <Button
                        variant="outline"
                        icon={Download}
                        onClick={handleExportImage}
                        disabled={exporting}
                    >
                        Image
                    </Button>
                    <Button
                        icon={Download}
                        onClick={handleExportPDF}
                        disabled={exporting}
                    >
                        {exporting ? 'Export...' : 'PDF'}
                    </Button>
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
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {filteredAnimals.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">Aucun résultat</p>
                            ) : (
                                filteredAnimals.map(animal => (
                                    <button
                                        key={animal.id}
                                        onClick={() => setSelectedAnimalId(animal.id)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${selectedAnimalId === animal.id ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-200' : 'hover:bg-slate-50'}`}
                                    >
                                        <img src={animal.photoUrl} alt={animal.name} className="w-8 h-8 rounded-full object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium truncate block">{animal.name}</span>
                                            <span className="text-xs text-slate-500">{animal.tagId}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-slate-900 mb-4">Personnalisation</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase mb-2">Thème</p>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'cyan', label: 'Cyan', color: 'bg-cyan-100' },
                                        { id: 'green', label: 'Vert', color: 'bg-emerald-100' },
                                        { id: 'orange', label: 'Orange', color: 'bg-orange-100' },
                                        { id: 'white', label: 'Blanc', color: 'bg-white border-slate-200' }
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id as any)}
                                            className={`w-10 h-10 rounded-lg border-2 transition-all ${theme === t.id ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'} ${t.color}`}
                                            title={t.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase mb-2">Zoom</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleZoomOut}
                                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                        disabled={zoom <= 50}
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <div className="flex-1 text-center">
                                        <span className="text-sm font-medium text-slate-700">{zoom}%</span>
                                    </div>
                                    <button
                                        onClick={handleZoomIn}
                                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                        disabled={zoom >= 150}
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleResetZoom}
                                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                                        title="Réinitialiser"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Info Card */}
                    {selectedAnimal && (
                        <Card>
                            <h3 className="font-bold text-slate-900 mb-3">Informations</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Générations:</span>
                                    <span className="font-medium">4</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Ancêtres:</span>
                                    <span className="font-medium">30 max</span>
                                </div>
                                {selectedAnimal.certification && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <span className="text-xs font-medium">Certifié {selectedAnimal.certification.level}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Tree Visualization */}
                <div className="lg:col-span-3">
                    <Card className="h-full min-h-[700px] bg-slate-50/50" noPadding>
                        <div
                            ref={treeContainerRef}
                            className="w-full h-full overflow-auto"
                            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                        >
                            {selectedAnimal ? (
                                <FamilyTree rootAnimal={selectedAnimal} theme={theme} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                    <div className="text-center">
                                        <p className="text-lg font-medium mb-2">Aucun animal sélectionné</p>
                                        <p className="text-sm">Sélectionnez un animal dans la liste</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #pedigree-tree, #pedigree-tree * {
                        visibility: visible;
                    }
                    #pedigree-tree {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
            `}</style>
        </div>
    );
};
