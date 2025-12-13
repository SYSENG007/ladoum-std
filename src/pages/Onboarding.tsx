import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserService } from '../services/UserService';
import { FarmService } from '../services/FarmService';
import { AnimalService } from '../services/AnimalService';
import { Button } from '../components/ui/Button';
import { ImageUpload } from '../components/ui/ImageUpload';
import {
    ChevronRight,
    ChevronLeft,
    User,
    Home,
    MapPin,
    CheckCircle,
    Sparkles,
    Users,
    PawPrint,
    Camera
} from 'lucide-react';
import type { OnboardingData } from '../types/auth';
import type { Gender } from '../types';

const TOTAL_STEPS = 6;

export const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const { user, userProfile, refreshUserProfile } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdFarmId, setCreatedFarmId] = useState<string | null>(null);

    const [data, setData] = useState<OnboardingData>({
        step: 1,
        userInfo: {
            displayName: userProfile?.displayName || user?.displayName || '',
            phone: '',
        },
        farmInfo: {
            name: '',
            location: '',
            defaultBreed: 'Ladoum',
            estimatedAnimals: 10,
            estimatedEmployees: 1,
        },
    });

    // First animal state
    const [firstAnimal, setFirstAnimal] = useState({
        name: '',
        tagId: '',
        gender: '' as Gender | '',
        birthDate: '',
        photoUrl: ''
    });
    const [skipAnimal, setSkipAnimal] = useState(false);

    const updateUserInfo = (field: keyof OnboardingData['userInfo'], value: string) => {
        setData(prev => ({
            ...prev,
            userInfo: { ...prev.userInfo, [field]: value },
        }));
    };

    const updateFarmInfo = (field: keyof OnboardingData['farmInfo'], value: string | number) => {
        setData(prev => ({
            ...prev,
            farmInfo: { ...prev.farmInfo, [field]: value },
        }));
    };

    const handleNext = async () => {
        setError(null);

        // Validation par étape
        if (currentStep === 2) {
            if (!data.userInfo.displayName.trim()) {
                setError('Veuillez entrer votre nom');
                return;
            }
        }

        if (currentStep === 3) {
            if (!data.farmInfo.name.trim()) {
                setError('Veuillez entrer le nom de votre bergerie');
                return;
            }
        }

        // Étape 5 : Créer la ferme avant d'aller à l'étape 6
        if (currentStep === 5 && !createdFarmId) {
            await createFarmAndUser();
            if (createdFarmId) {
                setCurrentStep(6);
            }
            return;
        }

        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const createFarmAndUser = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Mettre à jour le profil utilisateur
            await UserService.update(user.uid, {
                displayName: data.userInfo.displayName,
                phone: data.userInfo.phone,
            });

            // 2. Créer la ferme
            const farm = await FarmService.create(
                data.farmInfo.name,
                user.uid,
                data.userInfo.displayName,
                user.email || '',
                data.farmInfo.location
            );

            setCreatedFarmId(farm.id);

            // 3. Associer la ferme à l'utilisateur
            await UserService.addFarm(user.uid, farm.id, true);

            // 4. Rafraîchir le profil pour avoir accès au farmId
            await refreshUserProfile();

            setCurrentStep(6);

        } catch (err: any) {
            console.error('Error creating farm:', err);
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Si l'utilisateur veut ajouter un animal (et n'a pas skip)
            if (!skipAnimal && firstAnimal.name && firstAnimal.gender && createdFarmId) {
                await AnimalService.add({
                    name: firstAnimal.name,
                    tagId: firstAnimal.tagId || '',
                    gender: firstAnimal.gender as Gender,
                    birthDate: firstAnimal.birthDate || new Date().toISOString().split('T')[0],
                    breed: data.farmInfo.defaultBreed || 'Ladoum',
                    status: 'Active',
                    weight: 0,
                    height: 0,
                    length: 0,
                    chestGirth: 0,
                    photoUrl: firstAnimal.photoUrl || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400',
                    farmId: createdFarmId
                });
            }

            // Marquer l'onboarding comme terminé
            await UserService.completeOnboarding(user.uid);

            // Rafraîchir le profil
            await refreshUserProfile();

            // Stocker le flag pour le tour guidé
            localStorage.setItem('ladoum_show_tour', 'true');

            // Rediriger vers le dashboard
            navigate('/');

        } catch (err: any) {
            console.error('Onboarding error:', err);
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

    // Validation for first animal step
    const canAddAnimal = useMemo(() => {
        return firstAnimal.name.trim() && firstAnimal.gender;
    }, [firstAnimal]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm text-slate-500 mb-2">
                        <span>Étape {currentStep} sur {TOTAL_STEPS}</span>
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    {/* Step indicators */}
                    <div className="flex justify-between mt-3">
                        {[1, 2, 3, 4, 5, 6].map(step => (
                            <div
                                key={step}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step < currentStep
                                    ? 'bg-emerald-500 text-white'
                                    : step === currentStep
                                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 min-h-[480px] flex flex-col">
                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Welcome */}
                    {currentStep === 1 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center mb-6">
                                <span className="text-5xl">🐑</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-3">
                                Bienvenue sur Ladoum STD !
                            </h2>
                            <p className="text-slate-500 max-w-sm">
                                Configurons votre espace en quelques étapes simples pour
                                commencer à gérer votre élevage efficacement.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 text-left">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>Suivi complet de votre cheptel</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>Gestion de la reproduction</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>Comptabilité et inventaire</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span>Gestion de votre équipe</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: User Info */}
                    {currentStep === 2 && (
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Vos informations</h2>
                                    <p className="text-sm text-slate-500">Présentez-vous</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nom complet *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.userInfo.displayName}
                                        onChange={(e) => updateUserInfo('displayName', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Ex: Moustapha Diallo"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        value={data.userInfo.phone}
                                        onChange={(e) => updateUserInfo('phone', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="+221 77 123 45 67"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        Utile pour les notifications et contacts
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Farm Info */}
                    {currentStep === 3 && (
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <Home className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Votre bergerie</h2>
                                    <p className="text-sm text-slate-500">Informations générales</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nom de la bergerie *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.farmInfo.name}
                                        onChange={(e) => updateFarmInfo('name', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Ex: Bergerie Diallo"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Localisation
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={data.farmInfo.location}
                                            onChange={(e) => updateFarmInfo('location', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Ex: Thiès, Sénégal"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Race principale
                                    </label>
                                    <select
                                        value={data.farmInfo.defaultBreed}
                                        onChange={(e) => updateFarmInfo('defaultBreed', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="Ladoum">Ladoum</option>
                                        <option value="Bali-Bali">Bali-Bali</option>
                                        <option value="Touabire">Touabire</option>
                                        <option value="Peul-Peul">Peul-Peul</option>
                                        <option value="Mixed">Mixte</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Farm Size */}
                    {currentStep === 4 && (
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <PawPrint className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Taille du cheptel</h2>
                                    <p className="text-sm text-slate-500">Estimations actuelles</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">
                                        Nombre de sujets (moutons)
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[5, 10, 20, 50, 100, 200, 500].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => updateFarmInfo('estimatedAnimals', num)}
                                                className={`py-3 px-4 rounded-xl font-medium transition-all border-2 ${data.farmInfo.estimatedAnimals === num
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                    }`}
                                            >
                                                {num < 100 ? num : `${num}+`}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Cela nous aide à optimiser l'application pour vous
                                    </p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                                        <Users className="w-4 h-4" />
                                        Nombre d'employés
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[1, 2, 3, 5, 10].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => updateFarmInfo('estimatedEmployees', num)}
                                                className={`py-3 px-4 rounded-xl font-medium transition-all border-2 ${data.farmInfo.estimatedEmployees === num
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                    }`}
                                            >
                                                {num === 1 ? 'Seul' : num === 10 ? '10+' : num}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Vous pourrez inviter votre équipe après l'inscription
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Summary before creating farm */}
                    {currentStep === 5 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center mb-6">
                                <Home className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-3">
                                Création de votre bergerie
                            </h2>
                            <p className="text-slate-500 max-w-sm mb-6">
                                Nous allons créer <strong className="text-slate-700">{data.farmInfo.name}</strong> et vous pourrez ensuite ajouter votre premier mouton.
                            </p>

                            <div className="bg-slate-50 rounded-xl p-4 w-full text-left">
                                <h3 className="text-sm font-medium text-slate-700 mb-3">Récapitulatif :</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span>{data.userInfo.displayName}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <Home className="w-4 h-4 text-slate-400" />
                                        <span>{data.farmInfo.name}</span>
                                    </div>
                                    {data.farmInfo.location && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <span>{data.farmInfo.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-slate-600">
                                        <PawPrint className="w-4 h-4 text-slate-400" />
                                        <span>~{data.farmInfo.estimatedAnimals} sujets • {data.farmInfo.defaultBreed}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Add First Animal */}
                    {currentStep === 6 && (
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <PawPrint className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Votre premier mouton</h2>
                                    <p className="text-sm text-slate-500">Ajoutez votre premier animal</p>
                                </div>
                            </div>

                            {!skipAnimal ? (
                                <div className="space-y-4">
                                    {/* Photo Upload */}
                                    <div className="flex justify-center mb-4">
                                        <div className="relative">
                                            {firstAnimal.photoUrl ? (
                                                <img
                                                    src={firstAnimal.photoUrl}
                                                    alt="Animal"
                                                    className="w-24 h-24 rounded-full object-cover border-4 border-emerald-200"
                                                />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-200">
                                                    <Camera className="w-8 h-8 text-slate-400" />
                                                </div>
                                            )}
                                            <ImageUpload
                                                value={firstAnimal.photoUrl}
                                                onChange={(url: string) => setFirstAnimal(prev => ({ ...prev, photoUrl: url }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Nom *
                                            </label>
                                            <input
                                                type="text"
                                                value={firstAnimal.name}
                                                onChange={(e) => setFirstAnimal(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Ex: Koumba"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                N° Identification
                                            </label>
                                            <input
                                                type="text"
                                                value={firstAnimal.tagId}
                                                onChange={(e) => setFirstAnimal(prev => ({ ...prev, tagId: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Ex: LAD-001"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Sexe *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFirstAnimal(prev => ({ ...prev, gender: 'Male' }))}
                                                className={`py-3 px-4 rounded-xl font-medium transition-all border-2 flex items-center justify-center gap-2 ${firstAnimal.gender === 'Male'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                    }`}
                                            >
                                                ♂️ Mâle
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFirstAnimal(prev => ({ ...prev, gender: 'Female' }))}
                                                className={`py-3 px-4 rounded-xl font-medium transition-all border-2 flex items-center justify-center gap-2 ${firstAnimal.gender === 'Female'
                                                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                    }`}
                                            >
                                                ♀️ Femelle
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Date de naissance
                                        </label>
                                        <input
                                            type="date"
                                            value={firstAnimal.birthDate}
                                            onChange={(e) => setFirstAnimal(prev => ({ ...prev, birthDate: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <button
                                        onClick={() => setSkipAnimal(true)}
                                        className="text-sm text-slate-500 hover:text-slate-700 underline"
                                    >
                                        Passer cette étape →
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Sparkles className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 mb-4">
                                        Vous pourrez ajouter vos animaux depuis le tableau de bord.
                                    </p>
                                    <Button variant="secondary" size="sm" onClick={() => setSkipAnimal(false)}>
                                        Revenir et ajouter un animal
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
                        {currentStep > 1 && currentStep !== 6 ? (
                            <Button
                                variant="secondary"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                <ChevronLeft className="w-5 h-5 mr-1" />
                                Retour
                            </Button>
                        ) : (
                            <div></div>
                        )}

                        {currentStep < 5 && (
                            <Button onClick={handleNext}>
                                Continuer
                                <ChevronRight className="w-5 h-5 ml-1" />
                            </Button>
                        )}

                        {currentStep === 5 && (
                            <Button
                                onClick={handleNext}
                                disabled={loading}
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                            >
                                {loading ? 'Création...' : 'Créer ma bergerie'}
                                <ChevronRight className="w-5 h-5 ml-1" />
                            </Button>
                        )}

                        {currentStep === 6 && (
                            <Button
                                onClick={handleComplete}
                                disabled={loading || (!skipAnimal && !canAddAnimal)}
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600"
                            >
                                {loading ? 'Configuration...' : skipAnimal ? 'Terminer' : 'Ajouter et terminer'} 🚀
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
