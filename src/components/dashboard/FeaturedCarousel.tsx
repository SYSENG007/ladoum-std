import React from 'react';
import type { Animal } from '../../types';
import { Card } from '../ui/Card';
import { ArrowRight, Mars, Venus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeaturedCarouselProps {
    animals: Animal[];
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ animals }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Sujets Vedettes</h2>
                <Link to="/herd" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {animals.map((animal) => (
                    <Card key={animal.id} className="min-w-[280px] snap-center group cursor-pointer relative" noPadding>
                        <div className="aspect-[4/3] relative overflow-hidden">
                            <img
                                src={animal.photoUrl}
                                alt={animal.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white">
                                <h3 className="font-bold text-lg">{animal.name}</h3>
                                <div className="flex items-center gap-2 text-sm opacity-90">
                                    {animal.gender === 'Male' ? <Mars className="w-4 h-4 text-blue-300" /> : <Venus className="w-4 h-4 text-pink-300" />}
                                    <span>{animal.tagId}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
