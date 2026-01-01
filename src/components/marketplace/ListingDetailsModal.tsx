import React from 'react';
import {
    X, PawPrint, Wheat, Wrench, Truck, MapPin, Phone, MessageCircle,
    Calendar, Ruler, Weight, ChevronLeft, ChevronRight, Check, Clock, Tag
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import clsx from 'clsx';
import type { Listing, ListingStatus } from '../../types';

interface ListingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    listing: Listing;
    onStatusChange?: (listing: Listing, newStatus: ListingStatus) => void;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
    isOpen,
    onClose,
    listing,
    onStatusChange
}) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);

    const photos = listing.photos?.length > 0
        ? listing.photos
        : (listing.animalData?.photoUrl ? [listing.animalData.photoUrl] : []);

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'Animal': return 'Animal';
            case 'Feed': return 'Aliment';
            case 'Equipment': return 'Matériel';
            case 'Service': return 'Service';
            default: return category;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Animal': return <PawPrint className="w-5 h-5" />;
            case 'Feed': return <Wheat className="w-5 h-5" />;
            case 'Equipment': return <Wrench className="w-5 h-5" />;
            case 'Service': return <Truck className="w-5 h-5" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: ListingStatus) => {
        switch (status) {
            case 'Available':
                return <Badge variant="success" className="flex items-center gap-1 text-base px-4 py-2"><Check className="w-4 h-4" />Disponible</Badge>;
            case 'Reserved':
                return <Badge variant="warning" className="flex items-center gap-1 text-base px-4 py-2"><Clock className="w-4 h-4" />Réservé</Badge>;
            case 'Sold':
                return <Badge variant="neutral" className="flex items-center gap-1 text-base px-4 py-2"><Tag className="w-4 h-4" />Vendu</Badge>;
            case 'Closed':
                return <Badge variant="neutral" className="text-base px-4 py-2">Fermé</Badge>;
        }
    };

    const formatPrice = (price: number, currency: string) => {
        if (currency === 'XOF') {
            return new Intl.NumberFormat('fr-SN', {
                style: 'decimal',
                maximumFractionDigits: 0
            }).format(price) + ' FCFA';
        }
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    };

    const calculateAge = (birthDate: string) => {
        const birth = new Date(birthDate);
        const now = new Date();
        const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
        if (months < 12) {
            return `${months} mois`;
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return remainingMonths > 0 ? `${years} an${years > 1 ? 's' : ''} ${remainingMonths} mois` : `${years} an${years > 1 ? 's' : ''}`;
    };

    const handleWhatsAppClick = () => {
        if (listing.sellerWhatsapp) {
            const message = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce: ${listing.title}`);
            window.open(`https://wa.me/${listing.sellerWhatsapp}?text=${message}`, '_blank');
        }
    };

    const handlePhoneClick = () => {
        if (listing.sellerPhone) {
            window.open(`tel:${listing.sellerPhone}`, '_blank');
        }
    };

    const nextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    };

    const prevPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        {getCategoryIcon(listing.category)}
                        <span className="text-sm font-medium text-slate-500">{getCategoryLabel(listing.category)}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div className="grid md:grid-cols-2 gap-6 p-6">
                        {/* Left: Photos */}
                        <div className="space-y-4">
                            {/* Main Photo */}
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                                {photos.length > 0 ? (
                                    <>
                                        <img
                                            src={photos[currentPhotoIndex]}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600?text=Photo';
                                            }}
                                        />
                                        {photos.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevPhoto}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                                                >
                                                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                                                </button>
                                                <button
                                                    onClick={nextPhoto}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                                                >
                                                    <ChevronRight className="w-5 h-5 text-slate-700" />
                                                </button>
                                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                                                    {photos.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setCurrentPhotoIndex(index)}
                                                            className={clsx(
                                                                "w-2 h-2 rounded-full transition-colors",
                                                                index === currentPhotoIndex ? "bg-white" : "bg-white/50"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <PawPrint className="w-20 h-20" />
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {photos.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {photos.map((photo, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentPhotoIndex(index)}
                                            className={clsx(
                                                "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                                                index === currentPhotoIndex ? "border-primary-500" : "border-transparent opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <img
                                                src={photo}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Details */}
                        <div className="space-y-6">
                            {/* Status & Price */}
                            <div className="flex items-start justify-between">
                                {getStatusBadge(listing.status)}
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-primary-600">
                                        {formatPrice(listing.price, listing.currency)}
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="w-5 h-5" />
                                <span>{listing.region}{listing.city ? `, ${listing.city}` : ''}</span>
                            </div>

                            {/* Description */}
                            {listing.description && (
                                <div className="text-slate-600 whitespace-pre-wrap">
                                    {listing.description}
                                </div>
                            )}

                            {/* Animal Details */}
                            {listing.category === 'Animal' && listing.animalData && (
                                <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                                    <h3 className="font-bold text-slate-900">Caractéristiques de l'animal</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <PawPrint className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Sexe</p>
                                                <p className="font-medium">{listing.animalData.gender === 'Male' ? 'Bélier' : 'Brebis'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Âge</p>
                                                <p className="font-medium">{calculateAge(listing.animalData.birthDate)}</p>
                                            </div>
                                        </div>

                                        {listing.animalData.weight && (
                                            <div className="flex items-center gap-2">
                                                <Weight className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Poids</p>
                                                    <p className="font-medium">{listing.animalData.weight} kg</p>
                                                </div>
                                            </div>
                                        )}

                                        {listing.animalData.height_hg && (
                                            <div className="flex items-center gap-2">
                                                <Ruler className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">HG</p>
                                                    <p className="font-medium">{listing.animalData.height_hg} cm</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Measurements */}
                                    {(listing.animalData.height_hg || listing.animalData.length_lcs || listing.animalData.chest_tp) && (
                                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                                            {listing.animalData.height_hg && (
                                                <div className="text-center p-2 bg-white rounded-lg">
                                                    <p className="text-xs text-slate-500">Garrot (HG)</p>
                                                    <p className="text-lg font-bold text-slate-900">{listing.animalData.height_hg} cm</p>
                                                </div>
                                            )}
                                            {listing.animalData.length_lcs && (
                                                <div className="text-center p-2 bg-white rounded-lg">
                                                    <p className="text-xs text-slate-500">Longueur (LCS)</p>
                                                    <p className="text-lg font-bold text-slate-900">{listing.animalData.length_lcs} cm</p>
                                                </div>
                                            )}
                                            {listing.animalData.chest_tp && (
                                                <div className="text-center p-2 bg-white rounded-lg">
                                                    <p className="text-xs text-slate-500">Poitrine (TP)</p>
                                                    <p className="text-lg font-bold text-slate-900">{listing.animalData.chest_tp} cm</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Pedigree */}
                                    {(listing.animalData.sireName || listing.animalData.damName) && (
                                        <div className="pt-3 border-t border-slate-200">
                                            <p className="text-xs text-slate-500 mb-2">Lignée</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {listing.animalData.sireName && (
                                                    <div className="p-2 bg-secondary-50 rounded-lg">
                                                        <p className="text-xs text-primary-600">Père</p>
                                                        <p className="font-medium text-blue-900">{listing.animalData.sireName}</p>
                                                    </div>
                                                )}
                                                {listing.animalData.damName && (
                                                    <div className="p-2 bg-pink-50 rounded-lg">
                                                        <p className="text-xs text-pink-600">Mère</p>
                                                        <p className="font-medium text-pink-900">{listing.animalData.damName}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Seller Info */}
                            <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                                <h3 className="font-bold text-slate-900">Vendeur</h3>
                                <p className="text-lg font-medium text-slate-700">{listing.sellerName}</p>

                                <div className="flex gap-3">
                                    {listing.sellerWhatsapp && (
                                        <Button
                                            onClick={handleWhatsAppClick}
                                            className="flex-1 bg-green-500 hover:bg-green-600"
                                        >
                                            <MessageCircle className="w-5 h-5 mr-2" />
                                            WhatsApp
                                        </Button>
                                    )}
                                    {listing.sellerPhone && (
                                        <Button
                                            onClick={handlePhoneClick}
                                            variant="secondary"
                                            className="flex-1"
                                        >
                                            <Phone className="w-5 h-5 mr-2" />
                                            Appeler
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Status Actions */}
                            {onStatusChange && listing.status !== 'Sold' && listing.status !== 'Closed' && (
                                <div className="flex gap-3">
                                    {listing.status === 'Available' && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => onStatusChange(listing, 'Reserved')}
                                            className="flex-1"
                                        >
                                            <Clock className="w-4 h-4 mr-2" />
                                            Marquer Réservé
                                        </Button>
                                    )}
                                    {listing.status === 'Reserved' && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => onStatusChange(listing, 'Sold')}
                                            className="flex-1"
                                        >
                                            <Tag className="w-4 h-4 mr-2" />
                                            Marquer Vendu
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
