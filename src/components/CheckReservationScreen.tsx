import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, ArrowLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { bookingService } from '@/utils/supabase-booking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookingFormData } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { SelectSingleEventHandler } from 'react-day-picker';
const CheckReservationScreen: React.FC = () => {
  const { setCurrentStep, loading, setLoading, setCurrentBooking, setBookingFormData, previousSearchCriteria, setPreviousSearchCriteria } = useApp();
  const [searchCriteria, setSearchCriteria] = useState({
    name: '',
    phone: '',
    email: '',
    confirmationId: '',
    hotelName: ''
  });
  const [hotels, setHotels] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadHotels();
  }, []);

  useEffect(() => {
    if (previousSearchCriteria) {
      setSearchCriteria(previousSearchCriteria.searchCriteria);
      setSelectedDate(previousSearchCriteria.selectedDate);
      // Optionally, trigger a search if the user expects it to be re-run
      // handleSearch();
    }
  }, [previousSearchCriteria]);

  const loadHotels = async () => {
    try {
      const hotelData = await bookingService.getHotels();
      setHotels(hotelData);
    } catch (error) {
      console.error('Error loading hotels:', error);
    }
  };

  const handleSearch = async () => {
    const hasSearchCriteria = searchCriteria.name || searchCriteria.phone || 
                            searchCriteria.email || searchCriteria.confirmationId || 
                            (searchCriteria.hotelName && searchCriteria.hotelName !== 'all') ||
                            selectedDate;
    
    if (!hasSearchCriteria) {
      alert('⚠️ Please enter at least one search criteria');
      return;
    }

    try {
      setLoading(true);
      const results = await bookingService.searchBookings({
        ...searchCriteria,
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      });
      setBookings(results);
      setSearched(true);
    } catch (error) {
      console.error('Error searching bookings:', error);
      alert('❌ Error searching reservations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300';
      default: return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300';
    }
  };

  const handleBookingClick = (booking: any) => {
    // Create booking form data from the booking
    const bookingFormData: BookingFormData = {
      hotel: booking.hotels,
      checkIn: booking.check_in,
      nights: booking.nights,
      roomTypes: booking.booking_rooms?.map((room: any) => ({
        roomType: room.room_types,
        quantity: room.quantity
      })) || []
    };

    // Set the context data
    setCurrentBooking(booking, booking.customers);
    setBookingFormData(bookingFormData);
    
    // Save current search criteria before navigating
    setPreviousSearchCriteria({
      searchCriteria: searchCriteria,
      selectedDate: selectedDate,
    });

    // Navigate to confirmation screen
    setCurrentStep('confirmation');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep('availability')}
          className="flex items-center gap-2 hover:bg-white/50 hover:scale-105 transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Availability
        </Button>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
          🔍 Check Reservation
        </h2>
      </div>

      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 text-teal-600" />
            🔎 Search Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">👤 Guest Name</Label>
              <Input
                id="name"
                value={searchCriteria.name}
                onChange={(e) => setSearchCriteria({...searchCriteria, name: e.target.value})}
                placeholder="Enter guest name"
                className="bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-200"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">📞 Phone Number</Label>
              <Input
                id="phone"
                value={searchCriteria.phone}
                onChange={(e) => setSearchCriteria({...searchCriteria, phone: e.target.value})}
                placeholder="Enter phone number"
                className="bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-200"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">📧 Email</Label>
              <Input
                id="email"
                value={searchCriteria.email}
                onChange={(e) => setSearchCriteria({...searchCriteria, email: e.target.value})}
                placeholder="Enter email address"
                className="bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-200"
              />
            </div>
            <div>
              <Label htmlFor="hotelName" className="text-sm font-semibold text-slate-700">🏨 Hotel Name</Label>
              <Select value={searchCriteria.hotelName} onValueChange={(value) => setSearchCriteria({...searchCriteria, hotelName: value})}>
                <SelectTrigger className="bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-200">
                  <SelectValue placeholder="Select hotel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hotels</SelectItem>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.name}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="confirmationId" className="text-sm font-semibold text-slate-700">🎫 Confirmation ID</Label>
              <Input
                id="confirmationId"
                value={searchCriteria.confirmationId}
                onChange={(e) => setSearchCriteria({...searchCriteria, confirmationId: e.target.value})}
                placeholder="Enter confirmation ID"
                className="bg-white/50 border-white/30 hover:bg-white/70 transition-all duration-200"
              />
            </div>
            <div className="md:col-span-2 flex justify-center">
              <div className="space-y-2"> {/* Added a div to wrap Label and Calendar */}
                <Label htmlFor="date" className="text-sm font-semibold text-slate-700">📅 Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border shadow w-fit"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 hover:scale-105 transition-all duration-200 shadow-xl px-8"
            >
              <Search className="h-4 w-4" />
              {loading ? '🔄 Searching...' : '🔍 Search Reservations'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-xl animate-in slide-in-from-bottom duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Search Results ({bookings.length} found)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-slate-600 text-xl font-semibold mb-2">No Match Found</p>
                <p className="text-slate-500">No reservations found matching your search criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50/80 to-blue-50/80">
                      <TableHead className="font-semibold">🎫 ID</TableHead>
                      <TableHead className="font-semibold">👤 Guest</TableHead>
                      <TableHead className="font-semibold">📞 Contact</TableHead>
                      <TableHead className="font-semibold">🏨 Hotel</TableHead>
                      <TableHead className="font-semibold">📅 Dates</TableHead>
                      <TableHead className="font-semibold">🏠 Room</TableHead>
                      <TableHead className="font-semibold">📊 Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                       <TableRow 
                         key={booking.id} 
                         className="hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-blue-50/50 transition-all duration-200 cursor-pointer"
                         onClick={() => handleBookingClick(booking)}
                       >
                        <TableCell className="font-mono text-sm">
                          {booking.confirmation_id || booking.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {booking.customers?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{booking.customers?.phone || 'N/A'}</div>
                          {booking.customers?.email && (
                            <div className="text-slate-500">{booking.customers.email}</div>
                          )}
                        </TableCell>
                        <TableCell>{booking.hotels?.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm">
                          <div>{format(new Date(booking.check_in), 'MMM d, yyyy')}</div>
                          <div className="text-slate-500">{booking.nights} night{booking.nights > 1 ? 's' : ''}</div>
                        </TableCell>
                        <TableCell>
                          {booking.booking_rooms && booking.booking_rooms.length > 0 ? (
                            <div className="space-y-1">
                              {booking.booking_rooms.map((room: any, index: number) => (
                                <div key={index} className="text-sm">
                                  {room.quantity}x {room.room_types?.name || 'N/A'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            booking.room_types?.name || 'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(booking.status)}`}>
                            {booking.status === 'confirmed' ? '✅' : booking.status === 'cancelled' ? '❌' : '⏳'} {booking.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CheckReservationScreen;