import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { 
  Image, 
  BookOpen, 
  ChevronDown,
  ChevronUp,
  CheckCircle, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit, 
  X,
  BookMarked,
  Clock,
  Check,
  Library,
  ExternalLink
} from 'lucide-react';
import type { LibraryStatus, ReviewWithUser, RatingBreakdown } from '../types';
import { useAuth } from '@/hooks/use-auth';
import { useTitle } from '@/hooks/use-title';

const statusConfig = {
  want_to_read: { label: 'Want to Read', icon: BookMarked, color: 'bg-emerald-600 hover:bg-emerald-700' },
  reading: { label: 'Currently Reading', icon: Clock, color: 'bg-blue-600 hover:bg-blue-700' },
  read: { label: 'Read', icon: Check, color: 'bg-purple-600 hover:bg-purple-700' },
};

export function BookDetailPage() {
  const { '*': workKeyPath } = useParams();
  const [searchParams] = useSearchParams();
  const isbn = searchParams.get('isbn') || undefined;
  const workKey = workKeyPath || '';
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ['book', workKey, isbn],
    queryFn: () => api.getBookDetails(workKey, isbn),
  });

  useTitle(data?.data?.book?.title);

  const addToLibraryMutation = useMutation({
    mutationFn: (status: LibraryStatus) =>
      api.addToLibrary({
        workKey,
        title: data!.data.book.title,
        authorName: data!.data.book.authors[0]?.name,
        coverId: data!.data.book.coverId,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', workKey] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const updateLibraryMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LibraryStatus }) =>
      api.updateLibraryItem(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', workKey] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const removeFromLibraryMutation = useMutation({
    mutationFn: (id: string) => api.removeFromLibrary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', workKey] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: () =>
      api.createReview({
        workKey,
        bookTitle: data!.data.book.title,
        rating: reviewRating,
        content: reviewContent,
        hasSpoilers,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', workKey] });
      setReviewContent('');
      setReviewRating(5);
      setHasSpoilers(false);
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: (id: string) =>
      api.updateReview(id, {
        rating: reviewRating,
        content: reviewContent,
        hasSpoilers,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', workKey] });
      setIsEditing(false);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id: string) => api.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', workKey] });
    },
  });

  const toggleSpoiler = (reviewId: string) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const startEditing = () => {
    if (data?.data.userReview) {
      setReviewRating(data.data.userReview.rating);
      setReviewContent(data.data.userReview.content);
      setHasSpoilers(data.data.userReview.hasSpoilers);
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 shrink-0">
            <Skeleton className="w-full aspect-2/3 rounded-lg" />
            <Skeleton className="h-12 w-full mt-4" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive mb-4">Error loading book details.</p>
        <Button asChild>
          <Link to="/search">Back to Search</Link>
        </Button>
      </div>
    );
  }

  const { book, reviews, averageRating, reviewCount, reprintBreakdown: rawReprintBreakdown, openLibraryRatings, libraryItem, userReview } = data.data;
  const reprintBreakdown: RatingBreakdown = rawReprintBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const currentStatus = libraryItem?.status;
  const StatusIcon = currentStatus ? statusConfig[currentStatus].icon : BookMarked;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Main Book Info Section */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Cover & Actions */}
        <div className="lg:w-64 shrink-0">
          {/* Cover Image */}
          <div className="w-full aspect-2/3 bg-muted rounded-lg overflow-hidden shadow-lg">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Image className="h-20 w-20" />
              </div>
            )}
          </div>

          {/* Library Actions */}
          {isAuthenticated ? (
            <div className="mt-4 space-y-2">
              {libraryItem ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className={`w-full justify-between ${statusConfig[libraryItem.status].color}`}
                        size="lg"
                      >
                        <span className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig[libraryItem.status].label}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {(Object.keys(statusConfig) as LibraryStatus[]).map((status) => {
                        const config = statusConfig[status];
                        const Icon = config.icon;
                        return (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => updateLibraryMutation.mutate({ id: libraryItem.id, status })}
                            className="cursor-pointer"
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {config.label}
                            {libraryItem.status === status && (
                              <Check className="h-4 w-4 ml-auto" />
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove from Library
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove from library?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove "{book.title}" from your library.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeFromLibraryMutation.mutate(libraryItem.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      className="w-full justify-between bg-emerald-600 hover:bg-emerald-700"
                      size="lg"
                    >
                      <span className="flex items-center gap-2">
                        <BookMarked className="h-4 w-4" />
                        Want to Read
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {(Object.keys(statusConfig) as LibraryStatus[]).map((status) => {
                      const config = statusConfig[status];
                      const Icon = config.icon;
                      return (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => addToLibraryMutation.mutate(status)}
                          className="cursor-pointer"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {config.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                <Link to="/login">Sign in to track</Link>
              </Button>
            </div>
          )}

          {/* External Links */}
          {book.links && book.links.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-2">External Links</p>
              {book.links.slice(0, 5).map((link, i) => (
                <Button key={i} variant="outline" className="w-full justify-start overflow-hidden" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.title}>
                    <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">{link.title}</span>
                  </a>
                </Button>
              ))}
            </div>
          )}

          {/* Rate this book */}
          {isAuthenticated && !userReview && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Rate this book</p>
              <div className='flex items-center justify-center'>
              <StarRating
                rating={0}
                size="lg"
                interactive
                onChange={(rating) => {
                  setReviewRating(rating);
                  // Scroll to review section
                  document.getElementById('write-review')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Book Details */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
            {book.title}
          </h1>
          
          {book.subtitle && (
            <p className="text-xl text-muted-foreground mt-1">{book.subtitle}</p>
          )}

          {/* Author */}
          {book.authors.length > 0 && (
            <p className="text-xl mt-3">
              <span className="text-muted-foreground">by </span>
              {book.authors.map((author, i) => {
                // author.key is like "/authors/OL26320A", extract just the ID
                const authorId = author.key.replace('/authors/', '');
                return (
                  <span key={author.key}>
                    {i > 0 && ', '}
                    <Link
                      to={`/author/${authorId}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {author.name}
                    </Link>
                  </span>
                );
              })}
            </p>
          )}

          {/* Ratings Section - Show both RePrint and Open Library */}
          <div className="mt-4 flex flex-wrap gap-3">
            {/* RePrint Rating */}
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              {reviewCount > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <StarRating rating={averageRating ? parseFloat(averageRating) : 0} size="md" />
                    <span className="text-2xl font-semibold">
                      {averageRating}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-primary">RePrint</div>
                    <div className="text-muted-foreground">
                      {reviewCount.toLocaleString()} review{reviewCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm">
                  <div className="font-medium text-primary">RePrint</div>
                  <div className="text-muted-foreground">No reviews yet</div>
                </div>
              )}
            </div>
            
            {/* Open Library Rating */}
            <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
              {openLibraryRatings && openLibraryRatings.count > 0 && openLibraryRatings.average ? (
                <>
                  <div className="flex items-center gap-2">
                    <StarRating rating={parseFloat(openLibraryRatings.average)} size="md" />
                    <span className="text-2xl font-semibold">
                      {openLibraryRatings.average}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-amber-600 dark:text-amber-400">Open Library</div>
                    <div className="text-muted-foreground">
                      {openLibraryRatings.count.toLocaleString()} rating{openLibraryRatings.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm">
                  <div className="font-medium text-amber-600 dark:text-amber-400">Open Library</div>
                  <div className="text-muted-foreground">No ratings yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className={`text-muted-foreground leading-relaxed whitespace-pre-line ${!showFullDescription ? 'line-clamp-6' : ''}`}>
                {book.description}
              </p>
              {book.description.length > 400 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary hover:underline text-sm mt-2 font-medium flex items-center gap-1"
                >
                  {showFullDescription ? (
                    <>Show less <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Show more <ChevronDown className="h-4 w-4" /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Genres/Subjects */}
          {book.subjects.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                {book.subjects.slice(0, 8).map((subject) => (
                  <Link
                    key={subject}
                    to={`/search?q=${encodeURIComponent(subject)}`}
                    className="text-sm px-3 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    {subject}
                  </Link>
                ))}
                {book.subjects.length > 8 && (
                  <span className="text-sm text-muted-foreground px-2 py-1">
                    +{book.subjects.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Book Details */}
          <div className="mt-6 text-sm text-muted-foreground">
            {book.firstPublishDate && (
              <p>First published <span className="text-foreground">{book.firstPublishDate}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Ratings & Reviews Section */}
      <div className="mt-12">
        <Separator className="mb-8" />
        
        <h2 className="text-2xl font-bold mb-6">
          Ratings & Reviews
        </h2>

        {/* Tabbed Rating Breakdown */}
        <Tabs defaultValue="reprint" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="reprint" className="gap-2">
              <BookOpen className="h-4 w-4" />
              RePrint
            </TabsTrigger>
            <TabsTrigger value="openlibrary" className="gap-2">
              <Library className="h-4 w-4" />
              Open Library
            </TabsTrigger>
          </TabsList>
          
          {/* RePrint Ratings Tab */}
          <TabsContent value="reprint">
            {reviewCount > 0 ? (
              <div className="bg-card rounded-lg p-6 border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2 py-1 bg-primary/10 rounded text-xs font-semibold text-primary uppercase tracking-wide">
                    RePrint
                  </div>
                  <span className="text-sm text-muted-foreground">Community Reviews</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary">{averageRating}</div>
                    <StarRating rating={averageRating ? parseFloat(averageRating) : 0} size="md" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {reviewCount.toLocaleString()} review{reviewCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reprintBreakdown[stars as keyof RatingBreakdown] || 0;
                      const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-sm w-12 shrink-0">{stars} stars</span>
                          <Progress value={percentage} className="h-2 flex-1 min-w-0" />
                          <span className="text-sm text-muted-foreground w-24 text-right whitespace-nowrap shrink-0">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg p-6 text-center border border-border">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="font-medium">No RePrint reviews yet</p>
                <p className="text-sm text-muted-foreground">Be the first to share your thoughts on this book!</p>
              </div>
            )}
          </TabsContent>

          {/* Open Library Ratings Tab */}
          <TabsContent value="openlibrary">
            {openLibraryRatings && openLibraryRatings.count > 0 && openLibraryRatings.average ? (
              <div className="bg-card rounded-lg p-6 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2 py-1 bg-amber-500/10 rounded text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Open Library
                  </div>
                  <span className="text-sm text-muted-foreground">Community Ratings</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-amber-600 dark:text-amber-400">{openLibraryRatings.average}</div>
                    <StarRating rating={parseFloat(openLibraryRatings.average)} size="md" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {openLibraryRatings.count.toLocaleString()} rating{openLibraryRatings.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = openLibraryRatings.breakdown[stars as keyof RatingBreakdown] || 0;
                      const percentage = openLibraryRatings.count > 0 
                        ? Math.round((count / openLibraryRatings.count) * 100) 
                        : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-sm w-12 shrink-0">{stars} stars</span>
                          <Progress value={percentage} className="h-2 flex-1 min-w-0" />
                          <span className="text-sm text-muted-foreground w-24 text-right whitespace-nowrap shrink-0">
                            {count.toLocaleString()} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-4">
                  Ratings from the Open Library community. <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">Learn more →</a>
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-lg p-6 text-center border border-border">
                <Library className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="font-medium">No Open Library ratings yet</p>
                <p className="text-sm text-muted-foreground">This book hasn't been rated on Open Library yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Section Header for Reviews */}
        {reviews.length > 0 && (
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            RePrint Reviews ({reviewCount})
          </h3>
        )}

        {/* Write Review Form */}
        {isAuthenticated && (!userReview || isEditing) && (
          <Card id="write-review" className="mb-8 border-primary/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {userReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium">Your Rating</Label>
                  <StarRating
                    rating={reviewRating}
                    size="lg"
                    interactive
                    onChange={setReviewRating}
                  />
                </div>

                <div>
                  <Label htmlFor="review-content" className="mb-2 block text-sm font-medium">
                    Your Review
                  </Label>
                  <Textarea
                    id="review-content"
                    placeholder="What did you think of this book? Share your thoughts, favorite quotes, or how it made you feel..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    rows={6}
                    maxLength={5000}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {reviewContent.length}/5000 characters
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="spoilers"
                    checked={hasSpoilers}
                    onCheckedChange={(checked) => setHasSpoilers(!!checked)}
                  />
                  <Label htmlFor="spoilers" className="cursor-pointer text-sm">
                    This review contains spoilers
                  </Label>
                </div>

                <div className="flex gap-2 pt-2">
                  {userReview && isEditing ? (
                    <>
                      <Button
                        onClick={() => updateReviewMutation.mutate(userReview.id)}
                        disabled={!reviewContent.trim() || updateReviewMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => createReviewMutation.mutate()}
                      disabled={!reviewContent.trim() || createReviewMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Post Review
                    </Button>
                  )}
                </div>

                {(createReviewMutation.isSuccess || updateReviewMutation.isSuccess) && (
                  <p className="text-sm text-emerald-500">
                    ✓ Your review has been submitted for approval.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User's Existing Review */}
        {userReview && !isEditing && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Review</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={startEditing}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete review?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteReviewMutation.mutate(userReview.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <ReviewCard
              review={{
                ...userReview,
                username: userReview.username || user?.username || 'You',
              } as ReviewWithUser}
              isRevealed={true}
              onToggleSpoiler={() => {}}
              isOwn
            />
          </div>
        )}

        {/* Community Reviews */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Community Reviews</h3>
          {reviews.length === 0 && !userReview ? (
            <div className="text-center py-12 bg-card rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No reviews yet</p>
              <p className="text-muted-foreground">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews
                .filter((r) => r.userId !== user?.id)
                .map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    isRevealed={revealedSpoilers.has(review.id)}
                    onToggleSpoiler={() => toggleSpoiler(review.id)}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  isRevealed,
  onToggleSpoiler,
  isOwn = false,
}: {
  review: ReviewWithUser;
  isRevealed: boolean;
  onToggleSpoiler: () => void;
  isOwn?: boolean;
}) {
  const showContent = !review.hasSpoilers || isRevealed;
  const displayName = review.username || 'Anonymous';

  return (
    <div className={`bg-card rounded-lg p-5 ${isOwn ? 'border border-primary/30' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium">{displayName}</div>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {isOwn && review.status !== 'approved' && (
                <Badge variant="secondary" className="text-xs">
                  {review.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {review.hasSpoilers && !isOwn && (
          <Button variant="outline" size="sm" onClick={onToggleSpoiler}>
            {isRevealed ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Spoilers
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="mt-4">
        {showContent ? (
          <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
            {review.content}
          </p>
        ) : (
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Eye className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              This review contains spoilers. Click "Show Spoilers" to reveal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
