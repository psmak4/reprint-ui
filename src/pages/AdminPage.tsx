import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarRating } from '../components/StarRating';
import { Image, CheckCircle, XCircle, AlertCircle, Users, MessageSquare } from 'lucide-react';
import type { Review } from '../types';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const queryClient = useQueryClient();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.getAdminStats(),
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['adminReviews', activeTab],
    queryFn: () => api.getAdminReviews({ status: activeTab, limit: 50 }),
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
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

        <Card>
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
        <Link to={`/book${review.workKey}`} className="flex-shrink-0">
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
