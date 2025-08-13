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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Room } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface RoomEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

const RoomEditDialog: React.FC<RoomEditDialogProps> = ({
  isOpen,
  onClose,
  room,
}) => {
  const [roomNumber, setRoomNumber] = useState(room.room_number);
  const [status, setStatus] = useState(room.status);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (room) {
      setRoomNumber(room.room_number);
      setStatus(room.status);
    }
  }, [room]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          room_number: roomNumber,
          status: status,
        })
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: "Room Updated",
        description: `Room ${roomNumber} has been updated.`, 
      });
      onClose();
    } catch (error) {
      console.error('Error saving room:', error);
      toast({
        title: "Error",
        description: `Failed to save room: ${error.message}`, 
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number</Label>
            <Input
              id="roomNumber"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

export default RoomEditDialog;