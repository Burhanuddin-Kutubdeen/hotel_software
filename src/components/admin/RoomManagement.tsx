import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hotel, RoomType } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';

interface Room {
  id: string;
  room_number: string;
  room_type_id: string;
  hotel_id: string;
  status: string;
  room_types?: { name: string };
  hotels?: { name: string };
}

const RoomManagement: React.FC = () => {
  const { hasRole } = useApp();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [bulkData, setBulkData] = useState({
    room_type_id: '',
    start_number: '',
    end_number: '',
    prefix: ''
  });

  useEffect(() => {
    loadHotels();
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      loadRoomTypes(selectedHotel);
    }
  }, [selectedHotel]);

  const loadHotels = async () => {
    const { data } = await supabase.from('hotels').select('*');
    if (data) setHotels(data);
  };

  const loadRoomTypes = async (hotelId: string) => {
    const { data } = await supabase.from('room_types').select('*').eq('hotel_id', hotelId);
    if (data) setRoomTypes(data);
  };

  const loadRooms = async () => {
    const { data } = await supabase.from('rooms').select('*, room_types(name), hotels(name)');
    if (data) setRooms(data);
  };

  const handleBulkAdd = async () => {
    const start = parseInt(bulkData.start_number);
    const end = parseInt(bulkData.end_number);
    const roomsToAdd = [];

    for (let i = start; i <= end; i++) {
      roomsToAdd.push({
        room_number: `${bulkData.prefix}${i.toString().padStart(3, '0')}`,
        room_type_id: bulkData.room_type_id,
        hotel_id: selectedHotel,
        status: 'active'
      });
    }

    await supabase.from('rooms').insert(roomsToAdd);
    setBulkData({ room_type_id: '', start_number: '', end_number: '', prefix: '' });
    loadRooms();
  };

  const handleStatusChange = async (roomId: string, status: string) => {
    await supabase.from('rooms').update({ status }).eq('id', roomId);
    loadRooms();
  };

  const handleRoomTypeChange = async (roomId: string, roomTypeId: string) => {
    await supabase.from('rooms').update({ room_type_id: roomTypeId }).eq('id', roomId);
    loadRooms();
  };

  return (
    <div className="space-y-6">
      {hasRole('admin') && ( // Only admin can bulk add rooms
        <Card>
          <CardHeader>
            <CardTitle>Bulk Add Rooms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hotel">Hotel</Label>
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
              <>
                <div>
                  <Label htmlFor="room_type">Room Type</Label>
                  <Select value={bulkData.room_type_id} onValueChange={(value) => setBulkData({ ...bulkData, room_type_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="prefix">Prefix</Label>
                    <Input
                      id="prefix"
                      value={bulkData.prefix}
                      onChange={(e) => setBulkData({ ...bulkData, prefix: e.target.value })}
                      placeholder="e.g., R"
                    />
                  </div>
                  <div>
                    <Label htmlFor="start">Start Number</Label>
                    <Input
                      id="start"
                      type="number"
                      value={bulkData.start_number}
                      onChange={(e) => setBulkData({ ...bulkData, start_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">End Number</Label>
                    <Input
                      id="end"
                      type="number"
                      value={bulkData.end_number}
                      onChange={(e) => setBulkData({ ...bulkData, end_number: e.target.value })}
                    />
                  </div>
                </div>
                
                <Button onClick={handleBulkAdd}>Add Rooms</Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {rooms.map((room) => (
          <Card key={room.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{room.room_number}</h3>
                  <p className="text-sm text-gray-600">{room.hotels?.name} - {room.room_types?.name}</p>
                </div>
                {hasRole('admin') && ( // Only admin can edit room details
                  <div className="flex gap-2">
                    <Select value={room.room_type_id} onValueChange={(value) => handleRoomTypeChange(room.id, value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={room.status} onValueChange={(value) => handleStatusChange(room.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoomManagement;