"""import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { bookingService } from '@/utils/supabase-booking';
import { useApp } from '@/contexts/AppContext';

interface EditBookingDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditBookingDialog: React.FC<EditBookingDialogProps> = ({ booking, isOpen, onClose, onSave }) => {
  const { setLoading } = useApp();
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [nights, setNights] = useState(0);
  const [roomTypes, setRoomTypes] = useState<Array<{ roomType: any; quantity: number }>>([]);

  useEffect(() => {
    if (booking) {
      setCheckIn(parseISO(booking.check_in));
      setNights(booking.nights);
      setRoomTypes(booking.booking_rooms.map((br: any) => ({ roomType: br.room_types, quantity: br.quantity })));
    }
  }, [booking]);

  if (!booking) return null;

  const handleSaveChanges = async () => {
    if (!checkIn || nights <= 0) {
      alert("Please ensure check-in date is selected and nights is greater than 0.");
      return;
    }

    try {
      setLoading(true);
      await bookingService.updateBooking(booking.id, {
        checkIn: format(checkIn, 'yyyy-MM-dd'),
        nights,
        roomTypes,
      });
      onSave(); // Notify parent component to refresh data
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('❌ Error updating booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Check-in Date</Label>
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={setCheckIn}
              className="rounded-md border"
            />
          </div>
          <div>
            <Label htmlFor="nights">Nights</Label>
            <Input id="nights" type="number" value={nights} onChange={(e) => setNights(parseInt(e.target.value, 10))} />
          </div>
          <div>
            <Label>Room Types</Label>
            {roomTypes.map((rt, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input value={rt.roomType.name} disabled />
                <Input type="number" value={rt.quantity} onChange={(e) => {
                  const newRoomTypes = [...roomTypes];
                  newRoomTypes[index].quantity = parseInt(e.target.value, 10);
                  setRoomTypes(newRoomTypes);
                }} />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;
""