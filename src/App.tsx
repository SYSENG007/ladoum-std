import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Herd } from './pages/Herd';
import { AnimalDetails } from './pages/AnimalDetails';
import { Pedigree } from './pages/Pedigree';
import { Tasks } from './pages/Tasks';
import { Reproduction } from './pages/Reproduction';
import { Inventory } from './pages/Inventory';
import { Accounting } from './pages/Accounting';
import { Marketplace } from './pages/Marketplace';
import { Teleconsultation } from './pages/Teleconsultation';
import { ConsultationDetails } from './pages/ConsultationDetails';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Staff } from './pages/Staff';
import { Join } from './pages/Join';

// Providers
import { AuthProvider } from './context/AuthContext';
import { FarmProvider } from './context/FarmContext';
import { DataProvider } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';

// Components
import { OfflineIndicator } from './components/ui/OfflineIndicator';

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <FarmProvider>
          <DataProvider>
            <OfflineIndicator />
            <BrowserRouter>
              <Routes>
                {/* Public Routes (redirect if authenticated) */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />

                {/* Join invitation (requires auth but bypasses onboarding) */}
                <Route
                  path="/join"
                  element={
                    <ProtectedRoute requireOnboarding={false}>
                      <Join />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes (require auth + completed onboarding) */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute requireOnboarding={false}>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes (require auth + completed onboarding) */}
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/herd" element={<Herd />} />
                  <Route path="/herd/:id" element={<AnimalDetails />} />
                  <Route path="/pedigree" element={<Pedigree />} />
                  <Route path="/reproduction" element={<Reproduction />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/accounting" element={<Accounting />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/teleconsultation" element={<Teleconsultation />} />
                  <Route path="/teleconsultation/:id" element={<ConsultationDetails />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/staff" element={<Staff />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </FarmProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
