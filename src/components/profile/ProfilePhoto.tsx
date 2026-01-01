import React, { useState } from 'react';
import { Camera, User } from 'lucide-react';
import { ImageUpload } from '../ui/ImageUpload';
import { UserService } from '../../services/UserService';
import { useAuth } from '../../context/AuthContext';

export const ProfilePhoto: React.FC = () => {
    const { user, userProfile, refreshUserProfile } = useAuth();
    const [showUpload, setShowUpload] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(userProfile?.photoUrl || '');
    const [saving, setSaving] = useState(false);

    const handleSavePhoto = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await UserService.update(user.uid, { photoUrl });
            await refreshUserProfile();
            setShowUpload(false);
            alert('Photo de profil enregistrée avec succès!');
        } catch (error) {
            console.error('Error saving photo:', error);
            alert('Erreur lors de l\'enregistrement de la photo');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-4">
            {showUpload ? (
                <div className="space-y-4">
                    <ImageUpload
                        value={photoUrl}
                        onChange={setPhotoUrl}
                        label="Photo de profil"
                        farmId={userProfile?.farmId}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSavePhoto}
                            disabled={saving || photoUrl === userProfile?.photoUrl}
                            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                            onClick={() => {
                                setShowUpload(false);
                                setPhotoUrl(userProfile?.photoUrl || '');
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        {userProfile?.photoUrl ? (
                            <img
                                src={userProfile.photoUrl}
                                alt={userProfile.displayName || 'Profil'}
                                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-slate-200">
                                {userProfile?.displayName?.charAt(0).toUpperCase() || <User className="w-8 h-8" />}
                            </div>
                        )}
                        <button
                            onClick={() => setShowUpload(true)}
                            className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-colors"
                            title="Changer la photo"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600">Photo de profil</p>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Changer la photo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
