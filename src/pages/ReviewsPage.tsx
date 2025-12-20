import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { StarRating } from '../components/StarRating';
import { Image, Trash2, Edit, MessageSquare } from 'lucide-react';
import type { Review } from '../types';

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  approved: 'default',
  pending: 'secondary',
  rejected: 'destructive',
};

export function ReviewsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['userReviews'],
    queryFn: () => api.getUserReviews(),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => api.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userReviews'] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Reviews</h1>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-18 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-destructive">
          <p>Error loading reviews. Please try again.</p>
        </div>
      )}

      {data && data.data.reviews.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-4">You haven't written any reviews yet</p>
          <Button asChild>
            <Link to="/library">View Your Library</Link>
          </Button>
        </div>
      )}

      {data && data.data.reviews.length > 0 && (
        <div className="space-y-4">
          {data.data.reviews.map((review: Review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={() => deleteMutation.mutate(review.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  onDelete,
}: {
  review: Review;
  onDelete: () => void;
}) {
  const getCoverUrl = (coverId: number | null | undefined) => {
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  };

  const coverUrl = getCoverUrl(review.coverId);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4 mb-4">
          {/* Book Cover */}
          <Link to={`/book${review.workKey}`} className="shrink-0">
            <div className="w-12 h-18 bg-muted rounded overflow-hidden">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={review.bookTitle}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Image className="h-4 w-4" />
                </div>
              )}
            </div>
          </Link>

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link to={`/book${review.workKey}`}>
                  <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                    {review.bookTitle}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-sm text-muted-foreground">
                    {review.rating}/5
                  </span>
                </div>
              </div>
              <Badge variant={statusVariants[review.status]}>
                {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Review Content */}
        <div className="mb-4">
          {review.hasSpoilers && (
            <Badge variant="outline" className="mb-2">
              Contains Spoilers
            </Badge>
          )}
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {review.content}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Written {new Date(review.createdAt).toLocaleDateString()}
            {review.updatedAt !== review.createdAt && (
              <> · Updated {new Date(review.updatedAt).toLocaleDateString()}</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/book${review.workKey}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete review?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your review for "{review.bookTitle}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Status Message */}
        {review.status === 'pending' && (
          <p className="mt-3 text-xs text-muted-foreground bg-muted p-2 rounded">
            Your review is pending approval by a moderator.
          </p>
        )}
        {review.status === 'rejected' && (
          <p className="mt-3 text-xs text-destructive bg-destructive/10 p-2 rounded">
            Your review was not approved. You may edit and resubmit it.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
