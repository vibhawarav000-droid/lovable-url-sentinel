import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  UserPlus, 
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Eye,
  Pencil,
  Trash2,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'invited' | 'disabled';
  lastActive: string;
  createdAt: string;
}

const mockUsersList: MockUser[] = [
  {
    id: '1',
    name: 'John Super',
    email: 'superadmin@uptimehost.com',
    role: 'super_admin',
    status: 'active',
    lastActive: new Date().toISOString(),
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Admin',
    email: 'admin@uptimehost.com',
    role: 'admin',
    status: 'active',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-02-10',
  },
  {
    id: '3',
    name: 'Bob Viewer',
    email: 'viewer@uptimehost.com',
    role: 'viewer',
    status: 'active',
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-03-05',
  },
  {
    id: '4',
    name: 'Alice Developer',
    email: 'alice@uptimehost.com',
    role: 'admin',
    status: 'invited',
    lastActive: '',
    createdAt: '2024-02-20',
  },
  {
    id: '5',
    name: 'Charlie Ops',
    email: 'charlie@uptimehost.com',
    role: 'viewer',
    status: 'disabled',
    lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-25',
  },
];

const UserManagement: React.FC = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');

  if (!hasPermission(['super_admin', 'admin'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const filteredUsers = mockUsersList.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
            <ShieldCheck className="h-3 w-3" />
            Super Admin
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case 'viewer':
        return (
          <Badge variant="secondary" className="gap-1">
            <Eye className="h-3 w-3" />
            Viewer
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: MockUser['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="status-badge-up">Active</Badge>;
      case 'invited':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Invited</Badge>;
      case 'disabled':
        return <Badge variant="secondary">Disabled</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="User Management" subtitle="Manage team members and permissions" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{mockUsersList.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Active Users</p>
            <p className="text-2xl font-bold text-success">
              {mockUsersList.filter(u => u.status === 'active').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Pending Invites</p>
            <p className="text-2xl font-bold text-warning">
              {mockUsersList.filter(u => u.status === 'invited').length}
            </p>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>

          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isSuperAdmin && (
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      )}
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsInviteDialogOpen(false)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
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
                        <span className="text-sm font-medium text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {user.lastActive 
                        ? format(new Date(user.lastActive), 'MMM d, h:mm a')
                        : 'Never'
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove User
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
