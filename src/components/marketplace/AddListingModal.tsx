import React, { useState, useEffect } from 'react';
import { X, PawPrint, Wheat, Wrench, Truck, Plus, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ImageUpload } from '../ui/ImageUpload';
import { MarketplaceService } from '../../services/MarketplaceService';
import { useAnimals } from '../../hooks/useAnimals';
import { useFarm } from '../../context/FarmContext';
import type {
    Listing, ListingCategory, ListingStatus, ServiceType,
    SenegalRegion, ListingAnimalData
} from '../../types';

interface AddListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES: { value: ListingCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'Animal', label: 'Animal', icon: <PawPrint className="w-5 h-5" /> },
    { value: 'Feed', label: 'Aliment', icon: <Wheat className="w-5 h-5" /> },
    { value: 'Equipment', label: 'Matériel', icon: <Wrench className="w-5 h-5" /> },
    { value: 'Service', label: 'Service', icon: <Truck className="w-5 h-5" /> },
];

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
    { value: 'Transport', label: 'Transport' },
    { value: 'Insemination', label: 'Insémination' },
    { value: 'Veterinary', label: 'Vétérinaire' },
    { value: 'Consultation', label: 'Conseil' },
    { value: 'Other', label: 'Autre' },
];

const REGIONS: SenegalRegion[] = [
    'Dakar', 'Thiès', 'Diourbel', 'Saint-Louis', 'Louga',
    'Matam', 'Tambacounda', 'Kédougou', 'Kolda', 'Sédhiou',
    'Ziguinchor', 'Fatick', 'Kaolack', 'Kaffrine'
];

export const AddListingModal: React.FC<AddListingModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const { animals } = useAnimals();
    const { currentFarm } = useFarm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [category, setCategory] = useState<ListingCategory>('Animal');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState<'XOF' | 'EUR'>('XOF');
    const [region, setRegion] = useState<SenegalRegion>('Dakar');
    const [city, setCity] = useState('');
    const [sellerName, setSellerName] = useState('');
    const [sellerPhone, setSellerPhone] = useState('');
    const [sellerWhatsapp, setSellerWhatsapp] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

    // Animal-specific
    const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');

    // Service-specific
    const [serviceType, setServiceType] = useState<ServiceType>('Transport');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCategory('Animal');
            setTitle('');
            setDescription('');
            setPrice('');
            setCurrency('XOF');
            setRegion('Dakar');
            setCity('');
            setSellerName('');
            setSellerPhone('');
            setSellerWhatsapp('');
            setPhotos([]);
            setCurrentPhotoUrl('');
            setSelectedAnimalId('');
            setServiceType('Transport');
            setError(null);
        }
    }, [isOpen]);

    // Auto-fill from selected animal
    useEffect(() => {
        if (selectedAnimalId && category === 'Animal') {
            const animal = animals.find(a => a.id === selectedAnimalId);
            if (animal) {
                setTitle(`${animal.name} - ${animal.gender === 'Male' ? 'Bélier' : 'Brebis'} Ladoum`);
                if (animal.photoUrl && !photos.includes(animal.photoUrl)) {
                    setPhotos(prev => [animal.photoUrl, ...prev.filter(p => p !== animal.photoUrl)]);
                }
            }
        }
    }, [selectedAnimalId, animals, category, photos]);

    const getAnimalData = (animalId: string): ListingAnimalData | undefined => {
        const animal = animals.find(a => a.id === animalId);
        if (!animal) return undefined;

        const sire = animal.sireId ? animals.find(a => a.id === animal.sireId) : undefined;
        const dam = animal.damId ? animals.find(a => a.id === animal.damId) : undefined;

        return {
            name: animal.name,
            gender: animal.gender,
            birthDate: animal.birthDate,
            weight: animal.weight,
            height_hg: animal.height,
            length_lcs: animal.length,
            chest_tp: animal.chestGirth,
            sireId: animal.sireId,
            sireName: sire?.name,
            damId: animal.damId,
            damName: dam?.name,
            photoUrl: animal.photoUrl
        };
    };

    const handleAddPhoto = () => {
        if (currentPhotoUrl && !photos.includes(currentPhotoUrl)) {
            setPhotos([...photos, currentPhotoUrl]);
            setCurrentPhotoUrl('');
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError('Le titre est requis');
            return;
        }
        if (!price || parseFloat(price) <= 0) {
            setError('Le prix doit être supérieur à 0');
            return;
        }
        if (!sellerName.trim()) {
            setError('Le nom du vendeur est requis');
            return;
        }

        setLoading(true);

        try {
            const listingData: Omit<Listing, 'id'> = {
                title: title.trim(),
                description: description.trim(),
                category,
                status: 'Available' as ListingStatus,
                price: parseFloat(price),
                currency,
                photos,
                region,
                city: city.trim() || undefined,
                sellerName: sellerName.trim(),
                sellerPhone: sellerPhone.trim() || undefined,
                sellerWhatsapp: sellerWhatsapp.trim() || undefined,
                farmId: currentFarm?.id || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'current-user', // TODO: Get from auth context
            };

            // Add animal-specific data
            if (category === 'Animal' && selectedAnimalId) {
                listingData.animalId = selectedAnimalId;
                listingData.animalData = getAnimalData(selectedAnimalId);
            }

            // Add service-specific data
            if (category === 'Service') {
                listingData.serviceType = serviceType;
            }

            await MarketplaceService.add(listingData);
            onSuccess(); // Parent will handle closing and refreshing
        } catch (err) {
            console.error('Error creating listing:', err);
            setError('Erreur lors de la création de l\'annonce');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Nouvelle Annonce</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Category Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Catégorie *</label>
                        <div className="grid grid-cols-4 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`flex flex - col items - center gap - 2 p - 4 rounded - xl border - 2 transition - all ${category === cat.value
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        } `}
                                >
                                    {cat.icon}
                                    <span className="text-sm font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Animal Selector (if Animal category) */}
                    {category === 'Animal' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Sélectionner un animal de votre troupeau
                            </label>
                            <select
                                value={selectedAnimalId}
                                onChange={(e) => setSelectedAnimalId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">-- Choisir un animal --</option>
                                {animals.filter(a => a.status === 'Active').map(animal => (
                                    <option key={animal.id} value={animal.id}>
                                        {animal.name} - {animal.gender === 'Male' ? 'Bélier' : 'Brebis'}
                                        {animal.weight ? ` (${animal.weight}kg)` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Service Type (if Service category) */}
                    {category === 'Service' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Type de service *</label>
                            <select
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {SERVICE_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Titre de l'annonce *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Bélier Ladoum pure race - 2 ans"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Décrivez votre annonce en détail..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Price */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Prix *</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Devise</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as 'XOF' | 'EUR')}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="XOF">FCFA</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Région *</label>
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value as SenegalRegion)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {REGIONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Ville</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ex: Pikine"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Photos */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Photos</label>

                        {/* Photo thumbnails */}
                        {photos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={photo}
                                            alt={`Photo ${index + 1} `}
                                            className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePhoto(index)}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add photo */}
                        <div className="flex gap-2">
                            <ImageUpload
                                value={currentPhotoUrl}
                                onChange={setCurrentPhotoUrl}
                                label=""
                            />
                        </div>
                        {currentPhotoUrl && (
                            <Button type="button" variant="secondary" onClick={handleAddPhoto}>
                                <Plus className="w-4 h-4 mr-2" />
                                Ajouter cette photo
                            </Button>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                        <h3 className="font-medium text-slate-900">Informations de contact</h3>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Nom du vendeur *</label>
                            <input
                                type="text"
                                value={sellerName}
                                onChange={(e) => setSellerName(e.target.value)}
                                placeholder="Votre nom"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">Téléphone</label>
                                <input
                                    type="tel"
                                    value={sellerPhone}
                                    onChange={(e) => setSellerPhone(e.target.value)}
                                    placeholder="+221 77 000 00 00"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">WhatsApp</label>
                                <input
                                    type="tel"
                                    value={sellerWhatsapp}
                                    onChange={(e) => setSellerWhatsapp(e.target.value)}
                                    placeholder="+221 77 000 00 00"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Publication...
                            </>
                        ) : (
                            'Publier l\'annonce'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
