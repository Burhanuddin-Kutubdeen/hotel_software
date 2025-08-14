import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hotel } from '@/types/supabase';
import { supabase } from '@/lib/supabase';

interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description: string;
  base_price: number;
  max_occupancy: number;
  total_rooms: number; // Added total_rooms
  hotels?: { name: string };
}

const RoomTypeManagement: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [formData, setFormData] = useState({
    hotel_id: '',
    name: '',
    description: '',
    base_price: '',
    max_occupancy: '',
    total_rooms: '' // Added total_rooms
  });

  useEffect(() => {
    loadHotels();
    loadRoomTypes();
  }, []);

  const loadHotels = async () => {
    const { data } = await supabase.from('hotels').select('*');
    if (data) setHotels(data);
  };

  const loadRoomTypes = async () => {
    const { data } = await supabase.from('room_types').select('*, hotels(name)');
    if (data) setRoomTypes(data as any);
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      name: formData.name.trim(), // Trim whitespace
      base_price: parseFloat(formData.base_price),
      max_occupancy: parseInt(formData.max_occupancy),
      total_rooms: parseInt(formData.total_rooms) // Added total_rooms
    };

    if (editingRoomType) {
      await supabase.from('room_types').update(payload).eq('id', editingRoomType.id);
    } else {
      await supabase.from('room_types').insert(payload);
    }
    
    setEditingRoomType(null);
    setFormData({ hotel_id: '', name: '', description: '', base_price: '', max_occupancy: '' });
    loadRoomTypes();
  };

  const handleEdit = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setFormData({
      hotel_id: roomType.hotel_id,
      name: roomType.name,
      description: roomType.description || '',
      base_price: roomType.base_price.toString(),
      max_occupancy: roomType.max_occupancy.toString(),
      total_rooms: roomType.total_rooms.toString() // Added total_rooms
    });
  };

  const handleDelete = async (id: string) => {
    // Check for associated bookings in room_type_inventory_slots
    const { count: inventoryCount, error: inventoryError } = await supabase
      .from('room_type_inventory_slots')
      .select('id', { count: 'exact' })
      .eq('room_type_id', id)
      .not('booking_id', 'is', null); // Only count slots that are part of a booking

    if (inventoryError) {
      console.error('Error checking for associated inventory slots:', inventoryError);
      alert('Error checking for associated inventory slots. Please try again.');
      return;
    }

    if (inventoryCount && inventoryCount > 0) {
      alert('Cannot delete room type: There are existing bookings associated with this room type. Please delete or reassign bookings first.');
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this room type? This action cannot be undone and will also delete all associated rooms.')) {
      return;
    }

    await supabase.from('room_types').delete().eq('id', id);
    loadRoomTypes();
  };

  const handleCancel = () => {
    setEditingRoomType(null);
    setFormData({ hotel_id: '', name: '', description: '', base_price: '', max_occupancy: '', total_rooms: '' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingRoomType ? 'Edit Room Type' : 'Add New Room Type'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hotel">Hotel</Label>
            <Select value={formData.hotel_id} onValueChange={(value) => setFormData({ ...formData, hotel_id: value })}>
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
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4"> {/* Changed to grid-cols-3 */}
            <div>
              <Label htmlFor="base_price">Base Price</Label>
              <Input
                id="base_price"
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="max_occupancy">Max Occupancy</Label>
              <Input
                id="max_occupancy"
                type="number"
                value={formData.max_occupancy}
                onChange={(e) => setFormData({ ...formData, max_occupancy: e.target.value })}
              />
            </div>
            <div> {/* New div for total_rooms */}
              <Label htmlFor="total_rooms">Total Rooms</Label>
              <Input
                id="total_rooms"
                type="number"
                value={formData.total_rooms}
                onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingRoomType ? 'Update' : 'Create'}
            </Button>
            {editingRoomType && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {roomTypes.map((roomType) => (
          <Card key={roomType.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{roomType.name}</h3>
                  <p className="text-sm text-gray-600">{roomType.hotels?.name}</p>
                  <p className="text-sm text-gray-500">${roomType.base_price}/night • {roomType.max_occupancy} guests • {roomType.total_rooms} rooms</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(roomType)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(roomType.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoomTypeManagement;