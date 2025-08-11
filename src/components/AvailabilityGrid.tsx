import React from 'react';
import { format, parseISO } from 'date-fns';
import { AvailabilityData, RoomType } from '@/types';

interface AvailabilityGridProps {
  availability: AvailabilityData[];
  roomTypes: RoomType[];
  dates: string[];
}

export const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  availability,
  roomTypes,
  dates
}) => {
  const getAvailabilityForDateAndRoom = (date: string, roomTypeId: string) => {
    return availability.find(a => a.date === date && a.roomTypeId === roomTypeId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300 shadow-sm';
      case 'low': return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300 shadow-sm';
      case 'sold-out': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300 shadow-sm';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-500">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm">
            <tr>
              <th className="text-left p-4 font-semibold text-slate-700 min-w-[180px]">
                🏠 Room Type
              </th>
              {dates.map(date => (
                <th key={date} className="text-center p-3 font-semibold text-slate-700 min-w-[90px]">
                  <div className="text-xs text-slate-500 font-medium">
                    {format(parseISO(date), 'EEE')}
                  </div>
                  <div className="text-sm font-bold">
                    {format(parseISO(date), 'd MMM')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((roomType, index) => (
             <tr 
                key={roomType.id}
                className="border-t border-white/30 hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-blue-50/50 transition-all duration-300"
               >
                <td className="p-4">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    ✨ {roomType.name}
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-1">
                    🏨 {roomType.roomsCount} rooms total
                  </div>
                </td>
                {dates.map(date => {
                  const avail = getAvailabilityForDateAndRoom(date, roomType.id);
                  return (
                    <td key={date} className="p-3 text-center">
                      {avail && (
                        <span className={`inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200 hover:scale-110 ${getStatusColor(avail.status)}`}>
                          {avail.available}
                        </span>
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