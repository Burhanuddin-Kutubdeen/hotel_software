import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff' | 'viewer';
  is_active: boolean;
}

interface UserEditDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const UserEditDialog: React.FC<UserEditDialogProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated
}) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    full_name: user?.full_name || '',
    role: user?.role || 'staff',
    new_password: ''
  });
  const { toast } = useToast();

  React.useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        new_password: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const updateData: any = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role
      };

      if (formData.new_password) {
        updateData.temp_password = formData.new_password;
      }

      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      onUserUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="new_password">New Password (optional)</Label>
            <Input
              id="new_password"
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({...formData, new_password: e.target.value})}
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Update User</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};