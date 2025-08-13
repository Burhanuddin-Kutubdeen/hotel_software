import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hotel, RoomType } from '@/types/supabase'; // Assuming Room interface is also in supabase.ts or defined here
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext'; // For hasRole

interface Room { // Define Room interface if not in types/supabase.ts
  id: string;
  room_number: string;
  room_type_id: string;
  hotel_id: string;
  status: string;
  room_types?: { name: string };
  hotels?: { name: string };
}

const RoomsManagement: React.FC = () => {
  const { hasRole } = useApp();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');

  useEffect(() => {
    loadHotels();
    loadRooms(); // Load all rooms initially
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      loadRoomTypes(selectedHotel);
    } else {
      setRoomTypes([]); // Clear room types if no hotel selected
    }
  }, [selectedHotel]);

  const loadHotels = async () => {
    const { data } = await supabase.from('hotels').select('*');
    if (data) setHotels(data);
  };

  const loadRoomTypes = async (hotelId: string) => {
    const { data } = await supabase.from('room_types').select('*, hotels(name)').eq('hotel_id', hotelId);
    if (data) setRoomTypes(data);
  };

  const loadRooms = async () => {
    const { data } = await supabase.from('rooms').select('*, room_types(name), hotels(name)').neq('status', 'inactive');
    if (data) setRooms(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rooms Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hotel">Select Hotel</Label>
            <Select value={selectedHotel} onValueChange={setSelectedHotel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedHotel && (
            <div className="space-y-4">
              <h3>Room Types for {hotels.find(h => h.id === selectedHotel)?.name}</h3>
              {/* Room Type List and CRUD will go here */}
              {roomTypes.map(roomType => (
                <Card key={roomType.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{roomType.name}</h4>
                        <p className="text-sm text-gray-600">{roomType.description}</p>
                        <p className="text-sm text-gray-500">${roomType.base_price}/night • {roomType.max_occupancy} guests • {roomType.rooms_count} rooms</p>
                      </div>
                      {hasRole('admin') && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Edit Type</Button>
                          <Button size="sm" variant="destructive">Delete Type</Button>
                        </div>
                      )}
                    </div>
                    {/* Individual Rooms for this Room Type will go here */}
                    <div className="mt-4 border-t pt-4">
                      <h5>Individual Rooms ({rooms.filter(r => r.room_type_id === roomType.id).length})</h5>
                      {hasRole('admin') && (
                        <Button size="sm" className="mt-2">Add Room</Button>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {rooms.filter(r => r.room_type_id === roomType.id).map(room => (
                          <Card key={room.id}>
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-center">
                                <span>{room.room_number} ({room.status})</span>
                                {hasRole('admin') && (
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">Edit Room</Button>
                                    <Button size="sm" variant="destructive">Delete Room</Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomsManagement;