import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Hotel, RoomType, Customer, Booking, BookingFormData } from '@/types';
import { bookingService } from '@/utils/supabase-booking';

interface AppContextType {
  // Current step
  currentStep: 'availability' | 'details' | 'confirmation' | 'check-reservation';
  setCurrentStep: (step: 'availability' | 'details' | 'confirmation' | 'check-reservation') => void;

  // Previous search criteria
  previousSearchCriteria: { searchCriteria: any; selectedDate: Date | undefined } | null;
  setPreviousSearchCriteria: (criteria: { searchCriteria: any; selectedDate: Date | undefined } | null) => void;

  // App mode
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;

  // User state
  currentUser: any;
  setCurrentUser: (user: any) => void;
  
  // Helper function to check user role
  hasRole: (role: string) => boolean;

  // Search criteria
  selectedHotel: Hotel | null;
  setSelectedHotel: (hotel: Hotel | null) => void;
  selectedRoomType: RoomType | null;
  setSelectedRoomType: (roomType: RoomType | null) => void;
  checkIn: string;
  setCheckIn: (date: string) => void;
  nights: number;
  setNights: (nights: number) => void;

  // Data
  hotels: Hotel[];
  roomTypes: RoomType[];
  
  // Current booking
  currentBooking: Booking | null;
  currentCustomer: Customer | null;
  setCurrentBooking: (booking: Booking | null, customer: Customer | null) => void;
  
  // Booking form data
  bookingFormData: BookingFormData | null;
  setBookingFormData: (data: BookingFormData | null) => void;

  // Loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // Refresh trigger for availability
  availabilityRefresh: number;
  refreshAvailability: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<'availability' | 'details' | 'confirmation' | 'check-reservation'>('availability');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [checkIn, setCheckIn] = useState<string>('');
  const [nights, setNights] = useState<number>(1);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [currentBooking, setCurrentBookingState] = useState<Booking | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [bookingFormData, setBookingFormData] = useState<BookingFormData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [availabilityRefresh, setAvailabilityRefresh] = useState<number>(0);
  const [previousSearchCriteria, setPreviousSearchCriteria] = useState<{ searchCriteria: any; selectedDate: Date | undefined } | null>(null);

  // Load hotels on mount
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoading(true);
        const hotelsData = await bookingService.getHotels();
        setHotels(hotelsData);
      } catch (error) {
        console.error('Error loading hotels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHotels();
  }, []);

  // Load room types when hotel changes
  useEffect(() => {
    const loadRoomTypes = async () => {
      if (!selectedHotel) {
        setRoomTypes([]);
        setSelectedRoomType(null);
        return;
      }

      try {
        setLoading(true);
        // Clear existing room types immediately to prevent showing stale data
        setRoomTypes([]);
        setSelectedRoomType(null);
        
        const roomTypesData = await bookingService.getRoomTypes(selectedHotel.id);
        setRoomTypes(roomTypesData);
      } catch (error) {
        console.error('Error loading room types:', error);
        setRoomTypes([]);
        setSelectedRoomType(null);
      } finally {
        setLoading(false);
      }
    };

    loadRoomTypes();
  }, [selectedHotel]);

  const setCurrentBooking = (booking: Booking | null, customer: Customer | null) => {
    setCurrentBookingState(booking);
    setCurrentCustomer(customer);
  };

  const refreshAvailability = () => {
    setAvailabilityRefresh(prev => prev + 1);
  };
  
  const hasRole = (role: string) => {
    return currentUser?.appUser?.role?.toLowerCase() === role.toLowerCase();
  };

  const value: AppContextType = {
    currentStep,
    setCurrentStep,
    isAdminMode,
    setIsAdminMode,
    currentUser,
    setCurrentUser,
    hasRole,
    selectedHotel,
    setSelectedHotel,
    selectedRoomType,
    setSelectedRoomType,
    checkIn,
    setCheckIn,
    nights,
    setNights,
    hotels,
    roomTypes,
    currentBooking,
    currentCustomer,
    setCurrentBooking,
    bookingFormData,
    setBookingFormData,
    loading,
    setLoading,
    availabilityRefresh,
    refreshAvailability,
    previousSearchCriteria,
    setPreviousSearchCriteria
  };


  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};