import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ArrowLeft, Check, User, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { bookingService } from '@/utils/supabase-booking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const GuestDetailsScreen: React.FC = () => {
  const {
    bookingFormData,
    setCurrentStep,
    setCurrentBooking,
    setLoading,
    refreshAvailability,
    setIsFromCheckReservationFlow
  } = useApp();

  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    country: '',
    referralName: '',
    refAgency: ''
  });

  const [pricingData, setPricingData] = useState({
    totalPrice: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!customerData.name.trim()) newErrors.name = 'Name is required';
    if (!customerData.phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !bookingFormData) return;

    try {
      setIsSubmitting(true);
      setLoading(true);
      const { booking, customer } = await bookingService.createBooking({
        hotelId: bookingFormData.hotel.id,
        roomTypes: bookingFormData.roomTypes, // Pass all room types with quantities
        checkIn: bookingFormData.checkIn,
        nights: bookingFormData.nights,
        customer: customerData,
        totalPrice: pricingData.totalPrice ? parseFloat(pricingData.totalPrice) : undefined,
        notes: pricingData.notes
      });
      setCurrentBooking(booking, customer);
      refreshAvailability(); // Trigger availability refresh
      setIsFromCheckReservationFlow(false); // Add this line
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('❌ Error creating booking. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  if (!bookingFormData) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="text-center py-8">
          <p className="text-slate-600">No booking data found. Please go back and select your rooms.</p>
          <Button onClick={() => setCurrentStep('availability')} className="mt-4">
            Back to Availability
          </Button>
        </div>
      </div>
    );
  }

  const checkOut = format(addDays(new Date(bookingFormData.checkIn), bookingFormData.nights), 'EEE, d MMM yyyy');
  const checkInFormatted = format(new Date(bookingFormData.checkIn), 'EEE, d MMM yyyy');

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep('availability')}
          className="flex items-center gap-2 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold text-teal-600">✨ Guest Details</h2>
        <div className="w-16" />
      </div>

      {/* Main Content - Single Row Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Guest Info & Stay Details */}
        <div className="space-y-6">
          {/* Guest Information */}
          <Card className="bg-white/70 backdrop-blur-md border-white/30 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                <User className="h-4 w-4 text-teal-600" />
                👤 Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                  <Input
                    id="name"
                    value={customerData.name}
                    onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                    className={`bg-white border-2 border-slate-300 h-9 focus:border-teal-500 ${errors.name ? 'border-red-400' : ''}`}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">❌ {errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
                  <Input
                    id="phone"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                    className={`bg-white border-2 border-slate-300 h-9 focus:border-teal-500 ${errors.phone ? 'border-red-400' : ''}`}
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">❌ {errors.phone}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">📧 Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                    className="bg-white border-2 border-slate-300 h-9 focus:border-teal-500"
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="text-sm font-medium">🌍 Country</Label>
                  <Input
                    id="country"
                    value={customerData.country}
                    onChange={(e) => setCustomerData({...customerData, country: e.target.value})}
                    className="bg-white border-2 border-slate-300 h-9 focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="referralName" className="text-sm font-medium">🤝 Referral Name</Label>
                  <Input
                    id="referralName"
                    value={customerData.referralName}
                    onChange={(e) => setCustomerData({...customerData, referralName: e.target.value})}
                    className="bg-white border-2 border-slate-300 h-9 focus:border-teal-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="refAgency" className="text-sm font-medium">🏢 Ref Agency</Label>
                  <Input
                    id="refAgency"
                    value={customerData.refAgency}
                    onChange={(e) => setCustomerData({...customerData, refAgency: e.target.value})}
                    className="bg-white border-2 border-slate-300 h-9 focus:border-teal-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stay Details */}
          <Card className="bg-white/70 backdrop-blur-md border-white/30 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                <Calendar className="h-4 w-4 text-blue-600" />
                📅 Stay Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">🏨 Hotel</Label>
                    <div className="font-medium text-slate-800">{bookingFormData.hotel.name}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">📅 Check-in</Label>
                    <div className="font-medium text-slate-800">{checkInFormatted}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-slate-600">📅 Check-out</Label>
                    <div className="font-medium text-slate-800">{checkOut}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">🌙 Nights</Label>
                    <div className="font-medium text-slate-800">{bookingFormData.nights}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600">🏠 Room Types & Quantities</Label>
                  <div className="space-y-1 mt-1">
                    {bookingFormData.roomTypes.map((selection, index) => (
                      <div key={index} className="font-medium text-slate-800 text-sm">
                        {selection.quantity}x {selection.roomType.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Pricing & Notes */}
        <Card className="bg-white/70 backdrop-blur-md border-white/30 shadow-lg h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
              <DollarSign className="h-4 w-4 text-green-600" />
              💰 Pricing & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="totalPrice" className="text-sm font-medium">💵 Total Price (LKR)</Label>
              <Input
                id="totalPrice"
                type="number"
                value={pricingData.totalPrice}
                onChange={(e) => setPricingData({...pricingData, totalPrice: e.target.value})}
                placeholder="Optional"
                className="bg-white border-2 border-slate-300 h-9 focus:border-teal-500"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">📝 Notes</Label>
              <Textarea
                id="notes"
                value={pricingData.notes}
                onChange={(e) => setPricingData({...pricingData, notes: e.target.value})}
                placeholder="Special requests, inclusions, etc."
                rows={6}
                className="bg-white border-2 border-slate-300 resize-none focus:border-teal-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-2">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('availability')}
          className="bg-white/50 backdrop-blur-sm border-white/30 hover:bg-white/70"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              🤔 Processing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              ✨ Confirm Booking
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GuestDetailsScreen;