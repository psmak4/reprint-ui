import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { admin } from '../lib/auth-client';
import { useTitle } from '@/hooks/use-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarRating } from '../components/StarRating';
import { 
  Image, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Users, 
  MessageSquare, 
  Search,
  Ban,
  Shield,
  ShieldOff,
  Trash2,
  UserX,
  UserCheck,
} from 'lucide-react';
import type { Review } from '../types';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  banned: boolean | null;
  banReason: string | null;
  createdAt: string;
}

export function AdminPage() {
  useTitle('Admin Dashboard');
  const [activeSection, setActiveSection] = useState<'reviews' | 'users'>('reviews');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [userSearch, setUserSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.getAdminStats(),
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['adminReviews', activeTab],
    queryFn: () => api.getAdminReviews({ status: activeTab, limit: 50 }),
  });

  // Users query using Better Auth admin
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers', userSearch],
    queryFn: async () => {
      const result = await admin.listUsers({
        query: {
          limit: 100,
          ...(userSearch && {
            searchValue: userSearch,
            searchField: 'email' as const,
            searchOperator: 'contains' as const,
          }),
        },
      });
      return result.data;
    },
    enabled: activeSection === 'users',
  });

  const approveMutation = useMutation({
    mutationFn: (reviewId: string) => api.approveReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reviewId: string) => api.rejectReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  // User management mutations
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      return admin.banUser({ userId, banReason: reason });
    },
    onSuccess: () => refetchUsers(),
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return admin.unbanUser({ userId });
    },
    onSuccess: () => refetchUsers(),
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return admin.setRole({ userId, role: role as 'user' | 'admin' });
    },
    onSuccess: () => refetchUsers(),
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return admin.removeUser({ userId });
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card 
          className={`cursor-pointer transition-colors ${activeSection === 'reviews' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveSection('reviews')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-3xl font-bold">
                  {statsData?.data.pendingReviews ?? 0}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${activeSection === 'users' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveSection('users')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">
                  {statsData?.data.totalUsers ?? 0}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">
                  {statsData?.data.totalReviews ?? 0}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews Moderation */}
      {activeSection === 'reviews' && (
        <Card>
          <CardHeader>
            <CardTitle>Review Moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Pending
                  {statsData && statsData.data.pendingReviews > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {statsData.data.pendingReviews}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Rejected
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {reviewsLoading && (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg space-y-3">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ))}
                  </div>
                )}

                {reviewsData && reviewsData.data.reviews.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No {activeTab} reviews</p>
                  </div>
                )}

                {reviewsData && reviewsData.data.reviews.length > 0 && (
                  <div className="space-y-4">
                    {reviewsData.data.reviews.map((review: Review) => (
                      <AdminReviewCard
                        key={review.id}
                        review={review}
                        onApprove={() => approveMutation.mutate(review.id)}
                        onReject={() => rejectMutation.mutate(review.id)}
                        isApproving={approveMutation.isPending}
                        isRejecting={rejectMutation.isPending}
                        showActions={activeTab === 'pending'}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* User Management */}
      {activeSection === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {usersLoading && (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {usersData && usersData.users && usersData.users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No users found</p>
              </div>
            )}

            {usersData && usersData.users && usersData.users.length > 0 && (
              <div className="space-y-3">
                {(usersData.users as AdminUser[]).map((user: AdminUser) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onBan={(reason) => banUserMutation.mutate({ userId: user.id, reason })}
                    onUnban={() => unbanUserMutation.mutate(user.id)}
                    onSetRole={(role) => setRoleMutation.mutate({ userId: user.id, role })}
                    onRemove={() => removeUserMutation.mutate(user.id)}
                    isLoading={
                      banUserMutation.isPending || 
                      unbanUserMutation.isPending || 
                      setRoleMutation.isPending ||
                      removeUserMutation.isPending
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserCard({
  user,
  onBan,
  onUnban,
  onSetRole,
  onRemove,
  isLoading,
}: {
  user: AdminUser;
  onBan: (reason?: string) => void;
  onUnban: () => void;
  onSetRole: (role: string) => void;
  onRemove: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="p-4 border rounded-lg flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
        {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{user.name || user.username}</span>
          {user.role === 'admin' && (
            <Badge variant="default" className="gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          )}
          {user.banned && (
            <Badge variant="destructive" className="gap-1">
              <Ban className="h-3 w-3" />
              Banned
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {user.email} · @{user.username}
        </div>
        {user.banned && user.banReason && (
          <div className="text-xs text-destructive mt-1">
            Reason: {user.banReason}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Role selector */}
        <Select
          value={user.role}
          onValueChange={onSetRole}
          disabled={isLoading}
        >
          <SelectTrigger className="w-27.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">
              <span className="flex items-center gap-2">
                <ShieldOff className="h-3 w-3" />
                User
              </span>
            </SelectItem>
            <SelectItem value="admin">
              <span className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Ban/Unban button */}
        {user.banned ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onUnban}
            disabled={isLoading}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Unban
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading}
              >
                <UserX className="h-4 w-4 mr-1" />
                Ban
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ban User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to ban {user.name || user.email}? 
                  They will be logged out and unable to sign in.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onBan('Violated community guidelines')}>
                  Ban User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user 
                account for {user.name || user.email} and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function AdminReviewCard({
  review,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  showActions,
}: {
  review: Review;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
  showActions: boolean;
}) {
  const getCoverUrl = (coverId: number | null | undefined) => {
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-S.jpg`;
  };

  const coverUrl = getCoverUrl(review.coverId);

  return (
    <div className="p-4 border rounded-lg">
      {/* Header */}
      <div className="flex gap-4 mb-3">
        <Link to={`/book${review.workKey}`} className="shrink-0">
          <div className="w-10 h-14 bg-muted rounded overflow-hidden">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={review.bookTitle}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Image className="h-3 w-3" />
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/book${review.workKey}`}>
            <h4 className="font-medium hover:text-primary transition-colors line-clamp-1">
              {review.bookTitle}
            </h4>
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>by {review.username || 'Unknown'}</span>
            <StarRating rating={review.rating} size="sm" />
            <span>{review.rating}/5</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        {review.hasSpoilers && (
          <Badge variant="outline" className="mb-2 text-yellow-500 border-yellow-500/50">
            Contains Spoilers
          </Badge>
        )}
        <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
          {review.content}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Submitted {new Date(review.createdAt).toLocaleString()}
        </p>
        {showActions && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isApproving || isRejecting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isApproving || isRejecting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
