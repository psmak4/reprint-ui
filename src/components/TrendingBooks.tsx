import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, ChevronLeft, ChevronRight, Flame, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '../api';
import type { TrendingPeriod, TrendingBook } from '../types';

const BOOKS_PER_VIEW = 5;

function BookCard({ book }: { book: TrendingBook }) {
  // Normalize workKey - remove /works/ prefix or leading slash for clean URL
  const normalizedKey = book.workKey
    .replace('/works/', '')
    .replace(/^\//, '');

  return (
    <Link 
      to={`/book/${normalizedKey}`}
      className="group shrink-0 w-35 md:w-40"
    >
      <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-muted mb-2 shadow-md group-hover:shadow-xl transition-shadow">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5 text-primary/50">
            <span className="text-4xl font-bold">{book.title.charAt(0)}</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-sm font-medium">View Details</span>
        </div>
      </div>
      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
        {book.title}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
        {book.authors.length > 0 ? book.authors[0] : 'Unknown Author'}
      </p>
    </Link>
  );
}

function BookCardSkeleton() {
  return (
    <div className="shrink-0 w-35 md:w-40">
      <Skeleton className="aspect-2/3 rounded-lg mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function TrendingBooks() {
  const [period, setPeriod] = useState<TrendingPeriod>('daily');
  const [scrollIndex, setScrollIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['trending', period],
    queryFn: () => api.getTrendingBooks(period, 20),
    staleTime: period === 'daily' ? 60 * 60 * 1000 : 2 * 60 * 60 * 1000, // 1hr for daily, 2hr for others
  });

  const books = data?.data?.books || [];
  const maxIndex = Math.max(0, books.length - BOOKS_PER_VIEW);

  const handlePrev = () => {
    setScrollIndex((prev) => Math.max(0, prev - BOOKS_PER_VIEW));
  };

  const handleNext = () => {
    setScrollIndex((prev) => Math.min(maxIndex, prev + BOOKS_PER_VIEW));
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod as TrendingPeriod);
    setScrollIndex(0);
  };

  const getPeriodIcon = (p: TrendingPeriod) => {
    switch (p) {
      case 'daily':
        return <Flame className="h-4 w-4" />;
      case 'weekly':
        return <Clock className="h-4 w-4" />;
      case 'monthly':
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Trending Now</CardTitle>
          </div>
          <Tabs value={period} onValueChange={handlePeriodChange}>
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="daily" className="gap-1.5">
                {getPeriodIcon('daily')}
                <span className="hidden sm:inline">Today</span>
                <span className="sm:hidden">Day</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-1.5">
                {getPeriodIcon('weekly')}
                <span className="hidden sm:inline">This Week</span>
                <span className="sm:hidden">Week</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-1.5">
                {getPeriodIcon('monthly')}
                <span className="hidden sm:inline">This Month</span>
                <span className="sm:hidden">Month</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Unable to load trending books. Please try again later.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Navigation buttons */}
            {!isLoading && books.length > BOOKS_PER_VIEW && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full shadow-lg bg-background/95 backdrop-blur-sm hidden md:flex"
                  onClick={handlePrev}
                  disabled={scrollIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full shadow-lg bg-background/95 backdrop-blur-sm hidden md:flex"
                  onClick={handleNext}
                  disabled={scrollIndex >= maxIndex}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Books carousel */}
            <div className="overflow-x-auto md:overflow-hidden scrollbar-hide pb-2">
              <div 
                className="flex gap-4 transition-transform duration-300 ease-in-out"
                style={{ 
                  transform: `translateX(-${scrollIndex * (160 + 16)}px)`,
                }}
              >
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 6 }).map((_, i) => (
                    <BookCardSkeleton key={i} />
                  ))
                ) : books.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground w-full">
                    <p>No trending books found.</p>
                  </div>
                ) : (
                  books.map((book, index) => (
                    <BookCard key={`${book.workKey}-${index}`} book={book} />
                  ))
                )}
              </div>
            </div>

            {/* Mobile scroll indicator */}
            {!isLoading && books.length > BOOKS_PER_VIEW && (
              <div className="flex justify-center gap-1 mt-4 md:hidden">
                {Array.from({ length: Math.ceil(books.length / BOOKS_PER_VIEW) }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      Math.floor(scrollIndex / BOOKS_PER_VIEW) === i 
                        ? 'w-4 bg-primary' 
                        : 'w-1.5 bg-muted'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
