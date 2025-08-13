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

  useEffect(() => {
    if (booking) {
      setCheckIn(parseISO(booking.check_in));
      setNights(booking.nights);
      setRoomTypes(booking.booking_rooms.map((br: any) => ({ roomType: br.room_types, quantity: br.quantity })));
      setSelectedHotelId(booking.hotel.id);

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

  if (!booking) {
    console.log("EditBookingDialog: Booking is null, returning null.");
    return null;
  }

  console.log("EditBookingDialog: Rendering with state - checkIn:", checkIn, "nights:", nights, "roomTypes:", roomTypes, "selectedHotelId:", selectedHotelId, "allHotels:", allHotels, "allRoomTypes:", allRoomTypes);

  const handleSaveChanges = async () => {
    if (!checkIn || nights <= 0) {
      alert("Please ensure check-in date is selected and nights is greater than 0.");
      return;
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                <SelectValue placeholder="Select a hotel" />
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
            {roomTypes.map((rt, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={rt.roomType.name} disabled />
                <Input type="number" value={rt.quantity} onChange={(e) => {
                  const newRoomTypes = [...roomTypes];
                  newRoomTypes[index].quantity = parseInt(e.target.value, 10);
                  setRoomTypes(newRoomTypes);
                }} />
                <Button variant="destructive" size="sm" onClick={() => {
                  const newRoomTypes = roomTypes.filter((_, i) => i !== index);
                  setRoomTypes(newRoomTypes);
                }}>Remove</Button>
              </div>
            ))}
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
                  {allRoomTypes.map((rt: any) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.name}
                    </SelectItem>
                  ))}
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

export default EditBookingDialog;