import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { ImageUpload } from '../ui/ImageUpload';
import { FarmService } from '../../services/FarmService';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';

export const FarmLogoCircle: React.FC = () => {
    const { currentFarm, refreshFarm } = useFarm();
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [logoUrl, setLogoUrl] = useState(currentFarm?.logoUrl || '');
    const [saving, setSaving] = useState(false);

    const isOwner = currentFarm?.ownerId === user?.uid;

    const handleSave = async () => {
        if (!currentFarm?.id) return;

        setSaving(true);
        try {
            await FarmService.update(currentFarm.id, { logoUrl });
            await refreshFarm();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving logo:', error);
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    if (!currentFarm) return null;

    return (
        <>
            {/* Circular Logo */}
            <div className="relative group">
                {currentFarm.logoUrl ? (
                    <img
                        src={currentFarm.logoUrl}
                        alt={currentFarm.name || 'Logo'}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                ) : (
                    <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                        {currentFarm.name?.charAt(0).toUpperCase() || 'B'}
                    </div>
                )}

                {isOwner && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="absolute -bottom-2 -right-2 p-1.5 bg-white text-primary-600 border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Changer le logo"
                    >
                        <Camera className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Logo de la bergerie</h3>

                        <ImageUpload
                            value={logoUrl}
                            onChange={setLogoUrl}
                            label=""
                            farmId={currentFarm.id}
                        />

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                            >
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
