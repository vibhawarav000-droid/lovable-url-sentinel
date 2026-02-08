import React from 'react';
import { Header } from '@/components/layout/Header';
import { mockOrganization } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Monitor, 
  Users, 
  CreditCard,
  Zap,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const OrganizationManagement: React.FC = () => {
  const { hasPermission } = useAuth();

  if (!hasPermission('super_admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  const org = mockOrganization;
  const monitorsUsagePercent = (org.monitorsUsed / org.monitorsLimit) * 100;
  const usersUsagePercent = (org.usersCount / org.usersLimit) * 100;

  const getPlanBadge = () => {
    switch (org.plan) {
      case 'enterprise':
        return <Badge className="bg-gradient-to-r from-primary to-emerald-400 text-primary-foreground">Enterprise</Badge>;
      case 'business':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Business</Badge>;
      case 'pro':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Pro</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const planFeatures = [
    'Unlimited team members',
    'Custom status pages',
    'API access',
    'Priority support',
    'Advanced analytics',
    'Custom integrations',
  ];

  return (
    <div className="min-h-screen">
      <Header title="Organization Management" subtitle="Manage your organization settings" />

      <div className="p-6 space-y-6">
        {/* Organization Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-xl">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{org.name}</h2>
                <p className="text-muted-foreground">/{org.slug}</p>
              </div>
            </div>
            {getPlanBadge()}
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input id="orgName" defaultValue={org.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgSlug">Slug</Label>
              <Input id="orgSlug" defaultValue={org.slug} />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button>Save Changes</Button>
          </div>
        </Card>

        {/* Usage Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Monitors Usage</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Used</span>
                <span className="font-medium">{org.monitorsUsed} / {org.monitorsLimit}</span>
              </div>
              <Progress value={monitorsUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {org.monitorsLimit - org.monitorsUsed} monitors remaining
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Team Members</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{org.usersCount} / {org.usersLimit}</span>
              </div>
              <Progress value={usersUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {org.usersLimit - org.usersCount} seats remaining
              </p>
            </div>
          </Card>
        </div>

        {/* Billing */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Billing & Plan</h3>
              <p className="text-sm text-muted-foreground">Manage your subscription</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <p className="text-sm text-muted-foreground capitalize">{org.plan} Plan</p>
                </div>
                {getPlanBadge()}
              </div>
              <Button variant="outline" className="w-full gap-2">
                <Zap className="h-4 w-4" />
                Upgrade Plan
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3">Plan Features</h4>
              <ul className="space-y-2">
                {planFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/50">
          <h3 className="font-semibold text-destructive mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
            <div>
              <p className="font-medium">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organization and all its data
              </p>
            </div>
            <Button variant="destructive">Delete Organization</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationManagement;
