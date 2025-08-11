import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
}

const AVAILABLE_PERMISSIONS = [
  'view_bookings',
  'create_bookings',
  'edit_bookings',
  'delete_bookings',
  'view_rooms',
  'manage_rooms',
  'view_users',
  'manage_users',
  'view_reports',
  'manage_settings'
];

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
      if (error) throw error;
      // Ensure permissions is always an array
      const parsedRoles = (data || []).map(role => ({
        ...role,
        permissions: Array.isArray(role.permissions) 
          ? role.permissions 
          : (typeof role.permissions === 'string' && role.permissions)
            ? JSON.parse(role.permissions) 
            : []
      }));
      setRoles(parsedRoles);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRole) {
        const { error } = await supabase
          .from('roles')
          .update({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        toast({ title: "Success", description: "Role updated successfully" });
      } else {
        const { error } = await supabase
          .from('roles')
          .insert([{
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions
          }]);

        if (error) throw error;
        toast({ title: "Success", description: "Role created successfully" });
      }

      setFormData({ name: '', description: '', permissions: [] });
      setEditingRole(null);
      setIsDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions || []
    });
    setIsDialogOpen(true);
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission]
      });
    } else {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permission)
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingRole(null);
            setFormData({ name: '', description: '', permissions: [] });
          }
        }}>
          <DialogTrigger asChild>
            <Button>Add Role</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission}
                        checked={formData.permissions.includes(permission)}
                        onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                      />
                      <Label htmlFor={permission} className="text-sm">
                        {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(role.permissions || []).map((permission) => (
                        <span key={permission} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {permission.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(role)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;