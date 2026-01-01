import React, { useState, useEffect, useRef } from 'react';
import { FamilyTree } from '../components/pedigree/FamilyTree';
import { useAnimals } from '../hooks/useAnimals';
import type { Animal } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Download, ZoomIn, ZoomOut, Maximize2, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '../context/ToastContext';
import { useParams, useNavigate } from 'react-router-dom';

export const Pedigree: React.FC = () => {
    const { animalId } = useParams();
    const navigate = useNavigate();
    const { animals, loading } = useAnimals();
    const toast = useToast();
    const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [zoom, setZoom] = useState(100);
    const [exporting, setExporting] = useState(false);
    const treeContainerRef = useRef<HTMLDivElement>(null);

    // Select animal from URL or first animal by default
    useEffect(() => {
        if (animals.length > 0) {
            if (animalId) {
                // If URL has animalId, select it
                const animal = animals.find(a => a.id === animalId);
                if (animal) {
                    setSelectedAnimalId(animalId);
                }
            } else if (!selectedAnimalId) {
                // No URL param and no selection - select first animal
                const firstId = animals[0].id;
                setSelectedAnimalId(firstId);
                navigate(`/pedigree/${firstId}`, { replace: true });
            }
        }
    }, [animals, animalId]); // Removed selectedAnimalId from deps

    const selectedAnimal = animals.find(a => a.id === selectedAnimalId) || animals[0];

    // Update URL when animal is manually selected (not from URL)
    const handleAnimalSelect = (id: string) => {
        setSelectedAnimalId(id);
        navigate(`/pedigree/${id}`, { replace: true });
    };

    // Count real ancestors
    const countAncestors = (animal: Animal | undefined, visited: Set<string> = new Set()): number => {
        if (!animal || visited.has(animal.id)) return 0;
        visited.add(animal.id);

        let count = 0;
        const father = animal.sireId ? animals.find(a => a.id === animal.sireId) : null;
        const mother = animal.damId ? animals.find(a => a.id === animal.damId) : null;

        if (father) count += 1 + countAncestors(father, visited);
        if (mother) count += 1 + countAncestors(mother, visited);

        return count;
    };

    const ancestorCount = selectedAnimal ? countAncestors(selectedAnimal) : 0;

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

            // Add metadata
            pdf.setProperties({
                title: `Pédigrée de ${selectedAnimal?.name || 'Animal'}`,
                author: 'Ladoum STD',
                subject: 'Généalogie',
                creator: 'Ladoum STD App',
                keywords: 'pedigree, genealogie, ladoum'
            });

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`pedigree-${selectedAnimal?.name || 'animal'}.pdf`);
            toast.success('PDF exporté avec succès');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error('Erreur lors de l\'export PDF');
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
                toast.success('Image exportée avec succès');
            });
        } catch (error) {
            console.error('Error exporting image:', error);
            toast.error('Erreur lors de l\'export image');
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

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Sidebar / Controls */}
                <div className="lg:col-span-1 space-y-6">
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
                        <div className="space-y-2 max-h-[calc(100vh-500px)] overflow-y-auto">
                            {filteredAnimals.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">Aucun résultat</p>
                            ) : (
                                filteredAnimals.map(animal => (
                                    <button
                                        key={animal.id}
                                        onClick={() => handleAnimalSelect(animal.id)}
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

                    {loading && (
                        <Card>
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                <p className="mt-2 text-sm text-slate-500">Chargement...</p>
                            </div>
                        </Card>
                    )}

                    <Card>
                        <h3 className="font-bold text-slate-900 mb-4">Contrôles</h3>
                        <div className="space-y-4">
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
                                    <span className="font-medium">{ancestorCount}/{ancestorCount > 0 ? '30 max' : '0'}</span>
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
                <div className="lg:col-span-4 h-[calc(100vh-200px)] min-h-[600px]">
                    <Card style={{ height: '100%', position: 'relative' }} className="bg-slate-50/50" noPadding>
                        {selectedAnimal ? (
                            <FamilyTree rootAnimal={selectedAnimal} />
                        ) : (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f1f5f9'
                            }}>
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <p style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>Aucun animal sélectionné</p>
                                    <p style={{ fontSize: '0.875rem' }}>Sélectionnez un animal dans la liste</p>
                                </div>
                            </div>
                        )}
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
