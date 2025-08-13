import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Hotel } from '@/types/supabase';
import { supabase } from '@/lib/supabase';

const HotelManagement: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    const { data } = await supabase.from('hotels').select('*').eq('is_active', true);
    if (data) setHotels(data);
  };

  const handleSave = async () => {
    try {
      // Basic validation
      if (!formData.name.trim()) {
        alert('Hotel name is required');
        return;
      }

      if (editingHotel) {
        const { error } = await supabase.from('hotels').update(formData).eq('id', editingHotel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hotels').insert({ ...formData, is_active: true });
        if (error) throw error;
      }
      
      setEditingHotel(null);
      setFormData({ name: '', address: '', description: '', phone: '', email: '' });
      await loadHotels();
    } catch (error) {
      console.error('Error saving hotel:', error);
      alert('Error saving hotel. Please try again.');
    }
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      address: hotel.address || '',
      description: hotel.description || '',
      phone: hotel.phone || '',
      email: hotel.email || ''
    });
  };

  const handleDelete = async (id: string) => {
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to deactivate this hotel? Deactivated hotels will not appear in booking forms but their historical data will be preserved.')) {
      return;
    }
    await supabase.from('hotels').update({ is_active: false }).eq('id', id);
    loadHotels();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingHotel ? 'Update' : 'Create'}
            </Button>
            {editingHotel && (
              <Button variant="outline" onClick={() => {
                setEditingHotel(null);
                setFormData({ name: '', address: '', description: '', phone: '', email: '' });
              }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {hotels.map((hotel) => (
          <Card key={hotel.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{hotel.name}</h3>
                  <p className="text-sm text-gray-600">{hotel.address}</p>
                  <p className="text-sm text-gray-500 mt-1">{hotel.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(hotel)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(hotel.id)}>
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

export default HotelManagement;