import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '../api';
import type { TrendingBook } from '../types';

const BOOKS_PER_VIEW = 5;

// Define available lists
const NYT_LISTS = [
  {
    label: "Fiction",
    items: [
      { value: "hardcover-fiction", label: "Hardcover Fiction" },
      { value: "paperback-trade-fiction", label: "Paperback Trade Fiction" },
      { value: "combined-print-and-e-book-fiction", label: "Combined Print & E-Book Fiction" },
    ]
  },
  {
    label: "Nonfiction",
    items: [
      { value: "hardcover-nonfiction", label: "Hardcover Nonfiction" },
      { value: "paperback-nonfiction", label: "Paperback Nonfiction" },
      { value: "combined-print-and-e-book-nonfiction", label: "Combined Print & E-Book Nonfiction" },
      { value: "advice-how-to-and-miscellaneous", label: "Advice, How-To & Misc." },
    ]
  },
  {
    label: "Children & YA",
    items: [
      { value: "young-adult-hardcover", label: "Young Adult Hardcover" },
      { value: "middle-grade-hardcover", label: "Middle Grade Hardcover" },
      { value: "picture-books", label: "Picture Books" },
      { value: "childrens-series", label: "Children's Series" },
    ]
  },
  {
    label: "Monthly & Specialized",
    items: [
      { value: "business-books", label: "Business" },
      { value: "graphic-books-and-manga", label: "Graphic Books & Manga" },
      { value: "audio-fiction", label: "Audio Fiction" },
      { value: "science", label: "Science" },
    ]
  }
];

function BookCard({ book, rank }: { book: TrendingBook; rank: number }) {
  // Normalize workKey - remove /works/ prefix or leading slash for clean URL
  const normalizedKey = book.workKey
    .replace('/works/', '')
    .replace(/^\//, '');

  return (
    <Link 
      to={`/book/${normalizedKey}${book.isbn ? `?isbn=${book.isbn}` : ''}`}
      className="group shrink-0 w-35 md:w-40 relative"
    >
      {/* Rank Badge */}
      <div className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md border-2 border-background">
        {rank}
      </div>

      <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-muted mb-2 shadow-md transition-shadow">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5 text-primary/50">
            <span className="text-4xl font-bold">{book.title.charAt(0)}</span>
          </div>
        )}
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

export function NytBestSellers() {
  const [selectedList, setSelectedList] = useState("hardcover-fiction");
  const [scrollIndex, setScrollIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['nyt-bestsellers', selectedList],
    queryFn: () => api.getNytBestSellers(selectedList),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const books = data?.data?.books || [];
  // Reset scroll when list changes
  // We can't do this directly in render, but the effect of changing key/data usually resets components if we used key.
  // Here we just let it stay or we could add a useEffect.
  // Actually, simply resetting scrollIndex when `selectedList` changes is handled by the `setScrollIndex` call in the Select `onValueChange` if we wanted, or we can just accept it might be scrolled.
  // Let's reset it explicitly when selecting.

  const maxIndex = Math.max(0, books.length - BOOKS_PER_VIEW);

  const handlePrev = () => {
    setScrollIndex((prev) => Math.max(0, prev - BOOKS_PER_VIEW));
  };

  const handleNext = () => {
    setScrollIndex((prev) => Math.min(maxIndex, prev + BOOKS_PER_VIEW));
  };

  const handleListChange = (value: string) => {
    setSelectedList(value);
    setScrollIndex(0);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <CardTitle className="text-2xl">NY Times Best Sellers</CardTitle>
          </div>
          
          <div className="w-full md:w-64 flex items-center justify-end">
            <Select value={selectedList} onValueChange={handleListChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a list" />
              </SelectTrigger>
              <SelectContent>
                {NYT_LISTS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {error ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
            <p>Unable to load best sellers for this list.</p>
            <Button 
              variant="link" 
              onClick={() => handleListChange("hardcover-fiction")}
              className="mt-2"
            >
              Reset to Hardcover Fiction
            </Button>
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
            <div className="overflow-x-auto md:overflow-hidden scrollbar-hide pb-4 pt-2 px-2 -mx-2">
              <div 
                className="flex gap-6 transition-transform duration-300 ease-in-out"
                style={{ 
                  transform: `translateX(-${scrollIndex * (160 + 24)}px)`, // 160px width + 24px gap
                }}
              >
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 6 }).map((_, i) => (
                    <BookCardSkeleton key={i} />
                  ))
                ) : books.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground w-full border rounded-lg border-dashed">
                    <p className="text-lg mb-1">No books found</p>
                    <p className="text-sm">We couldn't resolve any books for this list. Try another category.</p>
                  </div>
                ) : (
                  books.map((book, index) => (
                    <BookCard key={`${book.workKey}-${index}`} book={book} rank={index + 1} />
                  ))
                )}
              </div>
            </div>

            {/* Mobile scroll indicator */}
            {!isLoading && books.length > BOOKS_PER_VIEW && (
              <div className="flex justify-center gap-1 mt-0 md:hidden">
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