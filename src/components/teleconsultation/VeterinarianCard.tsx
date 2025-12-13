import React from 'react';
import { Star, Video } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Veterinarian } from '../../types/consultation';
import clsx from 'clsx';

interface VeterinarianCardProps {
    vet: Veterinarian;
    selected?: boolean;
    onSelect?: (vet: Veterinarian) => void;
    compact?: boolean;
}

export const VeterinarianCard: React.FC<VeterinarianCardProps> = ({
    vet,
    selected = false,
    onSelect,
    compact = false
}) => {
    const getAvailabilityBadge = () => {
        switch (vet.availability) {
            case 'Available':
                return <Badge variant="success">Disponible</Badge>;
            case 'Busy':
                return <Badge variant="warning">Occupé</Badge>;
            case 'Offline':
                return <Badge variant="neutral">Hors ligne</Badge>;
        }
    };

    const getSpecialtyLabel = () => {
        switch (vet.specialty) {
            case 'General': return 'Généraliste';
            case 'Reproduction': return 'Reproduction';
            case 'Nutrition': return 'Nutrition';
            case 'Surgery': return 'Chirurgie';
        }
    };

    if (compact) {
        return (
            <div
                className={clsx(
                    'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                    selected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 bg-white hover:border-primary-200'
                )}
                onClick={() => onSelect?.(vet)}
            >
                <img
                    src={vet.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(vet.name)}&background=6366f1&color=fff`}
                    alt={vet.name}
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{vet.name}</p>
                    <p className="text-xs text-slate-500">{getSpecialtyLabel()}</p>
                </div>
                {getAvailabilityBadge()}
            </div>
        );
    }

    return (
        <Card
            className={clsx(
                'cursor-pointer transition-all border-2',
                selected
                    ? 'border-primary-500 ring-2 ring-primary-100'
                    : 'border-transparent hover:border-primary-200'
            )}
            onClick={() => onSelect?.(vet)}
        >
            <div className="flex gap-4">
                <img
                    src={vet.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(vet.name)}&background=6366f1&color=fff`}
                    alt={vet.name}
                    className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-100"
                />
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-slate-900">{vet.name}</h4>
                        {getAvailabilityBadge()}
                    </div>
                    <p className="text-sm text-slate-500 mb-2">{getSpecialtyLabel()}</p>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-medium">{vet.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <Video className="w-4 h-4" />
                            <span>{vet.consultationCount} consultations</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
