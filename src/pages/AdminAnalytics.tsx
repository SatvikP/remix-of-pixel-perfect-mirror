import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { checkIsAdmin, fetchAllUserProfiles } from '@/lib/api';
import { format } from 'date-fns';
import { ArrowLeft, Users, Upload, TrendingUp, UserX } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  has_uploaded_csv: boolean;
  first_csv_upload_at: string | null;
  total_csv_uploads: number;
  created_at: string;
  last_seen_at: string;
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth', { replace: true });
        return;
      }
      
      setUser(session.user);
      
      const adminStatus = await checkIsAdmin();
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        const data = await fetchAllUserProfiles();
        setProfiles(data);
      }
      
      setLoading(false);
    }
    init();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive font-medium">Access Denied</p>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const totalSignups = profiles.length;
  const usersWithUpload = profiles.filter(p => p.has_uploaded_csv).length;
  const usersWithoutUpload = totalSignups - usersWithUpload;
  const conversionRate = totalSignups > 0 ? ((usersWithUpload / totalSignups) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Admin Analytics</h1>
                <p className="text-xs text-muted-foreground">User signup and engagement tracking</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSignups}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uploaded CSV</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{usersWithUpload}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Upload</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{usersWithoutUpload}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>CSV Status</TableHead>
                  <TableHead className="text-right">Total Uploads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.email || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(profile.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(profile.last_seen_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      {profile.has_uploaded_csv ? (
                        <Badge variant="default" className="bg-green-600">Uploaded</Badge>
                      ) : (
                        <Badge variant="secondary">No Upload</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{profile.total_csv_uploads}</TableCell>
                  </TableRow>
                ))}
                {profiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
