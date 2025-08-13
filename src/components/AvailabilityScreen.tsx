import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { Users, ArrowRight, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { bookingService } from '@/utils/supabase-booking';
import { AvailabilityGrid } from './AvailabilityGrid';
import { RoomTypeSelector } from './RoomTypeSelector';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvailabilityData, RoomTypeSelection } from '@/types';

const AvailabilityScreen: React.FC = () => {
  const {
    selectedHotel,
    setSelectedHotel,
    checkIn,
    setCheckIn,
    nights,
    setNights,
    hotels,
    roomTypes,
    setCurrentStep,
    loading,
    setLoading,
    setBookingFormData,
    availabilityRefresh,
    hasRole
  } = useApp();
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<RoomTypeSelection[]>([]);

  const loadAvailability = useCallback(async () => {
    if (!selectedHotel || !checkIn) return;

    try {
      setLoading(true);
      setLoadingProgress(10);
      
      const availData = await bookingService.getAvailability(selectedHotel.id, checkIn, nights);
      setLoadingProgress(70);
      
      setAvailability(availData);

      const dateRange = [];
      const startDate = new Date(checkIn);
      for (let i = -5; i < nights + 5; i++) {
        dateRange.push(format(addDays(startDate, i), 'yyyy-MM-dd'));
      }
      setDates(dateRange);
      setLoadingProgress(100);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
      }, 200);
    }
  }, [selectedHotel, checkIn, nights, setLoading, setAvailability, setDates, setLoadingProgress]);

  useEffect(() => {
    loadAvailability();
  }, [selectedHotel, checkIn, nights, setLoading, availabilityRefresh, loadAvailability]);

  useEffect(() => {
    if (!checkIn) {
      setCheckIn(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [checkIn, setCheckIn]);

  const handleRoomTypeChange = (roomTypeId: string, quantity: number) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId);
    if (!roomType) return;

    setSelectedRoomTypes(prev => {
      const existing = prev.find(s => s.roomType.id === roomTypeId);
      if (quantity === 0) {
        return prev.filter(s => s.roomType.id !== roomTypeId);
      }
      if (existing) {
        return prev.map(s => s.roomType.id === roomTypeId ? { ...s, quantity } : s);
      }
      return [...prev, { roomType, quantity }];
    });
  };

  // Calculate minimum availability for each room type across the selected date range
  const getMinAvailabilityForRoomType = (roomTypeId: string) => {
    if (!checkIn || availability.length === 0) return 0;
    
    const checkInDate = new Date(checkIn);
    const relevantDates = [];
    for (let i = 0; i < nights; i++) {
      const date = new Date(checkInDate);
      date.setDate(date.getDate() + i);
      relevantDates.push(date.toISOString().split('T')[0]);
    }
    
    const availabilityForRoomType = availability.filter(a => 
      a.roomTypeId === roomTypeId && relevantDates.includes(a.date)
    );
    
    if (availabilityForRoomType.length === 0) return 0;
    
    return Math.min(...availabilityForRoomType.map(a => a.available));
  };

  const generateAvailabilityMessage = () => {
    if (!selectedHotel || !checkIn || selectedRoomTypes.length === 0) return '';
    
    const checkOut = format(addDays(new Date(checkIn), nights), 'EEE, d MMM yyyy');
    const checkInFormatted = format(new Date(checkIn), 'EEE, d MMM yyyy');
    
    const roomTypesText = selectedRoomTypes.map(s => 
      `${s.quantity}x ${s.roomType.name}`
    ).join(', ');
    
    return `Hello,

We have availability at ${selectedHotel.name} for ${checkInFormatted} for ${nights} night${nights > 1 ? 's' : ''}.

Room Types: ${roomTypesText}
Check-out: ${checkOut}

Would you like me to hold rooms and take your details?`;
  };

  const handleContinueToDetails = () => {
    if (selectedHotel && selectedRoomTypes.length > 0) {
      setBookingFormData({
        hotel: selectedHotel,
        checkIn,
        nights,
        roomTypes: selectedRoomTypes,
        customer: { name: '', phone: '', email: '', country: '' },
        price: 0,
        notes: ''
      });
    }
    setCurrentStep('details');
  };

  const handleComposeMessage = () => {
    const message = generateAvailabilityMessage();
    navigator.clipboard.writeText(message);
    alert('✨ Availability message copied to clipboard!');
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search Form */}
      <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="hotel" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              🏨 Hotel
            </Label>
            <Select value={selectedHotel?.id || ''} onValueChange={(value) => {
              const hotel = hotels.find(h => h.id === value);
              setSelectedHotel(hotel || null);
            }}>
              <SelectTrigger className="bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-200">
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map(hotel => (
                  <SelectItem key={hotel.id} value={hotel.id}>{hotel.name} ({hotel.roomCount || 0} rooms)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              📅 Check-in
            </Label>
            <Input
              id="checkin"
              type="date"
              value={checkIn}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setCheckIn(e.target.value)}
              className="bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nights" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              🌙 Nights
            </Label>
            <Input
              id="nights"
              type="number"
              min="1"
              max="30"
              value={nights}
              onChange={(e) => setNights(parseInt(e.target.value) || 1)}
              className="bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner 
          message="🚀 Optimizing availability search..." 
          progress={loadingProgress} 
        />
      )}

      {/* Room Type Selector */}
      {!loading && selectedHotel && checkIn && roomTypes.length > 0 && (
        <>
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-xl">
            <RoomTypeSelector
              roomTypes={roomTypes}
              selectedRoomTypes={selectedRoomTypes}
              onRoomTypeChange={handleRoomTypeChange}
              getAvailability={getMinAvailabilityForRoomType}
            />
          </div>

          <AvailabilityGrid
            availability={availability}
            roomTypes={roomTypes}
            dates={dates}
          />

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleComposeMessage}
              disabled={selectedRoomTypes.length === 0}
              variant="outline"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200/50 hover:from-purple-500/20 hover:to-pink-500/20 hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Users className="h-4 w-4" />
              ✨ Compose Message
            </Button>
            <Button
              onClick={handleContinueToDetails}
              disabled={selectedRoomTypes.length === 0 || hasRole('viewer')}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 hover:scale-105 transition-all duration-200 shadow-xl"
            >
              Continue to Guest Details
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AvailabilityScreen;