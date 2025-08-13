import React from 'react';
import { format, addDays } from 'date-fns';
import { Check, Copy, ArrowLeft, Sparkles, PartyPopper } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditBookingDialog from './EditBookingDialog';
import { bookingService } from '@/utils/supabase-booking';

const BookingConfirmationScreen: React.FC = () => {
  const {
    bookingFormData,
    currentBooking,
    currentCustomer,
    setCurrentStep,
    previousSearchCriteria,
    isFromCheckReservationFlow,
    hasPermission,
    setLoading
  } = useApp();

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<any>(null);

  if (!currentBooking || !currentCustomer || !bookingFormData) {
    return (
      <div className="text-center py-12 animate-in fade-in duration-500">
        <p className="text-slate-600 text-lg">❌ No booking found</p>
        <Button 
          onClick={() => setCurrentStep('availability')}
          className="mt-6 bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-105 transition-all duration-200"
        >
          Return to Availability
        </Button>
      </div>
    );
  }

  const checkOut = format(addDays(new Date(bookingFormData.checkIn), bookingFormData.nights), 'EEE, d MMM yyyy');
  const checkInFormatted = format(new Date(bookingFormData.checkIn), 'EEE, d MMM yyyy');

  const generateConfirmationMessage = () => {
    const priceText = currentBooking.total_price 
      ? `\nTotal: LKR ${currentBooking.total_price.toLocaleString()}`
      : '';
    
    const notesText = currentBooking.notes 
      ? `\nNotes: ${currentBooking.notes}`
      : '';

    const referralText = currentCustomer.referral_name 
      ? `\nReferral: ${currentCustomer.referral_name}${currentCustomer.ref_agency ? ` (${currentCustomer.ref_agency})` : ''}`
      : '';

    const roomTypesText = bookingFormData.roomTypes
      .map(rt => `${rt.quantity}x ${rt.roomType.name}`)
      .join(', ');

    return `✨ Booking confirmed at ${bookingFormData.hotel.name}

Guest: ${currentCustomer.name} — ${currentCustomer.phone}${currentCustomer.country ? ` — ${currentCustomer.country}` : ''}
Stay: ${checkInFormatted} → ${checkOut}, ${bookingFormData.nights} night${bookingFormData.nights > 1 ? 's' : ''}, ${roomTypesText}${priceText}
Confirmation ID: ${currentBooking.confirmation_id || currentBooking.id.slice(0, 8).toUpperCase()}${referralText}${notesText}

🎉 We look forward to hosting you!`;
  };

  const handleCopyMessage = () => {
    const message = generateConfirmationMessage();
    navigator.clipboard.writeText(message);
    alert('🎉 Confirmation message copied to clipboard!');
  };

  const handleNewBooking = () => {
    setCurrentStep('availability');
  };

  const handleEdit = () => {
    setSelectedBooking(currentBooking);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        setLoading(true);
        await bookingService.deleteBooking(currentBooking.id);
        alert('✅ Booking deleted successfully!');
        setCurrentStep('check-reservation'); // Go back to search results
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('❌ Error deleting booking');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Success Header */}
      <div className="text-center animate-in zoom-in duration-700">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mb-6 shadow-xl animate-bounce">
          <PartyPopper className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent mb-4">
          🎉 Booking Confirmed!
        </h2>
        <p className="text-lg text-slate-600 bg-gradient-to-r from-green-500/10 to-teal-500/10 px-6 py-3 rounded-full border border-green-200/50">
          ✨ Confirmation ID: {currentBooking.confirmation_id || currentBooking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Booking Summary */}
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300 animate-in slide-in-from-bottom duration-500">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            📋 Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                👤 Guest Information
              </h4>
              <div className="space-y-2 text-sm bg-gradient-to-r from-blue-50/50 to-teal-50/50 p-4 rounded-xl">
                <p><span className="font-semibold">👤 Name:</span> {currentCustomer.name}</p>
                <p><span className="font-semibold">📞 Phone:</span> {currentCustomer.phone}</p>
                {currentCustomer.email && (
                  <p><span className="font-semibold">📧 Email:</span> {currentCustomer.email}</p>
                )}
                {currentCustomer.country && (
                  <p><span className="font-semibold">🌍 Country:</span> {currentCustomer.country}</p>
                )}
                {currentCustomer.referral_name && (
                  <p><span className="font-semibold">🤝 Referral Name:</span> {currentCustomer.referral_name}</p>
                )}
                {currentCustomer.ref_agency && (
                  <p><span className="font-semibold">🏢 Ref Agency:</span> {currentCustomer.ref_agency}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                🏨 Stay Details
              </h4>
              <div className="space-y-2 text-sm bg-gradient-to-r from-teal-50/50 to-green-50/50 p-4 rounded-xl">
                <p><span className="font-semibold">🏨 Hotel:</span> {bookingFormData.hotel.name}</p>
                <p><span className="font-semibold">📅 Check-in:</span> {checkInFormatted}</p>
                <p><span className="font-semibold">📅 Check-out:</span> {checkOut}</p>
                <p><span className="font-semibold">🌙 Nights:</span> {bookingFormData.nights}</p>
                <p><span className="font-semibold">🏠 Room Types:</span> {bookingFormData.roomTypes.map(rt => `${rt.quantity}x ${rt.roomType.name}`).join(', ')}</p>
                {currentBooking.total_price && (
                  <p><span className="font-semibold">💰 Total:</span> LKR {currentBooking.total_price.toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
          {currentBooking.notes && (
            <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 p-4 rounded-xl">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">📝 Notes</h4>
              <p className="text-sm text-slate-600">{currentBooking.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Message */}
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-2xl animate-in slide-in-from-bottom duration-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            💌 Confirmation Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 p-6 rounded-xl mb-6 border border-white/30">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
              {generateConfirmationMessage()}
            </pre>
          </div>
          <Button
            onClick={handleCopyMessage}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-200 shadow-xl"
            variant="outline"
          >
            <Copy className="h-4 w-4" />
            📋 Copy Message
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4"> {/* Added gap-4 for spacing */}
        {console.log("BookingConfirmationScreen: hasPermission('Edit Bookings')", hasPermission('Edit Bookings'))}
        {console.log("BookingConfirmationScreen: hasPermission('Delete Bookings')", hasPermission('Delete Bookings'))}
        {hasPermission('Edit Bookings') && (
          <Button
            onClick={handleEdit}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-200 shadow-xl text-lg px-8 py-3"
          >
            Edit Booking
          </Button>
        )}
        {hasPermission('Delete Bookings') && (
          <Button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 hover:scale-105 transition-all duration-200 shadow-xl text-lg px-8 py-3"
          >
            Delete Booking
          </Button>
        )}
        {isFromCheckReservationFlow && ( // Conditional rendering
          <Button
            onClick={() => setCurrentStep('check-reservation')} // New button
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all duration-200 shadow-xl text-lg px-8 py-3"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Search Results
          </Button>
        )}
        <Button
          onClick={handleNewBooking}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 hover:scale-105 transition-all duration-200 shadow-xl text-lg px-8 py-3"
        >
          <ArrowLeft className="h-5 w-5" />
          🏠 Return to Availability
        </Button>
      </div>

      <EditBookingDialog
        booking={selectedBooking}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={() => {
          // After saving, refresh the current booking data if needed
          // For now, we'll just close the dialog and rely on the user to re-check
          // or navigate back to search results to see updated data.
          setIsEditDialogOpen(false);
          // Optionally, you might want to re-fetch currentBooking here
          // if the confirmation screen needs to reflect the changes immediately.
        }}
      />
    </div>
  );
};

export default BookingConfirmationScreen;