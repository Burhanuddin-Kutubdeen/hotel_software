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
  rooms_count: number;
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
    rooms_count: ''
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
    const { data } = await supabase.from('room_types').select('*, hotels(name)').eq('is_active', true);
    if (data) setRoomTypes(data);
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      base_price: parseFloat(formData.base_price),
      max_occupancy: parseInt(formData.max_occupancy),
      rooms_count: parseInt(formData.rooms_count)
    };

    if (editingRoomType) {
      await supabase.from('room_types').update(payload).eq('id', editingRoomType.id);
    } else {
      await supabase.from('room_types').insert({ ...payload, is_active: true });
    }
    
    setEditingRoomType(null);
    setFormData({ hotel_id: '', name: '', description: '', base_price: '', max_occupancy: '', rooms_count: '' });
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
      rooms_count: roomType.rooms_count.toString()
    });
  };

  const handleDelete = async (id: string) => {
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to deactivate this room type? Deactivated room types will not appear in booking forms but their historical data will be preserved.')) {
      return;
    }
    await supabase.from('room_types').update({ is_active: false }).eq('id', id);
    loadRoomTypes();
  };

  const handleCancel = () => {
    setEditingRoomType(null);
    setFormData({ hotel_id: '', name: '', description: '', base_price: '', max_occupancy: '', rooms_count: '' });
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
          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="rooms_count">Total Rooms</Label>
              <Input
                id="rooms_count"
                type="number"
                value={formData.rooms_count}
                onChange={(e) => setFormData({ ...formData, rooms_count: e.target.value })}
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
                  <p className="text-sm text-gray-500">${roomType.base_price}/night • {roomType.max_occupancy} guests • {roomType.rooms_count} rooms</p>
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