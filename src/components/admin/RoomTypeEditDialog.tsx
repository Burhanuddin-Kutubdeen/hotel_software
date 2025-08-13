
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RoomType } from '@/types/supabase';
import { supabase } from '@/lib/supabase';

interface RoomTypeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  roomType?: RoomType | null;
}

const RoomTypeEditDialog: React.FC<RoomTypeEditDialogProps> = ({
  isOpen,
  onClose,
  hotelId,
  roomType,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [maxOccupancy, setMaxOccupancy] = useState<number>(1);
  const [prefix, setPrefix] = useState('');
  const [startRoomNumber, setStartRoomNumber] = useState<number>(101);
  const [endRoomNumber, setEndRoomNumber] = useState<number>(101);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (roomType) {
      setName(roomType.name);
      setDescription(roomType.description || '');
      setBasePrice(roomType.base_price);
      setMaxOccupancy(roomType.max_occupancy);
      // These fields are for bulk creation and might not be on the roomType object
      setPrefix('');
      setStartRoomNumber(101);
      setEndRoomNumber(101);
    } else {
      // Reset form for new room type
      setName('');
      setDescription('');
      setBasePrice(0);
      setMaxOccupancy(1);
      setPrefix('');
      setStartRoomNumber(101);
      setEndRoomNumber(101);
    }
  }, [roomType]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (roomType) {
        // Update existing room type
        const { error } = await supabase
          .from('room_types')
          .update({
            name,
            description,
            base_price: basePrice,
            max_occupancy: maxOccupancy,
          })
          .eq('id', roomType.id);
        if (error) throw error;
      } else {
        // Create new room type and bulk create rooms
        const { data: newRoomType, error: roomTypeError } = await supabase
          .from('room_types')
          .insert({
            hotel_id: hotelId,
            name,
            description,
            base_price: basePrice,
            max_occupancy: maxOccupancy,
            rooms_count: endRoomNumber - startRoomNumber + 1,
          })
          .select()
          .single();

        if (roomTypeError) throw roomTypeError;

        if (newRoomType) {
          const roomsToCreate = [];
          for (let i = startRoomNumber; i <= endRoomNumber; i++) {
            roomsToCreate.push({
              hotel_id: hotelId,
              room_type_id: newRoomType.id,
              room_number: `${prefix}${i}`,
              status: 'available',
            });
          }
          const { error: roomsError } = await supabase
            .from('rooms')
            .insert(roomsToCreate);
          if (roomsError) throw roomsError;
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving room type:', error);
      // Handle error (e.g., show a toast notification)
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{roomType ? 'Edit Room Type' : 'Add New Room Type'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Room Type Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOccupancy">Max Occupancy</Label>
              <Input
                id="maxOccupancy"
                type="number"
                value={maxOccupancy}
                onChange={(e) => setMaxOccupancy(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price</Label>
            <Input
              id="basePrice"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(parseFloat(e.target.value))}
            />
          </div>
          {!roomType && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Room Number Prefix</Label>
                  <Input id="prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startRoomNumber">Start Number</Label>
                  <Input
                    id="startRoomNumber"
                    type="number"
                    value={startRoomNumber}
                    onChange={(e) => setStartRoomNumber(parseInt(e.target.value, 10))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endRoomNumber">End Number</Label>
                  <Input
                    id="endRoomNumber"
                    type="number"
                    value={endRoomNumber}
                    onChange={(e) => setEndRoomNumber(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                This will create {Math.max(0, endRoomNumber - startRoomNumber + 1)} rooms.
              </p>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoomTypeEditDialog;
