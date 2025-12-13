import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireOnboarding = true
}) => {
    const { user, userProfile, loading } = useAuth();
    const location = useLocation();

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500">Chargement...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Authenticated but onboarding not completed
    if (requireOnboarding && userProfile && !userProfile.onboardingCompleted) {
        // Don't redirect if already on onboarding page
        if (location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />;
        }
    }

    return <>{children}</>;
};

// Inverse - redirect if already authenticated
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // If authenticated and onboarding completed, redirect to home
    if (user && userProfile?.onboardingCompleted) {
        return <Navigate to="/" replace />;
    }

    // If authenticated but onboarding not completed, redirect to onboarding
    if (user && userProfile && !userProfile.onboardingCompleted) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};
