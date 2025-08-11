import { supabase } from '@/lib/supabase';

// Use secure function instead of direct materialized view access
export async function getCachedTimezoneNames() {
  try {
    const { data, error } = await supabase.rpc('get_timezone_names');
    
    if (error) {
      console.error('Error fetching timezone names:', error);
      return [];
    }
    
    return data?.map((item: { name: string }) => item.name) || [];
  } catch (error) {
    console.error('Error in getCachedTimezoneNames:', error);
    return [];
  }
}

// Get cached table metadata using secure function
export async function getCachedTableMetadata() {
  try {
    const { data, error } = await supabase.rpc('get_cached_table_metadata');
    
    if (error) {
      console.error('Error fetching table metadata:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCachedTableMetadata:', error);
    return [];
  }
}

// Batch availability checking with optimized queries
export async function batchCheckAvailability(
  hotelId: string,
  requests: Array<{
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    roomsNeeded?: number;
  }>
) {
  try {
    const results = await Promise.all(
      requests.map(async (request) => {
        const { data, error } = await supabase.rpc('check_room_availability', {
          p_hotel_id: hotelId,
          p_room_type_id: request.roomTypeId,
          p_check_in: request.checkIn,
          p_check_out: request.checkOut,
          p_rooms_needed: request.roomsNeeded || 1
        });
        
        return {
          ...request,
          available: !error && data === true
        };
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error in batchCheckAvailability:', error);
    return requests.map(req => ({ ...req, available: false }));
  }
}

// Enhanced booking search with proper indexing
export async function searchBookingsOptimized(
  hotelId: string,
  filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    confirmationId?: string;
  }
) {
  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        customers(*),
        room_types(*)
      `)
      .eq('hotel_id', hotelId);

    // Use indexed columns for efficient filtering
    if (filters.startDate) {
      query = query.gte('check_in', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('check_out', filters.endDate);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.confirmationId) {
      query = query.ilike('confirmation_id', `%${filters.confirmationId}%`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in searchBookingsOptimized:', error);
    return [];
  }
}