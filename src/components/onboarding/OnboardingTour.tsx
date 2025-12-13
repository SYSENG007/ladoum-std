import React, { useEffect } from 'react';
import { TourGuide, useTourGuide } from './TourGuide';
import type { TourStep } from './TourGuide';

const TOUR_STEPS: TourStep[] = [
    {
        target: '[data-tour="dashboard"]',
        title: '📊 Tableau de Bord',
        content: 'Votre centre de contrôle ! Ici vous voyez un aperçu de votre élevage: statistiques, animaux vedettes, et tâches récentes.',
        placement: 'bottom'
    },
    {
        target: '[data-tour="herd"]',
        title: '🐑 Gestion du Troupeau',
        content: 'Consultez tous vos animaux, ajoutez-en de nouveaux, et suivez leur historique complet (poids, santé, reproduction).',
        placement: 'right'
    },
    {
        target: '[data-tour="tasks"]',
        title: '📋 Tâches & Planning',
        content: 'Organisez votre travail avec des tâches: vaccinations, pesées, nettoyage. Vue Kanban ou calendrier disponible.',
        placement: 'right'
    },
    {
        target: '[data-tour="reproduction"]',
        title: '💕 Reproduction',
        content: 'Suivez les cycles, prédisez les chaleurs, enregistrez les naissances et simulez des croisements.',
        placement: 'right'
    },
    {
        target: '[data-tour="inventory"]',
        title: '📦 Inventaire',
        content: 'Gérez votre stock: alimentation, médicaments, équipements. Alertes automatiques quand le stock est bas.',
        placement: 'right'
    },
    {
        target: '[data-tour="add-animal"]',
        title: '➕ Ajouter un Animal',
        content: 'Cliquez ici pour ajouter un nouveau mouton à votre troupeau. Vous pouvez également le faire depuis la page Troupeau.',
        placement: 'bottom',
        highlight: true
    }
];

interface OnboardingTourProps {
    autoStart?: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ autoStart = true }) => {
    const { isOpen, hasCompleted, startTour, endTour } = useTourGuide('ladoum_dashboard_tour');

    useEffect(() => {
        // Check if we should start the tour (from onboarding completion)
        const shouldShowTour = localStorage.getItem('ladoum_show_tour') === 'true';

        if (autoStart && shouldShowTour && !hasCompleted) {
            // Small delay to let the page render
            const timer = setTimeout(() => {
                startTour();
                localStorage.removeItem('ladoum_show_tour');
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [autoStart, hasCompleted, startTour]);

    return (
        <TourGuide
            steps={TOUR_STEPS}
            isOpen={isOpen}
            onComplete={endTour}
            onSkip={endTour}
        />
    );
};

// Export for manual tour trigger
export { useTourGuide } from './TourGuide';
