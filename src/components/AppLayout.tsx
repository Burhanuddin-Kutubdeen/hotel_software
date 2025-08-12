import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Search, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AvailabilityScreen from './AvailabilityScreen';
import GuestDetailsScreen from './GuestDetailsScreen';
import BookingConfirmationScreen from './BookingConfirmationScreen';
import CheckReservationScreen from './CheckReservationScreen';
import AdminLayout from './AdminLayout';

const AppLayout: React.FC = () => {
  const { currentStep, isAdminMode, setIsAdminMode, setCurrentStep } = useApp();

  if (isAdminMode) {
    return <AdminLayout />;
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'availability':
        return <AvailabilityScreen />;
      case 'details':
        return <GuestDetailsScreen />;
      case 'confirmation':
        return <BookingConfirmationScreen />;
      case 'check-reservation':
        return <CheckReservationScreen />;
      default:
        return <AvailabilityScreen />;
    }
  };

  const getStepNumber = () => {
    if (currentStep === 'check-reservation') return 'Check';
    return currentStep === 'availability' ? '1' : currentStep === 'details' ? '2' : '3';
  };

  const getStepText = () => {
    if (currentStep === 'check-reservation') return 'Reservation';
    return 'of 3';
  };

  const handleCheckReservation = () => {
    setCurrentStep('check-reservation');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // The AuthWrapper will handle redirecting to login
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-in fade-in duration-500">
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-in slide-in-from-left duration-700">
              ✨ Hotel Booking System
            </h1>
            <div className="flex items-center gap-6">
              <div className="px-4 py-2 bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-full border border-teal-200/50 backdrop-blur-sm">
                <span className="text-sm font-semibold text-slate-700">
                  Step {getStepNumber()} {getStepText()}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep('availability')}
                className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Search className="h-4 w-4 mr-1" />
                Check Availability
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCheckReservation}
                className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Search className="h-4 w-4 mr-1" />
                Check Reservation
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAdminMode(true)}
                className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200 shadow-lg"
              >
                🔧 Admin
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="bg-red-50/50 backdrop-blur-sm border-red-200/50 hover:bg-red-100/70 hover:scale-105 transition-all duration-200 shadow-lg text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in slide-in-from-bottom duration-700">
        {renderCurrentStep()}
      </main>
    </div>
  );
};

export default AppLayout;