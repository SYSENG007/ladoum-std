import React, { useState, useEffect } from 'react';
import {
    Store, Plus, Search, PawPrint, Wheat, Wrench, Truck,
    Package, CheckCircle, Clock, Tag, Filter
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ListingCard } from '../components/marketplace/ListingCard';
import { AddListingModal } from '../components/marketplace/AddListingModal';
import { EditListingModal } from '../components/marketplace/EditListingModal';
import { ListingDetailsModal } from '../components/marketplace/ListingDetailsModal';
import { MarketplaceService } from '../services/MarketplaceService';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../context/SettingsContext';
import clsx from 'clsx';
import type { Listing, ListingCategory, ListingStatus, SenegalRegion } from '../types';

const REGIONS: SenegalRegion[] = [
    'Dakar', 'Thiès', 'Diourbel', 'Saint-Louis', 'Louga',
    'Matam', 'Tambacounda', 'Kédougou', 'Kolda', 'Sédhiou',
    'Ziguinchor', 'Fatick', 'Kaolack', 'Kaffrine'
];

export const Marketplace: React.FC = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'all'>('all');
    const [selectedStatus, setSelectedStatus] = useState<ListingStatus | 'all'>('all');
    const [selectedRegion, setSelectedRegion] = useState<SenegalRegion | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);

    const categories: { value: ListingCategory | 'all'; label: string; icon: React.ReactNode }[] = [
        { value: 'all', label: t('common.all'), icon: <Package className="w-4 h-4" /> },
        { value: 'Animal', label: t('marketplace.category.animal'), icon: <PawPrint className="w-4 h-4" /> },
        { value: 'Feed', label: t('marketplace.category.feed'), icon: <Wheat className="w-4 h-4" /> },
        { value: 'Equipment', label: t('marketplace.category.equipment'), icon: <Wrench className="w-4 h-4" /> },
        { value: 'Service', label: t('marketplace.category.service'), icon: <Truck className="w-4 h-4" /> },
    ];

    const statuses: { value: ListingStatus | 'all'; label: string; icon: React.ReactNode }[] = [
        { value: 'all', label: t('common.all'), icon: <Package className="w-4 h-4" /> },
        { value: 'Available', label: t('marketplace.status.available'), icon: <CheckCircle className="w-4 h-4" /> },
        { value: 'Reserved', label: t('marketplace.status.reserved'), icon: <Clock className="w-4 h-4" /> },
        { value: 'Sold', label: t('marketplace.status.sold'), icon: <Tag className="w-4 h-4" /> },
    ];

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<Listing | null>(null);
    const [viewingListing, setViewingListing] = useState<Listing | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        listing: Listing | null;
    }>({ isOpen: false, listing: null });

    // Load listings
    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        try {
            setLoading(true);
            const data = await MarketplaceService.getAll();
            setListings(data);
        } catch (err) {
            console.error('Error loading listings:', err);
            setError(t('marketplace.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (listing: Listing) => {
        setDeleteDialog({ isOpen: true, listing });
    };

    const confirmDelete = async () => {
        if (!deleteDialog.listing) return;
        try {
            await MarketplaceService.delete(deleteDialog.listing.id);
            await loadListings();
            setDeleteDialog({ isOpen: false, listing: null });
            toast.success(t('marketplace.deleteSuccess'));
        } catch (err) {
            console.error('Error deleting listing:', err);
            toast.error(t('marketplace.deleteError'));
        }
    };

    const handleStatusChange = async (listing: Listing, newStatus: ListingStatus) => {
        try {
            await MarketplaceService.updateStatus(listing.id, newStatus);
            await loadListings();
            toast.success(t('marketplace.statusUpdateSuccess').replace('{status}',
                newStatus === 'Available' ? t('marketplace.status.available')
                    : newStatus === 'Reserved' ? t('marketplace.status.reserved')
                        : t('marketplace.status.sold')
            ));
            if (viewingListing?.id === listing.id) {
                setViewingListing({ ...listing, status: newStatus });
            }
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error(t('marketplace.statusUpdateError'));
        }
    };

    // Filter listings
    const filteredListings = listings.filter(listing => {
        const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            listing.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || listing.category === selectedCategory;
        const matchesStatus = selectedStatus === 'all' || listing.status === selectedStatus;
        const matchesRegion = selectedRegion === 'all' || listing.region === selectedRegion;
        return matchesSearch && matchesCategory && matchesStatus && matchesRegion;
    });

    // Stats
    const availableCount = listings.filter(l => l.status === 'Available').length;
    const totalCount = listings.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Store className="w-7 h-7 text-primary-600" />
                        {t('marketplace.title')}
                    </h1>
                    <p className="text-slate-500">{t('marketplace.subtitle')}</p>
                </div>
                <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>
                    {t('marketplace.new')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Package className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('marketplace.totalListings')}</p>
                            <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('marketplace.availableListings')}</p>
                            <p className="text-2xl font-bold text-green-600">{availableCount}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary-100 rounded-lg">
                            <PawPrint className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t('marketplace.animalListings')}</p>
                            <p className="text-2xl font-bold text-primary-600">
                                {listings.filter(l => l.category === 'Animal').length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
                {/* Search & Toggle */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('marketplace.search')}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                            showFilters ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        {t('marketplace.filter')}
                    </button>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                                selectedCategory === cat.value
                                    ? "bg-primary-100 text-primary-700"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Additional Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">{t('common.status')}</label>
                            <div className="flex flex-wrap gap-2">
                                {statuses.map(status => (
                                    <button
                                        key={status.value}
                                        onClick={() => setSelectedStatus(status.value)}
                                        className={clsx(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                                            selectedStatus === status.value
                                                ? status.value === 'Available' ? 'bg-green-100 text-green-700 border-green-200'
                                                    : status.value === 'Reserved' ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                        : status.value === 'Sold' ? 'bg-red-100 text-red-700 border-red-200'
                                                            : 'bg-primary-100 text-primary-700 border-primary-200'
                                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                        )}
                                    >
                                        {status.icon}
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Region Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Région</label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value as SenegalRegion | 'all')}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">{t('marketplace.allRegions')}</option>
                                {REGIONS.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Listings Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-500">{t('marketplace.loading')}</p>
                </div>
            ) : error ? (
                <div className="text-center py-12 text-red-500 bg-red-50 rounded-xl border border-red-200">
                    <p>{error}</p>
                    <Button variant="secondary" onClick={loadListings} className="mt-4">
                        {t('marketplace.retry')}
                    </Button>
                </div>
            ) : filteredListings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                    <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">{t('marketplace.noListings')}</h3>
                    <p className="text-slate-500 mb-4">
                        {listings.length === 0
                            ? t('marketplace.createFirst')
                            : t('marketplace.adjustFilters')
                        }
                    </p>
                    {listings.length === 0 && (
                        <Button onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('marketplace.create')}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map(listing => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            onEdit={setEditingListing}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                            onClick={setViewingListing}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <AddListingModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={async () => {
                    setIsAddModalOpen(false);
                    await loadListings();
                }}
            />

            {editingListing && (
                <EditListingModal
                    isOpen={true}
                    onClose={() => setEditingListing(null)}
                    onSuccess={async () => {
                        setEditingListing(null);
                        await loadListings();
                    }}
                    listing={editingListing}
                />
            )}

            {viewingListing && (
                <ListingDetailsModal
                    isOpen={true}
                    onClose={() => setViewingListing(null)}
                    listing={viewingListing}
                    onStatusChange={handleStatusChange}
                />
            )}

            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title={t('marketplace.deleteTitle')}
                message={t('marketplace.deleteConfirm').replace('{title}', deleteDialog.listing?.title || '')}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, listing: null })}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                variant="danger"
            />
        </div>
    );
};
