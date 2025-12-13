import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import type { Animal } from '../../types';
import logo from '../../assets/logo.jpg';
import { Badge } from '../ui/Badge';
import { CertificationBadge } from '../ui/CertificationBadge';
import { EditAnimalModal } from './EditAnimalModal';
import { AnimalService } from '../../services/AnimalService';

interface AnimalCardProps {
    animal: Animal;
    onUpdate?: () => void;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({ animal, onUpdate }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${animal.name} ?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await AnimalService.delete(animal.id);
            onUpdate?.();
        } catch (err) {
            console.error('Error deleting animal:', err);
            alert('Erreur lors de la suppression de l\'animal.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(false);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        onUpdate?.();
    };

    return (
        <>
            <Link to={`/herd/${animal.id}`} className="block group relative">
                <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="relative aspect-square overflow-hidden">
                        <img
                            src={animal.photoUrl || logo}
                            alt={animal.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                        {/* Certification Badge */}
                        {animal.certification && (
                            <div className="absolute top-3 right-14">
                                <CertificationBadge level={animal.certification.level} size="sm" showLabel={false} className="bg-white/90 backdrop-blur-sm shadow-sm" />
                            </div>
                        )}

                        {/* Gender Badge */}
                        <div className="absolute top-3 left-3">
                            <Badge variant={animal.gender === 'Male' ? 'info' : 'success'} className="bg-white/90 backdrop-blur-sm shadow-sm">
                                {animal.gender === 'Male' ? 'Mâle' : 'Femelle'}
                            </Badge>
                        </div>

                        {/* Action Menu */}
                        <div className="absolute top-3 right-3 z-10">
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowMenu(!showMenu);
                                    }}
                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors shadow-sm"
                                >
                                    <MoreVertical className="w-4 h-4 text-slate-700" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                                        <button
                                            onClick={handleEdit}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Modifier
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {isDeleting ? 'Suppression...' : 'Supprimer'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-4 text-white">
                            <p className="font-bold text-lg leading-tight">{animal.name}</p>
                            <p className="text-xs opacity-80 font-mono">{animal.tagId}</p>
                        </div>
                    </div>

                    <div className="p-4">
                        {/* Get latest measurement if available */}
                        {(() => {
                            const lastMeasurement = animal.measurements && animal.measurements.length > 0
                                ? animal.measurements[animal.measurements.length - 1]
                                : null;

                            const hg = lastMeasurement?.height_hg || animal.height;
                            const lcs = lastMeasurement?.length_lcs || animal.length;
                            const tp = lastMeasurement?.chest_tp || animal.chestGirth;
                            const masse = lastMeasurement?.weight || animal.weight;

                            return (
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    {/* HG - Hauteur Garrot */}
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-medium">HG</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {hg ? <>{hg}<span className="text-[10px] font-normal text-slate-400">cm</span></> : '-'}
                                        </p>
                                    </div>
                                    {/* LCS - Longueur Corps */}
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-medium">LCS</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {lcs ? <>{lcs}<span className="text-[10px] font-normal text-slate-400">cm</span></> : '-'}
                                        </p>
                                    </div>
                                    {/* TP - Tour Poitrine */}
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-medium">TP</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {tp ? <>{tp}<span className="text-[10px] font-normal text-slate-400">cm</span></> : '-'}
                                        </p>
                                    </div>
                                    {/* Masse */}
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-medium">Masse</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {masse ? <>{masse}<span className="text-[10px] font-normal text-slate-400">kg</span></> : '-'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </Link>

            <EditAnimalModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                animal={animal}
            />
        </>
    );
};
