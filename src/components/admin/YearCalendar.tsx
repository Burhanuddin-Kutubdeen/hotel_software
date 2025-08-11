import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Hotel } from '@/types/supabase';
import { supabase } from '@/lib/supabase';

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
}

interface BlockedDate {
  id: string;
  room_id: string;
  date: string;
  reason?: string;
  booking_id?: string;
}

interface Booking {
  id: string;
  room_id: string | null;
  room_type_id: string;
  check_in: string;
  check_out: string;
  confirmation_id: string;
}

interface YearCalendarProps {
  onNavigate?: (section: string) => void;
}

const YearCalendar: React.FC<YearCalendarProps> = ({ onNavigate }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [blockType, setBlockType] = useState<'OOO' | 'OOS' | 'Hold'>('OOO');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHotels();
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      loadRooms();
      loadBlockedDates();
      loadBookings();
    }
  }, [selectedHotel, selectedYear]);

  const loadHotels = async () => {
    const { data } = await supabase.from('hotels').select('*');
    if (data) setHotels(data);
  };

  const loadRooms = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', selectedHotel)
      .eq('status', 'active')
      .order('room_number');
    if (data) setRooms(data);
    setLoading(false);
  };

  const loadBlockedDates = async () => {
    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;
    
    const { data } = await supabase
      .from('room_blocks')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (data) setBlockedDates(data);
  };

  const loadBookings = async () => {
    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;
    
    // Get bookings with their room assignments from booking_rooms
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_rooms (
          quantity,
          room_type_id,
          room_id
        )
      `)
      .eq('hotel_id', selectedHotel)
      .eq('status', 'confirmed')
      .gte('check_in', startDate)
      .lte('check_out', endDate);
    
    if (data) setBookings(data);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const isBlocked = (roomId: string, date: string) => {
    return blockedDates.find(b => b.room_id === roomId && b.date === date);
  };

  const getBookingsForDate = (roomId: string, roomTypeId: string, date: string) => {
    const bookingsForDate = [];
    
    // Check all bookings for room assignments in booking_rooms
    for (const booking of bookings) {
      if (date >= booking.check_in && date < booking.check_out) {
        // Check if this booking has room assignments
        if (booking.booking_rooms && booking.booking_rooms.length > 0) {
          // Look for specific room assignment
          const roomAssignment = booking.booking_rooms.find((br: any) => br.room_id === roomId);
          if (roomAssignment) {
            bookingsForDate.push(booking);
            continue;
          }
          
          // For unassigned bookings of this room type, distribute across available rooms
          const unassignedForType = booking.booking_rooms.filter((br: any) => 
            br.room_type_id === roomTypeId && !br.room_id
          );
          
          if (unassignedForType.length > 0) {
            // Get all rooms of this room type, sorted by room number
            const roomsOfType = rooms.filter(r => r.room_type_id === roomTypeId)
              .sort((a, b) => a.room_number.localeCompare(b.room_number));
            
            // Find which room this is in the sorted list
            const roomIndex = roomsOfType.findIndex(r => r.id === roomId);
            
            // Calculate total quantity needed for this room type
            const totalQuantity = unassignedForType.reduce((sum: number, br: any) => sum + br.quantity, 0);
            
            // Show booking on the first N rooms where N is the total quantity
            if (roomIndex < totalQuantity) {
              bookingsForDate.push(booking);
            }
          }
        }
      }
    }
    
    return bookingsForDate;
  };

  const isBooked = (roomId: string, roomTypeId: string, date: string) => {
    const bookingsForDate = getBookingsForDate(roomId, roomTypeId, date);
    return bookingsForDate.length > 0 ? bookingsForDate[0] : null;
  };
  const handleCellClick = async (roomId: string, date: string) => {
    const existing = isBlocked(roomId, date);
    
    if (existing) {
      // Cycle through block types: OOO -> OOS -> Hold -> Clear
      let nextType: 'OOO' | 'OOS' | 'Hold' | null = null;
      
      if (existing.type === 'OOO') nextType = 'OOS';
      else if (existing.type === 'OOS') nextType = 'Hold';
      else nextType = null; // Clear the block
      
      if (nextType) {
        await supabase.from('room_blocks')
          .update({ type: nextType, reason: `${nextType} block` })
          .eq('id', existing.id);
      } else {
        await supabase.from('room_blocks').delete().eq('id', existing.id);
      }
    } else {
      // Create new block with selected type
      await supabase.from('room_blocks').insert({
        room_id: roomId,
        date: date,
        type: blockType,
        reason: `${blockType} block`
      });
    }
    
    loadBlockedDates();
  };

  const renderMonth = (month: number) => {
    const daysInMonth = getDaysInMonth(selectedYear, month);
    const monthName = new Date(selectedYear, month).toLocaleString('default', { month: 'long' });
    
    return (
      <div key={month} className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-center">{monthName} {selectedYear}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-100 font-semibold min-w-[80px]">Room</th>
                {Array.from({ length: daysInMonth }, (_, day) => (
                  <th key={day} className="border border-gray-300 p-1 text-xs bg-gray-100 min-w-[25px]">
                    {day + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="border border-gray-300 p-2 font-medium bg-gray-50">{room.room_number}</td>
                   {Array.from({ length: daysInMonth }, (_, day) => {
                     const date = formatDate(selectedYear, month, day + 1);
                     const blocked = isBlocked(room.id, date);
                     const allBookings = getBookingsForDate(room.id, room.room_type_id, date);
                     const booked = allBookings.length > 0 ? allBookings[0] : null;
                     
                     let cellClass = 'border border-gray-300 p-1 cursor-pointer hover:bg-gray-100 text-center ';
                     let displayText = '';
                     let titleText = '';
                     
                     if (allBookings.length > 0) {
                       cellClass += 'bg-green-200 hover:bg-green-300';
                       
                       if (allBookings.length === 1) {
                         displayText = allBookings[0].confirmation_id.slice(0, 4);
                         titleText = `Booking: ${allBookings[0].confirmation_id}`;
                       } else {
                         displayText = `${allBookings.length}BK`;
                         const confirmationIds = allBookings.map(b => b.confirmation_id).join(', ');
                         titleText = `${allBookings.length} Bookings: ${confirmationIds}`;
                       }
                     } else if (blocked) {
                       if (blocked.reason === 'booking') {
                         cellClass += 'bg-green-200 hover:bg-green-300';
                         displayText = 'BKD';
                         titleText = 'Blocked for booking';
                       } else {
                         cellClass += blocked.reason === 'OOO block' 
                           ? 'bg-red-200 hover:bg-red-300' 
                           : blocked.reason === 'OOS block' 
                             ? 'bg-yellow-200 hover:bg-yellow-300' 
                             : 'bg-blue-200 hover:bg-blue-300';
                         displayText = blocked.reason?.split(' ')[0] || '';
                         titleText = `${blocked.reason}: Click to cycle through types`;
                       }
                     } else {
                       cellClass += 'bg-white';
                       titleText = `Click to add ${blockType} block`;
                     }
                     
                     return (
                       <td
                         key={day}
                         className={cellClass}
                         onClick={() => allBookings.length === 0 && handleCellClick(room.id, date)}
                         title={titleText}
                       >
                         {displayText && (
                           <div className="text-xs font-bold">
                             {displayText}
                           </div>
                         )}
                       </td>
                     );
                   })}
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Year Calendar - Room Blocking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select hotel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() + i - 2;
                    return (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={blockType} onValueChange={(value: 'OOO' | 'OOS' | 'Hold') => setBlockType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OOO">OOO</SelectItem>
                  <SelectItem value="OOS">OOS</SelectItem>
                  <SelectItem value="Hold">Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 border"></div>
              <span>Confirmed Bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 border"></div>
              <span>Out of Order (OOO)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-200 border"></div>
              <span>Out of Service (OOS)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border"></div>
              <span>Hold</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            <strong>Instructions:</strong> Click on any date cell to add a block. Click again to cycle through OOO → OOS → Hold → Clear.
          </div>
        </CardContent>
      </Card>

      {selectedHotel && (
        <>
          {loading ? (
            <div className="text-center py-8">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600 mb-4">No rooms found for this hotel.</p>
                <Button 
                  onClick={() => onNavigate?.('rooms')}
                  variant="outline"
                >
                  Go to Room Management to Add Rooms
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                Showing {rooms.length} rooms for the selected hotel
              </div>
              {Array.from({ length: 12 }, (_, month) => renderMonth(month))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default YearCalendar;