import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/use-auth';
import { authClient } from '../lib/auth-client';
import { useTitle } from '@/hooks/use-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Shield, 
  Smartphone, 
  Laptop, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { UAParser } from 'ua-parser-js';

// --- Profile Schema ---
const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

type ProfileForm = z.infer<typeof profileSchema>;

// --- Password Schema ---
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

// --- Types for Sessions ---
interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  image?: string;
}

export function SettingsPage() {
  useTitle('Settings');
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const { data } = await authClient.listSessions();
      if (data) {
        setSessions(data as unknown as Session[]);
      }
    } catch (error) {
      console.error('Failed to fetch sessions', error);
      toast.error('Failed to load active sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-6">
        <ProfileSection user={user} />
        <PasswordSection />
        <SessionsSection 
          sessions={sessions} 
          isLoading={isLoadingSessions} 
        />
      </div>
    </div>
  );
}

// --- Section 1: Profile Details ---
function ProfileSection({ user }: { user: User | null }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsUpdating(true);
    try {
      await authClient.updateUser({
        name: data.username,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Details
        </CardTitle>
        <CardDescription>Update your public profile information.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image} />
              <AvatarFallback className="text-lg">
                {user?.username?.substring(0, 2).toUpperCase() || 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Profile Picture</p>
              <p className="text-xs text-muted-foreground">
                Displaying initials. Avatar upload coming soon.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                {...register('username')} 
                placeholder="johndoe" 
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 px-6 py-4">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// --- Section 2: Password ---
function PasswordSection() {
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordForm) => {
    setIsUpdating(true);
    try {
      const res = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });
      
      if (res.error) {
        throw new Error(res.error.message);
      }
      
      toast.success('Password updated successfully');
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security
        </CardTitle>
        <CardDescription>Manage your password and security settings.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 mb-4">
          <Alert>
             <AlertCircle className="h-4 w-4" />
             <AlertDescription>
               Changing your password will sign out all other devices.
             </AlertDescription>
           </Alert>

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input 
              id="currentPassword" 
              type="password" 
              {...register('currentPassword')} 
            />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                {...register('newPassword')} 
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                {...register('confirmPassword')} 
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 px-6 py-4">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// --- Section 3: Sessions ---
function SessionsSection({ 
  sessions, 
  isLoading, 
}: { 
  sessions: Session[], 
  isLoading: boolean, 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Laptop className="h-5 w-5" />
          Sessions
        </CardTitle>
        <CardDescription>
          Devices that have logged into your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        ) : (
          <div className="space-y-4">
             {sessions.map((session) => {
               const ua = new UAParser(session.userAgent || '');
               const browser = ua.getBrowser();
               const os = ua.getOS();
               const device = ua.getDevice();
               const isMobile = device.type === 'mobile' || device.type === 'tablet';
               
               return (
                 <div key={session.id} className="flex items-start justify-between p-4 border rounded-lg">
                   <div className="flex items-start gap-4">
                     <div className="p-2 bg-muted rounded-full">
                       {isMobile ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                     </div>
                     <div>
                       <p className="font-medium">
                         {browser.name || 'Unknown Browser'} on {os.name || 'Unknown OS'}
                       </p>
                       <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {session.ipAddress || 'Unknown IP'}
                          </p>
                          <span className="text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            Expires {new Date(session.expiresAt).toLocaleDateString()}
                          </p>
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}