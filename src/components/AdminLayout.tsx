import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import HotelManagement from './admin/HotelManagement';
import RoomTypeManagement from './admin/RoomTypeManagement';
import RoomManagement from './admin/RoomManagement';
import YearCalendar from './admin/YearCalendar';
import UserManagement from './admin/UserManagement';
import RoleManagement from './admin/RoleManagement';

type AdminView = 'hotels' | 'roomTypes' | 'rooms' | 'calendar' | 'users' | 'roles';

const AdminLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<AdminView>('hotels');
  const { setIsAdminMode, hasRole } = useApp();

  const handleNavigate = (section: string) => {
    if (section === 'rooms') {
      setCurrentView('rooms');
    } else if (section === 'roomTypes') {
      setCurrentView('roomTypes');
    } else if (section === 'hotels') {
      setCurrentView('hotels');
    } else if (section === 'calendar') {
      setCurrentView('calendar');
    } else if (section === 'users') {
      setCurrentView('users');
    } else if (section === 'roles') {
      setCurrentView('roles');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'hotels':
        return <HotelManagement />;
      case 'roomTypes':
        return <RoomTypeManagement />;
      case 'rooms':
        return <RoomManagement />;
      case 'calendar':
        return <YearCalendar onNavigate={handleNavigate} />;
      case 'users':
        return hasRole('ADMIN') ? <UserManagement /> : <HotelManagement />;
      case 'roles':
        return hasRole('ADMIN') ? <RoleManagement /> : <HotelManagement />;
      default:
        return <HotelManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-teal-700">Hotel Management</h1>
            <div className="flex gap-2">
              <Button 
                variant={currentView === 'hotels' ? 'default' : 'outline'}
                onClick={() => setCurrentView('hotels')}
              >
                Hotels
              </Button>
              <Button 
                variant={currentView === 'roomTypes' ? 'default' : 'outline'}
                onClick={() => setCurrentView('roomTypes')}
              >
                Room Types
              </Button>
              <Button 
                variant={currentView === 'rooms' ? 'default' : 'outline'}
                onClick={() => setCurrentView('rooms')}
              >
                Rooms
              </Button>
              <Button 
                variant={currentView === 'calendar' ? 'default' : 'outline'}
                onClick={() => setCurrentView('calendar')}
              >
                Calendar
              </Button>
              {hasRole('ADMIN') && (
                <Button 
                  variant={currentView === 'users' ? 'default' : 'outline'}
                  onClick={() => setCurrentView('users')}
                >
                  Users
                </Button>
              )}
              {hasRole('ADMIN') && (
                <Button
                  variant={currentView === 'roles' ? 'default' : 'outline'}
                  onClick={() => setCurrentView('roles')}
                >
                  Roles
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => setIsAdminMode(false)}
              >
                Back to Booking
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default AdminLayout;