import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { ImageUpload } from '../ui/ImageUpload';
import { UserService } from '../../services/UserService';
import { useAuth } from '../../context/AuthContext';

export const ProfilePhotoCircle: React.FC = () => {
    const { user, userProfile, refreshUserProfile } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(userProfile?.photoUrl || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await UserService.update(user.uid, { photoUrl });
            await refreshUserProfile();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving photo:', error);
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <>
            {/* Circular Avatar */}
            <div className="relative group">
                {userProfile?.photoUrl ? (
                    <img
                        src={userProfile.photoUrl}
                        alt={userProfile.displayName || 'Photo'}
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                    />
                ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-slate-200">
                        {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                )}
                <button
                    onClick={() => setShowModal(true)}
                    className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-colors"
                    title="Changer la photo de profil"
                >
                    <Camera className="w-3 h-3" />
                </button>
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Photo de profil</h3>

                        <ImageUpload
                            value={photoUrl}
                            onChange={setPhotoUrl}
                            label=""
                            farmId={userProfile?.farmId}
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
