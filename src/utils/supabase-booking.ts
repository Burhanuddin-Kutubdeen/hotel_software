import { supabase } from '@/lib/supabase';
import { Hotel, RoomType, Booking, Customer, RoomTypeInventorySlot, AvailabilityData } from '@/types/supabase';
import { format, addDays } from 'date-fns';

export const bookingService = {
  // Get all hotels
  async getHotels(): Promise<Hotel[]> {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Get room types for a hotel
  async getRoomTypes(hotelId: string): Promise<RoomType[]> {
    const { data, error } = await supabase
      .from('room_types')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('name');
    
    if (error) throw error;
    
    // Map database fields to frontend interface
    return (data || []).map(roomType => ({
      id: roomType.id,
      hotel_id: roomType.hotel_id,
      name: roomType.name,
      description: roomType.description,
      base_price: roomType.base_price,
      max_occupancy: roomType.max_occupancy,
      total_rooms: roomType.total_rooms,
      created_at: roomType.created_at,
      updated_at: roomType.updated_at,
    }));
  },

  // Search bookings by criteria - returns empty array if no matches
  async searchBookings(criteria: {
    name?: string;
    phone?: string;
    email?: string;
    confirmationId?: string;
    hotelName?: string;
    date?: string;
  }): Promise<any[]> {
    // If no criteria provided, return empty array
    const hasCriteria = Object.values(criteria).some(value => value && value.trim());
    if (!hasCriteria) {
      return [];
    }

    let query = supabase
      .from('bookings')
      .select(`
        *,
        customers (*),
        hotels (id, name),
        booking_rooms (
          quantity,
          room_type_id,
          room_types (id, name)
        )
      `);

    // Apply filters - for confirmation ID we can filter directly
    if (criteria.confirmationId?.trim()) {
      query = query.eq('confirmation_id', criteria.confirmationId.trim());
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Search error:', error);
      throw error;
    }
    
    if (!data) return [];

    // Filter results in JavaScript for related table fields
    let filteredData = data;

    if (criteria.name?.trim()) {
      const nameFilter = criteria.name.trim().toLowerCase();
      filteredData = filteredData.filter(booking => 
        booking.customers?.name?.toLowerCase().includes(nameFilter)
      );
    }

    if (criteria.phone?.trim()) {
      const phoneFilter = criteria.phone.trim();
      filteredData = filteredData.filter(booking => 
        booking.customers?.phone?.includes(phoneFilter)
      );
    }

    if (criteria.email?.trim()) {
      const emailFilter = criteria.email.trim().toLowerCase();
      filteredData = filteredData.filter(booking => 
        booking.customers?.email?.toLowerCase().includes(emailFilter)
      );
    }

    if (criteria.hotelName?.trim() && criteria.hotelName !== 'all') {
      const hotelFilter = criteria.hotelName.trim().toLowerCase();
      filteredData = filteredData.filter(booking => 
        booking.hotels?.name?.toLowerCase().includes(hotelFilter)
      );
    }

    if (criteria.date) {
        const searchDate = new Date(criteria.date);
        filteredData = filteredData.filter(booking => {
            const checkInDate = new Date(booking.check_in);
            const checkOutDate = addDays(new Date(booking.check_in), booking.nights);

            return searchDate >= checkInDate && searchDate <= checkOutDate;
        });
    }

    return filteredData;
  },

  // Get availability for date range with optimized batch queries
  async getAvailability(hotelId: string, checkIn: string, nights: number): Promise<AvailabilityData[]> {
    // Use fallback method directly for reliability
    return this.getAvailabilityFallback(hotelId, checkIn, nights);
  },

  // Fallback method with original logic but some optimizations
  async getAvailabilityFallback(hotelId: string, checkIn: string, nights: number): Promise<AvailabilityData[]> {
    console.log(`getAvailabilityFallback: Fetching availability for hotelId: ${hotelId}, checkIn: ${checkIn}, nights: ${nights}`);
    const dates = [];
    const startDate = new Date(checkIn);
    
    // Generate date range (check-in - 5 to check-out + 5)
    for (let i = -5; i < nights + 5; i++) {
      dates.push(format(addDays(startDate, i), 'yyyy-MM-dd'));
    }
    console.log('getAvailabilityFallback: Dates to check:', dates);

    const roomTypes = await this.getRoomTypes(hotelId);
    console.log('getAvailabilityFallback: Room types for hotel:', roomTypes);

    // Fetch actual room counts for each room type from the 'rooms' table
    const { data: allRoomsData, error: allRoomsError } = await supabase
      .from('rooms')
      .select('room_type_id')
      .eq('hotel_id', hotelId);

    if (allRoomsError) {
      console.error('Error fetching all rooms:', allRoomsError);
      throw allRoomsError;
    }

    const roomCountsFromRoomsTable = new Map<string, number>();
    (allRoomsData || []).forEach(room => {
      const currentCount = roomCountsFromRoomsTable.get(room.room_type_id) || 0;
      roomCountsFromRoomsTable.set(room.room_type_id, currentCount + 1);
    });

    const roomTypeTotalRooms = new Map<string, number>();
    for (const roomType of roomTypes) {
        // Prioritize total_rooms from room_types table, but fallback to counting rooms
        const totalFromRoomTypes = roomType.total_rooms; // This now comes from getRoomTypes
        const totalFromRoomsTable = roomCountsFromRoomsTable.get(roomType.id) || 0;

        if (totalFromRoomTypes && totalFromRoomTypes > 0) {
            roomTypeTotalRooms.set(roomType.id, totalFromRoomTypes);
        } else {
            roomTypeTotalRooms.set(roomType.id, totalFromRoomsTable);
        }
    }

    console.log('getAvailabilityFallback: Room Type Total Rooms Map:', roomTypeTotalRooms);
    
    // Batch query for all bookings in date range
    const { data: bookingSlots } = await supabase
      .from('room_type_inventory_slots')
      .select('room_type_id, date')
      .eq('hotel_id', hotelId)
      .in('date', dates)
      .not('booking_id', 'is', null);

    console.log('getAvailabilityFallback: Booking Slots (raw):', bookingSlots);

    // Batch query for all room blocks in date range
    const { data: roomBlocks } = await supabase
      .from('room_blocks')
      .select('date, rooms!inner(room_type_id)')
      .in('date', dates);

    console.log('getAvailabilityFallback: Room Blocks (raw):', roomBlocks);

    const availability: AvailabilityData[] = [];

    for (const roomType of roomTypes) {
      const totalRoomsForType = roomTypeTotalRooms.get(roomType.id) || 0;
      for (const date of dates) {
        // Count bookings for this room type and date
        const bookingCount = (bookingSlots || []).filter(slot => 
          slot.room_type_id === roomType.id && slot.date === date
        ).length;

        // Count blocks for this room type and date
        const blockCount = (roomBlocks || []).filter(block => 
          block.rooms?.room_type_id === roomType.id && block.date === date
        ).length;

        const totalOccupied = bookingCount + blockCount;
        const available = Math.max(0, totalRoomsForType - totalOccupied);
        
        console.log(`getAvailabilityFallback: Date: ${date}, RoomType: ${roomType.name}, TotalRooms: ${totalRoomsForType}, Booked: ${bookingCount}, Blocked: ${blockCount}, Available: ${available}`);

        let status: 'available' | 'low' | 'sold-out' = 'available';
        if (available === 0) status = 'sold-out';
        else if (available <= Math.ceil(totalRoomsForType * 0.3)) status = 'low';

        availability.push({
          date,
          roomTypeId: roomType.id,
          available,
          total: totalRoomsForType,
          status
        });
      }
    }
    console.log('getAvailabilityFallback: Final availability data:', availability);
    return availability;
  },

  // Create booking with multiple room types and quantities
  async createBooking(bookingData: {
    hotelId: string;
    roomTypes: Array<{ roomType: { id: string; name: string }; quantity: number }>;
    checkIn: string;
    nights: number;
    customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'> & {
      referralName?: string;
      refAgency?: string;
    };
    totalPrice?: number;
    notes?: string;
  }): Promise<{ booking: Booking; customer: Customer }> {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([{
        name: bookingData.customer.name,
        phone: bookingData.customer.phone,
        email: bookingData.customer.email,
        country: bookingData.customer.country,
        referral_name: bookingData.customer.referralName,
        ref_agency: bookingData.customer.refAgency
      }])
      .select()
      .single();

    if (customerError) throw customerError;

    const checkOutDate = format(addDays(new Date(bookingData.checkIn), bookingData.nights), 'yyyy-MM-dd');
    const confirmationId = `BK${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(-2).toUpperCase()}`;

    // Create main booking record (room_type_id can be null since we use booking_rooms)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        confirmation_id: confirmationId,
        hotel_id: bookingData.hotelId,
        room_type_id: null, // We'll use booking_rooms for multiple room types
        customer_id: customer.id,
        check_in: bookingData.checkIn,
        check_out: checkOutDate,
        nights: bookingData.nights,
        total_price: bookingData.totalPrice,
        notes: bookingData.notes,
        referral_name: bookingData.customer.referralName,
        ref_agency: bookingData.customer.refAgency,
        status: 'confirmed'
      }])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Create booking_rooms entries for each room type and quantity
    const bookingRoomsData = [];
    for (const selection of bookingData.roomTypes) {
      // Verify room type exists
      const { data: roomTypeExists } = await supabase
        .from('room_types')
        .select('id')
        .eq('id', selection.roomType.id)
        .single();
      
      if (!roomTypeExists) {
        throw new Error(`Room type ${selection.roomType.id} not found`);
      }
      
      bookingRoomsData.push({
        booking_id: booking.id,
        room_type_id: selection.roomType.id,
        quantity: selection.quantity
      });
    }

    const { error: bookingRoomsError } = await supabase
      .from('booking_rooms')
      .insert(bookingRoomsData);

    if (bookingRoomsError) {
      console.error('Booking rooms error:', bookingRoomsError);
      throw new Error(`Failed to create booking rooms: ${bookingRoomsError.message}`);
    }

    // Allocate inventory slots for each room type and quantity
    for (const selection of bookingData.roomTypes) {
      for (let i = 0; i < selection.quantity; i++) {
        await this.allocateSlots(bookingData.hotelId, selection.roomType.id, bookingData.checkIn, bookingData.nights, booking.id);
      }
    }

    return { booking, customer };
  },

  // Simplified allocate slots - use incremental slot numbers to avoid conflicts
  async allocateSlots(hotelId: string, roomTypeId: string, checkIn: string, nights: number, bookingId: string): Promise<void> {
    const dates = [];
    const startDate = new Date(checkIn);
    
    for (let i = 0; i < nights; i++) {
      dates.push(format(addDays(startDate, i), 'yyyy-MM-dd'));
    }

    // Insert slots directly with incremental slot numbers to avoid unique constraint conflicts
    for (const date of dates) {
      try {
        // Find the next available slot number for this date/room type combination
        const { data: existingSlots } = await supabase
          .from('room_type_inventory_slots')
          .select('slot_no')
          .eq('hotel_id', hotelId)
          .eq('room_type_id', roomTypeId)
          .eq('date', date)
          .order('slot_no', { ascending: false })
          .limit(1);

        const nextSlotNo = existingSlots && existingSlots.length > 0 ? existingSlots[0].slot_no + 1 : 1;

        const { error } = await supabase
          .from('room_type_inventory_slots')
          .insert({
            hotel_id: hotelId,
            room_type_id: roomTypeId,
            date,
            slot_no: nextSlotNo,
            booking_id: bookingId
          });
        
        if (error) {
          console.error('Slot insert error:', error);
          throw error; // Propagate the error
        }
      } catch (error) {
        console.error('Error allocating slot:', error);
        throw error; // Propagate the error
      }
    }
  },

  // Delete a booking
  async deleteBooking(bookingId: string): Promise<void> {
    // 1. Delete associated booking_rooms entries
    const { error: bookingRoomsError } = await supabase
      .from('booking_rooms')
      .delete()
      .eq('booking_id', bookingId);

    if (bookingRoomsError) {
      console.error('Error deleting booking rooms:', bookingRoomsError);
      throw new Error(`Failed to delete booking rooms: ${bookingRoomsError.message}`);
    }

    // 2. Delete associated room_type_inventory_slots entries
    const { error: inventorySlotsError } = await supabase
      .from('room_type_inventory_slots')
      .delete()
      .eq('booking_id', bookingId);

    if (inventorySlotsError) {
      console.error('Error deleting inventory slots:', inventorySlotsError);
      throw new Error(`Failed to delete inventory slots: ${inventorySlotsError.message}`);
    }

    // 3. Delete the booking itself
    const { error: bookingError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (bookingError) {
      console.error('Error deleting booking:', bookingError);
      throw new Error(`Failed to delete booking: ${bookingError.message}`);
    }
  },

  // Update a booking
  async updateBooking(bookingId: string, updates: {
    checkIn?: string;
    nights?: number;
    roomTypes?: Array<{ roomType: { id: string; name: string }; quantity: number }>;
    hotelId?: string;
  }): Promise<void> {
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        check_in: updates.checkIn,
        nights: updates.nights,
        check_out: updates.checkIn && updates.nights ? format(addDays(new Date(updates.checkIn), updates.nights), 'yyyy-MM-dd') : undefined,
        hotel_id: updates.hotelId, // Update hotel_id if provided
      })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('Error updating booking details:', bookingError);
      throw new Error(`Failed to update booking details: ${bookingError.message}`);
    }

    if (updates.roomTypes) {
      // 1. Delete old booking_rooms entries
      const { error: deleteBookingRoomsError } = await supabase
        .from('booking_rooms')
        .delete()
        .eq('booking_id', bookingId);

      if (deleteBookingRoomsError) {
        console.error('Error deleting old booking rooms:', deleteBookingRoomsError);
        throw deleteBookingRoomsError;
      }

      // 2. Insert new booking_rooms entries
      const bookingRoomsData = updates.roomTypes.map(rt => ({
        booking_id: bookingId,
        room_type_id: rt.roomType.id,
        quantity: rt.quantity,
      }));

      const { error: insertBookingRoomsError } = await supabase
        .from('booking_rooms')
        .insert(bookingRoomsData);

      if (insertBookingRoomsError) {
        console.error('Error inserting new booking rooms:', insertBookingRoomsError);
        throw insertBookingRoomsError;
      }
    }

    // 3. Re-allocate inventory slots
    const { data: booking, error: fetchBookingError } = await supabase.from('bookings').select('hotel_id, check_in, nights').eq('id', bookingId).single();
    if (fetchBookingError) {
      console.error('Error fetching booking for slot re-allocation:', fetchBookingError);
      throw fetchBookingError;
    }

    if (booking && updates.roomTypes) {
        // Delete old slots
        const { error: deleteSlotsError } = await supabase.from('room_type_inventory_slots').delete().eq('booking_id', bookingId);
        if (deleteSlotsError) {
            console.error('Error deleting old inventory slots:', deleteSlotsError);
            throw deleteSlotsError;
        }

        // Allocate new slots
        const currentHotelId = updates.hotelId || booking.hotel_id; // Use new hotelId if provided, else existing
        for (const selection of updates.roomTypes) {
            for (let i = 0; i < selection.quantity; i++) {
                await this.allocateSlots(currentHotelId, selection.roomType.id, booking.check_in, booking.nights, bookingId);
            }
        }
    }
  }
};