import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { bookingService } from '@/utils/supabase-booking';
import { useApp } from '@/contexts/AppContext';
import { AvailabilityData } from '@/types/supabase';

interface EditBookingDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditBookingDialog: React.FC<EditBookingDialogProps> = ({ booking, isOpen, onClose, onSave }) => {
  console.log("EditBookingDialog: Component rendered. isOpen:", isOpen, "booking:", booking);
  const { setLoading } = useApp();
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [nights, setNights] = useState(0);
  const [roomTypes, setRoomTypes] = useState<Array<{ roomType: any; quantity: number }>>([]);
  const [allRoomTypes, setAllRoomTypes] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [allHotels, setAllHotels] = useState<any[]>([]);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([]);

  useEffect(() => {
    if (booking) {
      setCheckIn(parseISO(booking.check_in));
      setNights(booking.nights);

      if (booking.booking_rooms) {
        console.log("EditBookingDialog: booking.booking_rooms content:", booking.booking_rooms);
        setRoomTypes(booking.booking_rooms.map((br: any) => ({
          roomType: br.room_types,
          quantity: br.quantity
        })));
      } else {
        console.warn("EditBookingDialog: booking.booking_rooms is undefined or empty.", booking);
        setRoomTypes([]);
      }

      if (booking.hotels && booking.hotels.id) {
        setSelectedHotelId(booking.hotels.id);
      } else {
        console.warn("EditBookingDialog: booking.hotels or booking.hotels.id is undefined.", booking);
        setSelectedHotelId('');
      }

      // Fetch all hotels
      const fetchAllHotels = async () => {
        try {
          const hotelsData = await bookingService.getHotels();
          setAllHotels(hotelsData);
          console.log("EditBookingDialog: Fetched all hotels:", hotelsData);
        } catch (error) {
          console.error('Error fetching all hotels:', error);
        }
      };
      fetchAllHotels();
    }
  }, [booking]);

  useEffect(() => {
    if (selectedHotelId) {
      // Fetch all room types for the selected hotel
      const fetchAllRoomTypes = async () => {
        try {
          const roomTypesData = await bookingService.getRoomTypes(selectedHotelId);
          setAllRoomTypes(roomTypesData);
          // Clear selected room types if hotel changes
          setRoomTypes([]);
          console.log("EditBookingDialog: Fetched room types for hotel", selectedHotelId, ":", roomTypesData);
        } catch (error) {
          console.error('Error fetching all room types:', error);
        }
      };
      fetchAllRoomTypes();
    }
  }, [selectedHotelId]);

  useEffect(() => {
    if (selectedHotelId && checkIn && nights > 0) {
      const fetchAvailability = async () => {
        try {
          setLoading(true);
          const data = await bookingService.getAvailability(selectedHotelId, format(checkIn, 'yyyy-MM-dd'), nights);
          setAvailabilityData(data);
          console.log("EditBookingDialog: Fetched availability data:", data);
        } catch (error) {
          console.error('Error fetching availability:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAvailability();
    }
  }, [selectedHotelId, checkIn, nights]);

  if (!booking) {
    console.log("EditBookingDialog: Booking is null, returning null.");
    return null;
  }

  console.log("EditBookingDialog: Rendering with state - checkIn:", checkIn, "nights:", nights, "roomTypes:", roomTypes, "selectedHotelId:", selectedHotelId, "allHotels:", allHotels, "allRoomTypes:", allRoomTypes);

  const datesOfBooking = [];
  if (checkIn && nights > 0) {
    for (let i = 0; i < nights; i++) {
      datesOfBooking.push(format(addDays(checkIn, i), 'yyyy-MM-dd'));
    }
  }

  const handleSaveChanges = async () => {
    if (!checkIn || nights <= 0) {
      alert("Please ensure check-in date is selected and nights is greater than 0.");
      return;
    }

    // Validate room type quantities against availability across all booking dates
    for (const selectedRoom of roomTypes) {
      const minAvailableAcrossDates = datesOfBooking.reduce((minAvailable, date) => {
        const dailyAvailability = availabilityData.find(ad => ad.roomTypeId === selectedRoom.roomType.id && ad.date === date);
        return Math.min(minAvailable, dailyAvailability?.available || 0);
      }, Infinity);

      if (selectedRoom.quantity > minAvailableAcrossDates) {
        alert(`Error: ${selectedRoom.roomType.name} has only ${minAvailableAcrossDates} rooms available for the entire booking period. You selected ${selectedRoom.quantity}.`);
        return;
      }
    }

    try {
      setLoading(true);
      await bookingService.updateBooking(booking.id, {
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        nights,
        roomTypes,
        hotelId: selectedHotelId,
      });
      onSave(); // Notify parent component to refresh data
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('❌ Error updating booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Check-in Date</Label>
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={setCheckIn}
              className="rounded-md border"
            />
          </div>
          <div>
            <Label htmlFor="hotel">Hotel</Label>
            <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a hotel">
                  {allHotels.find(hotel => hotel.id === selectedHotelId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {allHotels.map((hotel: any) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nights">Nights</Label>
            <Input id="nights" type="number" value={nights} onChange={(e) => setNights(parseInt(e.target.value, 10))} />
          </div>
          <div>
            <Label>Room Types</Label>
            {roomTypes.map((rt, index) => {
              const minAvailableAcrossDates = datesOfBooking.reduce((minAvailable, date) => {
                const dailyAvailability = availabilityData.find(ad => ad.roomTypeId === rt.roomType.id && ad.date === date);
                return Math.min(minAvailable, dailyAvailability?.available || 0);
              }, Infinity);
              const totalRoomsForType = availabilityData.find(ad => ad.roomTypeId === rt.roomType.id && ad.date === datesOfBooking[0])?.total || 0; // Assuming total is consistent across dates

              return (
                <div key={index} className="flex items-center gap-2">
                  <Input value={`${rt.roomType.name} (Available: ${minAvailableAcrossDates} of ${totalRoomsForType})`} disabled />
                  <Input type="number" value={rt.quantity} onChange={(e) => {
                    const newRoomTypes = [...roomTypes];
                    const newQuantity = parseInt(e.target.value, 10);
                    newRoomTypes[index].quantity = newQuantity > minAvailableAcrossDates ? minAvailableAcrossDates : newQuantity;
                    setRoomTypes(newRoomTypes);
                  }} max={minAvailableAcrossDates} />
                  <Button variant="destructive" size="sm" onClick={() => {
                    const newRoomTypes = roomTypes.filter((_, i) => i !== index);
                    setRoomTypes(newRoomTypes);
                  }}>Remove</Button>
                </div>
              );
            })}
          </div>
          <div>
            <Label htmlFor="addRoomType">Add Room Type</Label>
            <div className="flex items-center gap-2">
              <Select onValueChange={(value) => {
                const selected = allRoomTypes.find(rt => rt.id === value);
                if (selected) {
                  setRoomTypes([...roomTypes, { roomType: selected, quantity: 1 }]);
                }
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a room type" />
                </SelectTrigger>
                <SelectContent>
                  {allRoomTypes.map((rt: any) => {
                    const minAvailableAcrossDates = datesOfBooking.reduce((minAvailable, date) => {
                      const dailyAvailability = availabilityData.find(ad => ad.roomTypeId === rt.id && ad.date === date);
                      return Math.min(minAvailable, dailyAvailability?.available || 0);
                    }, Infinity);
                    const totalRoomsForType = availabilityData.find(ad => ad.roomTypeId === rt.id && ad.date === datesOfBooking[0])?.total || 0; // Assuming total is consistent across dates

                    return (
                      <SelectItem key={rt.id} value={rt.id} disabled={minAvailableAcrossDates === 0}>
                        {rt.name} (Available: ${minAvailableAcrossDates} of ${totalRoomsForType})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
};

export default EditBookingDialog;