import React, { useState } from 'react';
import { useFarm } from '../hooks/useFarm';
import { ImageUpload } from '../components/ui/ImageUpload';
import { FarmService } from '../services/FarmService';
import { Building2, Save } from 'lucide-react';

export const FarmSettings: React.FC = () => {
    const { currentFarm } = useFarm();
    const [saving, setSaving] = useState(false);
    const [logoUrl, setLogoUrl] = useState(currentFarm?.logoUrl || '');

    const handleSaveLogo = async () => {
        if (!currentFarm) return;

        setSaving(true);
        try {
            await FarmService.update(currentFarm.id, { logoUrl });
            alert('Logo enregistré avec succès!');
        } catch (error) {
            console.error('Error saving logo:', error);
            alert('Erreur lors de l\'enregistrement du logo');
        } finally {
            setSaving(false);
        }
    };

    if (!currentFarm) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Paramètres de la bergerie</h2>
                        <p className="text-sm text-slate-500">{currentFarm.name}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Logo Upload */}
                    <div>
                        <ImageUpload
                            value={logoUrl}
                            onChange={setLogoUrl}
                            label="Logo de la bergerie"
                            farmId={currentFarm.id}
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            Ce logo sera affiché dans la barre de navigation et sur les documents.
                        </p>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveLogo}
                        disabled={saving || logoUrl === currentFarm.logoUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
};
