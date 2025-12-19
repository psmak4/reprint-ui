import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BookCard } from '../components/BookCard';
import { Search, BookOpen } from 'lucide-react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['books', 'search', query, page],
    queryFn: () => api.searchBooks(query, page, 20),
    enabled: !!query,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim(), page: '1' });
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search Form - Prominent */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by book title, author, or ISBN..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-6">
            Search
          </Button>
        </div>
      </form>

      {/* Results */}
      {!query && (
        <div className="text-center py-20">
          <BookOpen className="h-20 w-20 mx-auto mb-6 text-muted-foreground/30" />
          <h2 className="text-2xl font-semibold mb-2">Find your next read</h2>
          <p className="text-muted-foreground">
            Search for books by title, author, or ISBN
          </p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-lg">
              <Skeleton className="w-24 h-36 flex-shrink-0 rounded-md" />
              <div className="flex-1 space-y-3 py-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <p className="text-destructive">Error searching books. Please try again.</p>
        </div>
      )}

      {data && (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{data.data.pagination.total.toLocaleString()}</span> results for "{query}"
            </p>
          </div>

          {data.data.books.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium">No books found</p>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          ) : (
            <>
              {/* Book List */}
              <div className="divide-y divide-border">
                {data.data.books.map((book) => (
                  <BookCard key={book.workKey} book={book} />
                ))}
              </div>

              {/* Pagination */}
              {data.data.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pt-8 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    ← Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page <span className="font-medium text-foreground">{page}</span> of{' '}
                    <span className="font-medium text-foreground">{data.data.pagination.totalPages.toLocaleString()}</span>
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= data.data.pagination.totalPages}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
