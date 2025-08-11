export interface Hotel {
  id: string;
  name: string;
  currency: string;
}

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  roomsCount: number;
}

export interface InventorySlot {
  id: string;
  hotelId: string;
  roomTypeId: string;
  date: string;
  slotNo: number;
  bookingId?: string;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  country: string;
  referral_name?: string;
  ref_agency?: string;
}

export interface Booking {
  id: string;
  hotelId: string;
  roomTypeId?: string; // Make optional for multi-room bookings
  room_id?: string;
  customer: Customer;
  checkIn: string;
  nights: number;
  price: number;
  notes: string;
  createdAt: string;
}

export interface BookingRoom {
  id: string;
  booking_id: string;
  room_id?: string;
  room_type_id: string;
  quantity: number;
}

export interface AvailabilityData {
  date: string;
  roomTypeId: string;
  available: number;
  total: number;
  status: 'available' | 'low' | 'sold-out';
}

export type AppStep = 'availability' | 'details' | 'confirm';

export interface RoomTypeSelection {
  roomType: RoomType;
  quantity: number;
}

export interface BookingFormData {
  hotel: Hotel;
  checkIn: string;
  nights: number;
  roomTypes: RoomTypeSelection[];
  customer: Customer;
  price: number;
  notes: string;
}