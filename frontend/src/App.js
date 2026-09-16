import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

// Core components (cargados inmediatamente)
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ChatbotButton from './components/ChatbotButton';

// Lazy-loaded pages (cargadas solo cuando se necesitan)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const QuotationsList = lazy(() => import('./pages/QuotationsList'));
const QuotationDetail = lazy(() => import('./pages/QuotationDetail'));
const ClientsList = lazy(() => import('./pages/ClientsList'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const InventoryList = lazy(() => import('./pages/InventoryList'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const AlertsList = lazy(() => import('./pages/AlertsList'));
const CreateQuotation = lazy(() => import('./pages/CreateQuotation'));
const EditQuotation = lazy(() => import('./pages/EditQuotation'));
const CreateClient = lazy(() => import('./pages/CreateClient'));
const EditClient = lazy(() => import('./pages/EditClient'));
const CreateVehicle = lazy(() => import('./pages/CreateVehicle'));
const EditVehicle = lazy(() => import('./pages/EditVehicle'));
const CreatePaymentSchedule = lazy(() => import('./pages/CreatePaymentSchedule'));
const CreateDelivery = lazy(() => import('./pages/CreateDelivery'));
const CreateCreditApplication = lazy(() => import('./pages/CreateCreditApplication'));
const CreateAlert = lazy(() => import('./pages/CreateAlert'));
const CreateUser = lazy(() => import('./pages/CreateUser'));
const CreditList = lazy(() => import('./pages/CreditList'));
const PaymentsList = lazy(() => import('./pages/PaymentsList'));
const DeliveriesList = lazy(() => import('./pages/DeliveriesList'));
const Profile = lazy(() => import('./pages/Profile'));
const ClientQuotationHistory = lazy(() => import('./pages/ClientQuotationHistory'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente de loading para páginas lazy
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-base-100">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-base-content/70">Cargando...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <WebSocketProvider>
            <div className="min-h-screen bg-base-100">
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="quotations" element={<QuotationsList />} />
                  <Route path="quotations/create" element={<CreateQuotation />} />
                  <Route path="quotations/:id" element={<QuotationDetail />} />
                  <Route path="quotations/:id/edit" element={<EditQuotation />} />
                  <Route path="clients" element={<ClientsList />} />
                  <Route path="clients/create" element={<CreateClient />} />
                  <Route path="clients/:clientId" element={<ClientDetail />} />
                  <Route path="clients/:clientId/edit" element={<EditClient />} />
                  <Route path="clients/:clientId/history" element={<ClientQuotationHistory />} />
                  <Route path="inventory" element={<InventoryList />} />
                  <Route path="inventory/create" element={<CreateVehicle />} />
                  <Route path="inventory/:id" element={<VehicleDetail />} />
                  <Route path="inventory/:id/edit" element={<EditVehicle />} />
                  <Route path="alerts" element={<AlertsList />} />
                  <Route path="alerts/create" element={<CreateAlert />} />
                  <Route path="credit" element={<CreditList />} />
                  <Route path="credit/create" element={<CreateCreditApplication />} />
                  <Route path="billing" element={<PaymentsList />} />
                  <Route path="billing/create" element={<CreatePaymentSchedule />} />
                  <Route path="deliveries" element={<DeliveriesList />} />
                  <Route path="deliveries/create" element={<CreateDelivery />} />
                  <Route path="users/create" element={<CreateUser />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </Suspense>
              
              {/* Chatbot Button - Solo visible cuando está autenticado */}
              <ChatbotButton />
              
              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </WebSocketProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
