export interface Hotel {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description?: string;
  base_price: number;
  max_occupancy: number;
  rooms_count: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_type_id: string;
  room_number: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RoomTypeInventorySlot {
  id: string;
  hotel_id: string;
  room_type_id: string;
  date: string;
  slot_no: number;
  booking_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  hotel_id: string;
  room_type_id: string;
  customer_id: string;
  check_in: string;
  nights: number;
  total_price?: number;
  notes?: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface AvailabilityData {
  date: string;
  roomTypeId: string;
  available: number;
  total: number;
  status: 'available' | 'low' | 'sold-out';
}