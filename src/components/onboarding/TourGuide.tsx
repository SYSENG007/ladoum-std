import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import clsx from 'clsx';

export interface TourStep {
    target: string;  // CSS selector
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    highlight?: boolean;
    action?: () => void;  // Optional action when step is reached
}

interface TourGuideProps {
    steps: TourStep[];
    isOpen: boolean;
    onComplete: () => void;
    onSkip?: () => void;
}

export const TourGuide: React.FC<TourGuideProps> = ({
    steps,
    isOpen,
    onComplete,
    onSkip
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const step = steps[currentStep];

    const updatePosition = useCallback(() => {
        if (!step?.target) return;

        const element = document.querySelector(step.target);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        const tooltipHeight = tooltipRef.current?.offsetHeight || 150;
        const tooltipWidth = tooltipRef.current?.offsetWidth || 320;
        const padding = 16;

        let top = 0;
        let left = 0;

        switch (step.placement || 'bottom') {
            case 'top':
                top = rect.top - tooltipHeight - padding;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'bottom':
                top = rect.bottom + padding;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.left - tooltipWidth - padding;
                break;
            case 'right':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.right + padding;
                break;
        }

        // Keep tooltip within viewport
        top = Math.max(padding, Math.min(window.innerHeight - tooltipHeight - padding, top));
        left = Math.max(padding, Math.min(window.innerWidth - tooltipWidth - padding, left));

        setPosition({ top, left });
    }, [step]);

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);

            if (step?.action) {
                step.action();
            }
        }

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [isOpen, currentStep, updatePosition, step]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        if (onSkip) {
            onSkip();
        } else {
            onComplete();
        }
    };

    if (!isOpen) return null;

    const overlay = (
        <div className="fixed inset-0 z-[9998]">
            {/* Backdrop with hole for target */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && step?.highlight !== false && (
                            <rect
                                x={targetRect.left - 8}
                                y={targetRect.top - 8}
                                width={targetRect.width + 16}
                                height={targetRect.height + 16}
                                rx="12"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.6)"
                    mask="url(#tour-mask)"
                    style={{ pointerEvents: 'auto' }}
                />
            </svg>

            {/* Highlight border */}
            {targetRect && step?.highlight !== false && (
                <div
                    className="absolute border-2 border-slate-600 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        pointerEvents: 'none'
                    }}
                />
            )}

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="absolute bg-white rounded-2xl shadow-2xl w-80 animate-fadeIn"
                style={{
                    top: position.top,
                    left: position.left,
                    zIndex: 9999
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-slate-800" />
                        <span className="text-sm font-medium text-slate-900">
                            Tour guidé • {currentStep + 1}/{steps.length}
                        </span>
                    </div>
                    <button
                        onClick={handleSkip}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {step?.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {step?.content}
                    </p>
                </div>

                {/* Progress */}
                <div className="px-4">
                    <div className="flex gap-1">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={clsx(
                                    "h-1 rounded-full flex-1 transition-colors",
                                    idx <= currentStep ? "bg-primary-600" : "bg-slate-200"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 p-4">
                    {currentStep > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrev}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={handleNext}
                    >
                        {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
                        {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(overlay, document.body);
};

// Hook pour gérer le tour
export const useTourGuide = (storageKey: string) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasCompleted, setHasCompleted] = useState(() => {
        return localStorage.getItem(storageKey) === 'completed';
    });

    const startTour = () => setIsOpen(true);
    const endTour = () => {
        setIsOpen(false);
        localStorage.setItem(storageKey, 'completed');
        setHasCompleted(true);
    };
    const resetTour = () => {
        localStorage.removeItem(storageKey);
        setHasCompleted(false);
    };

    return { isOpen, hasCompleted, startTour, endTour, resetTour };
};
