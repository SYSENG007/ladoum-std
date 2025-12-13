import React from 'react';
import {
    PawPrint, Wheat, Wrench, Truck, MoreVertical, Edit2, Trash2,
    MapPin, Phone, MessageCircle, Check, Clock, Tag
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import clsx from 'clsx';
import type { Listing, ListingCategory, ListingStatus } from '../../types';

interface ListingCardProps {
    listing: Listing;
    onEdit?: (listing: Listing) => void;
    onDelete?: (listing: Listing) => void;
    onStatusChange?: (listing: Listing, newStatus: ListingStatus) => void;
    onClick?: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
    listing,
    onEdit,
    onDelete,
    onStatusChange,
    onClick
}) => {
    const [menuOpen, setMenuOpen] = React.useState(false);

    const getCategoryIcon = (category: ListingCategory) => {
        switch (category) {
            case 'Animal': return <PawPrint className="w-4 h-4" />;
            case 'Feed': return <Wheat className="w-4 h-4" />;
            case 'Equipment': return <Wrench className="w-4 h-4" />;
            case 'Service': return <Truck className="w-4 h-4" />;
        }
    };

    const getCategoryLabel = (category: ListingCategory) => {
        switch (category) {
            case 'Animal': return 'Animal';
            case 'Feed': return 'Aliment';
            case 'Equipment': return 'Matériel';
            case 'Service': return 'Service';
        }
    };

    const getStatusBadge = (status: ListingStatus) => {
        switch (status) {
            case 'Available':
                return <Badge variant="success" className="flex items-center gap-1"><Check className="w-3 h-3" />Disponible</Badge>;
            case 'Reserved':
                return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" />Réservé</Badge>;
            case 'Sold':
                return <Badge variant="neutral" className="flex items-center gap-1"><Tag className="w-3 h-3" />Vendu</Badge>;
            case 'Closed':
                return <Badge variant="neutral">Fermé</Badge>;
        }
    };

    const getNextStatus = (currentStatus: ListingStatus): ListingStatus | null => {
        switch (currentStatus) {
            case 'Available': return 'Reserved';
            case 'Reserved': return 'Sold';
            default: return null;
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

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.action-menu')) return;
        onClick?.(listing);
    };

    const handleWhatsAppClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (listing.sellerWhatsapp) {
            const message = encodeURIComponent(`Bonjour, je suis intéressé par votre annonce: ${listing.title}`);
            window.open(`https://wa.me/${listing.sellerWhatsapp}?text=${message}`, '_blank');
        }
    };

    const handlePhoneClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (listing.sellerPhone) {
            window.open(`tel:${listing.sellerPhone}`, '_blank');
        }
    };

    const primaryPhoto = listing.photos?.[0] || (listing.animalData?.photoUrl) || '/placeholder-animal.jpg';

    return (
        <Card
            className={clsx(
                "relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group",
                listing.status === 'Sold' && "opacity-75"
            )}
            onClick={handleCardClick}
        >
            {/* Photo */}
            <div className="relative h-48 -mx-4 -mt-4 mb-4 overflow-hidden">
                <img
                    src={primaryPhoto}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Photo';
                    }}
                />
                <div className="absolute top-3 left-3">
                    {getStatusBadge(listing.status)}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-slate-700">
                    {getCategoryIcon(listing.category)}
                    <span>{getCategoryLabel(listing.category)}</span>
                </div>
                {listing.photos?.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        +{listing.photos.length - 1} photos
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="space-y-3">
                <div>
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{listing.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{listing.description}</p>
                </div>

                {/* Animal Data Quick Stats */}
                {listing.category === 'Animal' && listing.animalData && (
                    <div className="flex gap-3 text-xs bg-slate-50 rounded-lg p-2">
                        {listing.animalData.weight && (
                            <span className="text-slate-600">{listing.animalData.weight} kg</span>
                        )}
                        {listing.animalData.height_hg && (
                            <span className="text-slate-600">HG: {listing.animalData.height_hg} cm</span>
                        )}
                        {listing.animalData.length_lcs && (
                            <span className="text-slate-600">LCS: {listing.animalData.length_lcs} cm</span>
                        )}
                    </div>
                )}

                {/* Price */}
                <div className="text-2xl font-bold text-primary-600">
                    {formatPrice(listing.price, listing.currency)}
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span>{listing.region}{listing.city ? `, ${listing.city}` : ''}</span>
                </div>

                {/* Contact Buttons */}
                <div className="flex gap-2 pt-2">
                    {listing.sellerWhatsapp && (
                        <button
                            onClick={handleWhatsAppClick}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </button>
                    )}
                    {listing.sellerPhone && (
                        <button
                            onClick={handlePhoneClick}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Phone className="w-4 h-4" />
                            Appeler
                        </button>
                    )}
                </div>
            </div>

            {/* Action Menu */}
            <div className="action-menu absolute top-16 right-4 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(!menuOpen);
                    }}
                    className="p-2 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                >
                    <MoreVertical className="w-4 h-4 text-slate-600" />
                </button>

                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-20">
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(listing);
                                    setMenuOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                            >
                                <Edit2 className="w-4 h-4" />
                                Modifier
                            </button>
                        )}
                        {onStatusChange && getNextStatus(listing.status) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const nextStatus = getNextStatus(listing.status);
                                    if (nextStatus) onStatusChange(listing, nextStatus);
                                    setMenuOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                            >
                                {listing.status === 'Available' ? (
                                    <><Clock className="w-4 h-4" />Marquer Réservé</>
                                ) : (
                                    <><Tag className="w-4 h-4" />Marquer Vendu</>
                                )}
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(listing);
                                    setMenuOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};
