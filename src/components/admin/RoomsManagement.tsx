import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hotel, RoomType, Room } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import RoomTypeEditDialog from './RoomTypeEditDialog';
import RoomEditDialog from './RoomEditDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


const RoomsManagement: React.FC = () => {
  const { hasRole } = useApp();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [isRoomTypeEditDialogOpen, setIsRoomTypeEditDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [isRoomTypeDeleteDialogOpen, setIsRoomTypeDeleteDialogOpen] = useState(false);
  const [deletingRoomType, setDeletingRoomType] = useState<RoomType | null>(null);
  const [isRoomEditDialogOpen, setIsRoomEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);


  const loadHotels = async () => {
    const { data } = await supabase.from('hotels').select('*');
    if (data) setHotels(data);
  };

  const loadRoomTypes = useCallback(async (hotelId: string) => {
    const { data } = await supabase.from('room_types').select('*').eq('hotel_id', hotelId).order('name');
    if (data) setRoomTypes(data);
  }, []);

  const loadRooms = useCallback(async () => {
    const { data, error } = await supabase.from('rooms').select('*, room_types(name), hotels(name)').neq('status', 'inactive');
    if (error) {
      console.error("Error loading rooms:", error);
      return;
    }
    if (data) {
      console.log("Loaded rooms:", data);
      setRooms(data);
    }
  }, []);

  useEffect(() => {
    loadHotels();
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (selectedHotel) {
      loadRoomTypes(selectedHotel);
    } else {
      setRoomTypes([]);
    }
  }, [selectedHotel, loadRoomTypes]);

  const handleAddRoomType = () => {
    setEditingRoomType(null);
    setIsRoomTypeEditDialogOpen(true);
  };

  const handleEditRoomType = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setIsRoomTypeEditDialogOpen(true);
  };

  const handleDeleteRoomType = (roomType: RoomType) => {
    setDeletingRoomType(roomType);
    setIsRoomTypeDeleteDialogOpen(true);
  };

  const confirmDeleteRoomType = async () => {
    if (!deletingRoomType) return;
    // First, delete all rooms associated with the room type
    const { error: deleteRoomsError } = await supabase.from('rooms').delete().eq('room_type_id', deletingRoomType.id);
    if (deleteRoomsError) {
      console.error('Error deleting rooms:', deleteRoomsError);
      // Handle error (e.g., show toast)
      return;
    }

    // Then, delete the room type itself
    const { error: deleteRoomTypeError } = await supabase.from('room_types').delete().eq('id', deletingRoomType.id);
    if (deleteRoomTypeError) {
      console.error('Error deleting room type:', deleteRoomTypeError);
      // Handle error
    } else {
      // Refresh list
      loadRoomTypes(selectedHotel);
      loadRooms();
    }
    setIsRoomTypeDeleteDialogOpen(false);
    setDeletingRoomType(null);
  };


  const handleRoomTypeDialogClose = () => {
    setIsRoomTypeEditDialogOpen(false);
    setEditingRoomType(null);
    // Refresh data after closing dialog
    if (selectedHotel) {
      loadRoomTypes(selectedHotel);
      loadRooms();
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setIsRoomEditDialogOpen(true);
  };

  const handleRoomDialogClose = () => {
    setIsRoomEditDialogOpen(false);
    setEditingRoom(null);
    // Refresh rooms after closing dialog
    loadRooms();
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
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Room Types for {hotels.find(h => h.id === selectedHotel)?.name}</h3>
                {hasRole('admin') && (
                  <Button onClick={handleAddRoomType}>Add Room Type</Button>
                )}
              </div>
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
                          <Button size="sm" variant="outline" onClick={() => handleEditRoomType(roomType)}>Edit Type</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteRoomType(roomType)}>Delete Type</Button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 border-t pt-4">
                      <h5 className="font-semibold">Individual Rooms ({rooms.filter(r => r.room_type_id === roomType.id).length})</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-2">
                        {rooms.filter(r => r.room_type_id === roomType.id).map(room => (
                          <Card key={room.id}>
                            <CardContent className="p-2 text-center">
                              <span className="text-sm font-medium">{room.room_number}</span>
                              <span className="text-xs block text-gray-500">{room.status}</span>
                              {hasRole('admin') && (
                                <Button size="sm" variant="outline" className="mt-2" onClick={() => handleEditRoom(room)}>Edit</Button>
                              )}
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

      {isRoomTypeEditDialogOpen && (
        <RoomTypeEditDialog
          isOpen={isRoomTypeEditDialogOpen}
          onClose={handleRoomTypeDialogClose}
          hotelId={selectedHotel}
          roomType={editingRoomType}
        />
      )}

      {isRoomEditDialogOpen && editingRoom && (
        <RoomEditDialog
          isOpen={isRoomEditDialogOpen}
          onClose={handleRoomDialogClose}
          room={editingRoom}
        />
      )}

      <AlertDialog open={isRoomTypeDeleteDialogOpen} onOpenChange={setIsRoomTypeDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the room type
              and all associated rooms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsRoomTypeDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRoomType}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoomsManagement;