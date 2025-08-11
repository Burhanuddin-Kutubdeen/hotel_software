import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoomType, RoomTypeSelection } from '@/types';

interface RoomTypeSelectorProps {
  roomTypes: RoomType[];
  selectedRoomTypes: RoomTypeSelection[];
  onRoomTypeChange: (roomTypeId: string, quantity: number) => void;
  getAvailability?: (roomTypeId: string) => number;
}

export const RoomTypeSelector: React.FC<RoomTypeSelectorProps> = ({
  roomTypes,
  selectedRoomTypes,
  onRoomTypeChange,
  getAvailability,
}) => {
  const getQuantity = (roomTypeId: string) => {
    const selection = selectedRoomTypes.find(s => s.roomType.id === roomTypeId);
    return selection?.quantity || 0;
  };

  const handleQuantityChange = (roomType: RoomType, delta: number) => {
    const currentQuantity = getQuantity(roomType.id);
    const maxAvailable = getAvailability ? getAvailability(roomType.id) : roomType.roomsCount;
    const newQuantity = Math.max(0, Math.min(maxAvailable, currentQuantity + delta));
    onRoomTypeChange(roomType.id, newQuantity);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-700">Select Room Types & Quantities</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roomTypes.map((roomType) => {
          const quantity = getQuantity(roomType.id);
          const availableRooms = getAvailability ? getAvailability(roomType.id) : roomType.roomsCount;
          const isUnavailable = availableRooms === 0;
          
          return (
            <Card key={roomType.id} className={`transition-all duration-200 ${
              isUnavailable 
                ? 'opacity-50 bg-gray-100/50 border-gray-200' 
                : quantity > 0 
                  ? 'ring-2 ring-teal-500 bg-teal-50/50' 
                  : 'hover:shadow-md'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{roomType.name}</CardTitle>
                <p className={`text-sm ${isUnavailable ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                  {isUnavailable ? 'No rooms available' : `${availableRooms} rooms available`}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(roomType, -1)}
                      disabled={quantity === 0 || isUnavailable}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(roomType, 1)}
                      disabled={quantity >= availableRooms || isUnavailable}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};