import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { apiService } from '@/services/apiService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Search, UserPlus, MoreHorizontal, Shield, ShieldCheck, Eye, Pencil, Trash2, Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

const UserManagement: React.FC = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    loadUsers();
  }, []);

  if (!hasPermission(['super_admin', 'admin'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    try {
      const newUser = await apiService.createUser({ email: inviteEmail, name: inviteName, role: inviteRole, password: 'temp123' });
      setUsers([...users, newUser]);
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteName('');
      toast({ title: 'User Created', description: `${inviteEmail} has been added.` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create user', variant: 'destructive' });
    }
  };

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      await apiService.updateUserRole(userId, role);
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
      toast({ title: 'Role Updated' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await apiService.deactivateUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast({ title: 'User Removed' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to remove user', variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1"><ShieldCheck className="h-3 w-3" />Super Admin</Badge>;
      case 'admin': return <Badge className="bg-warning/10 text-warning border-warning/20 gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
      case 'viewer': return <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" />Viewer</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="User Management" subtitle="Manage team members and permissions" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4"><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{users.length}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">Active Users</p><p className="text-2xl font-bold text-success">{users.filter(u => u.is_active !== false).length}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">Admins</p><p className="text-2xl font-bold text-warning">{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</p></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50" />
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><UserPlus className="h-4 w-4" />Add User</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New User</DialogTitle><DialogDescription>Create a new user for your organization</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Full Name</Label><Input placeholder="John Doe" value={inviteName} onChange={(e) => setInviteName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Email Address</Label><Input type="email" placeholder="user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleInviteUser}><Mail className="h-4 w-4 mr-2" />Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="animate-fade-in">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{(user.name || '').charAt(0).toUpperCase()}</span>
                      </div>
                      <div><p className="font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p></div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell><Badge className={user.is_active !== false ? 'status-badge-up' : 'bg-muted'}>{user.is_active !== false ? 'Active' : 'Disabled'}</Badge></TableCell>
                  <TableCell><span className="text-sm text-muted-foreground">{format(new Date(user.created_at || user.createdAt), 'MMM d, yyyy')}</span></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleChangeRole(user.id, user.role === 'admin' ? 'viewer' : 'admin')}>
                          <Shield className="h-4 w-4 mr-2" />Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeactivateUser(user.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
