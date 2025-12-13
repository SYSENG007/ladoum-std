import React, { useState, useEffect } from 'react';
import { X, PawPrint, Wheat, Wrench, Truck, Plus, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ImageUpload } from '../ui/ImageUpload';
import { MarketplaceService } from '../../services/MarketplaceService';
import { useAnimals } from '../../hooks/useAnimals';
import type {
    Listing, ListingCategory, ListingStatus, ServiceType,
    SenegalRegion, ListingAnimalData
} from '../../types';

interface EditListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    listing: Listing;
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

const STATUSES: { value: ListingStatus; label: string }[] = [
    { value: 'Available', label: 'Disponible' },
    { value: 'Reserved', label: 'Réservé' },
    { value: 'Sold', label: 'Vendu' },
    { value: 'Closed', label: 'Fermé' },
];

export const EditListingModal: React.FC<EditListingModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    listing
}) => {
    const { animals } = useAnimals();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [category, setCategory] = useState<ListingCategory>(listing.category);
    const [status, setStatus] = useState<ListingStatus>(listing.status);
    const [title, setTitle] = useState(listing.title);
    const [description, setDescription] = useState(listing.description);
    const [price, setPrice] = useState(listing.price.toString());
    const [currency, setCurrency] = useState<'XOF' | 'EUR'>(listing.currency);
    const [region, setRegion] = useState<SenegalRegion>(listing.region);
    const [city, setCity] = useState(listing.city || '');
    const [sellerName, setSellerName] = useState(listing.sellerName);
    const [sellerPhone, setSellerPhone] = useState(listing.sellerPhone || '');
    const [sellerWhatsapp, setSellerWhatsapp] = useState(listing.sellerWhatsapp || '');
    const [photos, setPhotos] = useState<string[]>(listing.photos || []);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

    // Animal-specific
    const [selectedAnimalId, setSelectedAnimalId] = useState<string>(listing.animalId || '');

    // Service-specific
    const [serviceType, setServiceType] = useState<ServiceType>(listing.serviceType || 'Transport');

    // Reset form when listing changes
    useEffect(() => {
        if (isOpen && listing) {
            setCategory(listing.category);
            setStatus(listing.status);
            setTitle(listing.title);
            setDescription(listing.description);
            setPrice(listing.price.toString());
            setCurrency(listing.currency);
            setRegion(listing.region);
            setCity(listing.city || '');
            setSellerName(listing.sellerName);
            setSellerPhone(listing.sellerPhone || '');
            setSellerWhatsapp(listing.sellerWhatsapp || '');
            setPhotos(listing.photos || []);
            setCurrentPhotoUrl('');
            setSelectedAnimalId(listing.animalId || '');
            setServiceType(listing.serviceType || 'Transport');
            setError(null);
        }
    }, [isOpen, listing]);

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
            const updates: Partial<Listing> = {
                title: title.trim(),
                description: description.trim(),
                category,
                status,
                price: parseFloat(price),
                currency,
                photos,
                region,
                city: city.trim() || undefined,
                sellerName: sellerName.trim(),
                sellerPhone: sellerPhone.trim() || undefined,
                sellerWhatsapp: sellerWhatsapp.trim() || undefined,
            };

            // Add animal-specific data
            if (category === 'Animal' && selectedAnimalId) {
                updates.animalId = selectedAnimalId;
                updates.animalData = getAnimalData(selectedAnimalId);
            } else {
                updates.animalId = undefined;
                updates.animalData = undefined;
            }

            // Add service-specific data
            if (category === 'Service') {
                updates.serviceType = serviceType;
            } else {
                updates.serviceType = undefined;
            }

            await MarketplaceService.update(listing.id, updates);
            onSuccess(); // Parent will handle closing and refreshing
        } catch (err) {
            console.error('Error updating listing:', err);
            setError('Erreur lors de la mise à jour de l\'annonce');
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
                    <h2 className="text-xl font-bold text-slate-900">Modifier l'annonce</h2>
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

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Statut</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ListingStatus)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            {STATUSES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Catégorie *</label>
                        <div className="grid grid-cols-4 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${category === cat.value
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                        }`}
                                >
                                    {cat.icon}
                                    <span className="text-sm font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Animal Selector */}
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

                    {/* Service Type */}
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
                        <label className="block text-sm font-medium text-slate-700">Titre *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
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
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Photos */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Photos</label>

                        {photos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={photo}
                                            alt={`Photo ${index + 1}`}
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

                        <ImageUpload
                            value={currentPhotoUrl}
                            onChange={setCurrentPhotoUrl}
                            label=""
                        />
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
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">WhatsApp</label>
                                <input
                                    type="tel"
                                    value={sellerWhatsapp}
                                    onChange={(e) => setSellerWhatsapp(e.target.value)}
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
                                Enregistrement...
                            </>
                        ) : (
                            'Enregistrer'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
